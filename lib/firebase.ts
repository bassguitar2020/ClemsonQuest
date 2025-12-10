import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  Auth,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';

declare module 'firebase/auth' {
  // Minimal declaration to satisfy TypeScript for React Native
  export function getReactNativePersistence(storage: any): any;
}

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${name}`);
  }

  return value;
}

const firebaseConfig = {
  apiKey: requireEnv('EXPO_PUBLIC_FIREBASE_API_KEY'),
  authDomain: requireEnv('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: requireEnv('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: requireEnv('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: requireEnv('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: requireEnv('EXPO_PUBLIC_FIREBASE_APP_ID'),
  measurementId: requireEnv('EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID'),
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let auth: Auth;

if (Platform.OS === 'web') {
  // Web can just use the default
  auth = getAuth(app);
} else {
  // Native (iOS / Android) – use AsyncStorage persistence
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}


export { auth };
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
