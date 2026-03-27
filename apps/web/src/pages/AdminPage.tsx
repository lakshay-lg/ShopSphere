import { useState, useEffect, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";
const TOKEN_KEY = "ss_admin_token";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
}

export default function AdminPage() {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) ?? "");
  const [tokenInput, setTokenInput] = useState("");
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchMessages = useCallback(async (t: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/contact-messages`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.status === 401) {
        setError("Invalid admin token.");
        setToken("");
        sessionStorage.removeItem(TOKEN_KEY);
        return;
      }
      if (!res.ok) throw new Error(`Server error (${res.status})`);
      const data = (await res.json()) as { messages: ContactMessage[] };
      setMessages(data.messages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) void fetchMessages(token);
  }, [token, fetchMessages]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const t = tokenInput.trim();
    if (!t) return;
    sessionStorage.setItem(TOKEN_KEY, t);
    setToken(t);
    setTokenInput("");
  }

  function handleLogout() {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken("");
    setMessages([]);
    setError("");
  }

  // — Token gate
  if (!token) {
    return (
      <div className="page-container flex items-center justify-center min-h-[70vh]">
        <div className="glass-card rounded-2xl p-10 border border-white/20 w-full max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <span className="material-symbols-outlined text-3xl text-primary">admin_panel_settings</span>
            <div>
              <p className="eyebrow">ShopSphere</p>
              <h1 className="font-headline text-2xl font-bold">Admin Access</h1>
            </div>
          </div>
          {error && (
            <p className="text-sm text-error font-medium mb-4 flex items-center gap-1">
              <span className="material-symbols-outlined text-base">error</span>
              {error}
            </p>
          )}
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="eyebrow block mb-2">Admin Token</label>
              <input
                type="password"
                className="input-field w-full"
                placeholder="Enter admin token"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                autoFocus
                required
              />
            </div>
            <button type="submit" className="btn-primary">
              Access Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Admin</p>
          <h1 className="font-headline text-5xl font-bold tracking-tight text-on-surface">
            Contact Messages
          </h1>
          <p className="text-on-surface-variant mt-2">
            {loading ? "Loading…" : `${messages.length} submission${messages.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex gap-3 self-start md:self-auto">
          <button
            className="btn-secondary !py-2 !px-4 !text-xs flex items-center gap-1"
            onClick={() => void fetchMessages(token)}
            disabled={loading}
          >
            <span className="material-symbols-outlined text-base">refresh</span>
            Refresh
          </button>
          <button
            className="btn-secondary !py-2 !px-4 !text-xs text-error border-error/30 hover:bg-error/5"
            onClick={handleLogout}
          >
            Sign Out
          </button>
        </div>
      </header>

      {error && (
        <div className="glass-card rounded-lg p-4 border border-error/30 bg-error/5 mb-6 flex items-center gap-3">
          <span className="material-symbols-outlined text-error">error</span>
          <p className="text-sm text-error font-medium">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24 text-on-surface-variant">
          <div className="flex flex-col items-center gap-4">
            <span className="material-symbols-outlined text-5xl animate-spin text-primary">
              progress_activity
            </span>
            <p className="font-label text-sm uppercase tracking-widest">Loading messages…</p>
          </div>
        </div>
      ) : messages.length === 0 ? (
        <div className="glass-card rounded-lg p-16 text-center border border-white/20">
          <span className="material-symbols-outlined text-5xl text-outline mb-3 block">
            inbox
          </span>
          <p className="font-headline text-lg font-bold">No messages yet</p>
          <p className="text-sm text-on-surface-variant mt-1">
            Contact form submissions will appear here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {messages.map((msg) => {
            const isExpanded = expandedId === msg.id;
            const date = new Date(msg.createdAt);
            return (
              <div
                key={msg.id}
                className="glass-card rounded-xl border border-white/20 overflow-hidden"
              >
                {/* Row header — always visible */}
                <button
                  className="w-full text-left px-6 py-4 flex items-center gap-4 hover:bg-white/5 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : msg.id)}
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-lg">person</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{msg.name}</p>
                      <p className="text-xs text-on-surface-variant">{msg.email}</p>
                    </div>
                    <p className="text-sm text-on-surface-variant truncate mt-0.5">
                      {msg.message}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-xs text-on-surface-variant">
                      {date.toLocaleDateString("en-IN", { dateStyle: "medium" })}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {date.toLocaleTimeString("en-IN", { timeStyle: "short" })}
                    </p>
                  </div>
                  <span
                    className={`material-symbols-outlined text-on-surface-variant transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                  >
                    expand_more
                  </span>
                </button>

                {/* Expanded message body */}
                {isExpanded && (
                  <div className="px-6 pb-6 pt-2 border-t border-outline-variant/20">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                      <div>
                        <p className="eyebrow">Full Name</p>
                        <p className="font-medium">{msg.name}</p>
                      </div>
                      <div>
                        <p className="eyebrow">Email</p>
                        <a
                          href={`mailto:${msg.email}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {msg.email}
                        </a>
                      </div>
                      <div>
                        <p className="eyebrow">Submission ID</p>
                        <p className="font-mono text-xs text-on-surface-variant">{msg.id}</p>
                      </div>
                    </div>
                    <div>
                      <p className="eyebrow mb-2">Message</p>
                      <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap bg-surface-container-low rounded-lg p-4">
                        {msg.message}
                      </p>
                    </div>
                    <div className="mt-4">
                      <a
                        href={`mailto:${msg.email}?subject=Re: Your ShopSphere enquiry`}
                        className="btn-primary !py-2 !px-4 !text-xs inline-flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-base">reply</span>
                        Reply via Email
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
