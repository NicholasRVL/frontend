import { useState } from "react";

const WHATSAPP_URL = "https://wa.me/628998777007";
const INSTAGRAM_URL = "https://www.instagram.com/coventown.plm?srtk=MTc2aWluZDA2Z2trNg==";

export default function ContactToggle() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="contact-toggle">
      {isOpen && (
        <div className="contact-toggle-options" aria-label="Pilihan kontak">
          <a
            className="contact-toggle-link contact-whatsapp"
            href={WHATSAPP_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M20 11.6a8 8 0 0 1-11.8 7L4 20l1.4-4.1A8 8 0 1 1 20 11.6Z" />
              <path d="M9 8.5c.3-.5.6-.5.9-.5h.5l.8 1.8-.8 1c.6 1.1 1.5 1.9 2.7 2.4l.9-.9 1.8.8v.5c0 .4-.1.7-.5 1-1 .6-2.7.2-4.5-1.1-1.7-1.3-2.8-3.1-2.6-4.2.1-.4.4-.7.8-.8Z" />
            </svg>
            <span>WhatsApp</span>
          </a>
          <a
            className="contact-toggle-link contact-instagram"
            href={INSTAGRAM_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <rect height="16" rx="4" width="16" x="4" y="4" />
              <circle cx="12" cy="12" r="3.5" />
              <circle className="instagram-dot" cx="17.5" cy="6.8" r="1" />
            </svg>
            <span>Instagram</span>
          </a>
        </div>
      )}
      <button
        aria-expanded={isOpen}
        className="contact-toggle-button"
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M4 5.5h16v11H11l-5 3v-3H4z" />
          <path d="M8 10h8M8 13h5" />
        </svg>
        <span>{isOpen ? "Tutup kontak" : "Hubungi kami"}</span>
      </button>
    </div>
  );
}
