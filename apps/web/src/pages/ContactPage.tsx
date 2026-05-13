import { useState } from "react";
import Icon from "../components/Icon.js";

const API = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const data = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Failed to send message");
      setStatus(data.message ?? "Message sent successfully.");
      setName("");
      setEmail("");
      setMessage("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Request failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page-container">
      {/* Page header */}
      <header style={{ marginBottom: 48 }}>
        <p className="eyebrow" style={{ marginBottom: 8 }}>Get in Touch</p>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(40px, 5vw, 64px)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 16 }}>
          Let's talk.
        </h1>
        <p style={{ fontSize: 16, color: "var(--c-muted)", maxWidth: 560, lineHeight: 1.6 }}>
          Questions about a drop, a technical issue, or just want to say hello — we read every message.
        </p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 24, alignItems: "start" }}>
        {/* Left: contact info cards + FAQ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            { icon: "heart", label: "Support", value: "concierge@shopsphere.io", detail: "For orders, returns, and anything shipping-related." },
            { icon: "star", label: "Press & Partnerships", value: "press@shopsphere.io", detail: "Editorial requests, brand collabs, and APIs." },
            { icon: "pin", label: "Based in", value: "Bengaluru, India", detail: "With distributed teams in Delhi and Pune." },
            { icon: "clock", label: "Response time", value: "Within 24 hours", detail: "Monday–Friday. Slower on drop weekends." },
          ].map((item) => (
            <div key={item.label} className="ss-card" style={{ padding: "20px 24px", display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, background: "var(--c-surface-2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--c-primary)", flexShrink: 0,
              }}>
                <Icon name={item.icon} size={18} stroke={1.8}/>
              </div>
              <div>
                <p className="eyebrow" style={{ marginBottom: 3 }}>{item.label}</p>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{item.value}</p>
                <p style={{ fontSize: 12, color: "var(--c-muted)", lineHeight: 1.5 }}>{item.detail}</p>
              </div>
            </div>
          ))}

          {/* FAQ strip */}
          <div className="ss-card" style={{ padding: "24px", background: "var(--c-ink)", color: "var(--c-surface)" }}>
            <p className="eyebrow" style={{ color: "rgba(244,246,248,0.5)", marginBottom: 12 }}>Quick FAQ</p>
            {[
              { q: "Can I change my order after queuing?", a: "No. Queue jobs are immutable once dispatched." },
              { q: "How do refunds work?", a: "Failed orders are never charged. Confirmed refunds within 7 days." },
            ].map((faq) => (
              <div key={faq.q} style={{ marginBottom: 16 }}>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: "#fff", marginBottom: 4 }}>{faq.q}</p>
                <p style={{ fontSize: 12, color: "rgba(244,246,248,0.6)", lineHeight: 1.5 }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: form */}
        <div className="ss-card" style={{ padding: "36px 40px" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 28 }}>
            Send a message
          </h2>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <label style={{ display: "block", fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "var(--c-muted)", marginBottom: 6 }}>
                Full Name
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ display: "block", fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "var(--c-muted)", marginBottom: 6 }}>
                Email Address
              </label>
              <input
                type="email"
                className="input-field"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ display: "block", fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "var(--c-muted)", marginBottom: 6 }}>
                Message
              </label>
              <textarea
                className="input-field"
                placeholder="Tell us what's on your mind…"
                rows={5}
                style={{ resize: "none" }}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                minLength={10}
                required
              />
            </div>

            {error && (
              <div style={{ background: "var(--c-danger-soft)", border: "1px solid var(--c-danger)", borderRadius: 10, padding: "10px 14px" }}>
                <p style={{ fontSize: 13, color: "var(--c-danger)", fontWeight: 600 }}>{error}</p>
              </div>
            )}
            {status && (
              <div style={{ background: "var(--c-success-soft)", border: "1px solid var(--c-success)", borderRadius: 10, padding: "10px 14px" }}>
                <p style={{ fontSize: 13, color: "var(--c-success)", fontWeight: 600 }}>{status}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
              style={{ width: "100%", padding: "14px 0", opacity: isSubmitting ? 0.6 : 1 }}
            >
              {isSubmitting ? "Sending…" : "Send Message"}
              {!isSubmitting && <Icon name="arrow" size={15}/>}
            </button>
            <p style={{ fontSize: 11, color: "var(--c-muted)", textAlign: "center" as const }}>
              Estimated response: 2–4 business hours
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ContactPage;
