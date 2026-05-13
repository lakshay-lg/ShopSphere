import { useState } from "react";
import { useAuth } from "../context/AuthContext.js";
import Icon from "../components/Icon.js";

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
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 48, height: 48, border: "3px solid var(--c-line)", borderTopColor: "var(--c-primary)",
            borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px",
          }}/>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--c-muted)" }}>
            Restoring session…
          </p>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
        <div className="ss-card" style={{ width: "100%", maxWidth: 420, textAlign: "center", padding: "48px 40px" }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%", background: "var(--c-success-soft)",
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", color: "var(--c-success)"
          }}>
            <Icon name="check" size={24} stroke={2.5}/>
          </div>
          <p className="eyebrow" style={{ marginBottom: 8 }}>Authentication</p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 8 }}>
            You're signed in.
          </h1>
          <p style={{ fontSize: 13, color: "var(--c-muted)", marginBottom: 24 }}>
            Logged in as <strong style={{ color: "var(--c-ink)" }}>{user.email}</strong>.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginBottom: 32 }}>
            <span className="ss-pill ss-pill-blue" style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
              ID: {user.id.slice(-8)}
            </span>
            <span className="ss-pill" style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
              Since: {new Date(user.createdAt).toLocaleDateString("en-IN")}
            </span>
          </div>
          <button className="btn-secondary" style={{ width: "100%" }} onClick={logout}>
            Log Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "80vh", display: "grid", gridTemplateColumns: "1fr 1fr" }} className="auth-grid">
      {/* Left: dark brand panel */}
      <div style={{
        background: "var(--c-ink)", color: "var(--c-surface)",
        padding: "64px 56px", display: "flex", flexDirection: "column", justifyContent: "center",
        minHeight: 600,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 56 }}>
          <div style={{
            width: 32, height: 32, background: "var(--c-accent)", borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "#fff", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 14 }}>S</span>
          </div>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16 }}>ShopSphere</span>
          <span style={{ color: "var(--c-accent)" }}>.</span>
        </div>

        <p className="eyebrow" style={{ color: "rgba(244,246,248,0.5)", marginBottom: 16 }}>
          Queue-first commerce
        </p>
        <h2 style={{
          fontFamily: "var(--font-display)", fontSize: 40, fontWeight: 800,
          letterSpacing: "-0.04em", lineHeight: 1.05, marginBottom: 24,
          color: "#fff",
        }}>
          Sign in once.<br />Stay in line.
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: "rgba(244,246,248,0.65)", maxWidth: 340, marginBottom: 48 }}>
          Your cart persists across sessions. Your queue position is durable.
          Your next drop is one click away.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { icon: "shield", text: "JWT auth — never stored plain" },
            { icon: "pkg", text: "Persistent order relay across sessions" },
            { icon: "bolt", text: "Flash-queue ready the moment you log in" },
          ].map((item) => (
            <div key={item.text} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, background: "rgba(244,246,248,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                color: "var(--c-accent)",
              }}>
                <Icon name={item.icon} size={15} stroke={1.8}/>
              </div>
              <span style={{ fontSize: 13, color: "rgba(244,246,248,0.7)" }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right: form */}
      <div style={{
        background: "var(--c-bg)", padding: "64px 56px",
        display: "flex", flexDirection: "column", justifyContent: "center",
      }}>
        <div style={{ maxWidth: 380 }}>
          <p className="eyebrow" style={{ marginBottom: 8 }}>Authentication</p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 24 }}>
            {mode === "login" ? "Welcome back." : "Create account."}
          </h1>

          {/* Mode toggle */}
          <div style={{
            display: "flex", background: "var(--c-surface)", border: "1px solid var(--c-line)",
            borderRadius: 12, padding: 4, marginBottom: 28, gap: 4,
          }}>
            {(["login", "register"] as AuthMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                style={{
                  flex: 1, padding: "8px 0", borderRadius: 9, border: "none", cursor: "pointer",
                  fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 700,
                  letterSpacing: "0.03em", textTransform: "uppercase" as const,
                  transition: "all 0.2s",
                  background: mode === m ? "var(--c-ink)" : "transparent",
                  color: mode === m ? "var(--c-surface)" : "var(--c-muted)",
                }}
              >
                {m === "login" ? "Log In" : "Register"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "var(--c-muted)", marginBottom: 6 }}>
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
            <div>
              <label style={{ display: "block", fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "var(--c-muted)", marginBottom: 6 }}>
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
              <div style={{ background: "var(--c-danger-soft)", border: "1px solid var(--c-danger)", borderRadius: 10, padding: "10px 14px" }}>
                <p style={{ fontSize: 13, color: "var(--c-danger)", fontWeight: 600 }}>{error}</p>
              </div>
            )}
            {status && (
              <div style={{ background: "var(--c-success-soft)", border: "1px solid var(--c-success)", borderRadius: 10, padding: "10px 14px" }}>
                <p style={{ fontSize: 13, color: "var(--c-success)", fontWeight: 600 }}>{status}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
              style={{ width: "100%", padding: "14px 0", marginTop: 4, opacity: isSubmitting ? 0.6 : 1 }}
            >
              {isSubmitting ? "Working…" : mode === "login" ? "Log In" : "Create Account"}
            </button>
          </form>

          <p style={{ marginTop: 24, fontSize: 12, color: "var(--c-muted)", textAlign: "center" as const }}>
            By continuing you agree to ShopSphere's{" "}
            <a href="/terms" style={{ color: "var(--c-primary)", textDecoration: "underline" }}>Terms</a> &{" "}
            <a href="/privacy" style={{ color: "var(--c-primary)", textDecoration: "underline" }}>Privacy</a>
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .auth-grid { grid-template-columns: 1fr !important; }
          .auth-grid > div:first-child { display: none !important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default LoginPage;
