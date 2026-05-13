import { Link, Navigate, useParams } from "react-router-dom";
import { getBlogPost } from "../data/blogPosts.js";
import Icon from "../components/Icon.js";

const SWATCH_COLORS = [
  ["#0b3fad", "#1855e0"],
  ["#f06a2c", "#e04010"],
  ["#168a4a", "#1ab35e"],
  ["#b87100", "#e09200"],
];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function BlogPostPage() {
  const params = useParams();
  const post = getBlogPost(params.slug ?? "");

  if (!post) {
    return <Navigate to="/404" replace />;
  }

  const colorIdx = hashStr(post.slug) % SWATCH_COLORS.length;
  const [colorA, colorB] = SWATCH_COLORS[colorIdx] ?? ["#0b3fad", "#1855e0"];

  return (
    <div className="page-container" style={{ maxWidth: 860, margin: "0 auto" }}>
      {/* Back link */}
      <Link
        to="/blog"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--c-muted)", marginBottom: 32, textDecoration: "none" }}
      >
        <Icon name="arrowL" size={14}/>
        Back to Journal
      </Link>

      {/* Post header */}
      <header style={{ marginBottom: 32 }}>
        <span className="ss-pill ss-pill-blue" style={{ marginBottom: 16, display: "inline-flex" }}>
          {post.tag}
        </span>
        <h1 style={{
          fontFamily: "var(--font-display)", fontSize: "clamp(32px, 5vw, 52px)",
          fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.05, marginBottom: 20,
        }}>
          {post.title}
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%", background: "var(--c-primary-soft)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 14, color: "var(--c-primary)",
          }}>
            SS
          </div>
          <div style={{ fontSize: 13, color: "var(--c-muted)" }}>
            <span>ShopSphere Editorial</span>
            <span style={{ margin: "0 8px" }}>·</span>
            <span>{post.date}</span>
            <span style={{ margin: "0 8px" }}>·</span>
            <span>{post.readTime}</span>
          </div>
        </div>
        <p style={{
          fontSize: 17, color: "var(--c-muted)", lineHeight: 1.65,
          borderLeft: "3px solid var(--c-primary)", paddingLeft: 18,
          fontStyle: "italic",
        }}>
          {post.excerpt}
        </p>
      </header>

      {/* Hero swatch */}
      <div style={{
        borderRadius: "var(--d-radius-lg)", overflow: "hidden", marginBottom: 40,
        background: `linear-gradient(135deg, ${colorA}, ${colorB})`,
        aspectRatio: "16/6", position: "relative",
      }}>
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.12 }} preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="post-hero" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="16" cy="16" r="2" fill="#fff"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#post-hero)"/>
        </svg>
      </div>

      {/* Article body */}
      <article className="ss-card" style={{ padding: "40px 48px", marginBottom: 40 }}>
        {post.sections.map((section) => (
          <section key={section.heading} style={{ marginBottom: 40 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 16 }}>
              {section.heading}
            </h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} style={{ fontSize: 15, color: "var(--c-muted)", lineHeight: 1.75, marginBottom: 12 }}>
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </article>

      {/* Actions */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const }}>
        <Link to="/blog" className="btn-secondary">
          <Icon name="arrowL" size={14}/>
          All posts
        </Link>
        <Link to="/marketplace" className="btn-primary">
          Visit Marketplace
          <Icon name="arrow" size={14}/>
        </Link>
      </div>
    </div>
  );
}

export default BlogPostPage;
