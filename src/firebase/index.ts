import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

let firebaseApp: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

// This function initializes and returns the Firebase services.
// It's designed to be idempotent, meaning it can be called multiple
// times without re-initializing the app.
function initializeFirebase() {
  if (!getApps().length) {
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    firebaseApp = getApp();
  }
  auth = getAuth(firebaseApp);
  firestore = getFirestore(firebaseApp);
  
  return { firebaseApp, auth, firestore };
}

// We call initializeFirebase once and export the initialized services.
// This ensures that any part of the app importing from this file
// gets the same, stable instances of auth and firestore.
const services = initializeFirebase();
const firebaseAppInstance = services.firebaseApp;
const authInstance = services.auth;
const firestoreInstance = services.firestore;

export { 
    initializeFirebase,
    firebaseAppInstance as firebaseApp,
    authInstance as auth,
    firestoreInstance as firestore
};

export * from './provider';
export * from './auth/use-user';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
