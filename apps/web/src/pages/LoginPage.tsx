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
      setError(
        submitError instanceof Error ? submitError.message : "Request failed",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <section className="content-page login-page">
        <article className="card-surface login-panel">
          <p className="section-kicker">Authentication</p>
          <h1>Restoring your session...</h1>
          <p>Checking whether you already have an active ShopSphere login.</p>
        </article>
      </section>
    );
  }

  if (user) {
    return (
      <section className="content-page login-page">
        <article className="card-surface login-panel auth-success-panel">
          <p className="section-kicker">Authentication</p>
          <h1>You're signed in.</h1>
          <p>
            Logged in as <strong>{user.email}</strong>. This demo stores the
            token locally and re-validates it with the API on reload.
          </p>
          <div className="auth-chip-row">
            <span className="info-chip">User ID: {user.id}</span>
            <span className="info-chip">
              Joined: {new Date(user.createdAt).toLocaleDateString()}
            </span>
          </div>
          <button className="button-secondary" type="button" onClick={logout}>
            Log Out
          </button>
        </article>
      </section>
    );
  }

  return (
    <section className="content-page login-page">
      <article className="card-surface login-panel">
        <p className="section-kicker">Authentication</p>
        <h1>
          {mode === "login" ? "Log in to ShopSphere" : "Create your account"}
        </h1>
        <p>
          This auth flow is now live for the demo. Register a new account or
          sign in with an existing one to establish a client session.
        </p>

        <div className="auth-toggle" role="tablist" aria-label="Auth mode">
          <button
            className={mode === "login" ? "button-primary" : "button-secondary"}
            type="button"
            onClick={() => setMode("login")}
          >
            Log In
          </button>
          <button
            className={
              mode === "register" ? "button-primary" : "button-secondary"
            }
            type="button"
            onClick={() => setMode("register")}
          >
            Register
          </button>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          {status ? <p className="form-success">{status}</p> : null}
          <button
            className="button-primary"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Working..."
              : mode === "login"
                ? "Log In"
                : "Create Account"}
          </button>
        </form>
      </article>
    </section>
  );
}

export default LoginPage;
