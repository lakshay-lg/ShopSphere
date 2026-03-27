import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

interface Product {
  id: string;
  sku: string;
  name: string;
  priceCents: number;
  stock: number;
  createdAt: string;
  updatedAt: string;
}

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});
const toCurrency = (cents: number) => currency.format(cents / 100);

function getUrgency(stock: number): { label: string; tone: "out" | "critical" | "low" | "ok" } {
  if (stock <= 0) return { label: "Sold Out", tone: "out" };
  if (stock <= 5) return { label: `Only ${stock} left!`, tone: "critical" };
  if (stock <= 20) return { label: "Low Stock", tone: "low" };
  return { label: "In Stock", tone: "ok" };
}

const urgencyClasses = {
  out: "bg-red-100 text-red-700 border border-red-200",
  critical: "bg-orange-100 text-orange-700 border border-orange-200",
  low: "bg-amber-100 text-amber-700 border border-amber-200",
  ok: "bg-green-100 text-green-700 border border-green-200",
};

export default function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!productId) return;
    fetch(`${API_BASE}/api/products/${productId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Product not found (${res.status})`);
        return res.json() as Promise<{ product: Product }>;
      })
      .then((data) => setProduct(data.product))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Could not load product")
      )
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-on-surface-variant">
          <span className="material-symbols-outlined text-5xl animate-spin text-primary">
            progress_activity
          </span>
          <p className="font-label text-sm uppercase tracking-widest">Loading product…</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="page-container">
        <div className="glass-card rounded-lg p-16 text-center">
          <span className="material-symbols-outlined text-6xl text-error mb-4 block">
            error
          </span>
          <p className="font-headline text-xl font-bold mb-2">{error || "Product not found"}</p>
          <Link to="/marketplace" className="btn-secondary inline-block mt-4">
            ← Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const urgency = getUrgency(product.stock);
  const isSoldOut = product.stock <= 0;

  return (
    <div className="page-container">
      <header className="mb-10">
        <Link
          to="/marketplace"
          className="inline-flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary transition-colors mb-6"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Back to Marketplace
        </Link>
        <p className="eyebrow">Product Detail</p>
        <h1 className="font-headline text-5xl font-bold tracking-tight text-on-surface">
          {product.name}
        </h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Visual card */}
        <div className="glass-card rounded-2xl overflow-hidden border border-white/20">
          <div className="h-64 bg-gradient-to-br from-primary-fixed to-secondary-container flex items-center justify-center relative">
            <span className="font-headline text-9xl font-bold text-primary/20 select-none">
              {product.name.charAt(0)}
            </span>
            <div
              className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${urgencyClasses[urgency.tone]}`}
            >
              {urgency.label}
            </div>
          </div>
          <div className="p-6 flex items-center justify-between">
            <div>
              <p className="eyebrow">SKU</p>
              <p className="font-mono text-sm text-on-surface-variant">{product.sku}</p>
            </div>
            <div className="text-right">
              <p className="eyebrow">Listed</p>
              <p className="text-sm font-medium">
                {new Date(product.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
              </p>
            </div>
          </div>
        </div>

        {/* Info card */}
        <div className="glass-card rounded-2xl p-8 border border-white/20 flex flex-col gap-6">
          <div>
            <p className="eyebrow">Price</p>
            <p className="font-headline text-4xl font-black text-primary">
              {toCurrency(product.priceCents)}
            </p>
          </div>

          <div>
            <p className="eyebrow">Stock Available</p>
            <p className={`font-headline text-2xl font-bold ${isSoldOut ? "text-error" : "text-on-surface"}`}>
              {isSoldOut ? "Sold Out" : product.stock.toLocaleString()}
            </p>
          </div>

          <div className="mt-auto pt-4 border-t border-outline-variant/20">
            <p className="text-sm text-on-surface-variant mb-4">
              This is a flash-sale product. Head to the Marketplace to place an order before stock runs out.
            </p>
            <Link
              to="/marketplace"
              className={isSoldOut ? "btn-secondary w-full text-center block" : "btn-primary w-full text-center block"}
            >
              {isSoldOut ? "View Marketplace" : "Buy on Marketplace"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
