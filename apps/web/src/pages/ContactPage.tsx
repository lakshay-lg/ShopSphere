import { useState } from "react";

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

      const data = (await response.json()) as {
        message?: string;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to send message");
      }

      setStatus(data.message ?? "Message sent successfully.");
      setName("");
      setEmail("");
      setMessage("");
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Request failed",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="content-page">
      <article className="page-intro card-surface">
        <p className="section-kicker">Contact</p>
        <h1>Reach the ShopSphere team.</h1>
        <p>
          For project collaboration, architecture reviews, or internship-related
          queries, use the channels below.
        </p>
      </article>

      <section className="contact-grid">
        <article className="card-surface contact-card">
          <h2>Email</h2>
          <p>lakshay.engineering@demo.dev</p>
        </article>
        <article className="card-surface contact-card">
          <h2>Response Window</h2>
          <p>Usually within 24 hours on weekdays.</p>
        </article>
        <article className="card-surface contact-card">
          <h2>Focus Areas</h2>
          <p>
            Distributed systems, backend reliability, and production AI tooling.
          </p>
        </article>
      </section>

      <article className="card-surface contact-form-card">
        <h2>Send a Message</h2>
        <form className="contact-form" onSubmit={handleSubmit}>
          <label>
            Name
            <input
              placeholder="Your name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Message
            <textarea
              rows={5}
              placeholder="Tell us what you are building..."
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              minLength={10}
              required
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          {status ? <p className="form-success">{status}</p> : null}
          <button
            className="button-primary"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Sending..." : "Send Message"}
          </button>
        </form>
      </article>
    </section>
  );
}

export default ContactPage;
