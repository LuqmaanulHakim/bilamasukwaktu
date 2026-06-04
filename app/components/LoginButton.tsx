"use client";

import { auth, db } from "../lib/firebase";

import {
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function LoginButton() {
  const router = useRouter();
  
  const handleLogin = async (): Promise<void> => {
    try {
      const provider = new GoogleAuthProvider();

      const result = await signInWithPopup(
        auth,
        provider
      );

      const user = result.user;

      // Reference to user document
      const userRef = doc(db, "users", user.uid);

      // Check if user already exists
      const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      try {
          await setDoc(userRef, {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          createdAt: serverTimestamp(),
          });
          console.log("User saved to Firestore");
      } catch (firestoreError) {
          console.error("Firestore write failed:", firestoreError);
      }
    }
      console.log("Login success");
      router.push("/dashboard");  
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <button onClick={handleLogin}>
      Login with Google
    </button>
  );
}