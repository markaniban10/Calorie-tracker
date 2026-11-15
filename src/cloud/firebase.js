// Starts Firebase only when src/cloud/firebaseConfig.js has been filled in.
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseConfig, isCloudConfigured } from './firebaseConfig';

let app = null;
let auth = null;
let db = null;

if (isCloudConfigured) {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);

  try {
    // keeps the user signed in between app launches
    auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch (e) {
    // already initialized (fast refresh) or persistence unavailable
    auth = getAuth(app);
  }

  try {
    db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
  } catch (e) {
    db = getFirestore(app);
  }
}

export { app, auth, db };