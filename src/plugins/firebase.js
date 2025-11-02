import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAvLy4u0QSAw9Rg_cDoZfwZyhDOENtMEmo",
  authDomain: "js-training-b20a2.firebaseapp.com",
  projectId: "js-training-b20a2",
  storageBucket: "js-training-b20a2.appspot.com",
  messagingSenderId: "966215365233",
  appId: "1:966215365233:web:89fef9f9987873c35721d0",
  measurementId: "G-RD4GPBKQDH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firebase services
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };