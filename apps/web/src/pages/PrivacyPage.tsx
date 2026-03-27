export default function PrivacyPage() {
  return (
    <div className="page-container max-w-3xl mx-auto">
      <header className="mb-10">
        <p className="eyebrow">Legal</p>
        <h1 className="font-headline text-5xl font-bold tracking-tight text-on-surface">
          Privacy Policy
        </h1>
        <p className="text-on-surface-variant mt-2 text-sm">Last updated: March 2026</p>
      </header>

      <div className="glass-card rounded-lg p-8 md:p-12 border border-white/20 space-y-8 font-body text-on-surface-variant leading-relaxed">

        <section>
          <h2 className="font-headline text-xl font-bold text-on-surface mb-3">
            1. Information We Collect
          </h2>
          <p>
            When you register, we collect your email address and a hashed version of your password.
            When you place an order, we store the items, quantities, and price snapshots at time of
            purchase. Contact form submissions are retained to respond to your enquiries.
          </p>
        </section>

        <section>
          <h2 className="font-headline text-xl font-bold text-on-surface mb-3">
            2. How We Use Your Data
          </h2>
          <p>
            Your data is used solely to operate the ShopSphere platform: authenticating your
            account, processing flash-sale orders, and responding to support requests. We do not
            sell, rent, or share your personal information with third parties for marketing purposes.
          </p>
        </section>

        <section>
          <h2 className="font-headline text-xl font-bold text-on-surface mb-3">
            3. Data Storage &amp; Security
          </h2>
          <p>
            Passwords are hashed using bcrypt with a cost factor of 12 and are never stored in
            plain text. Data is stored in a PostgreSQL database. We take reasonable technical
            measures to protect your information, but no system is completely immune to breaches.
          </p>
        </section>

        <section>
          <h2 className="font-headline text-xl font-bold text-on-surface mb-3">
            4. Cookies &amp; Local Storage
          </h2>
          <p>
            ShopSphere uses <code className="font-mono text-sm bg-surface-container px-1 rounded">localStorage</code> to
            persist your session token and order relay history. No third-party tracking cookies
            are used.
          </p>
        </section>

        <section>
          <h2 className="font-headline text-xl font-bold text-on-surface mb-3">
            5. Your Rights
          </h2>
          <p>
            You may request deletion of your account and associated data at any time by contacting
            us via the{" "}
            <a href="/contact" className="text-primary hover:underline">
              Contact
            </a>{" "}
            page. We will process your request within 30 days.
          </p>
        </section>

        <section>
          <h2 className="font-headline text-xl font-bold text-on-surface mb-3">6. Contact</h2>
          <p>
            For privacy-related enquiries, please reach out through our{" "}
            <a href="/contact" className="text-primary hover:underline">
              Contact
            </a>{" "}
            page.
          </p>
        </section>
      </div>
    </div>
  );
}
