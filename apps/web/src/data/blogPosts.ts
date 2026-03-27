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
  },
  {
    slug: "users-auth-and-the-question-of-identity",
    title: "Users, Auth, and the Question of Identity",
    tag: "Security",
    date: "March 18, 2026",
    readTime: "6 min read",
    excerpt:
      "Adding real authentication to ShopSphere forced a clear-eyed look at what it means to know who someone is — and what you owe them once you do.",
    sections: [
      {
        heading: "The guest era had to end",
        paragraphs: [
          "For a while, ShopSphere ran on the quiet fiction of a shared shopper identity. Everyone was effectively the same user. That works just long enough to prove that the queue pipeline is real, but it breaks the moment anyone asks a reasonable question like 'where are my orders?' The answer to that question requires the system to actually know who is asking.",
          "The auth implementation followed from that requirement rather than preceding it. Register with an email and password, get a signed JWT back, include that token on every subsequent request. It is not novel technology. The interesting part was building it to production habits from the start rather than leaving the token handling as an afterthought."
        ]
      },
      {
        heading: "Rate limiting is not paranoia, it is just politeness",
        paragraphs: [
          "Once the register and login routes existed, the obvious next step was protecting them. The implementation uses per-route IP-based limits via `@fastify/rate-limit`, with registration capped tighter than login. This is a calibration decision as much as a security one: registration is lower frequency by nature, so a tighter ceiling does not inconvenience real users but raises the cost of automated credential stuffing meaningfully.",
          "The constant-time comparison guard on login — running a dummy bcrypt compare even when the user is not found — deserves a mention. It eliminates the timing difference between 'email not found' and 'wrong password', which removes one side-channel that enumeration attacks rely on. Small details compound into a posture, and that detail cost almost nothing to add."
        ]
      },
      {
        heading: "The profile page as a trust signal",
        paragraphs: [
          "A profile page is not technically exciting. It renders what you already know about a user, lets them change their password, and lets them save shipping addresses. But it matters as a trust signal. A site that lets you create an account but offers no surface to inspect or manage it sends an implicit message about how seriously it takes that account.",
          "The password change flow requires the current password before accepting a new one. That check should feel obvious, but it is frequently omitted. The shipping address section adds real utility by letting saved addresses pre-fill the checkout selector, which reduces friction and prevents the awkward silence of a checkout form that never remembers anything."
        ]
      },
      {
        heading: "What JWT gets right and what it offloads",
        paragraphs: [
          "JWT authentication is stateless by design. The server does not store sessions; it trusts cryptographically signed tokens. That is a genuine architectural advantage at scale: any API instance can verify any token without a shared session store. The trade-off is that token revocation requires extra infrastructure. For now, logout is client-side only — the token is discarded locally and expires in seven days on its own.",
          "That is an honest trade-off for a project at this stage. The right tool for revocation is a token blocklist in Redis, which is already in the infrastructure stack. Adding it is a known next step rather than an oversight. Acknowledging the gap is more useful than pretending it does not exist."
        ]
      }
    ]
  },
  {
    slug: "persistence-by-design-addresses-cart-and-order-history",
    title: "Persistence by Design: Addresses, Cart, and Order History",
    tag: "Architecture",
    date: "March 21, 2026",
    readTime: "7 min read",
    excerpt:
      "A platform that forgets everything between page loads is not a platform. The work of deciding what to persist, where, and why turns out to be surprisingly opinionated.",
    sections: [
      {
        heading: "The cart problem is deceptively simple",
        paragraphs: [
          "Losing a cart on page refresh is a paper cut that accumulates into real frustration. The fix is straightforward: initialize cart state from localStorage with a lazy state function, serialize it back on every change via a sync effect. Two additions, high impact. The reason it was not there from the start is that in-memory state is easier to reason about while the underlying pipeline is still being built. Once the queue flow was stable, persistence became the obvious next layer.",
          "The same pattern was already in place for the order relay. Extending it to the cart was deliberate repetition rather than an oversight correction. The design is intentional: items you have added survive a refresh, and orders you have placed survive a tab close. Both are appropriate for their context."
        ]
      },
      {
        heading: "Shipping addresses as a first-class model",
        paragraphs: [
          "Adding a dedicated `ShippingAddress` model to the Prisma schema was the decision that made checkout feel real. A user can now save multiple addresses, set one as default, and have it automatically pre-selected in the marketplace checkout dropdown. The first address created becomes the default automatically; subsequent ones require an explicit action.",
          "The backend enforces ownership on every address mutation. Set-default and delete operations both verify that the requesting user owns the address before proceeding, returning 403 otherwise. That check is easy to skip when you are moving fast, but it is the kind of gap that creates real vulnerabilities. The order creation path accepts an optional `shippingAddressId` which is passed through the queue payload and persisted on the order record."
        ]
      },
      {
        heading: "Order history as a product feature, not just a database dump",
        paragraphs: [
          "The order history page uses cursor-based pagination rather than offset pagination. That is not purely academic. Offset pagination degrades as the table grows and produces inconsistent results when new rows are inserted between page fetches. Cursor-based pagination is stable under concurrent writes, which matters for a platform where orders are landing continuously.",
          "The order detail page completes the picture. It shows full item breakdown, line totals, order total, the queue job ID for traceability, and the shipping address that was attached at checkout. That last field required threading the address through the `orderWithItems` Prisma select, but it means the detail view is genuinely informative rather than a partial summary with a row ID."
        ]
      },
      {
        heading: "The product detail page closed a navigation gap",
        paragraphs: [
          "For a long time, product names in the marketplace grid were static text. Clicking them did nothing. Adding a dedicated `/products/:productId` route and a corresponding detail page resolved that gap without requiring changes to the ordering flow. The detail page is intentionally read-only: it shows the product, its price, its stock urgency, and a call to action that takes the user back to the marketplace to buy.",
          "That decision avoided a hard problem — the cart lives in MarketplacePage state and sharing it across routes would require lifting it to context. The read-only approach is honest about that constraint rather than papering over it. The right way to solve it later is a cart context provider, not a workaround."
        ]
      }
    ]
  },
  {
    slug: "admin-controls-and-the-infrastructure-that-ties-it-together",
    title: "Admin Controls and the Infrastructure That Ties It Together",
    tag: "Build Log",
    date: "March 26, 2026",
    readTime: "5 min read",
    excerpt:
      "Every user-facing feature eventually generates data that someone needs to read. Building the admin layer forced a conversation about access, trust, and what it means to operate a product responsibly.",
    sections: [
      {
        heading: "Contact messages needed a destination",
        paragraphs: [
          "The contact form had been persisting submissions to PostgreSQL since early in the build. But the data had nowhere useful to go. The `GET /api/admin/contact-messages` endpoint was the obvious completion, protected by a static `ADMIN_TOKEN` from the environment rather than the user JWT system. The choice reflects the real use case: an admin checking submissions is not a registered user browsing the store; they are an operator with a separate class of access.",
          "The frontend admin page at `/admin` makes that endpoint actually usable. It opens with a token prompt, stores the credential in `sessionStorage` for the duration of the tab, and renders submissions as collapsible cards. Each expanded card shows the full message, sender metadata, and a reply link that opens the user's email client pre-addressed. The session clears on tab close by design."
        ]
      },
      {
        heading: "Newsletter subscriptions without the spam infrastructure",
        paragraphs: [
          "The newsletter subscription form on the blog page now has a real backend. The `POST /api/newsletter` endpoint upserts on the email field, which means re-subscribing is idempotent. A repeated submission returns the same success response without creating a duplicate record. That is the correct behavior regardless of whether it was the user's intention.",
          "There is no confirmation email, no unsubscribe link, and no send infrastructure because none of those things were in scope. What does exist is a clean data model and a working capture path. Adding email delivery later is a concrete integration task, not a design problem to solve."
        ]
      },
      {
        heading: "Privacy and terms as honest documentation",
        paragraphs: [
          "The Privacy Policy and Terms of Service pages are not legal instruments for a live product. They are documentation artifacts that explain what the platform actually does with data: bcrypt-hashed passwords, localStorage for session tokens and cart state, PostgreSQL for orders and contact submissions. Writing them forced a useful audit of where data actually lives and how it flows through the system.",
          "That kind of documentation pays back quickly during code review and onboarding. A reader who knows the platform uses `localStorage` key `ss_token` for auth and `ss_cart` for cart state can orient themselves in the codebase faster. The pages are also linked from the footer, which means the site can explain its data practices without requiring anyone to dig through source."
        ]
      },
      {
        heading: "Where ShopSphere stands now",
        paragraphs: [
          "The platform now covers the full arc from discovery to order confirmation: product browsing with detail pages, cart management with persistence, authenticated flash-sale checkout with shipping address selection, order history and detail views, user profile and password management, and an admin interface for support operations. The newsletter captures interest and the blog records the build.",
          "The remaining gaps are known and named: email verification on registration, a forgot-password flow, token revocation, and a payment integration. Each of those is a contained addition to an architecture that was designed to support them. The foundation is honest about what it is and where it is going."
        ]
      }
    ]
  }
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}
