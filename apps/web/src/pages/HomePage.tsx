import { Link } from "react-router-dom";

const highlights = [
  {
    icon: "bolt",
    title: "Flash-Sale Reliability",
    text: "Queue-backed order dispatch with idempotency and distributed stock locking designed for traffic spikes.",
  },
  {
    icon: "analytics",
    title: "Data-First Operations",
    text: "Real-time inventory telemetry and queue state visibility keep product and engineering teams in sync.",
  },
  {
    icon: "map",
    title: "Production Roadmap",
    text: "Auth, payments, and advanced observability are the next modules on top of an already working core.",
  },
];

const milestones = [
  { icon: "check_circle", text: "Async order ingestion using BullMQ" },
  { icon: "check_circle", text: "Redis lock + Postgres transaction anti-oversell flow" },
  { icon: "check_circle", text: "Cart + multi-item checkout UX" },
  { icon: "check_circle", text: "Search and sorting for dense catalogs" },
];

function HomePage() {
  return (
    <div className="page-container space-y-8">
      {/* Hero */}
      <div className="glass-card rounded-lg p-10 md:p-14 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-fixed/20 blur-[80px] rounded-full -z-10 pointer-events-none"></div>
        <span className="inline-block px-4 py-1.5 rounded-full bg-secondary-container/50 text-on-secondary-container text-xs font-bold tracking-widest uppercase mb-6">
          Platform Overview
        </span>
        <h1 className="font-headline text-4xl md:text-6xl font-bold tracking-tight text-on-surface leading-tight mb-6 max-w-3xl">
          ShopSphere is a <span className="text-primary">high-concurrency</span> commerce engine for flash drops.
        </h1>
        <p className="text-on-surface-variant text-lg leading-relaxed max-w-2xl mb-10">
          This project demonstrates how a modern storefront can remain responsive while order execution is safely
          buffered and processed asynchronously. No overselling, no duplicate dispatch, and clear operational
          visibility under load.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/marketplace" className="btn-primary flex items-center justify-center gap-2">
            Explore Marketplace
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
          <Link to="/contact" className="btn-secondary flex items-center justify-center">
            Contact Team
          </Link>
        </div>
      </div>

      {/* Feature highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {highlights.map((item) => (
          <div key={item.title} className="glass-card rounded-lg p-8 hover:shadow-glass-hover transition-all duration-300 group">
            <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary transition-colors duration-300">
              <span className="material-symbols-outlined text-primary group-hover:text-white">{item.icon}</span>
            </div>
            <h2 className="font-headline text-xl font-bold mb-3">{item.title}</h2>
            <p className="text-on-surface-variant leading-relaxed">{item.text}</p>
          </div>
        ))}
      </div>

      {/* Milestones */}
      <div className="glass-card rounded-lg p-10 md:p-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="md:max-w-sm">
            <p className="eyebrow mb-2">Current Scope</p>
            <h2 className="font-headline text-3xl font-bold">What this build already proves</h2>
          </div>
          <ul className="flex-1 space-y-3">
            {milestones.map((m) => (
              <li key={m.text} className="flex items-center gap-3">
                <span className="material-symbols-outlined text-green-600 text-xl flex-shrink-0">check_circle</span>
                <span className="text-on-surface-variant">{m.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
