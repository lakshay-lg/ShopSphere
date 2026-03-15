import { Link } from "react-router-dom";

const highlights = [
  {
    title: "Flash-Sale Reliability",
    text: "Queue-backed order dispatch with idempotency and distributed stock locking designed for traffic spikes.",
  },
  {
    title: "Data-First Operations",
    text: "Real-time inventory telemetry and queue state visibility keep product and engineering teams in sync.",
  },
  {
    title: "Production Roadmap",
    text: "Auth, payments, and advanced observability are the next modules on top of an already working core.",
  },
];

const milestones = [
  "Async order ingestion using BullMQ",
  "Redis lock + Postgres transaction anti-oversell flow",
  "Cart + multi-item checkout UX",
  "Search and sorting for dense catalogs",
];

function HomePage() {
  return (
    <section className="content-page home-page">
      <article className="home-hero card-surface">
        <p className="section-kicker">Platform Overview</p>
        <h1>
          ShopSphere is a high-concurrency commerce engine for flash drops.
        </h1>
        <p>
          This project demonstrates how a modern storefront can remain
          responsive while order execution is safely buffered and processed
          asynchronously. The goal is simple: no overselling, no duplicate
          dispatch, and clear operational visibility under load.
        </p>

        <div className="hero-actions">
          <Link className="button-primary" to="/marketplace">
            Explore Marketplace
          </Link>
          <Link className="button-secondary" to="/contact">
            Contact Team
          </Link>
        </div>
      </article>

      <section className="home-grid">
        {highlights.map((item) => (
          <article className="card-surface" key={item.title}>
            <h2>{item.title}</h2>
            <p>{item.text}</p>
          </article>
        ))}
      </section>

      <section className="card-surface roadmap-block">
        <div>
          <p className="section-kicker">Current Scope</p>
          <h2>What this build already proves</h2>
        </div>

        <ul className="roadmap-list">
          {milestones.map((milestone) => (
            <li key={milestone}>{milestone}</li>
          ))}
        </ul>
      </section>
    </section>
  );
}

export default HomePage;
