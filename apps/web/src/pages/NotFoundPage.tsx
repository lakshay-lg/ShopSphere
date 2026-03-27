import { Link } from "react-router-dom";

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
    <div className="page-container flex items-center justify-center min-h-[80vh]">
      {/* Background glows */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[5%] w-[40%] h-[40%] rounded-full bg-primary-container/10 blur-[120px]"></div>
        <div className="absolute bottom-[10%] right-[5%] w-[35%] h-[35%] rounded-full bg-secondary-container/10 blur-[100px]"></div>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        {/* Info card */}
        <div className="md:col-span-5 glass-card rounded-lg p-8 flex flex-col justify-center items-start">
          <div className="bg-primary-container/10 p-3 rounded-md mb-6">
            <span className="material-symbols-outlined text-primary-container text-2xl">explore_off</span>
          </div>
          <p className="eyebrow mb-2">404 — Not Found</p>
          <h1 className="font-headline text-4xl font-bold text-on-surface mb-4 tracking-tight leading-tight">
            Lost in the <br /><span className="text-primary-container">Sphere.</span>
          </h1>
          <p className="font-body text-on-surface-variant mb-3 leading-relaxed">{gag}</p>
          <p className="text-xs font-mono text-outline bg-surface-container px-3 py-2 rounded-lg mb-8 w-full">
            route.lookup() → null
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Link to="/" className="btn-primary flex items-center justify-center gap-2 group">
              Back to Home
              <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </Link>
            <Link to="/marketplace" className="btn-secondary flex items-center justify-center">
              Marketplace
            </Link>
          </div>
        </div>

        {/* Decorative large card */}
        <div className="md:col-span-7 glass-card rounded-lg p-3 overflow-hidden relative group min-h-[300px] flex items-center justify-center bg-gradient-to-br from-primary-fixed/20 to-secondary-container/20">
          <span className="font-headline text-[180px] font-bold text-primary/10 leading-none select-none">404</span>
        </div>

        {/* Quick links */}
        {[
          { icon: "shopping_bag", title: "Marketplace", desc: "Browse latest drops" },
          { icon: "history", title: "Order History", desc: "View your purchases" },
          { icon: "rss_feed", title: "Flash Blog", desc: "Latest commerce trends" },
        ].map((item) => (
          <div key={item.title} className="md:col-span-4 glass-card rounded-lg p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-secondary">{item.icon}</span>
            </div>
            <div>
              <p className="font-headline font-bold text-on-surface">{item.title}</p>
              <p className="font-body text-xs text-on-surface-variant">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default NotFoundPage;
