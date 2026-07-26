import { useState, useEffect } from "react";
import { onAuthChange, logOut, type User } from "@/lib/firebase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange((u) => {
      setUser(u);
      if (u) {
        if (typeof window !== "undefined") localStorage.setItem("querify_authed", "true");
      } else {
        if (typeof window !== "undefined") localStorage.removeItem("querify_authed");
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signOut = async () => {
    await logOut();
    if (typeof window !== "undefined") localStorage.removeItem("querify_authed");
    window.location.href = "/login";
  };

  return { user, loading, isAuthenticated: !!user, signOut };
}
