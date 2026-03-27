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
    <div className="min-h-screen flex items-center justify-center pt-8 pb-12 px-6 relative overflow-hidden">
      {/* Background radial accents */}
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-primary-fixed/20 blur-[120px] rounded-full -z-10 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-secondary-container/30 blur-[100px] rounded-full -z-10 pointer-events-none"></div>

      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-12 items-center mt-16">
        {/* Left: editorial content */}
        <div className="space-y-8">
          <div className="space-y-4">
            <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-secondary-container/50 text-on-secondary-container text-xs font-bold tracking-widest uppercase">
              Get in Touch
            </span>
            <h1 className="font-headline text-5xl md:text-6xl font-bold text-on-surface tracking-tighter leading-[0.9]">
              Elevate your <span className="text-primary italic">commerce</span> experience.
            </h1>
            <p className="text-lg text-on-surface-variant max-w-md leading-relaxed">
              Our curation team is ready to assist you with bespoke solutions for your digital storefront.
              Reach out for exclusive partnership opportunities.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {[
              { icon: "mail", label: "Direct Inquiry", value: "concierge@shopsphere.io" },
              { icon: "location_on", label: "Focus Areas", value: "Distributed systems, backend reliability, and production AI tooling." },
              { icon: "schedule", label: "Response Window", value: "Usually within 24 hours on weekdays." },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center border border-outline-variant/20 group-hover:bg-primary transition-colors duration-300">
                  <span className="material-symbols-outlined text-primary group-hover:text-white">{item.icon}</span>
                </div>
                <div>
                  <p className="font-headline font-bold text-sm">{item.label}</p>
                  <p className="text-on-surface-variant text-sm">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: contact form */}
        <div className="glass-card p-10 md:p-12 rounded-xl shadow-glass">
          <form className="space-y-7" onSubmit={handleSubmit}>
            <div className="space-y-5">
              {[
                { label: "Full Name", type: "text", value: name, onChange: setName, placeholder: "Your name" },
                { label: "Email Address", type: "email", value: email, onChange: setEmail, placeholder: "your@email.com" },
              ].map((field) => (
                <div key={field.label} className="relative">
                  <label className="absolute -top-2.5 left-4 px-2 bg-white/90 text-primary text-[10px] font-bold uppercase tracking-widest z-10 rounded">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    className="input-field"
                    placeholder={field.placeholder}
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    required
                  />
                </div>
              ))}
              <div className="relative">
                <label className="absolute -top-2.5 left-4 px-2 bg-white/90 text-primary text-[10px] font-bold uppercase tracking-widest z-10 rounded">
                  Your Message
                </label>
                <textarea
                  className="input-field resize-none"
                  placeholder="Tell us what you are building..."
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  minLength={10}
                  required
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-error font-medium bg-error/5 rounded-lg px-4 py-3">{error}</p>
            )}
            {status && (
              <p className="text-sm text-green-700 font-medium bg-green-50 rounded-lg px-4 py-3">{status}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-4 flex items-center justify-center gap-3 group disabled:opacity-60"
            >
              {isSubmitting ? "Sending…" : "Send Message"}
              {!isSubmitting && (
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              )}
            </button>
            <p className="text-center text-[10px] text-on-surface-variant/60 font-medium uppercase tracking-tight">
              Estimated response time: 2–4 Business Hours
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ContactPage;
