import { useState } from "react";
import { useAuth } from "../context/AuthContext.js";

type AuthMode = "login" | "register";

function LoginPage() {
  const { user, isLoading, login, register, logout } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus(null);
    setIsSubmitting(true);
    try {
      if (mode === "login") {
        await login(email, password);
        setStatus("Logged in. Your session is now active on this browser.");
      } else {
        await register(email, password);
        setStatus("Account created and logged in successfully.");
      }
      setPassword("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Request failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-on-surface-variant">
          <span className="material-symbols-outlined text-5xl animate-spin text-primary">progress_activity</span>
          <p className="font-label text-sm uppercase tracking-widest">Restoring session…</p>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="glass-card rounded-xl p-10 md:p-12 w-full max-w-md text-center shadow-glass">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-3xl text-green-600">verified_user</span>
          </div>
          <p className="eyebrow mb-1">Authentication</p>
          <h1 className="font-headline text-3xl font-bold mb-3">You're signed in.</h1>
          <p className="text-on-surface-variant mb-4">
            Logged in as <strong className="text-on-surface">{user.email}</strong>.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <span className="px-3 py-1.5 rounded-full bg-surface-container text-xs font-mono text-on-surface-variant border border-outline-variant/20">
              ID: {user.id.slice(-8)}
            </span>
            <span className="px-3 py-1.5 rounded-full bg-surface-container text-xs font-mono text-on-surface-variant border border-outline-variant/20">
              Joined: {new Date(user.createdAt).toLocaleDateString()}
            </span>
          </div>
          <button className="btn-secondary w-full" type="button" onClick={logout}>
            Log Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary-fixed/20 blur-[120px] rounded-full -z-10 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-secondary-container/20 blur-[100px] rounded-full -z-10 pointer-events-none"></div>

      <div className="glass-card rounded-xl p-10 md:p-12 w-full max-w-md shadow-glass">
        <p className="eyebrow mb-1">Authentication</p>
        <h1 className="font-headline text-3xl font-bold mb-2">
          {mode === "login" ? "Welcome back." : "Create your account."}
        </h1>
        <p className="text-on-surface-variant text-sm mb-8">
          {mode === "login"
            ? "Sign in to access your orders and flash drops."
            : "Register a new account to start shopping on ShopSphere."}
        </p>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-8 p-1 rounded-md bg-surface-container-low">
          {(["login", "register"] as AuthMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 py-2 rounded text-xs font-bold font-headline uppercase tracking-wide transition-all duration-200 ${
                mode === m
                  ? "bg-white text-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {m === "login" ? "Log In" : "Register"}
            </button>
          ))}
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="relative">
            <label className="absolute -top-2.5 left-4 px-2 bg-white/90 text-primary text-[10px] font-bold uppercase tracking-widest z-10 rounded">
              Email
            </label>
            <input
              type="email"
              className="input-field"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="relative">
            <label className="absolute -top-2.5 left-4 px-2 bg-white/90 text-primary text-[10px] font-bold uppercase tracking-widest z-10 rounded">
              Password
            </label>
            <input
              type="password"
              className="input-field"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>

          {error && (
            <p className="text-sm text-error font-medium bg-error/5 rounded-lg px-4 py-3">{error}</p>
          )}
          {status && (
            <p className="text-sm text-green-700 font-medium bg-green-50 rounded-lg px-4 py-3">{status}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full py-4 disabled:opacity-60"
          >
            {isSubmitting ? "Working…" : mode === "login" ? "Log In" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
