export interface BlogPost {
  slug: string;
  title: string;
  tag: string;
  date: string;
  readTime: string;
  excerpt: string;
  sections: Array<{
    heading: string;
    paragraphs: string[];
  }>;
}

export const blogPosts: BlogPost[] = [
  {
    slug: "building-shopsphere-before-it-was-cool",
    title: "Building ShopSphere Before It Was Cool",
    tag: "Build Log",
    date: "March 12, 2026",
    readTime: "6 min read",
    excerpt:
      "The first week of ShopSphere was less about glamour and more about wrestling a storefront into something that could survive its own ambition.",
    sections: [
      {
        heading: "The original plan was suspiciously optimistic",
        paragraphs: [
          "ShopSphere started with the classic lie every early project tells itself: it will just be a clean storefront, a tidy checkout, and some backend queueing for realism. Within hours that turned into conversations about idempotency keys, worker throughput, lock timing, and whether a product card should feel like a calm catalog tile or a countdown siren.",
          "That tension became the real theme of the project. The website wanted to feel elegant and composed, while the system behind it wanted to prepare for traffic spikes, retries, race conditions, and every other form of distributed-system mischief. The interesting part was not choosing one side; it was making the polished surface tell the truth about the machinery underneath it."
        ]
      },
      {
        heading: "The first genuine win was structural clarity",
        paragraphs: [
          "The route split changed everything. Moving from a monolithic single-page storefront into a real site shell with Home, Marketplace, Blog, Contact, and Login gave the project a narrative. Suddenly the site could explain itself. The home page could tell the architectural story, the marketplace could focus on transaction flow, and the blog could hold the messy engineering diary that product pages should never be forced to carry.",
          "That sounds obvious in hindsight, but early development often stalls because the app has no information architecture. ShopSphere became easier to evolve the moment each concern had a page with a clear purpose. It is a useful reminder that good routing is not just navigation; it is a discipline for thinking."
        ]
      },
      {
        heading: "Trivia from the chaotic hours",
        paragraphs: [
          "One of the earliest internal jokes was that the cart had more emotional stability than the developers. The cart state was predictable, typed, and recoverable. Human plans for the evening were not. Another favorite moment came from debating how futuristic the UI should look before anyone had even decided where the footer would live. This is normal startup behavior: spend twenty minutes on gradients, then two hours on a missing edge case in order relay polling.",
          "There was also a brief philosophical dispute over whether a flash-commerce platform should look fast or simply be fast. The answer, of course, is both. But watching that debate happen while a queue worker silently did the serious labor in the background felt like the project defining its personality in real time."
        ]
      },
      {
        heading: "Why the early mess mattered",
        paragraphs: [
          "Early project chaos is only useless when it teaches nothing. In this case it forced the foundations to become explicit: route boundaries, shared design tokens, user flow separation, and clearer assumptions about what qualifies as a real feature versus a visual placeholder. By the end of the first stretch, ShopSphere was no longer pretending to be done. It was honest about what existed, what was stubbed, and what would be built next.",
          "That honesty is part of why the project now feels credible. Not because it is finished, but because its architecture reflects real tradeoffs instead of demo-theater shortcuts."
        ]
      }
    ]
  },
  {
    slug: "the-small-drama-of-queues-locks-and-checkout-buttons",
    title: "The Small Drama of Queues, Locks, and Checkout Buttons",
    tag: "Architecture",
    date: "March 13, 2026",
    readTime: "7 min read",
    excerpt:
      "A fast checkout button is easy to design. A trustworthy checkout path under concurrency is where the actual engineering begins.",
    sections: [
      {
        heading: "Every glossy button hides a negotiation",
        paragraphs: [
          "The marketplace view looks simple by design. Search a product, sort the catalog, add quantities, queue a purchase. But every one of those actions implies backend coordination. A flashy 'Buy' button that double-submits under latency is not a product feature; it is a bug amplifier.",
          "ShopSphere's checkout flow became more interesting once the interface was tied to a queue-backed order pipeline. The site stopped being a pretty front end and started acting like a control surface for a system with constraints. That shift is what made the project worth building."
        ]
      },
      {
        heading: "Idempotency is not glamorous, which is exactly why it matters",
        paragraphs: [
          "Most users never think about duplicate submissions, but systems engineers live in permanent anticipation of them. Refreshes happen. Mobile taps happen twice. Retry logic gets overenthusiastic. The cost of handling this after launch is much higher than acknowledging it during the build.",
          "Treating idempotency as a first-class concern changed the tone of the implementation. Instead of assuming polite behavior from the world, the backend started enforcing it. That is one of the subtle lines between a coding demo and a system prototype. The latter assumes the network will eventually try something rude."
        ]
      },
      {
        heading: "The trivia nobody asks for but everyone remembers",
        paragraphs: [
          "At one point, a running joke emerged that the lock TTL had become the most emotionally discussed number in the project. It was just a configuration value, but it briefly carried the weight of a product philosophy. Too low, and the system felt fragile. Too high, and it felt stubborn. The final value solved the technical problem and ended a debate that had become suspiciously personal.",
          "There was also a short-lived naming discussion around whether the queue status should sound industrial, operational, or encouraging. The conclusion: infrastructure vocabulary should be boring. If your queue copywriting is dramatic, something else in the architecture is probably underdesigned."
        ]
      },
      {
        heading: "The frontend had to earn its calmness",
        paragraphs: [
          "The product grid, cart summaries, and order status cards look cleaner now because they were forced through real system constraints. The UI does not need to scream about concurrency. It needs to remain legible while the backend absorbs it. That is a much higher bar than decorative elegance.",
          "A good commerce interface is not impressive because it looks complex. It is impressive because it feels stable while complicated things happen elsewhere. That is the standard ShopSphere is trying to meet."
        ]
      }
    ]
  },
  {
    slug: "notes-from-the-week-we-gave-the-demo-a-personality",
    title: "Notes from the Week We Gave the Demo a Personality",
    tag: "Product",
    date: "March 15, 2026",
    readTime: "5 min read",
    excerpt:
      "A convincing project is not just functional. It needs a point of view, a tone, and a willingness to be a little memorable.",
    sections: [
      {
        heading: "Professional does not have to mean forgettable",
        paragraphs: [
          "Once the core routes were stable, the next question was visual and editorial: what should ShopSphere feel like? A lot of technical demos default to a safe, anonymous style. That solves the fear of looking wrong, but it also guarantees that nothing is distinctive enough to remember.",
          "The redesign intentionally aimed for a cleaner, sharper identity. The typography became more deliberate, the navigation got out of the way, and the supporting pages began explaining the project instead of merely decorating it. The point was not to make the site louder. It was to make it more self-aware."
        ]
      },
      {
        heading: "The blog became the memory of the build",
        paragraphs: [
          "A good engineering project accumulates stories almost immediately: things that broke for interesting reasons, choices that looked small but changed the architecture, and tiny moments of accidental comedy. The blog section became the right place to keep those details. It made the site feel less like a static submission and more like a living record of how the product was taking shape.",
          "That matters because mature software is not just a code artifact. It is also a trail of reasoning. The best systems are explainable by design, and writing those explanations down tends to improve the code at the same time."
        ]
      },
      {
        heading: "An easter egg is a design decision too",
        paragraphs: [
          "The custom 404 page came from a simple instinct: if a user gets lost, the site should at least be entertaining on the way back. Randomized gags do not make a platform more scalable, but they do make it feel made by people with taste and a pulse. That kind of detail helps a project escape the uncanny valley of technically correct but emotionally blank software.",
          "Some of the rejected one-liners were arguably better than the final choices, which is usually how these things go. The important part was preserving a little personality without undermining the professionalism of the site."
        ]
      },
      {
        heading: "What comes next",
        paragraphs: [
          "Now that auth, contact submission, content pages, and a more expressive fallback experience are in place, the next frontier is operational depth: payment flows, persistent user order history, observability, and admin controls. Those are less visible than a homepage redesign, but they are what turn a coherent demo into something deployment-adjacent.",
          "The site is closer now to feeling established rather than assembled. That is a meaningful milestone, especially for a project that began as a storefront and quickly became a systems narrative."
        ]
      }
    ]
  }
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}
