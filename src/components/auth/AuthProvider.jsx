// src/components/auth/AuthProvider.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

const AuthCtx = createContext(null);

export function useAuth() {
  return useContext(AuthCtx);
}

// Legacy role migration map - convert old hazard roles to EMS roles
const ROLE_MIGRATION = {
  citizen: 'paramedic',
  analyst: 'hospital_admin',
  official: 'command_center'
};

// Valid EMS roles
const VALID_ROLES = ['paramedic', 'hospital_admin', 'command_center', 'dispatcher', 'admin', 'ambulance_driver'];

// Default role for new users
const DEFAULT_ROLE = 'paramedic';

export default function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRole] = useState(DEFAULT_ROLE);
  const [userDoc, setUserDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to normalize/migrate role
  const normalizeRole = (rawRole) => {
    if (!rawRole) return DEFAULT_ROLE;
    // Migrate legacy roles
    if (ROLE_MIGRATION[rawRole]) return ROLE_MIGRATION[rawRole];
    // Check if valid EMS role
    if (VALID_ROLES.includes(rawRole)) return rawRole;
    // Fallback
    return DEFAULT_ROLE;
  };

  useEffect(() => {
    const auth = getAuth();
    return onAuthStateChanged(auth, async (user) => {
      console.log('onAuthStateChanged: User changed', user?.email);
      setCurrentUser(user);
      if (user) {
        try {
          const db = getFirestore();
          const ref = doc(db, 'users', user.uid);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const data = snap.data();
            const storedRole = data?.role;
            console.log('onAuthStateChanged: Stored role from Firestore:', storedRole);
            const normalizedRole = normalizeRole(storedRole);
            console.log('onAuthStateChanged: Normalized role:', normalizedRole);

            // Auto-migrate legacy roles in Firestore
            if (storedRole !== normalizedRole) {
              console.log(`Migrating role: ${storedRole} -> ${normalizedRole}`);
              await setDoc(ref, { role: normalizedRole }, { merge: true });
            }

            setRole(normalizedRole);
            setUserDoc(data);
          } else {
            console.log('onAuthStateChanged: No user document, creating with default role');
            await setDoc(ref, {
              role: DEFAULT_ROLE,
              email: user.email || null,
              displayName: user.displayName || null,
              createdAt: new Date().toISOString()
            });
            setRole(DEFAULT_ROLE);
          }
        } catch (error) {
          console.error('Error setting up user:', error);
          setRole(DEFAULT_ROLE);
        }
      } else {
        console.log('onAuthStateChanged: No user, resetting to default role');
        setRole(DEFAULT_ROLE);
      }
      setLoading(false);
    });
  }, []);

  const login = async (email, password) => {
    const auth = getAuth();
    const cred = await signInWithEmailAndPassword(auth, email, password);

    // Explicitly fetch and set role after login
    const db = getFirestore();
    const ref = doc(db, 'users', cred.user.uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const storedRole = snap.data()?.role;
      console.log('Login: User role from Firestore:', storedRole);
      const normalizedRole = normalizeRole(storedRole);
      setRole(normalizedRole);
    } else {
      console.log('Login: No user document found, using default role');
      setRole(DEFAULT_ROLE);
    }
  };

  const register = async (email, password, demoRole) => {
    const auth = getAuth();
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const db = getFirestore();
    await setDoc(doc(db, 'users', cred.user.uid), {
      role: demoRole || DEFAULT_ROLE,
      email,
      createdAt: new Date().toISOString()
    });
  };

  const signInWithGoogle = async () => {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();

    // Configure provider settings
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user document exists, create if not
      const db = getFirestore();
      const userDoc = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDoc);

      if (!userSnap.exists()) {
        await setDoc(userDoc, {
          role: DEFAULT_ROLE,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          provider: 'google',
          createdAt: new Date().toISOString()
        });
      } else {
        // Migrate legacy role for existing Google users
        const storedRole = userSnap.data()?.role;
        const normalizedRole = normalizeRole(storedRole);
        if (storedRole !== normalizedRole) {
          await setDoc(userDoc, { role: normalizedRole }, { merge: true });
        }
      }

      return result;
    } catch (error) {
      console.error('Google sign-in failed:', error);

      // Handle specific error cases
      if (error.code === 'auth/popup-blocked') {
        throw new Error('Popup was blocked. Please allow popups for this site and try again.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in was cancelled.');
      } else if (error.code === 'auth/unauthorized-domain') {
        throw new Error('This domain is not authorized. Please contact support.');
      } else {
        throw new Error(error.message || 'Google sign-in failed');
      }
    }
  };

  const logout = async () => {
    const auth = getAuth();
    await signOut(auth);
  };

  const value = {
    currentUser,
    role,
    userDoc,
    login,
    register,
    logout,
    loading,
    signInWithGoogle
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}