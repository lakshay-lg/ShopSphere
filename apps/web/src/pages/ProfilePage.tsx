import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";

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
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  // — password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwState, setPwState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [pwMessage, setPwMessage] = useState("");

  // — addresses
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [addrLoading, setAddrLoading] = useState(true);
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [addrForm, setAddrForm] = useState(emptyAddressForm);
  const [addrSubmitting, setAddrSubmitting] = useState(false);
  const [addrError, setAddrError] = useState("");

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
    if (!user) { navigate("/login"); return; }
    void fetchAddresses();
  }, [user, navigate, fetchAddresses]);

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

  return (
    <div className="page-container">
      {/* Header */}
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Account</p>
          <h1 className="font-headline text-5xl font-bold tracking-tight text-on-surface">
            Your Profile
          </h1>
          <p className="text-on-surface-variant mt-2">Manage your account settings.</p>
        </div>
        <Link to="/orders" className="btn-secondary self-start md:self-auto">
          View Order History
        </Link>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Account info card */}
        <div className="md:col-span-1 glass-card rounded-lg p-6 md:p-8 border border-white/20 flex flex-col gap-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">person</span>
          </div>
          <div>
            <p className="eyebrow">Email</p>
            <p className="font-medium text-sm break-all">{user.email}</p>
          </div>
          <div>
            <p className="eyebrow">Member Since</p>
            <p className="font-medium text-sm">{memberSince}</p>
          </div>
          <div>
            <p className="eyebrow">User ID</p>
            <p className="font-mono text-xs text-on-surface-variant">{user.id}</p>
          </div>
          <button
            onClick={handleLogout}
            className="mt-auto btn-secondary text-error border-error/30 hover:bg-error/5 w-full"
          >
            Log Out
          </button>
        </div>

        {/* Change password card */}
        <div className="md:col-span-2 glass-card rounded-lg p-6 md:p-8 border border-white/20">
          <h2 className="font-headline text-xl font-bold mb-6">Change Password</h2>
          {pwState === "success" ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <span className="material-symbols-outlined text-5xl text-primary">check_circle</span>
              <p className="font-headline text-lg font-bold">{pwMessage}</p>
              <button className="btn-secondary" onClick={() => setPwState("idle")}>Change Again</button>
            </div>
          ) : (
            <form onSubmit={handlePasswordChange} className="flex flex-col gap-5">
              <div>
                <label className="eyebrow block mb-2">Current Password</label>
                <input type="password" className="input-field w-full" value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)} required
                  autoComplete="current-password" disabled={pwState === "loading"} />
              </div>
              <div>
                <label className="eyebrow block mb-2">New Password</label>
                <input type="password" className="input-field w-full" value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)} required minLength={8}
                  autoComplete="new-password" disabled={pwState === "loading"} />
              </div>
              <div>
                <label className="eyebrow block mb-2">Confirm New Password</label>
                <input type="password" className="input-field w-full" value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8}
                  autoComplete="new-password" disabled={pwState === "loading"} />
              </div>
              {pwState === "error" && <p className="text-sm text-error font-medium">{pwMessage}</p>}
              <button type="submit" className="btn-primary self-start" disabled={pwState === "loading"}>
                {pwState === "loading" ? "Updating…" : "Update Password"}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Shipping addresses */}
      <div className="glass-card rounded-lg p-6 md:p-8 border border-white/20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-headline text-xl font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">local_shipping</span>
            Shipping Addresses
          </h2>
          {!showAddrForm && (
            <button className="btn-secondary !py-2 !px-4 !text-xs" onClick={() => setShowAddrForm(true)}>
              + Add Address
            </button>
          )}
        </div>

        {/* Add address form */}
        {showAddrForm && (
          <form onSubmit={handleAddAddress} className="mb-6 p-5 bg-surface-container-low rounded-lg">
            <h3 className="font-headline font-bold mb-4">New Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { id: "fullName", label: "Full Name", col: 2 },
                { id: "line1",    label: "Address Line 1", col: 2 },
                { id: "line2",    label: "Address Line 2 (optional)", col: 2 },
                { id: "city",     label: "City", col: 1 },
                { id: "state",    label: "State", col: 1 },
                { id: "postalCode", label: "Postal Code", col: 1 },
                { id: "country",  label: "Country Code", col: 1 },
              ].map(({ id, label, col }) => (
                <div key={id} className={col === 2 ? "md:col-span-2" : ""}>
                  <label className="eyebrow block mb-1">{label}</label>
                  <input
                    className="input-field w-full"
                    value={addrForm[id as keyof typeof addrForm]}
                    onChange={(e) => setAddrForm((p) => ({ ...p, [id]: e.target.value }))}
                    required={id !== "line2"}
                    disabled={addrSubmitting}
                    maxLength={id === "country" ? 2 : 200}
                  />
                </div>
              ))}
            </div>
            {addrError && <p className="text-sm text-error mt-3">{addrError}</p>}
            <div className="flex gap-3 mt-4">
              <button type="submit" className="btn-primary" disabled={addrSubmitting}>
                {addrSubmitting ? "Saving…" : "Save Address"}
              </button>
              <button type="button" className="btn-secondary"
                onClick={() => { setShowAddrForm(false); setAddrForm(emptyAddressForm); setAddrError(""); }}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Address list */}
        {addrLoading ? (
          <p className="text-sm text-on-surface-variant py-4">Loading addresses…</p>
        ) : addresses.length === 0 ? (
          <div className="text-center py-8 text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl text-outline mb-2 block">location_off</span>
            <p className="text-sm">No saved addresses yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((addr) => (
              <div key={addr.id}
                className={`rounded-lg p-4 border ${addr.isDefault ? "border-primary/30 bg-primary/5" : "border-outline-variant/20 bg-surface-container-low"}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-semibold text-sm">{addr.fullName}</p>
                    {addr.isDefault && (
                      <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Default</span>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {!addr.isDefault && (
                      <button className="text-xs text-primary hover:underline"
                        onClick={() => void handleSetDefault(addr.id)}>
                        Set Default
                      </button>
                    )}
                    <button className="text-error hover:scale-110 transition-transform"
                      onClick={() => void handleDeleteAddress(addr.id)}>
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}<br />
                  {addr.city}, {addr.state} {addr.postalCode}<br />
                  {addr.country}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
