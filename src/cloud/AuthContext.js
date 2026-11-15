import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { isCloudConfigured } from './firebaseConfig';
import * as storage from '../storage/storage';

const NOT_SETUP =
  'Accounts are not set up in this build yet. Add your Firebase keys in src/cloud/firebaseConfig.js.';

const MAX_BACKUP_CHARS = 900000;

function friendlyError(e) {
  const code = e && e.code ? String(e.code) : '';

  switch (code) {
    case 'auth/invalid-email':
      return "That email address doesn't look right.";

    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Wrong email or password.';

    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try logging in instead.';

    case 'auth/weak-password':
      return 'Choose a password with at least 6 characters.';

    case 'auth/network-request-failed':
    case 'unavailable':
      return 'No internet connection. Try again when you are online.';

    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a few minutes and try again.';

    case 'permission-denied':
      return 'The cloud rules blocked this. Check the Firestore rules in your Firebase project.';

    case 'auth/operation-not-allowed':
      return 'This sign-in method is turned off in your Firebase project.';

    default:
      return (e && e.message) || 'Something went wrong. Please try again.';
  }
}

function toUser(u) {
  const providerId =
    (u.providerData && u.providerData[0] && u.providerData[0].providerId) || '';

  return {
    uid: u.uid,
    email: u.email || '',
    name: u.displayName || (u.email ? u.email.split('@')[0] : 'Account'),
    provider: providerId === 'google.com' ? 'Google' : 'Email',
  };
}

const noop = async () => {};

const AuthContext = createContext({
  cloudReady: false,
  mode: 'guest',
  user: null,
  authLoading: false,
  continueAsGuest: () => {},
  signUpWithEmail: noop,
  signInWithEmail: noop,
  sendReset: noop,
  signOut: noop,
  backupNow: noop,
  restoreNow: noop,
  getCloudInfo: async () => null,
  startFreshAccount: noop,
});

export const useAuth = () => useContext(AuthContext);

// mode: 'guest' | 'user' | null
export function AuthProvider({ initialMode, onDataRestored, children }) {
  const [mode, setModeState] = useState(initialMode ?? null);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(isCloudConfigured);

  const setMode = useCallback((m) => {
    setModeState(m);
    storage.setSetting('account_mode', m).catch(() => {});
  }, []);

  // Follow Firebase's sign-in state.
  useEffect(() => {
    if (!isCloudConfigured || !auth) {
      setAuthLoading(false);
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u ? toUser(u) : null);

      if (u) {
        setMode('user');
      }

      setAuthLoading(false);
    });

    return unsubscribe;
  }, [setMode]);

  // If the saved session is no longer active, return to guest mode.
  useEffect(() => {
    if (!authLoading && mode === 'user' && !user) {
      setMode('guest');
    }
  }, [authLoading, mode, user, setMode]);

  const continueAsGuest = useCallback(
    () => setMode('guest'),
    [setMode]
  );

  const signUpWithEmail = useCallback(async (email, password) => {
    if (!isCloudConfigured || !auth) {
      throw new Error(NOT_SETUP);
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (e) {
      throw new Error(friendlyError(e));
    }
  }, []);

  const signInWithEmail = useCallback(async (email, password) => {
    if (!isCloudConfigured || !auth) {
      throw new Error(NOT_SETUP);
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      throw new Error(friendlyError(e));
    }
  }, []);

  const sendReset = useCallback(async (email) => {
    if (!isCloudConfigured || !auth) {
      throw new Error(NOT_SETUP);
    }

    try {
      await sendPasswordResetEmail(auth, email);
    } catch (e) {
      if (e && e.code === 'auth/user-not-found') return;
      throw new Error(friendlyError(e));
    }
  }, []);

  const signOut = useCallback(async () => {
    if (auth) {
      await firebaseSignOut(auth);
    }

    // Local data is kept until another account is selected.
  }, []);

  const requireUid = () => {
    const uid = auth && auth.currentUser && auth.currentUser.uid;

    if (!db || !uid) {
      throw new Error('Please sign in first.');
    }

    return uid;
  };

  // Get the current account's cloud backup information.
  const getCloudInfo = useCallback(async () => {
    const uid = requireUid();

    try {
      const snap = await getDoc(doc(db, 'users', uid));

      return snap.exists()
        ? { updatedAt: snap.data().updatedAt || 0 }
        : null;
    } catch (e) {
      throw new Error(friendlyError(e));
    }
  }, []);

  // Back up local data to the current account.
  const backupNow = useCallback(async () => {
    const uid = requireUid();

    try {
      const data = await storage.exportData();
      const payload = JSON.stringify(data);

      if (payload.length > MAX_BACKUP_CHARS) {
        throw new Error('Your data is too large to back up to this account.');
      }

      const at = Date.now();

      await setDoc(doc(db, 'users', uid), {
        payload,
        updatedAt: at,
        schema: 1,
      });

      await storage.setSetting('last_backup', String(at));

      return at;
    } catch (e) {
      throw new Error(friendlyError(e));
    }
  }, []);

  // Restore the current account's cloud backup.
  const restoreNow = useCallback(async () => {
    const uid = requireUid();

    try {
      const snap = await getDoc(doc(db, 'users', uid));

      if (!snap.exists()) {
        throw new Error('No backup was found for this account yet.');
      }

      const data = JSON.parse(snap.data().payload);

      await storage.importData(data);
      await storage.setSetting(
        'last_backup',
        String(snap.data().updatedAt || Date.now())
      );

      if (onDataRestored) {
        await onDataRestored();
      }

      return true;
    } catch (e) {
      throw new Error(friendlyError(e));
    }
  }, [onDataRestored]);

  // Prepare a clean local database for a new account.
  const startFreshAccount = useCallback(async () => {
    await storage.resetPersonalData();

    if (onDataRestored) {
      await onDataRestored();
    }

    await backupNow();
  }, [onDataRestored, backupNow]);

  const value = useMemo(
    () => ({
      cloudReady: isCloudConfigured,
      mode,
      user,
      authLoading,
      continueAsGuest,
      signUpWithEmail,
      signInWithEmail,
      sendReset,
      signOut,
      backupNow,
      restoreNow,
      getCloudInfo,
      startFreshAccount,
    }),
    [
      mode,
      user,
      authLoading,
      continueAsGuest,
      signUpWithEmail,
      signInWithEmail,
      sendReset,
      signOut,
      backupNow,
      restoreNow,
      getCloudInfo,
      startFreshAccount,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}