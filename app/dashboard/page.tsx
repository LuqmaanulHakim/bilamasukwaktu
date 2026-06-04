"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";
import LogoutButton from "../components/LogoutButton";
import TasbihCounter from "../components/TasbihCounter";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading]);

  // 👇 Guard covers both loading and the brief logout transition
  if (loading || !user) return <p>Loading...</p>;

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user.name}</p>
      <p>{user.email}</p>
      <img src={user.photoURL} width={80} height={80} alt="profile" />

      <TasbihCounter uid={user.uid} /> {/* no more ! needed */}

      <LogoutButton />
    </div>
  );
}