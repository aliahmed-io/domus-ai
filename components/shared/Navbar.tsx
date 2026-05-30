'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavLink {
  readonly label: string;
  readonly href: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const NAV_LINKS: readonly NavLink[] = [
  { label: 'Features', href: '/features' },
  { label: 'Workflow', href: '/workflow' },
  { label: 'Community', href: '/community' },
  { label: 'Pricing', href: '/pricing' },
] as const;

const SCROLL_THRESHOLD = 20;

// ─── Domus Logo Mark ──────────────────────────────────────────────────────────

function DomusMark({ className }: { readonly className?: string }) {
  return (
    <Image 
      src="/logo.png" 
      alt="Domus" 
      width={32} 
      height={32} 
      className={cn("object-contain rounded", className)} 
    />
  );
}

// ─── Navbar Component ─────────────────────────────────────────────────────────

export default function Navbar() {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // ── Scroll detection ────────────────────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > SCROLL_THRESHOLD);
    };

    // Set initial state
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ── Close menu on route change ──────────────────────────────────────────────
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // ── Close menu on Escape ────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen]);

  // ── Lock body scroll when mobile menu is open ───────────────────────────────
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  // ── Animation variants ──────────────────────────────────────────────────────
  const menuVariants = {
    hidden: {
      opacity: 0,
      height: 0,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.25,
        ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
      },
    },
    visible: {
      opacity: 1,
      height: 'auto',
      transition: {
        duration: prefersReducedMotion ? 0 : 0.3,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      },
    },
    exit: {
      opacity: 0,
      height: 0,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.2,
        ease: [0.4, 0, 1, 1] as [number, number, number, number],
      },
    },
  };

  const menuItemVariants = {
    hidden: { opacity: 0, y: -8 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.2,
        delay: prefersReducedMotion ? 0 : i * 0.04,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      },
    }),
    exit: { opacity: 0, y: -4 },
  };

  return (
    <header
      role="banner"
      className={cn(
        'nav-frosted fixed top-0 left-0 right-0 z-50 transition-shadow duration-300',
        isScrolled && 'shadow-card',
      )}
      style={{ height: 'var(--nav-height)' }}
    >
      {/* ── Main nav bar ─────────────────────────────────────────────────── */}
      <nav
        aria-label="Main navigation"
        className="h-full mx-auto flex items-center justify-between px-6"
        style={{ maxWidth: 'var(--max-content-width)' }}
      >
        {/* LEFT: Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 flex-shrink-0 rounded-sm focus-visible:outline-indigo"
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

        {/* CENTER: Desktop nav links */}
        <ul
          className="hidden md:flex items-center gap-8 list-none m-0 p-0"
          role="list"
        >
          {NAV_LINKS.map(({ label, href }) => {
            const isActive =
              pathname === href || pathname.startsWith(`${href}/`);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'font-body font-medium text-stone transition-colors duration-200 rounded-sm py-1',
                    'hover:text-charcoal focus-visible:text-charcoal',
                    isActive && 'text-charcoal',
                  )}
                  style={{ fontSize: '15px' }}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* RIGHT: CTA buttons + hamburger */}
        <div className="flex items-center gap-3">
          {/* Desktop buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/sign-in"
              className="btn-secondary"
              style={{ padding: '10px 20px', fontSize: '14px' }}
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="btn-primary"
              style={{ padding: '10px 20px', fontSize: '14px' }}
            >
              Start Free
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={toggleMenu}
            className={cn(
              'md:hidden flex items-center justify-center w-10 h-10 rounded-md',
              'text-charcoal transition-colors duration-200',
              'hover:bg-indigo-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo focus-visible:ring-offset-2',
            )}
            aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
          >
            <AnimatePresence mode="wait" initial={false}>
              {isMenuOpen ? (
                <motion.span
                  key="close"
                  initial={{ rotate: -45, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 45, opacity: 0 }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
                >
                  <X size={24} strokeWidth={2} aria-hidden="true" />
                </motion.span>
              ) : (
                <motion.span
                  key="open"
                  initial={{ rotate: 45, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -45, opacity: 0 }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
                >
                  <Menu size={24} strokeWidth={2} aria-hidden="true" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </nav>

      {/* ── Mobile menu ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            id="mobile-menu"
            role="navigation"
            aria-label="Mobile navigation"
            key="mobile-menu"
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="md:hidden overflow-hidden bg-surface border-t border-hairline shadow-card"
          >
            <div className="px-6 py-6 flex flex-col gap-2">
              {/* Nav links */}
              <ul className="flex flex-col gap-1 list-none m-0 p-0 mb-4" role="list">
                {NAV_LINKS.map(({ label, href }, i) => {
                  const isActive =
                    pathname === href || pathname.startsWith(`${href}/`);
                  return (
                    <motion.li
                      key={href}
                      custom={i}
                      variants={menuItemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      <Link
                        href={href}
                        className={cn(
                          'flex items-center px-4 py-3 rounded-md font-body font-medium',
                          'text-stone transition-colors duration-200',
                          'hover:text-charcoal hover:bg-alabaster',
                          isActive && 'text-charcoal bg-indigo-light',
                        )}
                        style={{ fontSize: '15px' }}
                        aria-current={isActive ? 'page' : undefined}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {label}
                        {isActive && (
                          <span
                            className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo flex-shrink-0"
                            aria-hidden="true"
                          />
                        )}
                      </Link>
                    </motion.li>
                  );
                })}
              </ul>

              {/* CTA buttons */}
              <motion.div
                className="flex flex-col gap-3"
                custom={NAV_LINKS.length}
                variants={menuItemVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <Link
                  href="/sign-in"
                  className="btn-secondary w-full justify-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="btn-primary w-full justify-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Start Free
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
