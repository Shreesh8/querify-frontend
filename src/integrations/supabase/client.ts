/**
 * Supabase replaced with Querify JWT auth.
 * This stub prevents import errors from legacy code.
 */
export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    signInWithPassword: async () => ({ error: new Error("Use Querify auth instead") }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
};
