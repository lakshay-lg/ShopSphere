import { useState } from "react";
import { Link } from "react-router-dom";
import { blogPosts } from "../data/blogPosts.js";
import Icon from "../components/Icon.js";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

const SWATCH_COLORS = [
  ["#0b3fad", "#1855e0", "#c9d8ff"],
  ["#f06a2c", "#e04010", "#ffe8da"],
  ["#168a4a", "#1ab35e", "#d8f0e2"],
  ["#b87100", "#e09200", "#fcecca"],
];

function PostSwatch({ index, aspect = "16/9" }: { index: number; aspect?: string }) {
  const [a, b] = SWATCH_COLORS[index % SWATCH_COLORS.length] ?? ["#0b3fad", "#1855e0"];
  return (
    <div style={{ aspectRatio: aspect, background: `linear-gradient(135deg, ${a}, ${b})`, position: "relative", overflow: "hidden" }}>
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.15 }} preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id={`bp-${index}`} width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="12" cy="12" r="1.5" fill="#fff"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#bp-${index})`}/>
      </svg>
    </div>
  );
}

function BlogPage() {
  const [featured, ...rest] = blogPosts;
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterState, setNewsletterState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [newsletterMessage, setNewsletterMessage] = useState("");

  async function handleNewsletter(e: React.FormEvent) {
    e.preventDefault();
    setNewsletterState("loading");
    try {
      const res = await fetch(`${API_BASE}/api/newsletter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newsletterEmail }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Subscription failed");
      setNewsletterState("success");
      setNewsletterMessage(data.message ?? "You're subscribed!");
      setNewsletterEmail("");
    } catch (err) {
      setNewsletterState("error");
      setNewsletterMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <div className="page-container">
      {/* Header */}
      <header style={{ marginBottom: 48 }}>
        <p className="eyebrow" style={{ marginBottom: 10 }}>From the journal</p>
        <h1 style={{
          fontFamily: "var(--font-display)", fontSize: "clamp(48px, 6vw, 80px)",
          fontWeight: 800, letterSpacing: "-0.05em", lineHeight: 0.95, marginBottom: 20,
        }}>
          Engineering,<br />
          <span style={{ color: "var(--c-accent)" }}>design</span>, and the<br />
          warehouse floor.
        </h1>
        <p style={{ fontSize: 16, color: "var(--c-muted)", maxWidth: 560, lineHeight: 1.6 }}>
          Architecture decisions, scaling lessons, and implementation tradeoffs from the ShopSphere build.
        </p>
      </header>

      {/* Featured + side cards */}
      <div style={{ display: "grid", gridTemplateColumns: "8fr 4fr", gap: 16, marginBottom: 16 }}>
        {/* Featured post */}
        {featured && (
          <Link to={`/blog/${featured.slug}`} style={{ textDecoration: "none" }}>
            <article className="ss-card" style={{ padding: 0, overflow: "hidden", height: "100%", cursor: "pointer", transition: "box-shadow 0.2s" }}>
              <PostSwatch index={0} aspect="16/7"/>
              <div style={{ padding: "28px 32px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <span className="ss-pill ss-pill-strong" style={{ fontSize: 10, letterSpacing: "0.1em" }}>Featured</span>
                  <span style={{ fontSize: 11, color: "var(--c-muted)" }}>{featured.date}</span>
                  <span style={{ fontSize: 11, color: "var(--c-muted)" }}>·</span>
                  <span style={{ fontSize: 11, color: "var(--c-muted)" }}>{featured.tag}</span>
                </div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: 10 }}>
                  {featured.title}
                </h2>
                <p style={{ fontSize: 14, color: "var(--c-muted)", lineHeight: 1.6, marginBottom: 16 }}>
                  {featured.excerpt}
                </p>
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--c-primary)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Read Full Post <Icon name="arrow" size={13}/>
                </span>
              </div>
            </article>
          </Link>
        )}

        {/* Side posts */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {rest.slice(0, 2).map((post, i) => (
            <Link key={post.slug} to={`/blog/${post.slug}`} style={{ textDecoration: "none", flex: 1 }}>
              <article className="ss-card" style={{ padding: 0, overflow: "hidden", height: "100%", cursor: "pointer" }}>
                <PostSwatch index={i + 1} aspect="16/6"/>
                <div style={{ padding: "18px 20px" }}>
                  <p style={{ fontSize: 11, color: "var(--c-muted)", marginBottom: 6 }}>{post.date} · {post.tag}</p>
                  <h3 style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1.25, marginBottom: 8 }}>
                    {post.title}
                  </h3>
                  <p style={{ fontSize: 12, color: "var(--c-muted)", lineHeight: 1.5 }}>
                    {post.excerpt.slice(0, 100)}…
                  </p>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 64 }}>
        {rest.slice(2).map((post, i) => (
          <Link key={post.slug} to={`/blog/${post.slug}`} style={{ textDecoration: "none" }}>
            <article className="ss-card" style={{ padding: 0, overflow: "hidden", height: "100%", cursor: "pointer" }}>
              <PostSwatch index={i + 3} aspect="16/8"/>
              <div style={{ padding: "20px 22px" }}>
                <p style={{ fontSize: 11, color: "var(--c-muted)", marginBottom: 6 }}>{post.date} · {post.readTime}</p>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1.25, marginBottom: 8 }}>
                  {post.title}
                </h3>
                <p style={{ fontSize: 12, color: "var(--c-muted)", lineHeight: 1.5 }}>
                  {post.excerpt.slice(0, 120)}…
                </p>
              </div>
            </article>
          </Link>
        ))}

        {/* Quote card */}
        <div style={{
          background: "var(--c-ink)", borderRadius: "var(--d-radius)", padding: "24px 28px",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 48, lineHeight: 1, color: "var(--c-accent)", fontFamily: "serif", marginBottom: 12 }}>"</span>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, color: "#fff", lineHeight: 1.3, letterSpacing: "-0.02em" }}>
            Speed is the bridge between desire and ownership.
          </h3>
          <p style={{ fontSize: 11, color: "rgba(244,246,248,0.45)", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 20 }}>
            — ShopSphere Editorial
          </p>
        </div>
      </div>

      {/* Newsletter */}
      <section style={{
        background: "var(--c-ink)", borderRadius: "var(--d-radius-lg)",
        padding: "56px 64px", textAlign: "center",
        position: "relative", overflow: "hidden",
      }}>
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.05, pointerEvents: "none" }} preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="nl-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#nl-grid)"/>
        </svg>
        <p className="eyebrow" style={{ color: "rgba(244,246,248,0.5)", marginBottom: 12 }}>Stay informed</p>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", marginBottom: 12 }}>
          Stay within the <span style={{ color: "var(--c-accent)" }}>Sphere.</span>
        </h2>
        <p style={{ fontSize: 15, color: "rgba(244,246,248,0.6)", maxWidth: 480, margin: "0 auto 32px", lineHeight: 1.6 }}>
          Drop alerts, restocks, and the occasional long-read. No marketing slop.
        </p>

        {newsletterState === "success" ? (
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "var(--c-accent)" }}>
            {newsletterMessage}
          </p>
        ) : (
          <>
            <form
              onSubmit={handleNewsletter}
              style={{ display: "flex", gap: 10, maxWidth: 440, margin: "0 auto", position: "relative", zIndex: 1 }}
            >
              <input
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                required
                disabled={newsletterState === "loading"}
                style={{ background: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.12)", color: "#fff" }}
              />
              <button
                type="submit"
                className="btn-primary"
                disabled={newsletterState === "loading"}
                style={{ whiteSpace: "nowrap", background: "var(--c-accent)", flexShrink: 0 }}
              >
                {newsletterState === "loading" ? "…" : "Subscribe"}
              </button>
            </form>
            {newsletterState === "error" && (
              <p style={{ color: "var(--c-danger)", fontSize: 13, marginTop: 10 }}>{newsletterMessage}</p>
            )}
          </>
        )}
      </section>
    </div>
  );
}

export default BlogPage;
