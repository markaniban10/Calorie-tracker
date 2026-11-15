import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { isCloudConfigured, GOOGLE_WEB_CLIENT_ID } from './firebaseConfig';
import * as storage from '../storage/storage';

const NOT_SETUP = 'Accounts are not set up in this build yet. Add your Firebase keys in src/cloud/firebaseConfig.js.';
const GOOGLE_NEEDS_BUILD = 'Google sign-in needs a development build of the app. It does not work in Expo Go.';
const MAX_BACKUP_CHARS = 900000; // Firestore documents are limited to about 1 MB

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
  const providerId = (u.providerData && u.providerData[0] && u.providerData[0].providerId) || '';
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
  signInWithGoogle: async () => false,
  signOut: noop,
  backupNow: noop,
  restoreNow: noop,
  getCloudInfo: async () => null,
});

export const useAuth = () => useContext(AuthContext);

// mode: 'guest' (data only on this phone) | 'user' (signed in) | null (not chosen yet)
export function AuthProvider({ initialMode, onDataRestored, children }) {
  const [mode, setModeState] = useState(initialMode ?? null);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(isCloudConfigured);

  const setMode = useCallback((m) => {
    setModeState(m);
    storage.setSetting('account_mode', m).catch(() => {});
  }, []);

  // follow Firebase's sign-in state (also restores a saved session on launch)
  useEffect(() => {
    if (!isCloudConfigured || !auth) {
      setAuthLoading(false);
      return undefined;
    }
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u ? toUser(u) : null);
      if (u) setMode('user');
      setAuthLoading(false);
    });
    return unsubscribe;
  }, [setMode]);

  // "signed in" was saved but there is no live session any more -> back to guest
  useEffect(() => {
    if (!authLoading && mode === 'user' && !user) setMode('guest');
  }, [authLoading, mode, user, setMode]);

  const continueAsGuest = useCallback(() => setMode('guest'), [setMode]);

  const signUpWithEmail = useCallback(async (email, password) => {
    if (!isCloudConfigured || !auth) throw new Error(NOT_SETUP);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (e) {
      throw new Error(friendlyError(e));
    }
  }, []);

  const signInWithEmail = useCallback(async (email, password) => {
    if (!isCloudConfigured || !auth) throw new Error(NOT_SETUP);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      throw new Error(friendlyError(e));
    }
  }, []);

  const sendReset = useCallback(async (email) => {
    if (!isCloudConfigured || !auth) throw new Error(NOT_SETUP);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (e) {
      // do not reveal whether an account exists for this email
      if (e && e.code === 'auth/user-not-found') return;
      throw new Error(friendlyError(e));
    }
  }, []);

  // Returns true when signed in, false when the user cancelled.
  const signInWithGoogle = useCallback(async () => {
    if (!isCloudConfigured || !auth) throw new Error(NOT_SETUP);
    if (!GOOGLE_WEB_CLIENT_ID) {
      throw new Error('Google sign-in needs a web client ID in src/cloud/firebaseConfig.js.');
    }

    let google;
    try {
      google = require('@react-native-google-signin/google-signin');
    } catch (e) {
      throw new Error(GOOGLE_NEEDS_BUILD);
    }
    const { GoogleSignin, statusCodes, isErrorWithCode } = google || {};
    if (!GoogleSignin || typeof GoogleSignin.configure !== 'function') throw new Error(GOOGLE_NEEDS_BUILD);

    try {
      GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const res = await GoogleSignin.signIn();
      if (res && res.type === 'cancelled') return false;
      const idToken = (res && res.data && res.data.idToken) || (res && res.idToken);
      if (!idToken) throw new Error('Google did not return a sign-in token. Please try again.');
      await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
      return true;
    } catch (e) {
      if (isErrorWithCode && statusCodes && isErrorWithCode(e) && e.code === statusCodes.SIGN_IN_CANCELLED) {
        return false;
      }
      throw new Error(friendlyError(e));
    }
  }, []);

  const signOut = useCallback(async () => {
    if (auth) await firebaseSignOut(auth);
    try {
      const google = require('@react-native-google-signin/google-signin');
      if (google && google.GoogleSignin) await google.GoogleSignin.signOut();
    } catch (e) {
      // Google package not installed or not available: nothing to do
    }
    // onAuthStateChanged then moves the app back to guest mode; local data is kept
  }, []);

  const requireUid = () => {
    const uid = auth && auth.currentUser && auth.currentUser.uid;
    if (!db || !uid) throw new Error('Please sign in first.');
    return uid;
  };

  // The most recent backup in the cloud: { updatedAt } or null if none yet.
  const getCloudInfo = useCallback(async () => {
    const uid = requireUid();
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      return snap.exists() ? { updatedAt: snap.data().updatedAt || 0 } : null;
    } catch (e) {
      throw new Error(friendlyError(e));
    }
  }, []);

  const backupNow = useCallback(async () => {
    const uid = requireUid();
    try {
      const data = await storage.exportData();
      const payload = JSON.stringify(data);
      if (payload.length > MAX_BACKUP_CHARS) throw new Error('Your data is too large to back up to this account.');
      const at = Date.now();
      await setDoc(doc(db, 'users', uid), { payload, updatedAt: at, schema: 1 });
      await storage.setSetting('last_backup', String(at));
      return at;
    } catch (e) {
      throw new Error(friendlyError(e));
    }
  }, []);

  const restoreNow = useCallback(async () => {
    const uid = requireUid();
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (!snap.exists()) throw new Error('No backup was found for this account yet.');
      const data = JSON.parse(snap.data().payload);
      await storage.importData(data);
      await storage.setSetting('last_backup', String(snap.data().updatedAt || Date.now()));
      if (onDataRestored) await onDataRestored();
      return true;
    } catch (e) {
      throw new Error(friendlyError(e));
    }
  }, [onDataRestored]);

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
      signInWithGoogle,
      signOut,
      backupNow,
      restoreNow,
      getCloudInfo,
    }),
    [
      mode,
      user,
      authLoading,
      continueAsGuest,
      signUpWithEmail,
      signInWithEmail,
      sendReset,
      signInWithGoogle,
      signOut,
      backupNow,
      restoreNow,
      getCloudInfo,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}