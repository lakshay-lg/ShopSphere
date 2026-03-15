import { NavLink, Route, Routes } from "react-router-dom";
import "./styles.css";
import BlogPage from "./pages/BlogPage.js";
import BlogPostPage from "./pages/BlogPostPage.js";
import ContactPage from "./pages/ContactPage.js";
import HomePage from "./pages/HomePage.js";
import LoginPage from "./pages/LoginPage.js";
import MarketplacePage from "./pages/MarketplacePage.js";
import NotFoundPage from "./pages/NotFoundPage.js";

type NavItem = {
  to: string;
  label: string;
  end?: boolean;
};

const navItems: NavItem[] = [
  { to: "/", label: "Home", end: true },
  { to: "/marketplace", label: "Marketplace" },
  { to: "/blog", label: "Blog" },
  { to: "/contact", label: "Contact" },
  { to: "/login", label: "Log In" },
];

function App() {
  return (
    <div className="site-shell">
      <header className="site-header">
        <NavLink className="brand" to="/">
          <span className="brand-kicker">ShopSphere</span>
          <span className="brand-name">Flash Commerce Platform</span>
        </NavLink>

        <nav className="site-nav" aria-label="Primary">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive ? "nav-link nav-link-active" : "nav-link"
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="site-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
