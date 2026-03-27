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

type NavItem = {
  to: string;
  label: string;
  end?: boolean;
};

const navItems: NavItem[] = [
  { to: "/marketplace", label: "Marketplace" },
  { to: "/orders", label: "Order History" },
  { to: "/blog", label: "Blog" },
  { to: "/contact", label: "Contact" },
];

function App() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Floating pill navbar */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-[1200px] glass-nav rounded-full flex justify-between items-center px-8 py-3 z-50">
        {/* Brand */}
        <NavLink to="/" className="flex flex-col items-start leading-none uppercase text-primary font-bold font-headline">
          <span className="text-lg tracking-tighter">ShopSphere</span>
          <span className="text-[8px] tracking-[0.2em] opacity-70">Flash Commerce</span>
        </NavLink>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive
                  ? "text-primary font-bold border-b-2 border-primary text-xs tracking-tight font-label transition-all duration-300"
                  : "text-slate-600 hover:text-primary transition-colors text-xs font-medium tracking-tight font-label"
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* Auth CTA */}
        {user ? (
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              isActive
                ? "btn-primary !py-2 !px-6 !text-xs"
                : "bg-primary-container text-on-primary-container px-6 py-2 rounded-full text-xs font-bold font-headline hover:scale-105 hover:shadow-lg transition-all duration-300 active:scale-95"
            }
          >
            Profile
          </NavLink>
        ) : (
          <NavLink
            to="/login"
            className={({ isActive }) =>
              isActive
                ? "btn-primary !py-2 !px-6 !text-xs"
                : "bg-primary-container text-on-primary-container px-6 py-2 rounded-full text-xs font-bold font-headline hover:scale-105 hover:shadow-lg transition-all duration-300 active:scale-95"
            }
          >
            Log In
          </NavLink>
        )}
      </nav>

      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/products/:productId" element={<ProductDetailPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/orders" element={<OrderHistoryPage />} />
          <Route path="/orders/:orderId" element={<OrderDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="bg-slate-50 py-12 border-t border-slate-200/40 mt-8">
        <div className="max-w-[1240px] mx-auto flex flex-col md:flex-row justify-between items-center px-6 gap-6">
          <div className="flex flex-col items-center md:items-start gap-1">
            <span className="text-lg font-black text-primary font-headline uppercase tracking-tight">ShopSphere</span>
            <p className="text-slate-500 text-sm font-body">© 2025 ShopSphere. Flash Commerce Platform.</p>
          </div>
          <div className="flex gap-8">
            <NavLink to="/privacy" className="text-slate-500 hover:text-primary transition-colors font-label text-sm">Privacy Policy</NavLink>
            <NavLink to="/terms" className="text-slate-500 hover:text-primary transition-colors font-label text-sm">Terms of Service</NavLink>
            <NavLink to="/contact" className="text-slate-500 hover:text-primary transition-colors font-label text-sm">Support</NavLink>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
