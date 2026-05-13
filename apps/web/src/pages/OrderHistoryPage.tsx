import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import Icon from "../components/Icon.js";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  priceCents: number;
  product: { id: string; name: string; sku: string };
}

interface Order {
  id: string;
  queueJobId: string;
  userId: string;
  status: "CONFIRMED" | "FAILED";
  failureReason: string | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

interface OrdersResponse {
  orders: Order[];
  nextCursor: string | null;
  hasMore: boolean;
}

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const toCurrency = (priceCents: number) => currency.format(priceCents / 100);
const orderTotal = (items: OrderItem[]) =>
  items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);

function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  const isConfirmed = order.status === "CONFIRMED";

  return (
    <div className="ss-card" style={{ padding: 0, overflow: "hidden" }}>
      {/* Header row */}
      <div
        style={{ padding: "20px 24px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, cursor: "pointer" }}
        onClick={() => setExpanded((p) => !p)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, flexShrink: 0,
            background: isConfirmed ? "var(--c-primary-soft)" : "var(--c-danger-soft)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: isConfirmed ? "var(--c-primary)" : "var(--c-danger)",
          }}>
            <Icon name={isConfirmed ? "pkg" : "x"} size={20} stroke={1.8}/>
          </div>
          <div>
            <p className="eyebrow" style={{ marginBottom: 3 }}>Order ID</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700 }}>
              #{order.id.slice(-8).toUpperCase()}
            </h2>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 24 }}>
          <div>
            <p className="eyebrow" style={{ marginBottom: 3 }}>Date</p>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13 }}>
              {new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
            </span>
          </div>
          <div>
            <p className="eyebrow" style={{ marginBottom: 3 }}>Status</p>
            <span className={isConfirmed ? "ss-pill ss-pill-success" : "ss-pill ss-pill-danger"}>
              <span className="ss-dot" style={{ color: isConfirmed ? "var(--c-success)" : "var(--c-danger)" }}/>
              {order.status}
            </span>
          </div>
          <div style={{ textAlign: "right" }}>
            <p className="eyebrow" style={{ marginBottom: 3 }}>Total</p>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, color: isConfirmed ? "var(--c-primary)" : "var(--c-muted)" }}>
              {isConfirmed ? toCurrency(orderTotal(order.items)) : "—"}
            </span>
          </div>
          <button
            style={{
              width: 36, height: 36, borderRadius: "50%", background: "var(--c-surface-2)",
              border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--c-muted)",
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s",
            }}
          >
            <Icon name="arrow" size={16} style={{ transform: "rotate(90deg)" }}/>
          </button>
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div style={{ borderTop: "1px solid var(--c-line)", padding: "24px", background: "var(--c-surface-2)" }}>
          {order.failureReason && (
            <p style={{ fontSize: 13, color: "var(--c-danger)", fontWeight: 600, marginBottom: 16 }}>
              Reason: {order.failureReason}
            </p>
          )}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["Product", "SKU", "Qty", "Unit Price", "Line Total"].map((h, i) => (
                    <th key={h} style={{
                      padding: "0 12px 12px", fontFamily: "var(--font-display)", fontSize: 10,
                      fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
                      color: "var(--c-muted)", textAlign: (i >= 2 ? "center" : "left") as "left" | "center" | "right",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} style={{ background: "var(--c-surface)" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 600, borderRadius: "8px 0 0 8px" }}>{item.product.name}</td>
                    <td style={{ padding: "10px 12px", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--c-muted)" }}>{item.product.sku}</td>
                    <td style={{ padding: "10px 12px", textAlign: "center" }}>{item.quantity}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right" }}>{toCurrency(item.priceCents)}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, borderRadius: "0 8px 8px 0" }}>{toCurrency(item.priceCents * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
              {isConfirmed && (
                <tfoot>
                  <tr>
                    <td colSpan={3}/>
                    <td style={{ padding: "16px 12px 0", textAlign: "right", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13 }}>
                      Order Total
                    </td>
                    <td style={{ padding: "16px 12px 0", textAlign: "right", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, color: "var(--c-primary)" }}>
                      {toCurrency(orderTotal(order.items))}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--c-muted)" }}>
              Job: {order.queueJobId}
            </p>
            <Link
              to={`/orders/${order.id}`}
              style={{ fontSize: 12, fontWeight: 700, color: "var(--c-primary)", textDecoration: "underline", display: "flex", alignItems: "center", gap: 4 }}
              onClick={(e) => e.stopPropagation()}
            >
              Full Details <Icon name="arrow" size={12}/>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrderHistoryPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const fetchOrders = useCallback(
    async (cursor?: string) => {
      if (!token) return;
      const url = new URL(`${API_BASE}/api/orders`);
      if (cursor) url.searchParams.set("cursor", cursor);
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed to load orders (${res.status})`);
      return (await res.json()) as OrdersResponse;
    },
    [token],
  );

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/login"); return; }
    setLoading(true);
    fetchOrders()
      .then((data) => {
        if (!data) return;
        setOrders(data.orders);
        setNextCursor(data.nextCursor);
        setHasMore(data.hasMore);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not load orders"))
      .finally(() => setLoading(false));
  }, [user, navigate, fetchOrders]);

  const loadMore = useCallback(async () => {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      const data = await fetchOrders(nextCursor);
      if (!data) return;
      setOrders((prev) => [...prev, ...data.orders]);
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load more");
    } finally {
      setLoadingMore(false);
    }
  }, [fetchOrders, nextCursor]);

  // authLoading is unused below but kept for future use
  void authLoading;

  if (loading) {
    return (
      <div className="page-container" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 48, height: 48, border: "3px solid var(--c-line)", borderTopColor: "var(--c-primary)",
            borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px",
          }}/>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--c-muted)" }}>
            Loading orders…
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <header style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 40 }}>
        <div>
          <p className="eyebrow" style={{ marginBottom: 8 }}>Account</p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 4 }}>
            Order History
          </h1>
          <p style={{ fontSize: 14, color: "var(--c-muted)" }}>
            Manage and track your recent flash purchases.
          </p>
        </div>
        <Link to="/marketplace" className="btn-secondary" style={{ alignSelf: "flex-start" }}>
          <Icon name="arrowL" size={14}/>
          Marketplace
        </Link>
      </header>

      {error && (
        <div style={{ background: "var(--c-danger-soft)", border: "1px solid var(--c-danger)", borderRadius: 12, padding: "12px 16px", marginBottom: 24 }}>
          <p style={{ fontSize: 13, color: "var(--c-danger)", fontWeight: 600 }}>{error}</p>
        </div>
      )}

      {orders.length === 0 && !error ? (
        <div className="ss-card" style={{ padding: 64, textAlign: "center" }}>
          <div style={{ color: "var(--c-muted)", marginBottom: 16 }}>
            <Icon name="bag" size={48} stroke={1.2}/>
          </div>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No orders yet</p>
          <p style={{ fontSize: 14, color: "var(--c-muted)", marginBottom: 24 }}>Your flash purchase history will appear here.</p>
          <Link to="/marketplace" className="btn-primary">
            Start Shopping <Icon name="arrow" size={14}/>
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
          {hasMore && (
            <button
              className="btn-secondary"
              style={{ width: "100%", marginTop: 8 }}
              onClick={loadMore}
              disabled={loadingMore}
            >
              {loadingMore ? "Loading…" : "Load More Orders"}
            </button>
          )}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
