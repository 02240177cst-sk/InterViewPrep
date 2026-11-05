import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail,
  signInWithEmailAndPassword, signOut, updateProfile, User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { Profile } from './types';
import { syncAll } from './sync';

type Ctx = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  logIn: (email: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateName: (name: string) => Promise<void>;
  reloadProfile: () => Promise<void>;
};

const AuthCtx = createContext<Ctx>(null as any);
export const useAuth = () => useContext(AuthCtx);

export function authMessage(e: any) {
  const map: Record<string, string> = {
    'auth/invalid-email': 'That email address is not valid.',
    'auth/invalid-credential': 'Wrong email or password.',
    'auth/user-not-found': 'No account found with that email.',
    'auth/wrong-password': 'Wrong email or password.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/network-request-failed': 'No internet connection.',
    'auth/too-many-requests': 'Too many attempts. Try again later.',
  };
  console.log('AUTH ERROR', e?.code, e?.message);
  return map[e?.code] ?? `Something went wrong (${e?.code ?? e?.message}).`;
}

async function loadProfile(u: User): Promise<Profile> {
  const key = `profile:${u.uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', u.uid));
    if (snap.exists()) {
      const p = snap.data() as Profile;
      await AsyncStorage.setItem(key, JSON.stringify(p));
      return p;
    }
    console.log('PROFILE NOT FOUND for uid', u.uid);
  } catch (e) {
    console.log('PROFILE LOAD ERROR', e);
  }
  const cached = await AsyncStorage.getItem(key);
  if (cached) return JSON.parse(cached);
  return { name: u.displayName ?? '', email: u.email ?? '', role: 'user' };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(
    () =>
      onAuthStateChanged(auth, async (u) => {
        setUser(u);
        if (u) {
          setProfile(await loadProfile(u));
          syncAll(u.uid);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }),
    [],
  );

  // sync when the app returns to the foreground or the internet comes back
  useEffect(() => {
    if (!user) return;
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') syncAll(user.uid); });
    const unsub = NetInfo.addEventListener((s) => {
      if (s.isConnected && s.isInternetReachable !== false) syncAll(user.uid);
    });
    return () => { sub.remove(); unsub(); };
  }, [user]);

  const signUp = async (name: string, email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    const p: Profile = { name, email, role: 'user' };
    await setDoc(doc(db, 'users', cred.user.uid), { ...p, createdAt: Date.now() });
    await AsyncStorage.setItem(`profile:${cred.user.uid}`, JSON.stringify(p));
    setProfile(p);
  };

  const logIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logOut = async () => { await signOut(auth); };

  const resetPassword = async (email: string) => { await sendPasswordResetEmail(auth, email); };

  const updateName = async (name: string) => {
    if (!auth.currentUser) return;
    await updateProfile(auth.currentUser, { displayName: name });
    await setDoc(doc(db, 'users', auth.currentUser.uid), { name }, { merge: true });
    const p = { ...(profile as Profile), name };
    setProfile(p);
    await AsyncStorage.setItem(`profile:${auth.currentUser.uid}`, JSON.stringify(p));
  };

  const reloadProfile = async () => {
    if (auth.currentUser) setProfile(await loadProfile(auth.currentUser));
  };

  return (
    <AuthCtx.Provider value={{ user, profile, loading, signUp, logIn, logOut, resetPassword, updateName, reloadProfile }}>
      {children}
    </AuthCtx.Provider>
  );
}