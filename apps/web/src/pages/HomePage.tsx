import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon.js";
import Swatch, { getProductSwatch } from "../components/Swatch.js";
import { blogPosts } from "../data/blogPosts.js";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

interface Product {
  id: string;
  sku: string;
  name: string;
  priceCents: number;
  stock: number;
}

const fmt = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const fmtPrice = (cents: number) => fmt.format(cents / 100);

function StockPill({ stock }: { stock: number }) {
  if (stock <= 0) return (
    <span className="ss-pill ss-pill-danger"><span className="ss-dot"/> Sold out</span>
  );
  if (stock <= 5) return (
    <span className="ss-pill ss-pill-accent"><span className="ss-dot ss-dot-pulse"/> Only {stock} left</span>
  );
  if (stock <= 20) return (
    <span className="ss-pill ss-pill-warn"><span className="ss-dot"/> Low stock</span>
  );
  return <span className="ss-pill ss-pill-success"><span className="ss-dot"/> In stock</span>;
}

function ProductCard({ product, index }: { product: Product; index: number }) {
  const swatch = getProductSwatch(product.id, index);
  const isSoldOut = product.stock <= 0;
  return (
    <article className="ss-product-card ss-fade-in" style={{ display: "flex", flexDirection: "column" }}>
      <Link to={`/products/${product.id}`} style={{
        display: "block", aspectRatio: "5/4", position: "relative", overflow: "hidden",
      }}>
        <Swatch kind={swatch.kind} a={swatch.a} b={swatch.b} c={swatch.c} style={{ position: "absolute", inset: 0 }}/>
        <div style={{ position: "absolute", right: 12, top: 12 }}>
          <button style={{
            width: 32, height: 32, borderRadius: 999,
            background: "rgba(255,255,255,0.92)",
            display: "grid", placeItems: "center",
            color: "var(--c-ink-2)", border: "none", cursor: "pointer",
          }} aria-label="Wishlist">
            <Icon name="heart" size={14}/>
          </button>
        </div>
      </Link>
      <div style={{ padding: "14px 16px 0", flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <span className="eyebrow">{product.sku}</span>
          <StockPill stock={product.stock}/>
        </div>
        <Link to={`/products/${product.id}`} style={{ textDecoration: "none" }}>
          <h3 style={{
            fontSize: 15, fontWeight: 600, letterSpacing: "-0.015em",
            color: "var(--c-ink)", lineHeight: 1.3,
          }}>{product.name}</h3>
        </Link>
      </div>
      <div style={{
        padding: "12px 16px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
      }}>
        <span style={{
          fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 700,
          letterSpacing: "-0.02em", color: "var(--c-ink)",
          fontVariantNumeric: "tabular-nums",
        }}>
          {fmtPrice(product.priceCents)}
        </span>
        <Link to={`/products/${product.id}`}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            height: 30, padding: "0 12px", borderRadius: 999,
            background: isSoldOut ? "var(--c-surface-2)" : "var(--c-ink)",
            color: isSoldOut ? "var(--c-muted)" : "var(--c-surface)",
            fontSize: 11, fontFamily: "var(--font-display)", fontWeight: 600,
            textDecoration: "none",
            cursor: isSoldOut ? "not-allowed" : "pointer",
            opacity: isSoldOut ? 0.5 : 1,
          }}
        >
          {isSoldOut ? "Sold out" : <><Icon name="plus" size={11}/> View</>}
        </Link>
      </div>
    </article>
  );
}

function HeroTicker() {
  const stats: [string, string][] = [
    ["Queue-first", "checkout design"],
    ["Zero overselling", "stock locks on request"],
    ["₹0 held", "on failed orders"],
    ["24h dispatch", "Bengaluru hub"],
  ];
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
      borderTop: "1px solid rgba(255,255,255,0.1)",
      margin: "0 -48px",
    }}>
      {stats.map(([big, sub], i) => (
        <div key={big} style={{
          padding: "20px 28px",
          borderRight: i < 3 ? "1px solid rgba(255,255,255,0.1)" : "none",
        }}>
          <p style={{
            fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 700,
            color: "#fff", letterSpacing: "-0.02em",
          }}>{big}</p>
          <p style={{
            fontSize: 11, color: "#8b95a1", textTransform: "uppercase",
            letterSpacing: "0.12em", marginTop: 2,
          }}>{sub}</p>
        </div>
      ))}
    </div>
  );
}

