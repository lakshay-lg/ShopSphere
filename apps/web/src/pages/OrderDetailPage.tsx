import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";

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
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
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
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-on-surface-variant">
          <span className="material-symbols-outlined text-5xl animate-spin text-primary">
            progress_activity
          </span>
          <p className="font-label text-sm uppercase tracking-widest">Loading order…</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="page-container">
        <div className="glass-card rounded-lg p-16 text-center">
          <span className="material-symbols-outlined text-6xl text-error mb-4 block">error</span>
          <p className="font-headline text-xl font-bold mb-2">{error || "Order not found"}</p>
          <Link to="/orders" className="btn-secondary inline-block mt-4">
            ← Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const isConfirmed = order.status === "CONFIRMED";

  return (
    <div className="page-container">
      {/* Header */}
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Order Detail</p>
          <h1 className="font-headline text-5xl font-bold tracking-tight text-on-surface">
            #{order.id.slice(-8).toUpperCase()}
          </h1>
          <p className="text-on-surface-variant mt-2">
            Placed on{" "}
            {new Date(order.createdAt).toLocaleString("en-IN", {
              dateStyle: "long",
              timeStyle: "short",
            })}
          </p>
        </div>
        <Link to="/orders" className="btn-secondary self-start md:self-auto">
          ← Back to Orders
        </Link>
      </header>

      {/* Status / meta card */}
      <div className="glass-card rounded-lg p-6 md:p-8 mb-6 border border-white/20 flex flex-wrap gap-8 items-center">
        <div
          className={`w-16 h-16 rounded-md flex items-center justify-center ${
            isConfirmed ? "bg-primary/10 text-primary" : "bg-error/10 text-error"
          }`}
        >
          <span className="material-symbols-outlined text-3xl">
            {isConfirmed ? "package_2" : "error"}
          </span>
        </div>

        <div>
          <p className="eyebrow">Status</p>
          <span className={isConfirmed ? "status-badge-confirmed" : "status-badge-failed"}>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isConfirmed ? "bg-green-500" : "bg-red-500"
              }`}
            ></span>
            {order.status}
          </span>
          {order.failureReason && (
            <p className="text-sm text-error mt-1">{order.failureReason}</p>
          )}
        </div>

        <div>
          <p className="eyebrow">Job ID</p>
          <p className="font-mono text-sm text-on-surface-variant">{order.queueJobId}</p>
        </div>

        <div>
          <p className="eyebrow">Last Updated</p>
          <p className="text-sm font-medium">
            {new Date(order.updatedAt).toLocaleString("en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>

        {isConfirmed && (
          <div className="ml-auto text-right">
            <p className="eyebrow">Order Total</p>
            <p className="font-headline text-3xl font-black text-primary">
              {toCurrency(orderTotal(order.items))}
            </p>
          </div>
        )}
      </div>

      {/* Shipping address */}
      {order.shippingAddress && (
        <div className="glass-card rounded-lg p-6 md:p-8 mb-6 border border-white/20">
          <h2 className="font-headline text-xl font-bold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">local_shipping</span>
            Shipping Address
          </h2>
          <p className="font-semibold text-sm">{order.shippingAddress.fullName}</p>
          <p className="text-sm text-on-surface-variant leading-relaxed mt-1">
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
        <div className="glass-card rounded-lg p-6 md:p-8 border border-white/20">
          <h2 className="font-headline text-xl font-bold mb-6">Items</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-3">
              <thead>
                <tr className="text-on-surface-variant font-label text-xs uppercase tracking-widest">
                  <th className="pb-2 font-medium">Product</th>
                  <th className="pb-2 font-medium">SKU</th>
                  <th className="pb-2 font-medium text-center">Qty</th>
                  <th className="pb-2 font-medium text-right">Unit Price</th>
                  <th className="pb-2 font-medium text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="font-body text-sm">
                {order.items.map((item) => (
                  <tr key={item.id} className="bg-surface-container-lowest/50 rounded-lg">
                    <td className="py-3 px-4 rounded-l-lg font-semibold">{item.product.name}</td>
                    <td className="py-3 font-mono text-xs text-on-surface-variant">
                      {item.product.sku}
                    </td>
                    <td className="py-3 text-center">{item.quantity}</td>
                    <td className="py-3 text-right">{toCurrency(item.priceCents)}</td>
                    <td className="py-3 px-4 text-right font-bold rounded-r-lg">
                      {toCurrency(item.priceCents * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3}></td>
                  <td className="pt-6 text-right font-headline text-base font-bold">
                    Order Total
                  </td>
                  <td className="pt-6 text-right font-headline text-xl font-black text-primary px-4">
                    {toCurrency(orderTotal(order.items))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : (
        isConfirmed && (
          <div className="glass-card rounded-lg p-8 text-center text-on-surface-variant border border-white/20">
            <p className="text-sm">No item details available for this order.</p>
          </div>
        )
      )}
    </div>
  );
}
