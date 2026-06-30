import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { setAuthToken, removeAuthToken } from '../api';

interface AuthContextType {
  currentUser: User | null;
  userData: any | null;
  loading: boolean;
  loginStaff: (email: string, pass: string) => Promise<void>;
  loginStudent: (_studentId: string, _pin: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Mock asking for a JWT token from Express server using Firebase info
        try {
          const res = await fetch('/api/auth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: user.uid, email: user.email })
          });
          const data = await res.json();
          if (data.token) {
            setAuthToken(data.token);
          }
        } catch(e) {
          console.error('Failed to get JWT token from server', e);
        }

        // Fetch user metadata from Firebase Realtime DB
        const snap = await get(ref(db, `users/${user.uid}`));
        if (snap.exists()) {
          setUserData(snap.val());
        }
      } else {
        setUserData(null);
        removeAuthToken();
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loginStaff = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const loginStudent = async (_studentId: string, _pin: string) => {
    // Implement student login logic based on old script
    // E.g., looking up student node, matching PIN, then generating a custom token or just setting state
    throw new Error('Student login not fully implemented yet');
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ currentUser, userData, loading, loginStaff, loginStudent, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