function Hero() {
  return (
    <section style={{
      background: "var(--c-ink)", color: "#f4f6f8",
      borderRadius: "var(--d-radius-lg)", padding: "56px 48px 0",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        display: "grid", gridTemplateColumns: "1.4fr 1fr",
        gap: 40, alignItems: "end",
      }}>
        <div>
          <div style={{ marginBottom: 24 }}>
            <span className="ss-pill" style={{
              background: "rgba(255,255,255,0.08)", color: "#fff",
              border: "1px solid rgba(255,255,255,0.16)",
            }}>
              <span className="ss-dot" style={{ background: "var(--c-accent)" }}/>
              Queue-first · zero overselling
            </span>
          </div>
          <h1 style={{
            fontSize: "clamp(48px, 6vw, 88px)", fontWeight: 700,
            letterSpacing: "-0.045em", lineHeight: 0.92, color: "#fff", marginBottom: 24,
          }}>
            Built for the<br/>
            <span style={{ color: "var(--c-accent)" }}>flash-sale</span> rush.
          </h1>
          <p style={{
            fontSize: 17, lineHeight: 1.55, color: "#c8d0d8",
            maxWidth: 500, marginBottom: 32,
          }}>
            ShopSphere is a queue-first commerce engine. We hold the line so you actually
            get the thing — even when ten thousand other people want it at the same moment.
          </p>
          <div style={{ paddingBottom: 56, display: "flex", gap: 12, alignItems: "center" }}>
            <Link to="/marketplace" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              height: 48, padding: "0 22px", borderRadius: 999,
              background: "var(--c-accent)", color: "#fff",
              fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14,
              textDecoration: "none", transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Shop now <Icon name="arrow" size={16}/>
            </Link>
            <Link to="/blog/building-shopsphere-before-it-was-cool" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              height: 48, padding: "0 22px", borderRadius: 999,
              background: "transparent", color: "#fff",
              border: "1px solid rgba(255,255,255,0.2)",
              fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14,
              textDecoration: "none",
            }}>
              How it works
            </Link>
          </div>
        </div>

        {/* Product art card */}
        <div style={{
          aspectRatio: "3/4", position: "relative",
          borderRadius: 20, overflow: "hidden", marginBottom: 32,
          boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
        }}>
          <Swatch kind="rings" a="#06143c" b="#f06a2c" c="#1855e0"
            style={{ position: "absolute", inset: 0 }}/>
          <div style={{
            position: "absolute", left: 16, right: 16, bottom: 16, padding: 16,
            background: "rgba(11,16,20,0.65)", backdropFilter: "blur(10px)",
            borderRadius: 14, color: "#fff",
          }}>
            <p style={{
              fontFamily: "var(--font-display)", fontSize: 10, opacity: 0.7,
              letterSpacing: "0.14em", textTransform: "uppercase",
            }}>
              Featured · Limited edition
            </p>
            <p style={{
              fontFamily: "var(--font-display)", fontWeight: 700,
              fontSize: 20, marginTop: 4,
            }}>
              Helix Studio Headphones
            </p>
          </div>
        </div>
      </div>

      <HeroTicker/>
    </section>
  );
}

