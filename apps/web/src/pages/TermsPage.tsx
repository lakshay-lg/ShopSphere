export default function TermsPage() {
  const sections = [
    {
      n: "§1",
      heading: "Acceptance of Terms",
      body: "By accessing or using ShopSphere, you agree to be bound by these Terms of Service. If you do not agree, please discontinue use immediately.",
    },
    {
      n: "§2",
      heading: "Flash Sale Orders",
      body: "All flash-sale orders are processed on a first-come, first-served basis via a queue system. Order confirmation depends on stock availability at the time of processing. A QUEUED status does not guarantee fulfilment; only a CONFIRMED status does. Failed orders incur no charge.",
    },
    {
      n: "§3",
      heading: "Account Responsibility",
      body: "You are responsible for maintaining the confidentiality of your account credentials. Notify us immediately of any unauthorised access. ShopSphere is not liable for losses resulting from unauthorised use of your account.",
    },
    {
      n: "§4",
      heading: "Acceptable Use",
      body: "You agree not to use ShopSphere for any unlawful purpose, to attempt to circumvent the queue or rate-limit mechanisms, to submit automated or scripted orders without prior written consent, or to interfere with the platform's availability.",
    },
    {
      n: "§5",
      heading: "Limitation of Liability",
      body: "ShopSphere is provided as-is. To the fullest extent permitted by law, we disclaim all warranties and shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform.",
    },
    {
      n: "§6",
      heading: "Changes to Terms",
      body: "We reserve the right to update these Terms at any time. Continued use of the platform after changes constitutes acceptance. The date at the top of this page reflects the most recent revision.",
    },
    {
      n: "§7",
      heading: "Contact",
      body: null,
      custom: (
        <p style={{ fontSize: 14, color: "var(--c-muted)", lineHeight: 1.7 }}>
          Questions about these Terms may be directed to us via the{" "}
          <a href="/contact" style={{ color: "var(--c-primary)", textDecoration: "underline" }}>Contact</a>{" "}
          page.
        </p>
      ),
    },
  ];

  return (
    <div className="page-container" style={{ maxWidth: 760, margin: "0 auto", paddingTop: 48, paddingBottom: 80 }}>
      <header style={{ marginBottom: 40 }}>
        <p className="eyebrow" style={{ marginBottom: 8 }}>Legal</p>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(40px, 5vw, 56px)", fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 8 }}>
          Terms of Service
        </h1>
        <p style={{ fontSize: 13, color: "var(--c-muted)" }}>Last updated: March 2026</p>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {sections.map((s) => (
          <div key={s.n} className="ss-card" style={{ padding: "28px 32px" }}>
            <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
              <span style={{
                fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22,
                color: "var(--c-accent)", minWidth: 40, paddingTop: 2, lineHeight: 1,
              }}>
                {s.n}
              </span>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em", marginBottom: 10 }}>
                  {s.heading}
                </h2>
                {s.body && <p style={{ fontSize: 14, color: "var(--c-muted)", lineHeight: 1.7 }}>{s.body}</p>}
                {s.custom}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
