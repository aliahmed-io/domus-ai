import Link from 'next/link';
import { MessageSquare } from 'lucide-react';

// Custom inline SVGs for social brands to prevent Lucide-react version compilation mismatches
function TwitterIcon({ size }: { size: number; strokeWidth?: number; 'aria-hidden'?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
    </svg>
  );
}

function LinkedinIcon({ size }: { size: number; strokeWidth?: number; 'aria-hidden'?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function GithubIcon({ size }: { size: number; strokeWidth?: number; 'aria-hidden'?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface FooterLink {
  readonly label: string;
  readonly href: string;
}

interface FooterColumn {
  readonly heading: string;
  readonly links: readonly FooterLink[];
}

interface SocialLink {
  readonly label: string;
  readonly href: string;
  readonly Icon: React.ComponentType<{ size: number; strokeWidth: number; 'aria-hidden': boolean }>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FOOTER_COLUMNS: readonly FooterColumn[] = [
  {
    heading: 'Product',
    links: [
      { label: 'Features', href: '/features' },
      { label: 'How It Works', href: '/workflow' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Changelog', href: '/changelog' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Blog', href: '/blog' },
      { label: 'Contact', href: '/contact' },
      { label: 'Careers', href: '/careers' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/legal/privacy' },
      { label: 'Terms of Service', href: '/legal/terms' },
      { label: 'Cookie Policy', href: '/legal/cookies' },
      { label: 'GDPR Rights', href: '/legal/gdpr' },
    ],
  },
] as const;

const SOCIAL_LINKS: readonly SocialLink[] = [
  {
    label: 'Domus on X (Twitter)',
    href: 'https://twitter.com/domus_ai',
    Icon: TwitterIcon,
  },
  {
    label: 'Domus on LinkedIn',
    href: 'https://linkedin.com/company/domus-ai',
    Icon: LinkedinIcon,
  },
  {
    label: 'Domus on GitHub',
    href: 'https://github.com/domus-ai',
    Icon: GithubIcon,
  },
  {
    label: 'Domus Discord community',
    href: 'https://discord.gg/domus',
    Icon: MessageSquare,
  },
] as const;

// ─── Domus Logo Mark (matches Navbar) ────────────────────────────────────

function DomusMark({ className }: { readonly className?: string }) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      {/* Left pillar of D */}
      <rect x="7" y="6" width="3.2" height="20" rx="1.6" fill="#8C7662" />
      
      {/* Dome Arch of D */}
      <path d="M8.6 6 C19.8 6, 24.6 12, 24.6 16 C24.6 20, 19.8 26, 8.6 26" stroke="#8C7662" strokeWidth="2.5" strokeLinecap="round" />
      
      {/* Minimal House Profile inside */}
      <path d="M12 13 L16.5 10 L21 13 Z" stroke="#C2A585" strokeWidth="1.8" strokeLinejoin="round" fill="none" />
      <rect x="14" y="13" width="5" height="6.4" stroke="#8C7662" strokeWidth="1.2" rx="0.4" fill="none" />
      <circle cx="16.5" cy="16.2" r="1.2" fill="#C2A585" />
    </svg>
  );
}

// ─── Newsletter Form ──────────────────────────────────────────────────────────
// Isolated as a sub-component to keep Footer as a server component.
// The form itself uses a server action pattern (no 'use client' needed).

function NewsletterForm() {
  return (
    <form
      action="/api/newsletter/subscribe"
      method="POST"
      className="flex flex-col gap-3"
      aria-label="Newsletter subscription"
    >
      <label
        htmlFor="footer-email"
        className="sr-only"
      >
        Email address
      </label>
      <input
        id="footer-email"
        type="email"
        name="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
        className={[
          'w-full px-4 py-3 rounded-md',
          'bg-white border border-hairline',
          'font-body text-charcoal placeholder:text-muted',
          'text-sm leading-none',
          'transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-indigo focus:border-transparent',
        ].join(' ')}
        style={{ fontSize: '14px' }}
      />
      <button
        type="submit"
        className="btn-primary w-full justify-center"
        style={{ padding: '12px 20px', fontSize: '14px' }}
      >
        Subscribe
      </button>
      <p className="text-muted text-center" style={{ fontSize: '12px' }}>
        — No spam. Unsubscribe anytime.
      </p>
    </form>
  );
}

// ─── Footer Component (Server Component) ─────────────────────────────────────

export default function Footer() {
  const currentYear = 2026;

  return (
    <footer
      className="bg-alabaster border-t border-hairline"
      role="contentinfo"
      aria-label="Site footer"
    >
      {/* ── Main footer content ──────────────────────────────────────────── */}
      <div
        className="mx-auto px-6 py-16"
        style={{ maxWidth: '1280px' }}
      >
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto_1fr]">

          {/* LEFT: Brand + tagline + social */}
          <div className="flex flex-col gap-6 lg:col-span-1 lg:pr-8">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2.5 w-fit rounded-sm"
              aria-label="Domus — go to homepage"
            >
              <DomusMark />
              <span
                className="font-headline font-bold text-charcoal tracking-tight leading-none"
                style={{ fontSize: '20px' }}
              >
                Domus
              </span>
            </Link>

            {/* Tagline */}
            <p
              className="font-body text-stone leading-relaxed max-w-xs"
              style={{ fontSize: '14px' }}
            >
              Designing the future of space,{' '}
              <span className="text-charcoal font-medium">one room at a time.</span>
            </p>

            {/* Social links */}
            <nav aria-label="Social media links">
              <ul className="flex items-center gap-3 list-none m-0 p-0" role="list">
                {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                  <li key={href}>
                    <a
                      href={href}
                      aria-label={label}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={[
                        'flex items-center justify-center w-9 h-9 rounded-md',
                        'text-stone transition-colors duration-200',
                        'hover:text-charcoal hover:bg-white',
                        'border border-transparent hover:border-hairline',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo',
                      ].join(' ')}
                    >
                      <Icon size={16} strokeWidth={2} aria-hidden={true} />
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* CENTER: 3 nav columns */}
          {FOOTER_COLUMNS.map((column) => (
            <nav
              key={column.heading}
              aria-label={`${column.heading} links`}
              className="flex flex-col gap-4"
            >
              <h3
                className="font-headline font-semibold text-charcoal tracking-tight"
                style={{ fontSize: '14px' }}
              >
                {column.heading}
              </h3>
              <ul className="flex flex-col gap-3 list-none m-0 p-0" role="list">
                {column.links.map(({ label, href }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className={[
                        'font-body text-stone',
                        'transition-colors duration-200',
                        'hover:text-charcoal',
                        'focus-visible:outline-none focus-visible:text-indigo',
                        'rounded-sm',
                      ].join(' ')}
                      style={{ fontSize: '14px' }}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          {/* RIGHT: Newsletter */}
          <div className="flex flex-col gap-5 lg:col-span-1 lg:pl-8">
            <div className="flex flex-col gap-2">
              <h3
                className="font-headline font-bold text-charcoal tracking-tight"
                style={{ fontSize: '18px' }}
              >
                Stay in the loop
              </h3>
              <p className="text-stone" style={{ fontSize: '13px' }}>
                Spatial intelligence updates, monthly.
              </p>
            </div>
            <NewsletterForm />
          </div>
        </div>
      </div>

      {/* ── Bottom bar ───────────────────────────────────────────────────── */}
      <div className="border-t border-hairline">
        <div
          className="mx-auto px-6 py-5 flex flex-col items-center gap-2 sm:flex-row sm:justify-between"
          style={{ maxWidth: '1280px' }}
        >
          <p
            className="font-body text-muted text-center sm:text-left"
            style={{ fontSize: '13px' }}
          >
            &copy; {currentYear} Domus. All rights reserved.
          </p>
          <p
            className="font-body text-muted text-center sm:text-right"
            style={{ fontSize: '13px' }}
          >
            Created with{' '}
            <span
              aria-label="spatial precision"
              className="text-stone font-medium"
            >
              spatial precision
            </span>{' '}
            by{' '}
            <span className="text-charcoal font-medium">Ali Ahmed</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
