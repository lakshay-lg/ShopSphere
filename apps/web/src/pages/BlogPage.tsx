import { useState } from "react";
import { Link } from "react-router-dom";
import { blogPosts } from "../data/blogPosts.js";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

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
      <header className="mb-14 text-center md:text-left">
        <div className="inline-block px-4 py-1.5 rounded-full bg-tertiary-fixed/30 text-tertiary text-xs font-bold font-headline uppercase tracking-widest mb-4">
          Flash Insights
        </div>
        <h1 className="font-headline text-5xl md:text-6xl font-bold tracking-tight text-on-surface leading-tight mb-4">
          The Curated <br />
          <span className="text-primary">Chronicle.</span>
        </h1>
        <p className="max-w-2xl text-on-surface-variant text-lg leading-relaxed font-body">
          Architecture decisions, scaling lessons, and implementation tradeoffs from the ShopSphere build.
        </p>
      </header>

      {/* Bento grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Featured post */}
        {featured && (
          <article className="md:col-span-8 group cursor-pointer">
            <Link to={`/blog/${featured.slug}`} className="block h-full">
              <div className="glass-card rounded-lg overflow-hidden h-full flex flex-col hover:shadow-glass-hover transition-all duration-500">
                <div className="p-8 md:p-10 flex-grow flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4 text-xs font-medium font-headline text-on-surface-variant tracking-wider uppercase">
                      <span className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-primary shadow-sm border border-outline-variant/20">
                        FEATURED
                      </span>
                      <span>{featured.date}</span>
                      <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                      <span>{featured.tag}</span>
                    </div>
                    <h2 className="font-headline text-3xl font-bold mb-4 group-hover:text-primary transition-colors leading-tight">
                      {featured.title}
                    </h2>
                    <p className="text-on-surface-variant text-base leading-relaxed mb-6 line-clamp-3">
                      {featured.excerpt}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-widest">
                    Read Full Post
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </div>
                </div>
              </div>
            </Link>
          </article>
        )}

        {/* Side cards */}
        <div className="md:col-span-4 flex flex-col gap-6">
          {rest.slice(0, 2).map((post) => (
            <article key={post.slug} className="group cursor-pointer flex-1">
              <Link to={`/blog/${post.slug}`} className="block h-full">
                <div className="glass-card rounded-lg overflow-hidden h-full hover:shadow-glass-hover transition-all duration-500 p-7 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-medium font-headline text-on-surface-variant tracking-wider uppercase mb-2">
                      {post.date} · {post.tag}
                    </div>
                    <h3 className="font-headline text-lg font-bold mb-3 group-hover:text-primary transition-colors leading-snug">
                      {post.title}
                    </h3>
                    <p className="text-on-surface-variant text-sm leading-relaxed line-clamp-2">{post.excerpt}</p>
                  </div>
                  <div className="flex items-center gap-1 text-primary font-bold text-xs uppercase tracking-widest mt-5">
                    Read
                    <span className="material-symbols-outlined text-sm">arrow_outward</span>
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>

        {/* Bottom grid */}
        {rest.slice(2).map((post) => (
          <article key={post.slug} className="md:col-span-4 group cursor-pointer">
            <Link to={`/blog/${post.slug}`} className="block h-full">
              <div className="glass-card rounded-lg overflow-hidden h-full hover:shadow-glass-hover transition-all duration-500 p-7">
                <div className="text-xs font-medium font-headline text-on-surface-variant tracking-wider uppercase mb-2">
                  {post.date} · {post.readTime}
                </div>
                <h3 className="font-headline text-lg font-bold mb-3 group-hover:text-primary transition-colors leading-snug">
                  {post.title}
                </h3>
                <p className="text-on-surface-variant text-sm leading-relaxed line-clamp-3">{post.excerpt}</p>
              </div>
            </Link>
          </article>
        ))}

        {/* Quote card */}
        <div className="md:col-span-4 glass-card rounded-lg overflow-hidden bg-primary-container text-white p-8 flex flex-col justify-between">
          <span className="material-symbols-outlined text-4xl mb-4 opacity-60">format_quote</span>
          <h3 className="font-headline text-2xl font-bold leading-tight">
            "Speed is the bridge between desire and ownership."
          </h3>
          <div className="text-sm font-headline tracking-widest opacity-80 mt-6">
            — SHOPSPHERE EDITORIAL
          </div>
        </div>
      </div>

      {/* Newsletter section */}
      <section className="mt-24 rounded-lg bg-surface-container-low p-12 md:p-16 text-center relative overflow-hidden">
        <h2 className="font-headline text-3xl md:text-4xl font-bold tracking-tight mb-4">
          Stay within the <span className="text-primary">Sphere.</span>
        </h2>
        <p className="max-w-lg mx-auto text-on-surface-variant mb-8 font-body">
          Get exclusive early access to flash collections and engineering insights directly in your inbox.
        </p>
        {newsletterState === "success" ? (
          <p className="max-w-md mx-auto text-primary font-bold font-headline text-lg">
            {newsletterMessage}
          </p>
        ) : (
          <>
            <form
              className="max-w-md mx-auto flex flex-col md:flex-row gap-3"
              onSubmit={handleNewsletter}
            >
              <input
                className="input-field flex-grow"
                placeholder="curator@example.com"
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                required
                disabled={newsletterState === "loading"}
              />
              <button
                type="submit"
                className="btn-primary whitespace-nowrap"
                disabled={newsletterState === "loading"}
              >
                {newsletterState === "loading" ? "Subscribing…" : "Subscribe"}
              </button>
            </form>
            {newsletterState === "error" && (
              <p className="text-error text-sm mt-3">{newsletterMessage}</p>
            )}
          </>
        )}
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
      </section>
    </div>
  );
}

export default BlogPage;
