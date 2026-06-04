// src/components/LogoutButton.tsx
"use client";

import { auth } from "../lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  return (
    <button onClick={handleLogout}>
      Logout
    </button>
  );
}