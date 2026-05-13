import { NavLink, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext.js";
import "./styles.css";
import BlogPage from "./pages/BlogPage.js";
import BlogPostPage from "./pages/BlogPostPage.js";
import ContactPage from "./pages/ContactPage.js";
import HomePage from "./pages/HomePage.js";
import LoginPage from "./pages/LoginPage.js";
import MarketplacePage from "./pages/MarketplacePage.js";
import NotFoundPage from "./pages/NotFoundPage.js";
import OrderHistoryPage from "./pages/OrderHistoryPage.js";
import OrderDetailPage from "./pages/OrderDetailPage.js";
import ProfilePage from "./pages/ProfilePage.js";
import PrivacyPage from "./pages/PrivacyPage.js";
import TermsPage from "./pages/TermsPage.js";
import ProductDetailPage from "./pages/ProductDetailPage.js";
import AdminPage from "./pages/AdminPage.js";
import Icon from "./components/Icon.js";

const NAV_LINKS = [
  { to: "/marketplace", label: "Marketplace" },
  { to: "/orders",      label: "Orders" },
  { to: "/blog",        label: "Journal" },
  { to: "/contact",     label: "Contact" },
];

const MARQUEE_ITEMS = [
  "Free shipping over ₹2,500",
  "Queue-backed checkout — zero overselling",
  "Real-time inventory tracking",
  "30-day no-quibble returns",
  "2-year warranty on all electronics",
  "Bengaluru dispatch hub · ships in 24h",
];

function Navbar() {
  const { user } = useAuth();

  return (
    <header className="ss-nav">
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 24, maxWidth: 1320, margin: "0 auto",
        padding: "14px var(--d-pad-page, 28px)",
      }}>
        {/* Brand */}
        <NavLink to="/" style={{
          display: "flex", alignItems: "center", gap: 10,
          fontFamily: "var(--font-display)", fontWeight: 700,
          fontSize: 18, letterSpacing: "-0.04em", color: "var(--c-ink)",
          textDecoration: "none",
        }}>
          <BrandMark/>
          <span>ShopSphere<span style={{ color: "var(--c-accent)" }}>.</span></span>
        </NavLink>

        {/* Nav links */}
        <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {NAV_LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              style={({ isActive }) => ({
                padding: "8px 12px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                color: isActive ? "var(--c-surface)" : "var(--c-ink-2)",
                background: isActive ? "var(--c-ink)" : "transparent",
                textDecoration: "none",
                transition: "background 0.15s, color 0.15s",
              })}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        {/* Tail */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <NavLink to="/marketplace" style={{
            display: "flex", alignItems: "center", gap: 8, height: 36,
            padding: "0 12px", borderRadius: 999,
            background: "var(--c-surface-2)", border: "1px solid transparent",
            color: "var(--c-muted)", fontSize: 12, cursor: "pointer",
            textDecoration: "none", transition: "border-color 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--c-line)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "transparent")}
          >
            <Icon name="search" size={14}/>
            <span>Search</span>
          </NavLink>

          {user ? (
            <NavLink
              to="/profile"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                height: 32, padding: "0 14px", borderRadius: 999,
                background: "var(--c-surface-2)", color: "var(--c-ink)",
                fontSize: 12, fontFamily: "var(--font-display)", fontWeight: 600,
                textDecoration: "none", transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--c-surface-3)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--c-surface-2)")}
            >
              <Icon name="user" size={13}/>
              {user.email.split("@")[0]}
            </NavLink>
          ) : (
            <NavLink
              to="/login"
              style={{
                display: "inline-flex", alignItems: "center",
                height: 32, padding: "0 14px", borderRadius: 999,
                background: "var(--c-ink)", color: "var(--c-surface)",
                fontSize: 12, fontFamily: "var(--font-display)", fontWeight: 600,
                textDecoration: "none", transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--c-ink-2)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--c-ink)")}
            >
              Sign in
            </NavLink>
          )}
        </div>
      </div>
    </header>
  );
}

function BrandMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 32 32" style={{ flexShrink: 0 }}>
      <rect width="32" height="32" rx="9" fill="var(--c-ink)"/>
      <circle cx="16" cy="16" r="4.5" fill="var(--c-accent)"/>
      <path d="M16 4 A 12 12 0 0 1 28 16" stroke="var(--c-accent)" strokeWidth="2"
        fill="none" strokeLinecap="round" opacity="0.7"/>
      <path d="M4 16 A 12 12 0 0 1 16 4" stroke="#f4f6f8" strokeWidth="2"
        fill="none" strokeLinecap="round" opacity="0.55"/>
    </svg>
  );
}

