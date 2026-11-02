"use client";
import { useState } from "react";
import { Download } from "lucide-react";
export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [downloaded, setDownloaded] = useState(false);
  function saveDraft(event: React.FormEvent) {
    event.preventDefault();
    const url = URL.createObjectURL(
      new Blob([`Name: ${name}\nEmail: ${email}\n\n${message}`], {
        type: "text/plain;charset=utf-8",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "domus-message-draft.txt";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setDownloaded(true);
  }
  return (
    <form onSubmit={saveDraft} className="local-settings contact-draft">
      <h2>Prepare a message</h2>
      <p>
        Message delivery is not connected yet. Save a draft to keep your
        question and contact details.
      </p>
      <label htmlFor="contact-name">Your name</label>
      <input
        id="contact-name"
        autoComplete="name"
        maxLength={100}
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <label htmlFor="contact-email">Email address</label>
      <input
        id="contact-email"
        type="email"
        autoComplete="email"
        maxLength={254}
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <label htmlFor="contact-message">Your message</label>
      <textarea
        id="contact-message"
        rows={5}
        maxLength={10000}
        required
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button type="submit" className="studio-button">
        <Download size={17} />
        Save message draft
      </button>
      {downloaded && (
        <p role="status">Draft downloaded. Nothing has been sent.</p>
      )}
    </form>
  );
}
