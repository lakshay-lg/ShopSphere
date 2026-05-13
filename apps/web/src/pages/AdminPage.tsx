import { useState, useEffect, useCallback } from "react";
import Icon from "../components/Icon.js";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";
const TOKEN_KEY = "ss_admin_token";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
}

interface Product {
  id: string;
  sku: string;
  name: string;
  priceCents: number;
  stock: number;
  createdAt: string;
  updatedAt: string;
}

interface AdminUser {
  id: string;
  email: string;
  createdAt: string;
  _count: { orders: number };
}

interface AdminOrderItem {
  priceCents: number;
  quantity: number;
  product: { name: string; sku: string };
}

interface AdminOrder {
  id: string;
  userId: string;
  userEmail: string;
  status: "CONFIRMED" | "FAILED";
  failureReason: string | null;
  total: number;
  createdAt: string;
  items: AdminOrderItem[];
}

interface Stats {
  userCount: number;
  totalOrders: number;
  confirmedCount: number;
  revenue: number;
  lowStockCount: number;
  outOfStockCount: number;
}

type Tab = "messages" | "products" | "users" | "orders";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 2,
});
const toCurrency = (cents: number) => currency.format(cents / 100);

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 40, height: 40, border: "3px solid var(--c-line)", borderTopColor: "var(--c-primary)",
          borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px",
        }}/>
        <p style={{ fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" as const, color: "var(--c-muted)" }}>
          Loading…
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div style={{ background: "var(--c-danger-soft)", border: "1px solid var(--c-danger)", borderRadius: 12, padding: "12px 16px", marginBottom: 24, display: "flex", gap: 10, alignItems: "center" }}>
      <Icon name="x" size={16} stroke={2}/>
      <p style={{ fontSize: 13, color: "var(--c-danger)", fontWeight: 600 }}>{msg}</p>
    </div>
  );
}

// ─── Stats strip ──────────────────────────────────────────────────────────────

function StatsStrip({ token }: { token: string }) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json() as Promise<Stats>)
      .then(setStats)
      .catch(() => null);
  }, [token]);

  const cells: { label: string; value: string; sub?: string; accent?: string }[] = stats
    ? [
        { label: "Revenue", value: toCurrency(stats.revenue), sub: `${stats.confirmedCount} confirmed orders` },
        { label: "Total Orders", value: stats.totalOrders.toLocaleString("en-IN"), sub: `${stats.totalOrders - stats.confirmedCount} failed` },
        { label: "Users", value: stats.userCount.toLocaleString("en-IN") },
        {
          label: "Stock Alerts",
          value: (stats.lowStockCount + stats.outOfStockCount).toString(),
          sub: `${stats.outOfStockCount} out · ${stats.lowStockCount} low`,
          accent: stats.outOfStockCount > 0 ? "var(--c-danger)" : stats.lowStockCount > 0 ? "var(--c-warn)" : undefined,
        },
      ]
    : [];

  return (
    <div className="ss-card" style={{ padding: 0, marginBottom: 28, overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
        {stats === null
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ padding: "20px 24px", borderRight: i < 3 ? "1px solid var(--c-line)" : undefined }}>
                <div style={{ height: 11, width: 60, background: "var(--c-line)", borderRadius: 4, marginBottom: 10 }}/>
                <div style={{ height: 28, width: 90, background: "var(--c-line)", borderRadius: 6 }}/>
              </div>
            ))
          : cells.map((c, i) => (
              <div key={c.label} style={{ padding: "20px 24px", borderRight: i < 3 ? "1px solid var(--c-line)" : undefined }}>
                <p className="eyebrow" style={{ marginBottom: 6 }}>{c.label}</p>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, letterSpacing: "-0.03em", color: c.accent ?? "var(--c-ink)" }}>
                  {c.value}
                </p>
                {c.sub && <p style={{ fontSize: 12, color: "var(--c-muted)", marginTop: 3 }}>{c.sub}</p>}
              </div>
            ))}
      </div>
    </div>
  );
}

// ─── Messages tab ─────────────────────────────────────────────────────────────

