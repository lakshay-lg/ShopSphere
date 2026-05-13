import { Link } from "react-router-dom";
import Icon from "../components/Icon.js";

const gags = [
  "The page joined a stealth startup and left no forwarding address.",
  "404: even the queue workers could not locate this route.",
  "This URL was last seen pretending to be a feature request.",
  "The page exists in another branch, probably named final-final-v2.",
  "We checked the cart, the cache, and the couch cushions. Nothing.",
  "This route scaled horizontally into nonexistence.",
  "A product manager said it should be 'somewhere obvious.' It wasn't.",
  "This page was optimized out for being too mysterious.",
];

function pickRandomGag(): string {
  return gags[Math.floor(Math.random() * gags.length)] || "The route escaped into the backlog.";
}

function NotFoundPage() {
  const gag = pickRandomGag();

  return (
    <div className="page-container" style={{ display: "flex", flexDirection: "column", gap: 16, minHeight: "80vh", justifyContent: "center" }}>
      {/* Main split */}
      <div style={{ display: "grid", gridTemplateColumns: "5fr 7fr", gap: 16, alignItems: "stretch" }}>
        {/* Left: dark info panel */}
        <div style={{
          background: "var(--c-ink)", borderRadius: "var(--d-radius-lg)",
          padding: "48px 40px", display: "flex", flexDirection: "column", justifyContent: "center",
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, background: "rgba(244,246,248,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--c-accent)", marginBottom: 28,
          }}>
            <Icon name="x" size={20} stroke={2}/>
          </div>
          <p className="eyebrow" style={{ color: "rgba(244,246,248,0.45)", marginBottom: 12 }}>404 — Not Found</p>
          <h1 style={{
            fontFamily: "var(--font-display)", fontSize: 42, fontWeight: 800,
            letterSpacing: "-0.04em", lineHeight: 1.0, color: "#fff", marginBottom: 16,
          }}>
            Lost in the<br />
            <span style={{ color: "var(--c-accent)" }}>Sphere.</span>
          </h1>
          <p style={{ fontSize: 14, color: "rgba(244,246,248,0.6)", lineHeight: 1.6, marginBottom: 12 }}>
            {gag}
          </p>
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(244,246,248,0.35)",
            background: "rgba(244,246,248,0.04)", borderRadius: 8, padding: "8px 12px", marginBottom: 32,
          }}>
            route.lookup() → null
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const }}>
            <Link to="/" className="btn-primary" style={{ background: "#fff", color: "var(--c-ink)" }}>
              Back to Home <Icon name="arrow" size={14}/>
            </Link>
            <Link to="/marketplace" className="btn-secondary" style={{ borderColor: "rgba(255,255,255,0.2)", color: "#fff" }}>
              Marketplace
            </Link>
          </div>
        </div>

        {/* Right: decorative 404 panel */}
        <div style={{
          background: "var(--c-surface-2)", borderRadius: "var(--d-radius-lg)",
          display: "flex", alignItems: "center", justifyContent: "center",
          minHeight: 360, position: "relative", overflow: "hidden",
        }}>
          {/* Grid pattern background */}
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.3 }} preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="grid404" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M 32 0 L 0 0 0 32" fill="none" stroke="var(--c-line-strong)" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid404)"/>
          </svg>
          <span style={{
            fontFamily: "var(--font-display)", fontSize: "clamp(120px, 18vw, 200px)",
            fontWeight: 800, color: "var(--c-line-strong)", letterSpacing: "-0.06em",
            lineHeight: 1, userSelect: "none",
            position: "relative", zIndex: 1,
          }}>
            404
          </span>
        </div>
      </div>

      {/* Quick links */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {[
          { icon: "bag", path: "/marketplace", title: "Marketplace", desc: "Browse the latest drops" },
          { icon: "pkg", path: "/orders", title: "Order History", desc: "View your purchases" },
          { icon: "star", path: "/blog", title: "Journal", desc: "Engineering & design reads" },
        ].map((item) => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              display: "flex", alignItems: "center", gap: 16,
              background: "var(--c-surface)", border: "1px solid var(--c-line)",
              borderRadius: "var(--d-radius)", padding: "20px 24px",
              transition: "border-color 0.2s, box-shadow 0.2s",
              textDecoration: "none",
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 10, background: "var(--c-surface-2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--c-primary)", flexShrink: 0,
            }}>
              <Icon name={item.icon} size={18} stroke={1.8}/>
            </div>
            <div>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14 }}>{item.title}</p>
              <p style={{ fontSize: 12, color: "var(--c-muted)", marginTop: 2 }}>{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default NotFoundPage;