function Marquee() {
  return (
    <div className="ss-marquee">
      <div className="ss-marquee-track">
        {[0, 1].map((i) => (
          <span key={i} style={{ display: "contents" }}>
            {MARQUEE_ITEMS.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}

function Footer() {
  const sections = [
    {
      title: "Shop",
      links: [
        { to: "/marketplace", label: "Marketplace" },
        { to: "/marketplace", label: "New Arrivals" },
        { to: "/marketplace", label: "Best Sellers" },
      ],
    },
    {
      title: "Account",
      links: [
        { to: "/orders", label: "Order History" },
        { to: "/profile", label: "Profile" },
        { to: "/login",   label: "Sign In" },
        { to: "/admin",   label: "Admin" },
      ],
    },
    {
      title: "Company",
      links: [
        { to: "/blog",    label: "Journal" },
        { to: "/contact", label: "Contact" },
        { to: "/privacy", label: "Privacy" },
        { to: "/terms",   label: "Terms" },
      ],
    },
  ];

  return (
    <footer className="ss-footer">
      <div style={{
        maxWidth: 1320, margin: "0 auto",
        padding: "56px var(--d-pad-page, 28px) 0",
        display: "grid",
        gridTemplateColumns: "1.5fr repeat(3, 1fr)",
        gap: 40,
      }}>
        {/* Brand col */}
        <div>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            fontFamily: "var(--font-display)", fontWeight: 700,
            fontSize: 18, letterSpacing: "-0.04em", color: "#fff",
            marginBottom: 16,
          }}>
            <BrandMark/>
            <span>ShopSphere<span style={{ color: "var(--c-accent)" }}>.</span></span>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: "#8b95a1", maxWidth: 280, marginBottom: 24 }}>
            A queue-first marketplace. Built so ten thousand people can hit checkout
            on a Wednesday evening and nobody loses their cart.
          </p>
          <p style={{ fontSize: 11, color: "#5b6573", marginBottom: 8 }}>Drop alerts & long-reads</p>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="email"
              placeholder="you@example.com"
              style={{
                flex: 1, height: 36, padding: "0 12px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 8, color: "#fff", fontSize: 13,
                fontFamily: "var(--font-body)",
              }}
            />
            <button style={{
              height: 36, padding: "0 14px", borderRadius: 8,
              background: "var(--c-accent)", color: "#fff",
              fontFamily: "var(--font-display)", fontWeight: 600,
              fontSize: 12, cursor: "pointer", border: "none",
            }}>
              Join
            </button>
          </div>
        </div>

        {/* Link cols */}
        {sections.map((sec) => (
          <div key={sec.title}>
            <h4 style={{
              fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 700,
              letterSpacing: "0.15em", textTransform: "uppercase", color: "#fff",
              marginBottom: 18,
            }}>{sec.title}</h4>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {sec.links.map((l) => (
                <li key={l.label}>
                  <NavLink to={l.to} style={{
                    color: "#c8d0d8", fontSize: 13,
                    textDecoration: "none", transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#c8d0d8")}
                  >
                    {l.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div style={{
        maxWidth: 1320, margin: "40px auto 0",
        padding: "24px var(--d-pad-page, 28px) 28px",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: 16,
        fontSize: 12, color: "#8b95a1",
      }}>
        <span>© 2026 ShopSphere · Flash Commerce Platform</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className="ss-dot ss-dot-pulse" style={{ color: "#22c55e" }}/>
          All systems operational · Made in India
        </span>
      </div>
    </footer>
  );
}

function App() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--c-bg)", color: "var(--c-ink)" }}>
      <Navbar/>
      <Marquee/>
      <main>
        <Routes>
          <Route path="/"                   element={<HomePage />} />
          <Route path="/marketplace"        element={<MarketplacePage />} />
          <Route path="/products/:productId" element={<ProductDetailPage />} />
          <Route path="/blog"               element={<BlogPage />} />
          <Route path="/blog/:slug"         element={<BlogPostPage />} />
          <Route path="/contact"            element={<ContactPage />} />
          <Route path="/orders"             element={<OrderHistoryPage />} />
          <Route path="/orders/:orderId"    element={<OrderDetailPage />} />
          <Route path="/profile"            element={<ProfilePage />} />
          <Route path="/privacy"            element={<PrivacyPage />} />
          <Route path="/terms"              element={<TermsPage />} />
          <Route path="/admin"              element={<AdminPage />} />
          <Route path="/login"              element={<LoginPage />} />
          <Route path="/404"               element={<NotFoundPage />} />
          <Route path="*"                  element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer/>
    </div>
  );
}

export default App;