function MessagesTab({ token }: { token: string }) {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/contact-messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Server error (${res.status})`);
      const data = (await res.json()) as { messages: ContactMessage[] };
      setMessages(data.messages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void fetchMessages(); }, [fetchMessages]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <p style={{ fontSize: 14, color: "var(--c-muted)" }}>
          {loading ? "Loading…" : `${messages.length} submission${messages.length !== 1 ? "s" : ""}`}
        </p>
        <button className="btn-secondary" style={{ padding: "7px 14px", fontSize: 12 }} onClick={() => void fetchMessages()} disabled={loading}>
          <Icon name="refresh" size={13}/>Refresh
        </button>
      </div>

      {error && <ErrorBanner msg={error}/>}
      {loading ? <Spinner/> : messages.length === 0 ? (
        <div className="ss-card" style={{ padding: 64, textAlign: "center" }}>
          <div style={{ color: "var(--c-muted)", marginBottom: 12 }}><Icon name="pkg" size={40} stroke={1.2}/></div>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Inbox empty</p>
          <p style={{ fontSize: 13, color: "var(--c-muted)" }}>Contact form submissions will appear here.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {messages.map((msg) => {
            const isExpanded = expandedId === msg.id;
            const date = new Date(msg.createdAt);
            return (
              <div key={msg.id} className="ss-card" style={{ padding: 0, overflow: "hidden" }}>
                <button
                  style={{ width: "100%", textAlign: "left", padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, background: "none", border: "none", cursor: "pointer" }}
                  onClick={() => setExpandedId(isExpanded ? null : msg.id)}
                >
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--c-primary-soft)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--c-primary)", flexShrink: 0 }}>
                    <Icon name="user" size={15} stroke={1.8}/>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" as const }}>
                      <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14 }}>{msg.name}</span>
                      <span style={{ fontSize: 12, color: "var(--c-muted)" }}>{msg.email}</span>
                    </div>
                    <p style={{ fontSize: 13, color: "var(--c-muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{msg.message}</p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0, fontSize: 12, color: "var(--c-muted)" }}>
                    <p>{date.toLocaleDateString("en-IN", { dateStyle: "medium" })}</p>
                    <p>{date.toLocaleTimeString("en-IN", { timeStyle: "short" })}</p>
                  </div>
                  <div style={{ color: "var(--c-muted)", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                    <Icon name="arrow" size={14} style={{ transform: "rotate(90deg)" }}/>
                  </div>
                </button>
                {isExpanded && (
                  <div style={{ padding: "0 20px 20px", borderTop: "1px solid var(--c-line)" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 16, paddingTop: 16 }}>
                      <div><p className="eyebrow" style={{ marginBottom: 4 }}>Name</p><p style={{ fontWeight: 600, fontSize: 13 }}>{msg.name}</p></div>
                      <div><p className="eyebrow" style={{ marginBottom: 4 }}>Email</p><a href={`mailto:${msg.email}`} style={{ color: "var(--c-primary)", fontWeight: 600, fontSize: 13 }}>{msg.email}</a></div>
                      <div><p className="eyebrow" style={{ marginBottom: 4 }}>ID</p><p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--c-muted)" }}>{msg.id}</p></div>
                    </div>
                    <p className="eyebrow" style={{ marginBottom: 6 }}>Message</p>
                    <p style={{ fontSize: 13, color: "var(--c-muted)", lineHeight: 1.7, whiteSpace: "pre-wrap", background: "var(--c-surface-2)", borderRadius: 8, padding: "12px 16px" }}>{msg.message}</p>
                    <div style={{ marginTop: 12 }}>
                      <a href={`mailto:${msg.email}?subject=Re: Your ShopSphere enquiry`} className="btn-primary" style={{ fontSize: 12, padding: "7px 14px", display: "inline-flex", textDecoration: "none" }}>
                        <Icon name="arrow" size={12}/>Reply via Email
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

// ─── Products tab ─────────────────────────────────────────────────────────────

function ProductsTab({ token }: { token: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<Product>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ sku: "", name: "", priceCents: "", stock: "" });
  const [saving, setSaving] = useState(false);

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const fetchProducts = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/products`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`Server error (${res.status})`);
      const data = (await res.json()) as { products: Product[] };
      setProducts(data.products);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to load"); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { void fetchProducts(); }, [fetchProducts]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/products`, {
        method: "POST", headers,
        body: JSON.stringify({ sku: addForm.sku, name: addForm.name, priceCents: parseInt(addForm.priceCents), stock: parseInt(addForm.stock) }),
      });
      if (!res.ok) { const d = (await res.json()) as { error: string }; throw new Error(d.error); }
      setAddForm({ sku: "", name: "", priceCents: "", stock: "" });
      setShowAdd(false);
      await fetchProducts();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to add product"); }
    finally { setSaving(false); }
  }

  async function handleSaveEdit(id: string) {
    setSaving(true); setError("");
    const patch: Record<string, unknown> = {};
    if (editDraft.sku !== undefined) patch.sku = editDraft.sku;
    if (editDraft.name !== undefined) patch.name = editDraft.name;
    if (editDraft.priceCents !== undefined) patch.priceCents = Number(editDraft.priceCents);
    if (editDraft.stock !== undefined) patch.stock = Number(editDraft.stock);
    try {
      const res = await fetch(`${API_BASE}/api/admin/products/${id}`, {
        method: "PATCH", headers, body: JSON.stringify(patch),
      });
      if (!res.ok) { const d = (await res.json()) as { error: string }; throw new Error(d.error); }
      setEditingId(null);
      await fetchProducts();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to update"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/products/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok && res.status !== 204) { const d = (await res.json()) as { error: string }; throw new Error(d.error); }
      await fetchProducts();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to delete"); }
  }

  function startEdit(p: Product) {
    setEditingId(p.id);
    setEditDraft({ sku: p.sku, name: p.name, priceCents: p.priceCents, stock: p.stock });
  }

  const inputStyle: React.CSSProperties = {
    height: 32, padding: "0 10px", borderRadius: 6, border: "1px solid var(--c-line)",
    background: "var(--c-surface)", color: "var(--c-ink)", fontSize: 13, fontFamily: "var(--font-body)",
    width: "100%",
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <p style={{ fontSize: 14, color: "var(--c-muted)" }}>{loading ? "Loading…" : `${products.length} product${products.length !== 1 ? "s" : ""}`}</p>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-secondary" style={{ padding: "7px 14px", fontSize: 12 }} onClick={() => void fetchProducts()} disabled={loading}>
            <Icon name="refresh" size={13}/>Refresh
          </button>
          <button className="btn-primary" style={{ padding: "7px 14px", fontSize: 12 }} onClick={() => setShowAdd((v) => !v)}>
            <Icon name="plus" size={13}/>{showAdd ? "Cancel" : "Add Product"}
          </button>
        </div>
      </div>

      {error && <ErrorBanner msg={error}/>}

      {showAdd && (
        <div className="ss-card" style={{ padding: "20px 24px", marginBottom: 20 }}>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, marginBottom: 16 }}>New Product</p>
          <form onSubmit={(e) => void handleAdd(e)}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
              {[
                { label: "SKU", key: "sku", placeholder: "PROD-001" },
                { label: "Name", key: "name", placeholder: "Product name" },
                { label: "Price (paise)", key: "priceCents", placeholder: "49900" },
                { label: "Stock", key: "stock", placeholder: "100" },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <p className="eyebrow" style={{ marginBottom: 4 }}>{label}</p>
                  <input
                    style={inputStyle}
                    placeholder={placeholder}
                    value={addForm[key as keyof typeof addForm]}
                    onChange={(e) => setAddForm((f) => ({ ...f, [key]: e.target.value }))}
                    required
                    type={key === "priceCents" || key === "stock" ? "number" : "text"}
                    min={0}
                  />
                </div>
              ))}
            </div>
            <button type="submit" className="btn-primary" style={{ padding: "8px 20px", fontSize: 12 }} disabled={saving}>
              {saving ? "Saving…" : "Create Product"}
            </button>
          </form>
        </div>
      )}

      {loading ? <Spinner/> : products.length === 0 ? (
        <div className="ss-card" style={{ padding: 64, textAlign: "center" }}>
          <div style={{ color: "var(--c-muted)", marginBottom: 12 }}><Icon name="pkg" size={40} stroke={1.2}/></div>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, marginBottom: 4 }}>No products</p>
          <p style={{ fontSize: 13, color: "var(--c-muted)" }}>Add your first product above.</p>
        </div>
      ) : (
        <div className="ss-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--c-line)" }}>
                  {["SKU", "Name", "Price", "Stock", "Updated", ""].map((h, i) => (
                    <th key={i} style={{ padding: "12px 16px", fontFamily: "var(--font-display)", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "var(--c-muted)", textAlign: "left" as const }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const isEditing = editingId === p.id;
                  return (
                    <tr key={p.id} style={{ borderBottom: "1px solid var(--c-line)" }}>
                      <td style={{ padding: "10px 16px" }}>
                        {isEditing
                          ? <input style={{ ...inputStyle, width: 100 }} value={editDraft.sku ?? ""} onChange={(e) => setEditDraft((d) => ({ ...d, sku: e.target.value }))}/>
                          : <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--c-muted)" }}>{p.sku}</span>}
                      </td>
                      <td style={{ padding: "10px 16px" }}>
                        {isEditing
                          ? <input style={{ ...inputStyle, width: 200 }} value={editDraft.name ?? ""} onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}/>
                          : <span style={{ fontWeight: 600 }}>{p.name}</span>}
                      </td>
                      <td style={{ padding: "10px 16px" }}>
                        {isEditing
                          ? <input type="number" style={{ ...inputStyle, width: 100 }} value={editDraft.priceCents ?? ""} onChange={(e) => setEditDraft((d) => ({ ...d, priceCents: parseInt(e.target.value) || 0 }))}/>
                          : toCurrency(p.priceCents)}
                      </td>
                      <td style={{ padding: "10px 16px" }}>
                        {isEditing
                          ? <input type="number" style={{ ...inputStyle, width: 80 }} min={0} value={editDraft.stock ?? ""} onChange={(e) => setEditDraft((d) => ({ ...d, stock: parseInt(e.target.value) || 0 }))}/>
                          : <span style={{ color: p.stock <= 0 ? "var(--c-danger)" : p.stock <= 10 ? "var(--c-warn)" : "var(--c-success)", fontWeight: 700 }}>{p.stock}</span>}
                      </td>
                      <td style={{ padding: "10px 16px", fontSize: 12, color: "var(--c-muted)" }}>
                        {new Date(p.updatedAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                      </td>
                      <td style={{ padding: "10px 16px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          {isEditing ? (
                            <>
                              <button className="btn-primary" style={{ padding: "5px 12px", fontSize: 11 }} onClick={() => void handleSaveEdit(p.id)} disabled={saving}>Save</button>
                              <button className="btn-secondary" style={{ padding: "5px 12px", fontSize: 11 }} onClick={() => setEditingId(null)}>Cancel</button>
                            </>
                          ) : (
                            <>
                              <button className="btn-secondary" style={{ padding: "5px 10px", fontSize: 11 }} onClick={() => startEdit(p)}>
                                <Icon name="edit" size={12}/>Edit
                              </button>
                              <button
                                className="btn-secondary"
                                style={{ padding: "5px 10px", fontSize: 11, color: "var(--c-danger)", borderColor: "var(--c-danger)" }}
                                onClick={() => void handleDelete(p.id)}
                              >
                                <Icon name="trash" size={12}/>Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Users tab ────────────────────────────────────────────────────────────────

function UsersTab({ token }: { token: string }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`Server error (${res.status})`);
      const data = (await res.json()) as { users: AdminUser[] };
      setUsers(data.users);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to load"); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { void fetchUsers(); }, [fetchUsers]);

  async function handleDelete(id: string, email: string) {
    if (!confirm(`Delete user ${email}? This will also delete all their orders and data.`)) return;
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok && res.status !== 204) { const d = (await res.json()) as { error: string }; throw new Error(d.error); }
      await fetchUsers();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to delete user"); }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <p style={{ fontSize: 14, color: "var(--c-muted)" }}>{loading ? "Loading…" : `${users.length} user${users.length !== 1 ? "s" : ""}`}</p>
        <button className="btn-secondary" style={{ padding: "7px 14px", fontSize: 12 }} onClick={() => void fetchUsers()} disabled={loading}>
          <Icon name="refresh" size={13}/>Refresh
        </button>
      </div>

      {error && <ErrorBanner msg={error}/>}

      {loading ? <Spinner/> : users.length === 0 ? (
        <div className="ss-card" style={{ padding: 64, textAlign: "center" }}>
          <div style={{ color: "var(--c-muted)", marginBottom: 12 }}><Icon name="user" size={40} stroke={1.2}/></div>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, marginBottom: 4 }}>No users yet</p>
          <p style={{ fontSize: 13, color: "var(--c-muted)" }}>Registered accounts will appear here.</p>
        </div>
      ) : (
        <div className="ss-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--c-line)" }}>
                  {["User", "Email", "Orders", "Joined", ""].map((h, i) => (
                    <th key={i} style={{ padding: "12px 16px", fontFamily: "var(--font-display)", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "var(--c-muted)", textAlign: "left" as const }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const initials = u.email.slice(0, 2).toUpperCase();
                  return (
                    <tr key={u.id} style={{ borderBottom: "1px solid var(--c-line)" }}>
                      <td style={{ padding: "10px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: "50%",
                            background: "var(--c-primary-soft)", color: "var(--c-primary)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 11, flexShrink: 0,
                          }}>{initials}</div>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--c-muted)" }}>{u.id.slice(-8)}</span>
                        </div>
                      </td>
                      <td style={{ padding: "10px 16px", fontWeight: 600 }}>{u.email}</td>
                      <td style={{ padding: "10px 16px" }}>
                        <span className={u._count.orders > 0 ? "ss-pill ss-pill-success" : "ss-pill"}>
                          {u._count.orders}
                        </span>
                      </td>
                      <td style={{ padding: "10px 16px", fontSize: 12, color: "var(--c-muted)" }}>
                        {new Date(u.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                      </td>
                      <td style={{ padding: "10px 16px" }}>
                        <button
                          className="btn-secondary"
                          style={{ padding: "5px 10px", fontSize: 11, color: "var(--c-danger)", borderColor: "var(--c-danger)" }}
                          onClick={() => void handleDelete(u.id, u.email)}
                        >
                          <Icon name="trash" size={12}/>Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Orders tab ───────────────────────────────────────────────────────────────

function OrdersTab({ token }: { token: string }) {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "CONFIRMED" | "FAILED">("ALL");

  const fetchOrders = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/orders`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`Server error (${res.status})`);
      const data = (await res.json()) as { orders: AdminOrder[] };
      setOrders(data.orders);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to load"); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { void fetchOrders(); }, [fetchOrders]);

  const visible = filter === "ALL" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 4, padding: "3px", background: "var(--c-surface-2)", borderRadius: 10, width: "fit-content" }}>
          {(["ALL", "CONFIRMED", "FAILED"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "5px 14px", borderRadius: 7, border: "none", cursor: "pointer",
                fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 12,
                background: filter === f ? "var(--c-surface)" : "transparent",
                color: filter === f ? "var(--c-ink)" : "var(--c-muted)",
                boxShadow: filter === f ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.15s",
              }}
            >
              {f === "ALL" ? `All (${orders.length})` : f === "CONFIRMED" ? `Confirmed (${orders.filter(o => o.status === "CONFIRMED").length})` : `Failed (${orders.filter(o => o.status === "FAILED").length})`}
            </button>
          ))}
        </div>
        <button className="btn-secondary" style={{ padding: "7px 14px", fontSize: 12 }} onClick={() => void fetchOrders()} disabled={loading}>
          <Icon name="refresh" size={13}/>Refresh
        </button>
      </div>

      {error && <ErrorBanner msg={error}/>}

      {loading ? <Spinner/> : visible.length === 0 ? (
        <div className="ss-card" style={{ padding: 64, textAlign: "center" }}>
          <div style={{ color: "var(--c-muted)", marginBottom: 12 }}><Icon name="pkg" size={40} stroke={1.2}/></div>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, marginBottom: 4 }}>No orders</p>
          <p style={{ fontSize: 13, color: "var(--c-muted)" }}>Orders will appear here once customers check out.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {visible.map((order) => {
            const isExpanded = expandedId === order.id;
            const isConfirmed = order.status === "CONFIRMED";
            return (
              <div key={order.id} className="ss-card" style={{ padding: 0, overflow: "hidden" }}>
                <button
                  style={{ width: "100%", textAlign: "left", padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, background: "none", border: "none", cursor: "pointer" }}
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                >
                  {/* Status dot */}
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: isConfirmed ? "var(--c-primary-soft)" : "var(--c-danger-soft)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: isConfirmed ? "var(--c-primary)" : "var(--c-danger)",
                  }}>
                    <Icon name={isConfirmed ? "check" : "x"} size={14} stroke={2.5}/>
                  </div>

                  {/* Order ID + user */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13 }}>#{order.id.slice(-8).toUpperCase()}</span>
                      <span className={isConfirmed ? "ss-pill ss-pill-success" : "ss-pill ss-pill-danger"} style={{ fontSize: 10 }}>
                        <span className="ss-dot" style={{ color: isConfirmed ? "var(--c-success)" : "var(--c-danger)" }}/>
                        {order.status}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: "var(--c-muted)", marginTop: 2 }}>{order.userEmail}</p>
                  </div>

                  {/* Items count */}
                  <div style={{ textAlign: "center", flexShrink: 0 }}>
                    <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13 }}>{order.items.length}</p>
                    <p style={{ fontSize: 11, color: "var(--c-muted)" }}>item{order.items.length !== 1 ? "s" : ""}</p>
                  </div>

                  {/* Total */}
                  <div style={{ textAlign: "right", flexShrink: 0, minWidth: 100 }}>
                    <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, color: isConfirmed ? "var(--c-primary)" : "var(--c-muted)" }}>
                      {isConfirmed ? toCurrency(order.total) : "—"}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--c-muted)" }}>
                      {new Date(order.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                    </p>
                  </div>

                  <div style={{ color: "var(--c-muted)", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                    <Icon name="arrow" size={14} style={{ transform: "rotate(90deg)" }}/>
                  </div>
                </button>

                {isExpanded && (
                  <div style={{ padding: "0 18px 18px", borderTop: "1px solid var(--c-line)" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, paddingTop: 14, marginBottom: 14 }}>
                      <div><p className="eyebrow" style={{ marginBottom: 3 }}>Order ID</p><p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--c-muted)" }}>{order.id}</p></div>
                      <div><p className="eyebrow" style={{ marginBottom: 3 }}>Customer</p><p style={{ fontSize: 13, fontWeight: 600 }}>{order.userEmail}</p></div>
                      <div><p className="eyebrow" style={{ marginBottom: 3 }}>Placed</p><p style={{ fontSize: 13 }}>{new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p></div>
                    </div>

                    {order.failureReason && (
                      <div style={{ background: "var(--c-danger-soft)", border: "1px solid var(--c-danger)", borderRadius: 8, padding: "8px 12px", marginBottom: 12 }}>
                        <p style={{ fontSize: 12, color: "var(--c-danger)", fontWeight: 600 }}>Failure: {order.failureReason}</p>
                      </div>
                    )}

                    {order.items.length > 0 && (
                      <div style={{ background: "var(--c-surface-2)", borderRadius: 8, overflow: "hidden" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                          <thead>
                            <tr style={{ borderBottom: "1px solid var(--c-line)" }}>
                              {["Product", "SKU", "Qty", "Unit", "Line"].map((h, i) => (
                                <th key={h} style={{ padding: "8px 12px", fontFamily: "var(--font-display)", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--c-muted)", textAlign: (i >= 2 ? "right" : "left") as "left" | "right" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {order.items.map((item, idx) => (
                              <tr key={idx} style={{ borderBottom: idx < order.items.length - 1 ? "1px solid var(--c-line)" : undefined }}>
                                <td style={{ padding: "8px 12px", fontWeight: 600 }}>{item.product.name}</td>
                                <td style={{ padding: "8px 12px", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--c-muted)" }}>{item.product.sku}</td>
                                <td style={{ padding: "8px 12px", textAlign: "right" }}>{item.quantity}</td>
                                <td style={{ padding: "8px 12px", textAlign: "right" }}>{toCurrency(item.priceCents)}</td>
                                <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700 }}>{toCurrency(item.priceCents * item.quantity)}</td>
                              </tr>
                            ))}
                          </tbody>
                          {isConfirmed && (
                            <tfoot>
                              <tr>
                                <td colSpan={3}/>
                                <td style={{ padding: "8px 12px", textAlign: "right", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 11 }}>Total</td>
                                <td style={{ padding: "8px 12px", textAlign: "right", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 14, color: "var(--c-primary)" }}>{toCurrency(order.total)}</td>
                              </tr>
                            </tfoot>
                          )}
                        </table>
                      </div>
                    )}
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

// ─── Main page ────────────────────────────────────────────────────────────────

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "messages", label: "Messages", icon: "mail" },
  { key: "orders",   label: "Orders",   icon: "bag" },
  { key: "products", label: "Products", icon: "pkg" },
  { key: "users",    label: "Users",    icon: "user" },
];

export default function AdminPage() {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) ?? "");
  const [tokenInput, setTokenInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [tab, setTab] = useState<Tab>("messages");

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const t = tokenInput.trim();
    if (!t) return;
    sessionStorage.setItem(TOKEN_KEY, t);
    setToken(t);
    setTokenInput("");
    setLoginError("");
  }

  function handleLogout() {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken("");
    setLoginError("");
  }

  // Token gate
  if (!token) {
    return (
      <div className="page-container" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "70vh" }}>
        <div className="ss-card" style={{ width: "100%", maxWidth: 440, padding: "48px 40px" }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--c-primary-soft)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--c-primary)", marginBottom: 24 }}>
            <Icon name="shield" size={22} stroke={1.8}/>
          </div>
          <p className="eyebrow" style={{ marginBottom: 8 }}>ShopSphere</p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 28 }}>
            Admin Access
          </h1>
          {loginError && (
            <div style={{ background: "var(--c-danger-soft)", border: "1px solid var(--c-danger)", borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: "var(--c-danger)", fontWeight: 600 }}>{loginError}</p>
            </div>
          )}
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "var(--c-muted)", marginBottom: 6 }}>
                Admin Token
              </label>
              <input
                type="password"
                className="input-field"
                placeholder="Enter admin token"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                autoFocus
                required
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: "100%", padding: "12px 0" }}>
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
      <header style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <p className="eyebrow" style={{ marginBottom: 8 }}>Admin</p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 800, letterSpacing: "-0.04em" }}>
            Dashboard
          </h1>
        </div>
        <button
          className="btn-secondary"
          style={{ padding: "8px 16px", fontSize: 12, color: "var(--c-danger)", borderColor: "var(--c-danger)", alignSelf: "flex-start" }}
          onClick={handleLogout}
        >
          Sign Out
        </button>
      </header>

      {/* Stats strip */}
      <StatsStrip token={token}/>

      {/* Tab nav */}
      <div style={{ display: "flex", gap: 4, marginBottom: 28, padding: "4px", background: "var(--c-surface-2)", borderRadius: 12, width: "fit-content" }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 8,
              background: tab === t.key ? "var(--c-surface)" : "transparent",
              border: "none", cursor: "pointer", fontFamily: "var(--font-display)",
              fontWeight: 600, fontSize: 13, color: tab === t.key ? "var(--c-ink)" : "var(--c-muted)",
              boxShadow: tab === t.key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s",
            }}
          >
            <Icon name={t.icon} size={14} stroke={1.8}/>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "messages" && <MessagesTab token={token}/>}
      {tab === "orders"   && <OrdersTab   token={token}/>}
      {tab === "products" && <ProductsTab token={token}/>}
      {tab === "users"    && <UsersTab    token={token}/>}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
