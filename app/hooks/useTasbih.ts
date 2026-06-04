import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { doc, getDoc, setDoc, increment, updateDoc } from "firebase/firestore";

export function useTasbih(uid: string) {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const tasbihRef = doc(db, "users", uid, "tasbih", "main");

  useEffect(() => {
    const fetchCount = async () => {
      const snap = await getDoc(tasbihRef);
      if (snap.exists()) {
        setCount(snap.data().count ?? 0);
      } else {
        await setDoc(tasbihRef, { count: 0 });
      }
      setLoading(false);
    };

    fetchCount();
  }, [uid]);

  const add = async () => {
    setCount((prev) => prev + 1); // optimistic update
    await updateDoc(tasbihRef, { count: increment(1) });
  };

  const reset = async () => {
    setCount(0);
    await updateDoc(tasbihRef, { count: 0 });
  };

  return { count, loading, add, reset };
}