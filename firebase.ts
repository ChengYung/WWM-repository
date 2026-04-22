import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);

// Use getFirestore with explicit databaseId from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);

// Connectivity Test
async function testConnection() {
  try {
    // Attempting a simple read to check network/config
    await getDocFromServer(doc(db, '_internal_', 'connection_test'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration: Firestore appears unreachable.");
    }
  }
}
testConnection();
