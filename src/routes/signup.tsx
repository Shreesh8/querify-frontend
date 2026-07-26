import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { signUpWithEmail, signInWithGoogle } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { isAuthenticated } from "@/lib/api";

export const Route = createFileRoute("/signup")({
  beforeLoad: async () => {
    if (isAuthenticated()) throw redirect({ to: "/app" });
  },
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signUpWithEmail(email, password);
      toast.success("Account created! Welcome to Querify.");
      navigate({ to: "/app" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithGoogle();
      navigate({ to: "/app" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_20%,oklch(0.55_0.18_265/0.25),transparent_55%),radial-gradient(circle_at_75%_75%,oklch(0.55_0.22_300/0.20),transparent_55%)]" />
      <div className="w-full max-w-md rounded-2xl border border-glass-border bg-glass p-8 backdrop-blur-2xl shadow-2xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent-violet shadow-glow">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Create your workspace</h1>
          <p className="mt-1 text-sm text-muted-foreground">Start analyzing your data in minutes</p>
        </div>
        <Button variant="outline" className="w-full" onClick={handleGoogle}>
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path fill="currentColor" d="M21.35 11.1H12v3.2h5.35c-.23 1.4-1.6 4.1-5.35 4.1-3.22 0-5.85-2.67-5.85-5.95s2.63-5.95 5.85-5.95c1.83 0 3.05.78 3.75 1.45l2.55-2.46C16.65 4.18 14.55 3.3 12 3.3 6.96 3.3 2.85 7.4 2.85 12.45S6.96 21.6 12 21.6c6.93 0 9.15-4.86 9.15-7.4 0-.5-.05-.88-.13-1.1z"/>
          </svg>
          Continue with Google
        </Button>
        <div className="relative my-6 text-center text-xs text-muted-foreground">
          <div className="absolute inset-y-1/2 left-0 right-0 border-t border-glass-border" />
          <span className="relative bg-glass px-2">or with email</span>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="w-full bg-gradient-to-r from-primary to-accent-violet text-primary-foreground shadow-glow" disabled={loading}>
            {loading ? "Creating…" : "Create account"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
