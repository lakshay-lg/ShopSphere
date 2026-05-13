import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Icon from "../components/Icon.js";
import Swatch, { getProductSwatch } from "../components/Swatch.js";

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

function getUrgency(stock: number): { label: string; pillClass: string } {
  if (stock <= 0) return { label: "Sold Out", pillClass: "ss-pill ss-pill-danger" };
  if (stock <= 5) return { label: `Only ${stock} left!`, pillClass: "ss-pill ss-pill-danger" };
  if (stock <= 20) return { label: "Low Stock", pillClass: "ss-pill ss-pill-warn" };
  return { label: "In Stock", pillClass: "ss-pill ss-pill-success" };
}

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
      <div className="page-container" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 48, height: 48, border: "3px solid var(--c-line)", borderTopColor: "var(--c-primary)",
            borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px",
          }}/>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--c-muted)" }}>
            Loading product…
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="page-container">
        <div className="ss-card" style={{ padding: 64, textAlign: "center" }}>
          <div style={{ color: "var(--c-danger)", marginBottom: 16 }}>
            <Icon name="x" size={48} stroke={1.5}/>
          </div>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
            {error || "Product not found"}
          </p>
          <Link to="/marketplace" className="btn-secondary">
            <Icon name="arrowL" size={14}/>
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const urgency = getUrgency(product.stock);
  const isSoldOut = product.stock <= 0;
  const swatch = getProductSwatch(product.id, 0);

  return (
    <div className="page-container">
      {/* Back link */}
      <Link
        to="/marketplace"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--c-muted)", marginBottom: 32, textDecoration: "none" }}
      >
        <Icon name="arrowL" size={14}/>
        Back to Marketplace
      </Link>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
        {/* Left: swatch + meta */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="ss-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ aspectRatio: "1/1" }}>
              <Swatch
                kind={swatch.kind}
                a={swatch.a}
                b={swatch.b}
                c={swatch.c}
                label={product.name}
                style={{ width: "100%", height: "100%" }}
              />
            </div>
          </div>

          <div className="ss-card" style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <p className="eyebrow" style={{ marginBottom: 4 }}>SKU</p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--c-muted)" }}>{product.sku}</p>
            </div>
            <div>
              <p className="eyebrow" style={{ marginBottom: 4 }}>Listed</p>
              <p style={{ fontSize: 13 }}>
                {new Date(product.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
              </p>
            </div>
            <div>
              <p className="eyebrow" style={{ marginBottom: 4 }}>Last Updated</p>
              <p style={{ fontSize: 13 }}>
                {new Date(product.updatedAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
              </p>
            </div>
            <div>
              <p className="eyebrow" style={{ marginBottom: 4 }}>Product ID</p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--c-muted)" }}>{product.id.slice(-12)}</p>
            </div>
          </div>
        </div>

        {/* Right: pricing + CTA */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="ss-card" style={{ padding: "32px 36px" }}>
            {/* Status badge */}
            <span className={urgency.pillClass} style={{ marginBottom: 16, display: "inline-flex" }}>
              <span className="ss-dot ss-dot-pulse" style={{ color: isSoldOut ? "var(--c-danger)" : product.stock <= 20 ? "var(--c-warn)" : "var(--c-success)" }}/>
              {urgency.label}
            </span>

            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 8 }}>
              {product.name}
            </h1>
            <p style={{ fontSize: 13, color: "var(--c-muted)", marginBottom: 28 }}>
              Flash-sale product · Drop 14 · Limited units
            </p>

            <div style={{ display: "flex", gap: 24, marginBottom: 28, padding: "20px 0", borderTop: "1px solid var(--c-line)", borderBottom: "1px solid var(--c-line)" }}>
              <div>
                <p className="eyebrow" style={{ marginBottom: 4 }}>Price</p>
                <p style={{ fontFamily: "var(--font-display)", fontSize: 40, fontWeight: 800, letterSpacing: "-0.04em", color: "var(--c-primary)" }}>
                  {toCurrency(product.priceCents)}
                </p>
              </div>
              <div>
                <p className="eyebrow" style={{ marginBottom: 4 }}>Stock</p>
                <p style={{ fontFamily: "var(--font-display)", fontSize: 40, fontWeight: 800, letterSpacing: "-0.04em", color: isSoldOut ? "var(--c-danger)" : "var(--c-ink)" }}>
                  {isSoldOut ? "—" : product.stock.toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            <p style={{ fontSize: 13, color: "var(--c-muted)", lineHeight: 1.6, marginBottom: 20 }}>
              This is a flash-sale product. Head to the Marketplace to place an order before stock runs out. Orders are processed via a fair-queue system.
            </p>

            <Link
              to="/marketplace"
              className={isSoldOut ? "btn-secondary" : "btn-primary"}
              style={{ display: "flex", justifyContent: "center", width: "100%", padding: "14px 0" }}
            >
              {isSoldOut ? "View Marketplace" : "Buy on Marketplace"}
              <Icon name="arrow" size={15}/>
            </Link>
          </div>

          {/* Shipping / returns badges */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { icon: "truck", title: "Ships in 24h", sub: "Bengaluru hub" },
              { icon: "refresh", title: "30-day returns", sub: "No questions asked" },
              { icon: "shield", title: "2-year warranty", sub: "All electronics" },
              { icon: "bolt", title: "Flash-queued", sub: "Fair ordering" },
            ].map((b) => (
              <div key={b.title} className="ss-card" style={{ padding: "14px 16px", display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ color: "var(--c-primary)", flexShrink: 0 }}>
                  <Icon name={b.icon} size={16} stroke={1.8}/>
                </div>
                <div>
                  <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12 }}>{b.title}</p>
                  <p style={{ fontSize: 11, color: "var(--c-muted)" }}>{b.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
