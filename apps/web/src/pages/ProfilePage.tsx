import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import Icon from "../components/Icon.js";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

interface ShippingAddress {
  id: string;
  fullName: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
}

const emptyAddressForm = {
  fullName: "", line1: "", line2: "", city: "",
  state: "", postalCode: "", country: "IN",
};

export default function ProfilePage() {
  const { user, token, logout, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwState, setPwState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [pwMessage, setPwMessage] = useState("");

  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [addrLoading, setAddrLoading] = useState(true);
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [addrForm, setAddrForm] = useState(emptyAddressForm);
  const [addrSubmitting, setAddrSubmitting] = useState(false);
  const [addrError, setAddrError] = useState("");

  const [activeTab, setActiveTab] = useState<"overview" | "addresses" | "security">("overview");

  const fetchAddresses = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/addresses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as { addresses: ShippingAddress[] };
      setAddresses(data.addresses);
    } catch {
      // non-critical
    } finally {
      setAddrLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/login"); return; }
    void fetchAddresses();
  }, [user, authLoading, navigate, fetchAddresses]);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwState("error"); setPwMessage("New passwords do not match"); return;
    }
    setPwState("loading");
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      setPwState("success"); setPwMessage(data.message ?? "Password updated");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err) {
      setPwState("error");
      setPwMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  async function handleAddAddress(e: React.FormEvent) {
    e.preventDefault();
    setAddrSubmitting(true); setAddrError("");
    try {
      const res = await fetch(`${API_BASE}/api/addresses`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(addrForm),
      });
      const data = (await res.json()) as { address?: ShippingAddress; message?: string };
      if (!res.ok) throw new Error(data.message ?? "Failed to save address");
      setShowAddrForm(false);
      setAddrForm(emptyAddressForm);
      await fetchAddresses();
    } catch (err) {
      setAddrError(err instanceof Error ? err.message : "Could not save address");
    } finally {
      setAddrSubmitting(false);
    }
  }

  async function handleSetDefault(id: string) {
    await fetch(`${API_BASE}/api/addresses/${id}/default`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    await fetchAddresses();
  }

  async function handleDeleteAddress(id: string) {
    await fetch(`${API_BASE}/api/addresses/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    await fetchAddresses();
  }

  function handleLogout() { logout(); navigate("/"); }

  if (!user) return null;

  const memberSince = new Date(user.createdAt).toLocaleDateString("en-IN", { dateStyle: "long" });
  const tabs = [
    { id: "overview", label: "Overview", icon: "user" },
    { id: "addresses", label: "Addresses", icon: "truck" },
    { id: "security", label: "Security", icon: "shield" },
  ] as const;

  return (
    <div className="page-container">
      {/* Header */}
      <header style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <p className="eyebrow" style={{ marginBottom: 8 }}>Account</p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 800, letterSpacing: "-0.04em" }}>
            Your Profile
          </h1>
        </div>
        <Link to="/orders" className="btn-secondary" style={{ alignSelf: "flex-start" }}>
          Order History <Icon name="arrow" size={14}/>
        </Link>
      </header>

      {/* Stat strip */}
      <div className="ss-card" style={{ padding: 0, overflow: "hidden", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 24 }}>
        {[
          { label: "Member Since", value: new Date(user.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) },
          { label: "Addresses", value: addrLoading ? "…" : addresses.length },
          { label: "Account ID", value: user.id.slice(-8).toUpperCase() },
        ].map(({ label, value }, i) => (
          <div key={label} style={{
            padding: "20px 24px",
            borderRight: i < 2 ? "1px solid var(--c-line)" : "none",
          }}>
            <p className="eyebrow" style={{ marginBottom: 6 }}>{label}</p>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, letterSpacing: "-0.02em" }}>{String(value)}</p>
          </div>
        ))}
      </div>

      {/* Tab nav */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "var(--c-surface-2)", borderRadius: 12, padding: 4, width: "fit-content" }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: 9, border: "none", cursor: "pointer",
              fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 700,
              transition: "all 0.2s",
              background: activeTab === tab.id ? "var(--c-ink)" : "transparent",
              color: activeTab === tab.id ? "var(--c-surface)" : "var(--c-muted)",
            }}
          >
            <Icon name={tab.icon} size={14} stroke={1.8}/>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 20 }}>
          {/* Account card */}
          <div className="ss-card" style={{ padding: "28px" }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%", background: "var(--c-primary-soft)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--c-primary)", marginBottom: 20, fontSize: 22, fontFamily: "var(--font-display)", fontWeight: 800,
            }}>
              {user.email.charAt(0).toUpperCase()}
            </div>
            <div style={{ marginBottom: 16 }}>
              <p className="eyebrow" style={{ marginBottom: 4 }}>Email</p>
              <p style={{ fontWeight: 600, fontSize: 14, wordBreak: "break-all" }}>{user.email}</p>
            </div>
            <div style={{ marginBottom: 16 }}>
              <p className="eyebrow" style={{ marginBottom: 4 }}>Member Since</p>
              <p style={{ fontWeight: 600, fontSize: 14 }}>{memberSince}</p>
            </div>
            <div style={{ marginBottom: 24 }}>
              <p className="eyebrow" style={{ marginBottom: 4 }}>User ID</p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--c-muted)", wordBreak: "break-all" }}>{user.id}</p>
            </div>
            <button
              onClick={handleLogout}
              className="btn-secondary"
              style={{ width: "100%", color: "var(--c-danger)", borderColor: "var(--c-danger)" }}
            >
              Log Out
            </button>
          </div>

          {/* Quick info panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="ss-card" style={{ padding: "24px 28px" }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Account Summary</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {[
                  { label: "Order history", action: "/orders", cta: "View orders" },
                  { label: "Shipping addresses", action: null, cta: addresses.length === 0 ? "None saved" : `${addresses.length} saved` },
                ].map((item) => (
                  <div key={item.label} style={{ background: "var(--c-surface-2)", borderRadius: 10, padding: "14px 16px" }}>
                    <p className="eyebrow" style={{ marginBottom: 4 }}>{item.label}</p>
                    {item.action ? (
                      <Link to={item.action} style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "var(--c-primary)", textDecoration: "underline" }}>
                        {item.cta}
                      </Link>
                    ) : (
                      <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14 }}>{item.cta}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="ss-card" style={{ padding: "24px 28px", background: "var(--c-ink)", color: "var(--c-surface)" }}>
              <p className="eyebrow" style={{ color: "rgba(244,246,248,0.45)", marginBottom: 8 }}>Queue-first account</p>
              <p style={{ fontSize: 14, color: "rgba(244,246,248,0.7)", lineHeight: 1.6 }}>
                Your cart and order relay history persist across sessions. Every checkout is processed via a fair-queue system — first in, first served.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Addresses tab */}
      {activeTab === "addresses" && (
        <div className="ss-card" style={{ padding: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="truck" size={16} stroke={1.8}/>
              Shipping Addresses
            </h2>
            {!showAddrForm && (
              <button className="btn-primary" style={{ padding: "8px 16px", fontSize: 12 }} onClick={() => setShowAddrForm(true)}>
                <Icon name="plus" size={13}/>
                Add Address
              </button>
            )}
          </div>

          {showAddrForm && (
            <form onSubmit={handleAddAddress} style={{ marginBottom: 24, background: "var(--c-surface-2)", borderRadius: 12, padding: 20 }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, marginBottom: 16 }}>New Address</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { id: "fullName", label: "Full Name", col: 2 },
                  { id: "line1",    label: "Address Line 1", col: 2 },
                  { id: "line2",    label: "Address Line 2 (optional)", col: 2 },
                  { id: "city",     label: "City", col: 1 },
                  { id: "state",    label: "State", col: 1 },
                  { id: "postalCode", label: "Postal Code", col: 1 },
                  { id: "country",  label: "Country Code", col: 1 },
                ].map(({ id, label, col }) => (
                  <div key={id} style={{ gridColumn: col === 2 ? "1 / -1" : undefined }}>
                    <label style={{ display: "block", fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--c-muted)", marginBottom: 5 }}>
                      {label}
                    </label>
                    <input
                      className="input-field"
                      value={addrForm[id as keyof typeof addrForm]}
                      onChange={(e) => setAddrForm((p) => ({ ...p, [id]: e.target.value }))}
                      required={id !== "line2"}
                      disabled={addrSubmitting}
                      maxLength={id === "country" ? 2 : 200}
                    />
                  </div>
                ))}
              </div>
              {addrError && <p style={{ fontSize: 13, color: "var(--c-danger)", marginTop: 10 }}>{addrError}</p>}
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button type="submit" className="btn-primary" style={{ padding: "10px 20px" }} disabled={addrSubmitting}>
                  {addrSubmitting ? "Saving…" : "Save Address"}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: "10px 20px" }}
                  onClick={() => { setShowAddrForm(false); setAddrForm(emptyAddressForm); setAddrError(""); }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {addrLoading ? (
            <p style={{ fontSize: 13, color: "var(--c-muted)", padding: "16px 0" }}>Loading addresses…</p>
          ) : addresses.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ color: "var(--c-muted)", marginBottom: 10 }}><Icon name="truck" size={40} stroke={1.2}/></div>
              <p style={{ fontSize: 14, color: "var(--c-muted)" }}>No saved addresses yet.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {addresses.map((addr) => (
                <div key={addr.id} style={{
                  borderRadius: 12, padding: "16px 18px",
                  background: addr.isDefault ? "var(--c-primary-soft)" : "var(--c-surface-2)",
                  border: `1px solid ${addr.isDefault ? "var(--c-primary)" : "var(--c-line)"}`,
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 14 }}>{addr.fullName}</p>
                      {addr.isDefault && <span className="ss-pill ss-pill-blue" style={{ fontSize: 10, marginTop: 4 }}>Default</span>}
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      {!addr.isDefault && (
                        <button
                          style={{ fontSize: 11, color: "var(--c-primary)", fontWeight: 700, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                          onClick={() => void handleSetDefault(addr.id)}
                        >
                          Set Default
                        </button>
                      )}
                      <button
                        style={{ color: "var(--c-danger)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                        onClick={() => void handleDeleteAddress(addr.id)}
                      >
                        <Icon name="trash" size={15}/>
                      </button>
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: "var(--c-muted)", lineHeight: 1.6 }}>
                    {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}<br />
                    {addr.city}, {addr.state} {addr.postalCode}<br />
                    {addr.country}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Security tab */}
      {activeTab === "security" && (
        <div className="ss-card" style={{ padding: "28px", maxWidth: 560 }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, marginBottom: 24 }}>
            Change Password
          </h2>
          {pwState === "success" ? (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <div style={{ color: "var(--c-success)", marginBottom: 12 }}>
                <Icon name="check" size={40} stroke={2.5}/>
              </div>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, marginBottom: 16 }}>{pwMessage}</p>
              <button className="btn-secondary" onClick={() => setPwState("idle")}>Change Again</button>
            </div>
          ) : (
            <form onSubmit={handlePasswordChange} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { label: "Current Password", value: currentPassword, setter: setCurrentPassword, ac: "current-password" },
                { label: "New Password", value: newPassword, setter: setNewPassword, ac: "new-password" },
                { label: "Confirm New Password", value: confirmPassword, setter: setConfirmPassword, ac: "new-password" },
              ].map(({ label, value, setter, ac }) => (
                <div key={label}>
                  <label style={{ display: "block", fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "var(--c-muted)", marginBottom: 6 }}>
                    {label}
                  </label>
                  <input
                    type="password"
                    className="input-field"
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    required
                    minLength={8}
                    autoComplete={ac}
                    disabled={pwState === "loading"}
                  />
                </div>
              ))}
              {pwState === "error" && (
                <p style={{ fontSize: 13, color: "var(--c-danger)", fontWeight: 600 }}>{pwMessage}</p>
              )}
              <button
                type="submit"
                className="btn-primary"
                style={{ alignSelf: "flex-start", padding: "12px 24px" }}
                disabled={pwState === "loading"}
              >
                {pwState === "loading" ? "Updating…" : "Update Password"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
