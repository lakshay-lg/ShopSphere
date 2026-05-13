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
        heading: "What came next",
        paragraphs: [
          "Now that auth, contact submission, content pages, and a more expressive fallback experience were in place, the next frontier was operational depth: payment flows, persistent user order history, observability, and admin controls. Those are less visible than a homepage redesign, but they are what turn a coherent demo into something deployment-adjacent.",
          "All of those have since landed. Order history, shipping address management, admin controls, and a full Razorpay payment integration are now part of the platform. The site has moved from feeling assembled to feeling established — which was always the real milestone, especially for a project that began as a storefront and quietly became a systems narrative."
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
          "The platform covers the full arc from discovery to paid order confirmation: product browsing with detail pages, cart management with persistence, Razorpay-gated flash-sale checkout with shipping address selection, order history and detail views, user profile and password management, and an admin interface for support operations. The newsletter captures interest and the blog records the build.",
          "The remaining gaps are the ones that require external infrastructure to be meaningful: email verification on registration, a forgot-password flow, and token revocation. Each is a contained addition to an architecture that was designed to support them. The foundation is honest about what it is and where it is going."
        ]
      }
    ]
  },
  {
    slug: "payment-processing-and-the-problem-of-trust",
    title: "Payment Processing and the Problem of Trust",
    tag: "Architecture",
    date: "March 29, 2026",
    readTime: "6 min read",
    excerpt:
      "Integrating a payment gateway is less about the API call and more about deciding where trust lives in your system — and making sure nothing can bypass it.",
    sections: [
      {
        heading: "The gap that made checkout feel incomplete",
        paragraphs: [
          "ShopSphere had a working checkout pipeline before payment was integrated. You could queue an order, watch it processed by the worker, and see a confirmed status land in the database. The system was technically coherent. But it was also missing the most fundamental thing a commerce platform is supposed to do: actually exchange value. Without payment, the checkout button was a demonstration rather than a transaction.",
          "Adding Razorpay was the natural next step. The requirement was not just to display a payment form — it was to integrate payment into the existing queue-backed flow in a way that was honest about the trust model. That meant thinking carefully about where verification happened and what could not be bypassed."
        ]
      },
      {
        heading: "Server-side order creation is not optional",
        paragraphs: [
          "The Razorpay integration starts with a server-side call. When the user initiates checkout, the frontend first requests a Razorpay order from the API via `POST /api/payments/create-order`. The API creates the order with the correct amount and returns an `orderId` alongside the public key. The frontend then opens the Razorpay checkout modal using those values.",
          "This sequence matters because it means the amount cannot be set by the client. A frontend-only integration that passes the amount directly to the checkout modal is trivially exploitable — anyone with browser devtools can change the number. Having the server create the order with the authoritative price from the database closes that hole before it can be opened."
        ]
      },
      {
        heading: "HMAC signature verification before anything happens",
        paragraphs: [
          "After the user completes payment, Razorpay returns three values to the client: `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature`. The signature is an HMAC-SHA256 hash of `orderId|paymentId` using the Razorpay key secret as the signing key. It exists specifically to let the server confirm that the payment response is genuine and unmodified.",
          "The flash-sale order endpoint now requires all three values. Before the idempotency check, before the product existence check, before anything is enqueued, the API verifies the signature using `crypto.timingSafeEqual`. If it does not match, the request is rejected with a 400. There is no code path that allows a confirmed order to be created without a valid payment signature. The queue worker then persists both `razorpayOrderId` and `razorpayPaymentId` on the order record, so every confirmed or failed order carries its payment provenance."
        ]
      },
      {
        heading: "Fitting payment into an existing concurrency model",
        paragraphs: [
          "The existing checkout flow had already solved the hard concurrency problems: idempotency key reservation, Redis stock locks with safe release, deadlock prevention via sorted product IDs, and atomic Prisma transactions. Payment verification slots in cleanly before the queue enqueue step without touching any of that machinery.",
          "The sequencing is: payment verified → idempotency key reserved → job enqueued → worker acquires locks → transaction commits. Each stage has a single responsibility. Payment is the trust gate. Everything after it operates on the assumption that the payment was real. Keeping those concerns separate made the integration straightforward and kept the worker logic unchanged."
        ]
      },
      {
        heading: "Test mode and what it actually tests",
        paragraphs: [
          "Razorpay's test mode is a complete sandbox. Test card numbers, hardcoded OTPs, and synthetic payment IDs let the full flow run end-to-end without moving any real money. That includes signature generation — the HMAC is computed with the real key secret against the test payment ID, so the verification logic is exercised identically to production.",
          "The only thing test mode does not cover is failure recovery from real payment network errors. But the platform's failure model is already explicit: a payment that does not complete never reaches the order queue, and a queued order that fails stock validation records a failure reason and preserves the payment IDs for audit. The happy path and the known failure path both leave a clean trail."
        ]
      }
    ]
  },
  {
    slug: "redesigning-shopsphere-from-the-design-token-up",
    title: "Redesigning ShopSphere from the Design Token Up",
    tag: "Design",
    date: "May 13, 2026",
    readTime: "7 min read",
    excerpt:
      "Rebuilding a frontend without touching the business logic is an exercise in restraint. The challenge is not what to change — it is ensuring nothing that already works stops working while you do it.",
    sections: [
      {
        heading: "The case against framework-dependent styling",
        paragraphs: [
          "The original UI was functional but visually inconsistent. Colors, spacing, and typographic choices accumulated organically across thirteen pages without a shared vocabulary to keep them coherent. The fix was not a new component library or a utility-class framework — it was a CSS custom property system: a small set of named tokens that every page could reference and that could be changed in one place.",
          "The token set is deliberately minimal. A handful of color variables — `--c-ink` for the primary dark tone, `--c-accent` for the orange highlight, `--c-primary` for the blue — combined with two font stacks and a spacing baseline covers the vast majority of decisions. Anything not covered by a token is a one-off and stays that way. The discipline of using tokens well comes from knowing which decisions deserve a name and which do not."
        ]
      },
      {
        heading: "The Swatch component solved a real problem elegantly",
        paragraphs: [
          "The product catalog has no images. The API returns names, prices, and stock counts — nothing visual. An earlier version used placeholder blocks of color, which made the marketplace feel like a spreadsheet. The redesign introduced a Swatch component: a set of ten deterministic SVG art patterns — stripes, concentric rings, grooves, woven geometry, grid, mountain profile, tessellated tiles, lens distortion, knit texture, and a soft orb — each rendered from a hash of the product ID.",
          "The important property is consistency. A product's pattern does not change between page loads, between the marketplace grid and the product detail page, or between sessions. The hash function maps the product ID to a pattern index and a palette index separately, so the same pattern can appear in different color combinations across the catalog without looking repetitive. The result is a catalog that feels visually considered rather than visually empty, without requiring a single real image."
        ]
      },
      {
        heading: "Thirteen pages, one constraint",
        paragraphs: [
          "The redesign covered every page in the application: home, marketplace, product detail, login, profile, order history, order detail, blog listing, blog post, contact, admin, privacy, terms, and the 404. The constraint on every page was the same — preserve all working logic, replace only the visual layer. State management, API calls, auth guards, form handlers, polling loops, and payment flows stayed exactly as they were.",
          "The most technically demanding page to reskin was the marketplace. It is roughly fifteen hundred lines and contains the Razorpay payment flow, BullMQ job polling, cart localStorage persistence, idempotency key management, and a quantity stepper system. Changing the wrong line in the wrong JSX block would break checkout. The approach was to edit only the parts that could be changed safely: class maps for visual state, the page header, the metric strip, the product card layout, and the sidebar. Everything between those visual anchors stayed untouched."
        ]
      },
      {
        heading: "What a redesign is actually for",
        paragraphs: [
          "A visual redesign of a working system is not really about aesthetics, even when it looks like it is. It is about coherence. A platform that uses the same visual language across all its surfaces communicates something to the people using it: that the same level of care was applied everywhere, that the details were considered, that the experience was designed rather than assembled.",
          "For a technical portfolio project, that coherence carries additional weight. The code behind the UI is the actual artifact, but the UI is what most people see first. A well-designed surface earns the time needed to explain the distributed systems work underneath it. Getting that right — without breaking thirteen pages of working business logic in the process — is the kind of constraint that makes a project interesting to reflect on."
        ]
      }
    ]
  },
  {
    slug: "a-complete-admin-portal-for-a-flash-commerce-platform",
    title: "A Complete Admin Portal for a Flash-Commerce Platform",
    tag: "Build Log",
    date: "May 13, 2026",
    readTime: "6 min read",
    excerpt:
      "A single endpoint that dumps contact messages into a token-gated page is not an admin portal. Building one that actually earns the name required thinking seriously about what operators need to run a live platform.",
    sections: [
      {
        heading: "The contact viewer was a starting point, not a destination",
        paragraphs: [
          "The original admin page had a single purpose: let someone with the right token read contact form submissions. It did that job well. But as the platform grew — products, users, orders, payment flow — the gap between what the site could do and what the admin surface could observe became increasingly hard to ignore. You could have a live commerce platform and no way to see a single order or change a product's stock without going directly to the database.",
          "The rewrite started from a simple question: what does a person actually need to operate this platform day-to-day? The answer was four things. They need to see the numbers at a glance. They need to manage the catalog. They need visibility into orders. They need to handle user accounts. Everything else is secondary to those four."
        ]
      },
      {
        heading: "The stats strip is the most honest part of the dashboard",
        paragraphs: [
          "The stats strip at the top of the dashboard shows four numbers: total revenue from confirmed orders, total order count with a failed-order breakdown, registered user count, and a stock alert count that turns red when products are out or running low. None of those numbers require a chart or a trend line to be useful. They answer the question 'is the platform working right now?' in a single glance.",
          "The revenue figure required a small design decision. Prisma's aggregate API does not support computed expressions like `SUM(priceCents * quantity)`, so the calculation happens in application code: fetch all confirmed orders with their items, reduce in JavaScript. For a platform at this scale that is perfectly fast. At larger volumes the right move is a `$queryRaw` with a SQL expression, and the refactor path is obvious. Noting that during the build rather than after it is the kind of thing that keeps a codebase honest."
        ]
      },
      {
        heading: "Product CRUD without a framework",
        paragraphs: [
          "The products tab is a full create-read-update-delete interface built without an admin framework. The table renders all products with color-coded stock values, inline row editing with controlled inputs that swap in on click, and a collapsible add-product form at the top. Saves go directly to `PATCH /api/admin/products/:id`, which validates the body with Zod and updates the Prisma record.",
          "One detail worth noting: the existing public product routes — `POST /api/products` and `PATCH /api/products/:id/stock` — were already in the codebase unprotected. The new admin routes add a properly gated equivalent. The older routes remain for backwards compatibility with the load test script, which was written before the admin layer existed. That kind of legacy coexistence is a normal part of a real codebase. Knowing which routes are admin-gated and which are not is the kind of thing that should live in documentation, not just in memory."
        ]
      },
      {
        heading: "Orders and users complete the picture",
        paragraphs: [
          "The orders tab fetches the latest two hundred orders and merges user emails in application code, since the `Order` model stores `userId` as a plain string with no Prisma back-relation to the `User` model. A `groupBy` query on the `Order` table produces per-user order counts for the users tab by the same approach. Neither workaround is particularly clever — they are pragmatic responses to a schema constraint that would require a migration to resolve the right way. They are documented in comments rather than hidden.",
          "The users tab shows registered accounts alongside their order counts and join dates. Delete operations include a confirmation prompt and cascade through the user's data. The admin portal now gives a realistic picture of who is using the platform and how. That sounds like a minor addition, but the difference between a platform you can observe and one you cannot is the difference between operating software and just running it."
        ]
      }
    ]
  }
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}
