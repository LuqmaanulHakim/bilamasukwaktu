"use client";

import { useTasbih } from "../hooks/useTasbih";

export default function TasbihCounter({ uid }: { uid: string }) {
  const { count, loading, add, reset } = useTasbih(uid);

  if (loading) return <p>Loading tasbih...</p>;

  return (
    <div>
      <h2>Tasbih</h2>
      <p>{count}</p>
      <button onClick={add}>+</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}