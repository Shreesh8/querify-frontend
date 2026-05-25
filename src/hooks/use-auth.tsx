import { useState, useEffect } from "react";
import { isAuthenticated, clearToken } from "@/lib/api";

export type User = {
  id: string;
  email: string;
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated()) {
      // Decode user from JWT token
      const token = localStorage.getItem("querify_token");
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          setUser({ id: payload.sub, email: payload.email ?? "" });
        } catch {
          clearToken();
        }
      }
    }
    setLoading(false);
  }, []);

  const signOut = () => {
    clearToken();
    window.location.href = "/login";
  };

  return { user, loading, isAuthenticated: isAuthenticated(), signOut };
}
