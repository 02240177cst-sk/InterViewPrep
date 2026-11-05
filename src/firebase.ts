import { getApp, getApps, initializeApp } from 'firebase/app';
// @ts-ignore
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyDBwq2ch6EEtNVga0eBFFY8o0NCMwN1yvA',
  authDomain: 'cte308project2.firebaseapp.com',
  projectId: 'cte308project2',
  storageBucket: 'cte308project2.firebasestorage.app',
  messagingSenderId: '776525106242',
  appId: '1:776525106242:web:5a2335c05fc43a0baff1db',
};

const isFirstLoad = getApps().length === 0;
const app = isFirstLoad ? initializeApp(firebaseConfig) : getApp();

export const auth = isFirstLoad
  ? initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })
  : getAuth(app);

export const db = isFirstLoad
  ? initializeFirestore(app, { experimentalForceLongPolling: true })
  : getFirestore(app);