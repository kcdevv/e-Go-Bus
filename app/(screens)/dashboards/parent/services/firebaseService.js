import { initializeApp, getApps } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';
import Constants from 'expo-constants';

const firebaseConfig = {
  apiKey: Constants.expoConfig.extra.FIREBASE_API_KEY, 
  authDomain: Constants.expoConfig.extra.FIREBASE_AUTH_DOMAIN,
  projectId: Constants.expoConfig.extra.FIREBASE_PROJECT_ID,
  storageBucket: Constants.expoConfig.extra.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: Constants.expoConfig.extra.FIREBASE_MESSAGING_SENDER_ID,
  appId: Constants.expoConfig.extra.FIREBASE_APP_ID,
  measurementId: Constants.expoConfig.extra.FIREBASE_MEASUREMENT_ID,
  databaseURL: Constants.expoConfig.extra.FIREBASE_DATABASE_URL,
};


let app;
// Prevent reinitialization of Firebase in hot reload scenarios
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
}

// Initialize Firebase Storage and Database
const storage = getStorage(app);
const database = getDatabase(app);

export { storage, database };