/**
 * Lovable auth replaced with Querify JWT auth.
 * All auth flows now go through FastAPI backend.
 */
export const lovable = {
  auth: {
    signInWithOAuth: async () => {
      return { error: new Error("OAuth not supported. Use email/password.") };
    },
  },
};
