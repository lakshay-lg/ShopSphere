export default function TermsPage() {
  return (
    <div className="page-container max-w-3xl mx-auto">
      <header className="mb-10">
        <p className="eyebrow">Legal</p>
        <h1 className="font-headline text-5xl font-bold tracking-tight text-on-surface">
          Terms of Service
        </h1>
        <p className="text-on-surface-variant mt-2 text-sm">Last updated: March 2026</p>
      </header>

      <div className="glass-card rounded-lg p-8 md:p-12 border border-white/20 space-y-8 font-body text-on-surface-variant leading-relaxed">

        <section>
          <h2 className="font-headline text-xl font-bold text-on-surface mb-3">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing or using ShopSphere, you agree to be bound by these Terms of Service. If
            you do not agree, please discontinue use immediately.
          </p>
        </section>

        <section>
          <h2 className="font-headline text-xl font-bold text-on-surface mb-3">
            2. Flash Sale Orders
          </h2>
          <p>
            All flash-sale orders are processed on a first-come, first-served basis via a queue
            system. Order confirmation depends on stock availability at the time of processing.
            A QUEUED status does not guarantee fulfilment; only a CONFIRMED status does. Failed
            orders incur no charge.
          </p>
        </section>

        <section>
          <h2 className="font-headline text-xl font-bold text-on-surface mb-3">
            3. Account Responsibility
          </h2>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials.
            Notify us immediately of any unauthorised access. ShopSphere is not liable for losses
            resulting from unauthorised use of your account.
          </p>
        </section>

        <section>
          <h2 className="font-headline text-xl font-bold text-on-surface mb-3">
            4. Acceptable Use
          </h2>
          <p>
            You agree not to use ShopSphere for any unlawful purpose, to attempt to circumvent
            the queue or rate-limit mechanisms, to submit automated or scripted orders without
            prior written consent, or to interfere with the platform's availability.
          </p>
        </section>

        <section>
          <h2 className="font-headline text-xl font-bold text-on-surface mb-3">
            5. Limitation of Liability
          </h2>
          <p>
            ShopSphere is provided as-is. To the fullest extent permitted by law, we disclaim all
            warranties and shall not be liable for any indirect, incidental, or consequential
            damages arising from your use of the platform.
          </p>
        </section>

        <section>
          <h2 className="font-headline text-xl font-bold text-on-surface mb-3">
            6. Changes to Terms
          </h2>
          <p>
            We reserve the right to update these Terms at any time. Continued use of the platform
            after changes constitutes acceptance. The date at the top of this page reflects the
            most recent revision.
          </p>
        </section>

        <section>
          <h2 className="font-headline text-xl font-bold text-on-surface mb-3">7. Contact</h2>
          <p>
            Questions about these Terms may be directed to us via the{" "}
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
