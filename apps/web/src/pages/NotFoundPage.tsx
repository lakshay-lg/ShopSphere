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
  return (
    gags[Math.floor(Math.random() * gags.length)] ||
    "The route escaped into the backlog."
  );
}

function NotFoundPage() {
  const gag = pickRandomGag();

  return (
    <section className="content-page not-found-page">
      <article className="card-surface not-found-panel">
        <p className="section-kicker">404</p>
        <h1>Route not found.</h1>
        <p className="not-found-gag">{gag}</p>
        <div className="not-found-codeblock" aria-hidden="true">
          <span>route.lookup()</span>
          <span>=&gt;</span>
          <span>null</span>
        </div>
        <div className="hero-actions">
          <Link className="button-primary" to="/">
            Return Home
          </Link>
          <Link className="button-secondary" to="/marketplace">
            Go to Marketplace
          </Link>
        </div>
      </article>
    </section>
  );
}

export default NotFoundPage;
