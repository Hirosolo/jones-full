import { useState, type FormEvent } from "react";
import SEO from "@Components/common/SEO";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<null | "idle" | "sending" | "sent" | "error">(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");

    try {
      // Attempt a client-side POST to a contact endpoint if available.
      // If no backend exists, fallback to opening the user's email client.
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE || "/api";
      const res = await fetch(`${baseUrl}/contact/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      }).catch(() => null);

      if (res && (res.ok || res.status === 201)) {
        setStatus("sent");
      } else {
        // fallback: open mail client
        const mailto = `mailto:hello@example.com?subject=${encodeURIComponent(
          "Contact from site: " + name
        )}&body=${encodeURIComponent(message + "\n\nFrom: " + email)}`;
        window.location.href = mailto;
        setStatus("sent");
      }
    } catch (err) {
      console.error("Contact submit failed", err);
      setStatus("error");
    }
  }

  return (
    <div className="page contact-page">
      <SEO
        title="Contact Us"
        description="Contact Jones for customer support, product questions, and order help."
      />
      <main className="page__container contact-page__container">
        <section className="contact-page__hero">
          <p className="contact-page__eyebrow">Get in touch</p>
          <h1 className="contact-page__title">Contact Us</h1>
          <p className="contact-page__lead">
            Questions, suggestions, or support requests all belong here. Send us a
            note and we will get back to you as soon as possible.
          </p>
        </section>

        <div className="contact-page__layout">
          <section className="contact-page__panel contact-page__details" aria-label="Contact details">
            <h2>Reach us directly</h2>
            <p>
              Email: <a href="mailto:hello@example.com">hello@example.com</a>
            </p>
            <p>
              We keep things simple and reply with clear next steps, whether you are
              asking about an order, a product, or the site itself.
            </p>
            <ul className="contact-page__list">
              <li>Fast support for order and product questions</li>
              <li>Help with account or checkout issues</li>
              <li>General feedback and partnership inquiries</li>
            </ul>
          </section>

          <section className="contact-page__panel contact-page__form-panel">
            <h2>Send a message</h2>
            <form onSubmit={handleSubmit} className="contact-page__form">
              <label className="contact-page__field">
                <span>Name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </label>

              <label className="contact-page__field">
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>

              <label className="contact-page__field contact-page__field--full">
                <span>Message</span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </label>

              <div className="contact-page__actions">
                <button className="button" type="submit" disabled={status === "sending"}>
                  {status === "sending" ? "Sending..." : "Send Message"}
                </button>
                {status === "sent" && (
                  <span className="contact-page__feedback contact-page__feedback--success">
                    Thanks, we will be in touch.
                  </span>
                )}
                {status === "error" && (
                  <span className="contact-page__feedback contact-page__feedback--error">
                    Failed to send.
                  </span>
                )}
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
