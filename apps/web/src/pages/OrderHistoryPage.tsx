import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";

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
    <div className="glass-card rounded-lg overflow-hidden transition-all duration-300 hover:shadow-glass-hover border border-white/20">
      {/* Card header */}
      <div
        className="p-6 md:p-8 flex flex-wrap items-center justify-between gap-6 cursor-pointer"
        onClick={() => setExpanded((p) => !p)}
      >
        <div className="flex items-center gap-6">
          <div className={`w-14 h-14 rounded-md flex items-center justify-center ${isConfirmed ? "bg-primary/10 text-primary" : "bg-error/10 text-error"}`}>
            <span className="material-symbols-outlined text-2xl">
              {isConfirmed ? "package_2" : "error"}
            </span>
          </div>
          <div>
            <p className="eyebrow">Order ID</p>
            <h2 className="font-headline text-xl font-bold">#{order.id.slice(-8).toUpperCase()}</h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-8 md:gap-10">
          <div>
            <p className="eyebrow">Date</p>
            <span className="font-medium text-sm">
              {new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
            </span>
          </div>
          <div>
            <p className="eyebrow">Status</p>
            <span className={isConfirmed ? "status-badge-confirmed" : "status-badge-failed"}>
              <span className={`w-1.5 h-1.5 rounded-full ${isConfirmed ? "bg-green-500" : "bg-red-500"}`}></span>
              {order.status}
            </span>
          </div>
          <div className="text-right">
            <p className="eyebrow">Total</p>
            <span className={`font-headline text-xl font-bold ${isConfirmed ? "text-primary" : "text-on-surface-variant"}`}>
              {isConfirmed ? toCurrency(orderTotal(order.items)) : "—"}
            </span>
          </div>
          <button className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center hover:bg-primary-container hover:text-white transition-all">
            <span className="material-symbols-outlined text-lg transition-transform duration-300" style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}>
              expand_more
            </span>
          </button>
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-outline-variant/14 px-6 md:px-8 py-8 bg-surface-container-low/30">
          {order.failureReason && (
            <p className="text-sm text-error mb-4 font-medium">
              Reason: {order.failureReason}
            </p>
          )}
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
                    <td className="py-3 font-mono text-xs text-on-surface-variant">{item.product.sku}</td>
                    <td className="py-3 text-center">{item.quantity}</td>
                    <td className="py-3 text-right">{toCurrency(item.priceCents)}</td>
                    <td className="py-3 px-4 text-right font-bold rounded-r-lg">{toCurrency(item.priceCents * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
              {isConfirmed && (
                <tfoot>
                  <tr>
                    <td colSpan={3}></td>
                    <td className="pt-6 text-right font-headline text-base font-bold">Order Total</td>
                    <td className="pt-6 text-right font-headline text-xl font-black text-primary px-4">
                      {toCurrency(orderTotal(order.items))}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-on-surface-variant">Job ID: {order.queueJobId}</p>
            <Link
              to={`/orders/${order.id}`}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              View Full Details
              <span className="material-symbols-outlined text-sm">arrow_outward</span>
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

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-on-surface-variant">
          <span className="material-symbols-outlined text-5xl animate-spin text-primary">progress_activity</span>
          <p className="font-label text-sm uppercase tracking-widest">Loading your orders…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Account</p>
          <h1 className="font-headline text-5xl font-bold tracking-tight text-on-surface">Order History</h1>
          <p className="text-on-surface-variant mt-2">Manage and track your recent flash purchases.</p>
        </div>
        <Link to="/marketplace" className="btn-secondary self-start md:self-auto">
          ← Back to Marketplace
        </Link>
      </header>

      {error && (
        <div className="glass-card rounded-lg p-4 mb-6 border border-error/20 text-error text-sm font-medium">
          {error}
        </div>
      )}

      {orders.length === 0 && !error ? (
        <div className="glass-card rounded-lg p-16 text-center">
          <span className="material-symbols-outlined text-6xl text-outline mb-4 block">shopping_bag</span>
          <p className="font-headline text-xl font-bold mb-2">No orders yet</p>
          <p className="text-on-surface-variant mb-6">Your flash purchase history will appear here.</p>
          <Link to="/marketplace" className="btn-primary inline-block">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
          {hasMore && (
            <button
              className="btn-secondary w-full mt-4"
              onClick={loadMore}
              disabled={loadingMore}
            >
              {loadingMore ? "Loading…" : "Load More Orders"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
