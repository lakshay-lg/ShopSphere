export default function PrivacyPage() {
  const sections = [
    {
      n: "§1",
      heading: "Information We Collect",
      body: "When you register, we collect your email address and a hashed version of your password. When you place an order, we store the items, quantities, and price snapshots at time of purchase. Contact form submissions are retained to respond to your enquiries.",
    },
    {
      n: "§2",
      heading: "How We Use Your Data",
      body: "Your data is used solely to operate the ShopSphere platform: authenticating your account, processing flash-sale orders, and responding to support requests. We do not sell, rent, or share your personal information with third parties for marketing purposes.",
    },
    {
      n: "§3",
      heading: "Data Storage & Security",
      body: "Passwords are hashed using bcrypt with a cost factor of 12 and are never stored in plain text. Data is stored in a PostgreSQL database. We take reasonable technical measures to protect your information, but no system is completely immune to breaches.",
    },
    {
      n: "§4",
      heading: "Cookies & Local Storage",
      body: null,
      custom: (
        <p style={{ fontSize: 14, color: "var(--c-muted)", lineHeight: 1.7 }}>
          ShopSphere uses{" "}
          <code style={{ fontFamily: "var(--font-mono)", fontSize: 12, background: "var(--c-surface-2)", padding: "2px 6px", borderRadius: 4 }}>
            localStorage
          </code>{" "}
          to persist your session token and order relay history. No third-party tracking cookies are used.
        </p>
      ),
    },
    {
      n: "§5",
      heading: "Your Rights",
      body: null,
      custom: (
        <p style={{ fontSize: 14, color: "var(--c-muted)", lineHeight: 1.7 }}>
          You may request deletion of your account and associated data at any time by contacting us via the{" "}
          <a href="/contact" style={{ color: "var(--c-primary)", textDecoration: "underline" }}>Contact</a>{" "}
          page. We will process your request within 30 days.
        </p>
      ),
    },
    {
      n: "§6",
      heading: "Contact",
      body: null,
      custom: (
        <p style={{ fontSize: 14, color: "var(--c-muted)", lineHeight: 1.7 }}>
          For privacy-related enquiries, please reach out through our{" "}
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
          Privacy Policy
        </h1>
        <p style={{ fontSize: 13, color: "var(--c-muted)" }}>Last updated: March 2026</p>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {sections.map((s) => (
          <div key={s.n} className="ss-card" style={{ padding: "28px 32px" }}>
            <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
              <span style={{
                fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22,
                color: "var(--c-primary)", minWidth: 40, paddingTop: 2, lineHeight: 1,
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
