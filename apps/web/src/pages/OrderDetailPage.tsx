import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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

interface ShippingAddress {
  id: string;
  fullName: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface Order {
  id: string;
  queueJobId: string;
  userId: string;
  status: "CONFIRMED" | "FAILED";
  failureReason: string | null;
  shippingAddress: ShippingAddress | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const toCurrency = (priceCents: number) => currency.format(priceCents / 100);
const orderTotal = (items: OrderItem[]) =>
  items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { user, token, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/login"); return; }
    if (!orderId || !token) return;

    fetch(`${API_BASE}/api/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Order not found (${res.status})`);
        return res.json() as Promise<{ order: Order }>;
      })
      .then((data) => setOrder(data.order))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Could not load order")
      )
      .finally(() => setLoading(false));
  }, [user, token, orderId, navigate]);

  if (loading) {
    return (
      <div className="page-container" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 48, height: 48, border: "3px solid var(--c-line)", borderTopColor: "var(--c-primary)",
            borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px",
          }}/>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--c-muted)" }}>
            Loading order…
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="page-container">
        <div className="ss-card" style={{ padding: 64, textAlign: "center" }}>
          <div style={{ color: "var(--c-danger)", marginBottom: 16 }}>
            <Icon name="x" size={48} stroke={1.5}/>
          </div>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
            {error || "Order not found"}
          </p>
          <Link to="/orders" className="btn-secondary">
            <Icon name="arrowL" size={14}/>
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const isConfirmed = order.status === "CONFIRMED";

  return (
    <div className="page-container">
      {/* Header */}
      <header style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <p className="eyebrow" style={{ marginBottom: 8 }}>Order Detail</p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 4 }}>
            #{order.id.slice(-8).toUpperCase()}
          </h1>
          <p style={{ fontSize: 14, color: "var(--c-muted)" }}>
            Placed on{" "}
            {new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" })}
          </p>
        </div>
        <Link to="/orders" className="btn-secondary" style={{ alignSelf: "flex-start" }}>
          <Icon name="arrowL" size={14}/>
          Back to Orders
        </Link>
      </header>

      {/* Status card */}
      <div className="ss-card" style={{ padding: "24px 28px", marginBottom: 20, display: "flex", flexWrap: "wrap", gap: 24, alignItems: "center" }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: isConfirmed ? "var(--c-primary-soft)" : "var(--c-danger-soft)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: isConfirmed ? "var(--c-primary)" : "var(--c-danger)",
          flexShrink: 0,
        }}>
          <Icon name={isConfirmed ? "pkg" : "x"} size={24} stroke={1.8}/>
        </div>

        <div>
          <p className="eyebrow" style={{ marginBottom: 4 }}>Status</p>
          <span className={isConfirmed ? "ss-pill ss-pill-success" : "ss-pill ss-pill-danger"}>
            <span className="ss-dot" style={{ color: isConfirmed ? "var(--c-success)" : "var(--c-danger)" }}/>
            {order.status}
          </span>
          {order.failureReason && (
            <p style={{ fontSize: 13, color: "var(--c-danger)", marginTop: 4 }}>{order.failureReason}</p>
          )}
        </div>

        <div>
          <p className="eyebrow" style={{ marginBottom: 4 }}>Job ID</p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--c-muted)" }}>{order.queueJobId}</p>
        </div>

        <div>
          <p className="eyebrow" style={{ marginBottom: 4 }}>Last Updated</p>
          <p style={{ fontSize: 13, fontWeight: 600 }}>
            {new Date(order.updatedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>

        {isConfirmed && (
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <p className="eyebrow" style={{ marginBottom: 4 }}>Order Total</p>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 32, color: "var(--c-primary)", letterSpacing: "-0.03em" }}>
              {toCurrency(orderTotal(order.items))}
            </p>
          </div>
        )}
      </div>

      {/* Shipping address */}
      {order.shippingAddress && (
        <div className="ss-card" style={{ padding: "24px 28px", marginBottom: 20 }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
            <Icon name="truck" size={16} stroke={1.8}/>
            Shipping Address
          </h2>
          <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{order.shippingAddress.fullName}</p>
          <p style={{ fontSize: 13, color: "var(--c-muted)", lineHeight: 1.7 }}>
            {order.shippingAddress.line1}
            {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}<br />
            {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
            {order.shippingAddress.postalCode}<br />
            {order.shippingAddress.country}
          </p>
        </div>
      )}

      {/* Items table */}
      {isConfirmed && order.items.length > 0 ? (
        <div className="ss-card" style={{ padding: "24px 28px" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Items</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["Product", "SKU", "Qty", "Unit Price", "Line Total"].map((h, i) => (
                    <th key={h} style={{
                      padding: "0 12px 12px", fontFamily: "var(--font-display)", fontSize: 10,
                      fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
                      color: "var(--c-muted)", borderBottom: "1px solid var(--c-line)",
                      textAlign: (i >= 2 ? (i === 2 ? "center" : "right") : "left") as "left" | "center" | "right",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td style={{ padding: "12px 12px", fontWeight: 600 }}>{item.product.name}</td>
                    <td style={{ padding: "12px 12px", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--c-muted)" }}>{item.product.sku}</td>
                    <td style={{ padding: "12px 12px", textAlign: "center" }}>{item.quantity}</td>
                    <td style={{ padding: "12px 12px", textAlign: "right" }}>{toCurrency(item.priceCents)}</td>
                    <td style={{ padding: "12px 12px", textAlign: "right", fontWeight: 700 }}>{toCurrency(item.priceCents * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3}/>
                  <td style={{ padding: "20px 12px 0", textAlign: "right", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13 }}>
                    Order Total
                  </td>
                  <td style={{ padding: "20px 12px 0", textAlign: "right", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "var(--c-primary)" }}>
                    {toCurrency(orderTotal(order.items))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : isConfirmed ? (
        <div className="ss-card" style={{ padding: 32, textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "var(--c-muted)" }}>No item details available for this order.</p>
        </div>
      ) : null}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
