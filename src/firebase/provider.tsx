
'use client';
import { createContext, useContext, ReactNode, useMemo } from 'react';
import { FirebaseApp }from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import FirebaseErrorListener from '@/components/FirebaseErrorListener';

export type FirebaseContextValue = {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
};

const FirebaseContext = createContext<FirebaseContextValue | undefined>(undefined);

export type FirebaseProviderProps = {
  children: ReactNode;
  value: FirebaseContextValue;
};

export function FirebaseProvider({ children, value }: FirebaseProviderProps) {
  const memoizedValue = useMemo(() => value, [value]);
  return (
    <FirebaseContext.Provider value={memoizedValue}>
      {children}
      {process.env.NODE_ENV === 'development' && <FirebaseErrorListener />}
    </FirebaseContext.Provider>
  );
}

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

export const useFirebaseApp = () => useFirebase().firebaseApp;
export const useAuth = () => useFirebase().auth;
export const useFirestore = () => useFirebase().firestore;