function BeliefsStrip() {
  const beliefs = [
    {
      n: "01",
      title: "No overselling.",
      body: "Stock locks at request time. If we can't reserve it, we won't take your money or your time.",
    },
    {
      n: "02",
      title: "No lost carts.",
      body: "Cart state persists across sessions. The queue is durable; so is your place in it.",
    },
    {
      n: "03",
      title: "No hidden status.",
      body: "Live API health is in the nav. Queue depth and order state are visible at every step.",
    },
  ];
  return (
    <section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
        <div>
          <span className="eyebrow">What we believe</span>
          <h2 style={{
            fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 700,
            letterSpacing: "-0.03em", marginTop: 8, color: "var(--c-ink)",
          }}>
            Three things this platform never does.
          </h2>
        </div>
        <Link to="/blog" style={{
          color: "var(--c-primary)", fontWeight: 600, fontSize: 13,
          textDecoration: "none", display: "flex", alignItems: "center", gap: 4,
          whiteSpace: "nowrap",
        }}>
          Read the journal <Icon name="arrow" size={13}/>
        </Link>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {beliefs.map((b) => (
          <div key={b.n} className="ss-card" style={{ padding: 28 }}>
            <p style={{
              fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 56,
              color: "var(--c-primary)", lineHeight: 0.85, letterSpacing: "-0.05em",
              fontVariantNumeric: "tabular-nums",
            }}>{b.n}</p>
            <h3 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 12 }}>{b.title}</h3>
            <p style={{ fontSize: 13, color: "var(--c-muted)", lineHeight: 1.6, marginTop: 6 }}>{b.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ShippingStrip() {
  const items = [
    { icon: "truck",    title: "Shipped within 24h", sub: "Bengaluru hub. Standard 2–4 days, express overnight." },
    { icon: "refresh",  title: "30-day no-quibble",  sub: "Send anything back — no questions, no restocking fee." },
    { icon: "shield",   title: "2-year warranty",     sub: "Every electronic, every keyboard, every leather good." },
  ];
  return (
    <section style={{
      background: "var(--c-surface-2)", padding: 36,
      borderRadius: "var(--d-radius-lg)",
    }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
        {items.map((item) => (
          <div key={item.title} style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: "var(--c-surface)",
              display: "grid", placeItems: "center",
              color: "var(--c-primary)", flexShrink: 0,
              boxShadow: "var(--shadow-sm)",
            }}>
              <Icon name={item.icon} size={20} stroke={1.8}/>
            </div>
            <div>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "var(--c-ink)" }}>
                {item.title}
              </p>
              <p style={{ fontSize: 12, color: "var(--c-muted)", marginTop: 4, lineHeight: 1.5 }}>
                {item.sub}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function BlogCard({ post, swatch }: { post: (typeof blogPosts)[0]; swatch: { kind: string; a: string; b: string; c: string } }) {
  return (
    <article style={{
      background: "var(--c-surface)", border: "1px solid var(--c-line)",
      borderRadius: "var(--d-radius)", overflow: "hidden", cursor: "pointer",
      transition: "border-color 0.15s, transform 0.15s",
    }}
    onMouseEnter={(e) => {
      (e.currentTarget as HTMLElement).style.borderColor = "var(--c-ink)";
      (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLElement).style.borderColor = "var(--c-line)";
      (e.currentTarget as HTMLElement).style.transform = "none";
    }}
    >
      <Link to={`/blog/${post.slug}`} style={{ textDecoration: "none" }}>
        <div style={{ aspectRatio: "16/9", position: "relative" }}>
          <Swatch {...swatch} label={post.tag} style={{ position: "absolute", inset: 0 }}/>
        </div>
        <div style={{ padding: 20 }}>
          <h3 style={{
            fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em",
            lineHeight: 1.25, color: "var(--c-ink)", marginBottom: 8,
          }}>{post.title}</h3>
          <p style={{ fontSize: 12, color: "var(--c-muted)", lineHeight: 1.5, marginBottom: 12 }}>
            {post.excerpt}
          </p>
          <div style={{ display: "flex", gap: 8, fontSize: 11, color: "var(--c-muted)" }}>
            <span>{post.date}</span>
            <span>·</span>
            <span>{post.readTime}</span>
          </div>
        </div>
      </Link>
    </article>
  );
}

const BLOG_SWATCHES = [
  { kind: "mountain", a: "#0b3fad", b: "#e1ebff", c: "#f4f6f8" },
  { kind: "tessera",  a: "#0b1014", b: "#f4f6f8", c: "#f06a2c" },
  { kind: "orb",      a: "#5b21b6", b: "#7c3aed", c: "#ecd9ff" },
];

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/products`)
      .then((r) => r.json())
      .then((data: { products?: Product[] } | Product[]) => {
        const list = Array.isArray(data) ? data : (data.products ?? []);
        setProducts(list.slice(0, 8));
      })
      .catch(() => {});
  }, []);

  return (
    <div style={{
      maxWidth: 1320, margin: "0 auto",
      padding: "32px var(--d-pad-page, 28px) 80px",
      display: "flex", flexDirection: "column", gap: 64,
    }}>
      <Hero/>

      <BeliefsStrip/>

      {/* Featured products grid */}
      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
          <div>
            <span className="eyebrow">Now shopping</span>
            <h2 style={{
              fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 700,
              letterSpacing: "-0.03em", marginTop: 8, color: "var(--c-ink)",
            }}>
              {products.length > 0 ? "In stock this week" : "Loading catalogue…"}
            </h2>
          </div>
          <Link to="/marketplace" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            height: 36, padding: "0 16px", borderRadius: 999,
            background: "transparent", color: "var(--c-ink)",
            border: "1px solid var(--c-line)",
            fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 12,
            textDecoration: "none",
          }}>
            Browse all <Icon name="arrow" size={14}/>
          </Link>
        </div>

        {products.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i}/>
            ))}
          </div>
        ) : (
          <div style={{
            height: 240, display: "grid", placeItems: "center",
            background: "var(--c-surface-2)", borderRadius: "var(--d-radius)",
            color: "var(--c-muted)", fontSize: 13,
          }}>
            Connect to the API to see live inventory
          </div>
        )}
      </section>

      <ShippingStrip/>

      {/* Journal strip */}
      {blogPosts.length > 0 && (
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
            <div>
              <span className="eyebrow">From the journal</span>
              <h2 style={{
                fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 700,
                letterSpacing: "-0.03em", marginTop: 8, color: "var(--c-ink)",
              }}>
                Engineering, design, and the warehouse floor
              </h2>
            </div>
            <Link to="/blog" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              height: 36, padding: "0 16px", borderRadius: 999,
              background: "transparent", color: "var(--c-ink)",
              border: "1px solid var(--c-line)",
              fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 12,
              textDecoration: "none",
            }}>
              All posts <Icon name="arrow" size={14}/>
            </Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {blogPosts.slice(0, 3).map((post, i) => (
              <BlogCard key={post.slug} post={post} swatch={BLOG_SWATCHES[i % BLOG_SWATCHES.length]!}/>
            ))}
          </div>
        </section>
      )}

      {/* CTA banner */}
      <section style={{
        background: "var(--c-ink)", borderRadius: "var(--d-radius-lg)",
        padding: "48px 56px",
        display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 40, alignItems: "center",
      }}>
        <div>
          <span className="eyebrow" style={{ color: "rgba(244,246,248,0.6)" }}>Ready to build?</span>
          <h2 style={{
            fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 700,
            letterSpacing: "-0.035em", color: "#fff", marginTop: 8, lineHeight: 1.05,
          }}>
            Explore the live marketplace.
          </h2>
          <p style={{ color: "#8b95a1", marginTop: 12, fontSize: 14, maxWidth: 440 }}>
            Real products, real inventory, real queue processing. Add to cart and watch the
            async dispatch pipeline handle the rest.
          </p>
          <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
            <Link to="/marketplace" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              height: 44, padding: "0 20px", borderRadius: 999,
              background: "#fff", color: "var(--c-ink)",
              fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13,
              textDecoration: "none",
            }}>
              Explore marketplace <Icon name="arrow" size={14}/>
            </Link>
            <Link to="/contact" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              height: 44, padding: "0 20px", borderRadius: 999,
              background: "transparent", color: "#fff",
              border: "1px solid rgba(255,255,255,0.2)",
              fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13,
              textDecoration: "none",
            }}>
              Contact team
            </Link>
          </div>
        </div>

        {/* Right: stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[
            ["async", "order dispatch"],
            ["BullMQ", "queue engine"],
            ["Redis lock", "stock guard"],
            ["Razorpay", "payments"],
          ].map(([big, sub]) => (
            <div key={big} style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14, padding: "18px 20px",
            }}>
              <p style={{
                fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18,
                color: "#fff", letterSpacing: "-0.02em",
              }}>{big}</p>
              <p style={{ fontSize: 11, color: "#8b95a1", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4 }}>
                {sub}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
