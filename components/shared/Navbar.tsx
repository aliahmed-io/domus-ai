"use client";
import { useState } from "react";
import Link from "next/link";
import { Menu, X, } from "lucide-react";
export default function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="studio-nav">
      <Link href="/" className="studio-wordmark" aria-label="Domus home">

        domus<span>Space to create.</span>
      </Link>
      <button
        className="studio-menu-toggle"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="studio-navigation"
        onClick={() => setOpen(!open)}
      >
        {open ? <X /> : <Menu />}
      </button>
      <nav
        id="studio-navigation"
        className={open ? "studio-nav-links is-open" : "studio-nav-links"}
        aria-label="Main navigation"
      >
        <Link href="/editor" onClick={() => setOpen(false)}>
          The workshop
        </Link>
        <Link href="/showcase" onClick={() => setOpen(false)}>
          Inspiration
        </Link>
        <Link href="/about" onClick={() => setOpen(false)}>
          About Domus
        </Link>
        <Link
          href="/editor"
          className="studio-button"
          onClick={() => setOpen(false)}
        >
          Start creating
        </Link>
      </nav>
    </header>
  );
}
