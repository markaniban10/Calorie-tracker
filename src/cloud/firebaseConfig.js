// Accounts are OPTIONAL. Until you fill this in, the app works as guest-only.
//
// 1. Firebase console > Project settings > Your apps > Web app > copy the config below.
// 2. Authentication > Sign-in method > turn on "Email/Password" (and "Google" later).
// 3. Firestore Database > create it, then paste the rules from the README.




export const firebaseConfig = {
  apiKey: "AIzaSyAuOHvbAFK_cgVb_S3atJdYiefSTXhKknw",
  authDomain: "calorie-tracker-ce9d0.firebaseapp.com",
  projectId: "calorie-tracker-ce9d0",
  storageBucket: "calorie-tracker-ce9d0.firebasestorage.app",
  messagingSenderId: "265258591705",
  appId: "1:265258591705:web:95a452f188c42afb7425c8",
  measurementId: "G-NX9TJGYWM5"
};

// Only needed for "Continue with Google".
// Firebase console > Authentication > Sign-in method > Google > Web SDK configuration > Web client ID
export const GOOGLE_WEB_CLIENT_ID = '';

export const isCloudConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);