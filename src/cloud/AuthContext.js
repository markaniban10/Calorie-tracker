import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { AppState } from 'react-native';

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

// Auto-save waits this long after the last change before saving.
const AUTO_SAVE_DELAY_MS = 2500;

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
  saveNow: noop,
  autoSave: false,
  setAutoSave: noop,
  lastSaved: null,
  saveStatus: 'idle',
});

export const useAuth = () => useContext(AuthContext);

// mode: 'guest' | 'user' | null
export function AuthProvider({ initialMode, onDataRestored, children }) {
  const [mode, setModeState] = useState(initialMode ?? null);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(isCloudConfigured);

  // Saving to the account
  const [autoSave, setAutoSaveState] = useState(false);
  const [lastSaved, setLastSaved] = useState(null); // time of the last save, or null
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const dirtyRef = useRef(false); // true when there are changes not yet saved
  const timerRef = useRef(null);

  const setMode = useCallback((m) => {
    setModeState(m);
    storage.setSetting('account_mode', m).catch(() => {});
  }, []);

  // Load the saved auto-save choice and the time of the last save.
  useEffect(() => {
    (async () => {
      try {
        setAutoSaveState((await storage.getSetting('auto_save')) === '1');
        const last = await storage.getSetting('last_backup');
        setLastSaved(last ? Number(last) : null);
      } catch (e) {
        // keep the defaults
      }
    })();
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

  // Signed out: nothing is waiting to be saved any more.
  useEffect(() => {
    if (!user) {
      dirtyRef.current = false;
      setSaveStatus('idle');
    }
  }, [user]);

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

  // Get the current account's cloud save information.
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

  // Write this phone's data to the current account.
  const backupNow = useCallback(async () => {
    const uid = requireUid();

    try {
      const data = await storage.exportData();
      const payload = JSON.stringify(data);

      if (payload.length > MAX_BACKUP_CHARS) {
        throw new Error('Your data is too large to save to this account.');
      }

      const at = Date.now();

      await setDoc(doc(db, 'users', uid), {
        payload,
        updatedAt: at,
        schema: 1,
      });

      await storage.setSetting('last_backup', String(at));
      setLastSaved(at);

      return at;
    } catch (e) {
      throw new Error(friendlyError(e));
    }
  }, []);

  // Save now (used by the Save button and by auto-save). Keeps saveStatus up to date.
  const saveNow = useCallback(async () => {
    clearTimeout(timerRef.current);
    dirtyRef.current = false;
    setSaveStatus('saving');

    try {
      const at = await backupNow();
      setSaveStatus('saved');
      return at;
    } catch (e) {
      dirtyRef.current = true; // try again on the next change or when the app comes back
      setSaveStatus('error');
      throw e;
    }
  }, [backupNow]);

  // Restore the current account's cloud save.
  const restoreNow = useCallback(async () => {
    const uid = requireUid();

    try {
      const snap = await getDoc(doc(db, 'users', uid));

      if (!snap.exists()) {
        throw new Error('No saved data was found for this account yet.');
      }

      const data = JSON.parse(snap.data().payload);
      const at = snap.data().updatedAt || Date.now();

      await storage.importData(data);
      await storage.setSetting('last_backup', String(at));
      setLastSaved(at);
      dirtyRef.current = false;
      setSaveStatus('saved');

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
    setLastSaved(null);

    if (onDataRestored) {
      await onDataRestored();
    }

    await backupNow();
  }, [onDataRestored, backupNow]);

  // Turn auto-save on or off. Turning it on saves right away.
  // The choice is kept even if that first save fails (for example when offline).
  const setAutoSave = useCallback(
    async (value) => {
      setAutoSaveState(value);
      await storage.setSetting('auto_save', value ? '1' : '0');

      if (value && auth && auth.currentUser) {
        await saveNow();
      }
    },
    [saveNow]
  );

  // Auto-save: a few seconds after the last change, save to the account.
  useEffect(() => {
    if (!autoSave || !user) return undefined;

    const unsubscribe = storage.subscribeToChanges(() => {
      dirtyRef.current = true;
      clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        saveNow().catch(() => {});
      }, AUTO_SAVE_DELAY_MS);
    });

    return () => {
      unsubscribe();
      clearTimeout(timerRef.current);
    };
  }, [autoSave, user, saveNow]);

  // Auto-save: save straight away when the app goes to the background, and retry when it comes back.
  useEffect(() => {
    if (!autoSave || !user) return undefined;

    const sub = AppState.addEventListener('change', () => {
      if (dirtyRef.current) {
        saveNow().catch(() => {});
      }
    });

    return () => sub.remove();
  }, [autoSave, user, saveNow]);

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
      saveNow,
      autoSave,
      setAutoSave,
      lastSaved,
      saveStatus,
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
      saveNow,
      autoSave,
      setAutoSave,
      lastSaved,
      saveStatus,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}