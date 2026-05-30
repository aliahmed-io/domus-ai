'use client';

import { useState, useId } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Pen,
  Globe,
  Grid,
  Layers,
  Scan,
  Palette,
  Armchair,
  Settings,
  CreditCard,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Logo from '@/components/shared/Logo';

/* ─── Types ──────────────────────────────────────────────────────────────────── */

interface SidebarUser {
  name: string;
  username: string;
  avatarUrl?: string;
}

export interface SidebarProps {
  user?: SidebarUser;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.FC<{ size?: number; strokeWidth?: number; className?: string }>;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

/* ─── Nav config ─────────────────────────────────────────────────────────────── */

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'WORKSPACE',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Editor', href: '/editor', icon: Pen },
      { label: 'Community', href: '/community', icon: Globe },
    ],
  },
  {
    title: 'TOOLS',
    items: [
      { label: 'Floor Plan', href: '/floor-plan', icon: Grid },
      { label: 'BIM Lift', href: '/bim-lift', icon: Layers },
      { label: 'AR Map', href: '/ar-map', icon: Scan },
      { label: 'Material Lab', href: '/material-lab', icon: Palette },
      { label: 'Furniture', href: '/furniture', icon: Armchair },
    ],
  },
  {
    title: 'ACCOUNT',
    items: [
      { label: 'Settings', href: '/settings', icon: Settings },
      { label: 'Billing', href: '/billing', icon: CreditCard },
      { label: 'Help', href: '/help', icon: HelpCircle },
    ],
  },
];

/* ─── Motion variants ─────────────────────────────────────────────────────────── */

const EASE = [0.4, 0, 0.2, 1] as const;

const labelVariants = {
  visible: {
    opacity: 1,
    width: 'auto',
    transition: { duration: 0.18, ease: EASE },
  },
  hidden: {
    opacity: 0,
    width: 0,
    transition: { duration: 0.14, ease: EASE },
  },
} as const;

const sectionLabelVariants = {
  visible: {
    opacity: 1,
    height: 'auto',
    marginBottom: '8px',
    transition: { duration: 0.18, ease: EASE },
  },
  hidden: {
    opacity: 0,
    height: 0,
    marginBottom: 0,
    transition: { duration: 0.14, ease: EASE },
  },
} as const;

/* ─── Sub-components ─────────────────────────────────────────────────────────── */

function UserAvatar({
  user,
  size = 32,
}: {
  user: SidebarUser;
  size?: number;
}) {
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (user.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.avatarUrl}
        alt={user.name}
        width={size}
        height={size}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className="flex items-center justify-center rounded-full bg-indigo text-white font-inter font-semibold flex-shrink-0 select-none"
      style={{ width: size, height: size, fontSize: size * 0.375 }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

interface NavItemButtonProps {
  item: NavItem;
  isCollapsed: boolean;
  isActive: boolean;
}

function NavItemButton({ item, isCollapsed, isActive }: NavItemButtonProps) {
  const Icon = item.icon;
  const tooltipId = useId();

  return (
    <Link
      href={item.href}
      aria-label={isCollapsed ? item.label : undefined}
      aria-describedby={isCollapsed ? tooltipId : undefined}
      className={cn(
        'group relative flex items-center gap-3 rounded-md transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo',
        'h-12 px-3',
        isActive
          ? 'bg-indigo-light text-indigo'
          : 'text-stone hover:bg-gray-50 hover:text-charcoal',
        isCollapsed && 'justify-center px-0',
      )}
    >
      {/* Active left-border indicator */}
      {isActive && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-indigo rounded-r-full"
          aria-hidden="true"
        />
      )}

      {/* Icon */}
      <Icon
        size={20}
        strokeWidth={isActive ? 2 : 1.75}
        className="flex-shrink-0"
      />

      {/* Label — animated fade+width */}
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto', transition: { duration: 0.18, ease: EASE } }}
            exit={{ opacity: 0, width: 0, transition: { duration: 0.14, ease: EASE } }}
            className="overflow-hidden whitespace-nowrap font-inter font-medium text-[14px] leading-none"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Tooltip — only shown when collapsed */}
      {isCollapsed && (
        <span
          id={tooltipId}
          role="tooltip"
          className={cn(
            'pointer-events-none absolute left-full ml-3 z-50',
            'flex items-center h-8 px-3 rounded-md',
            'bg-charcoal text-white font-inter font-medium text-[12px] whitespace-nowrap',
            'opacity-0 -translate-x-1 scale-95',
            'group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100',
            'transition-all duration-150 ease-out',
            'shadow-card',
          )}
        >
          {item.label}
          {/* Tooltip arrow */}
          <span
            className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0"
            style={{
              borderTop: '5px solid transparent',
              borderBottom: '5px solid transparent',
              borderRight: '5px solid #2a2a2a',
            }}
            aria-hidden="true"
          />
        </span>
      )}
    </Link>
  );
}

/* ─── Main Sidebar component ─────────────────────────────────────────────────── */

export default function Sidebar({ user }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const toggleCollapsed = () => setIsCollapsed((prev) => !prev);

  return (
    <motion.aside
      layout
      initial={false}
      animate={{ width: isCollapsed ? 64 : 240 }}
      transition={{
        duration: 0.25,
        ease: [0.4, 0, 0.2, 1],
      }}
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col',
        'bg-surface border-r border-hairline overflow-hidden',
      )}
      style={{ boxShadow: '2px 0 16px rgba(0,0,0,0.04)' }}
      aria-label="Main navigation"
    >
      {/* ── 1. LOGO AREA ──────────────────────────────────────────────────────── */}
      <div
        className={cn(
          'flex h-16 flex-shrink-0 items-center border-b border-hairline',
          isCollapsed ? 'justify-center px-0' : 'px-5',
        )}
      >
        {isCollapsed ? (
          /* Collapsed: only O icon centered */
          <div aria-label="Domus">
            <svg
              width={32}
              height={32}
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <circle cx="20" cy="20" r="17" stroke="#5b6af0" strokeWidth="3" fill="none" />
              <circle
                cx="20"
                cy="20"
                r="11"
                stroke="#5b6af0"
                strokeWidth="1.5"
                strokeDasharray="3 3"
                fill="none"
                opacity="0.45"
              />
              <path d="M20 11 L26 14.5 L20 18 L14 14.5 Z" fill="#5b6af0" opacity="0.9" />
              <path d="M14 14.5 L20 18 L20 25 L14 21.5 Z" fill="#3d4fd6" opacity="0.85" />
              <path d="M20 18 L26 14.5 L26 21.5 L20 25 Z" fill="#8b96f5" opacity="0.7" />
            </svg>
          </div>
        ) : (
          /* Expanded: full logo with wordmark */
          <AnimatePresence initial={false}>
            <motion.div
              key="logo-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.1, duration: 0.18, ease: EASE } }}
              exit={{ opacity: 0, transition: { duration: 0.1, ease: EASE } }}
            >
              <Logo size="md" showWordmark />
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* ── 2. USER AREA ──────────────────────────────────────────────────────── */}
      {user != null && (
        <div
          className={cn(
            'flex flex-shrink-0 items-center border-b border-hairline py-4',
            isCollapsed ? 'justify-center px-0' : 'gap-3 px-4',
          )}
        >
          <UserAvatar user={user} size={32} />

          <AnimatePresence initial={false}>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto', transition: { duration: 0.18, ease: EASE } }}
                exit={{ opacity: 0, width: 0, transition: { duration: 0.14, ease: EASE } }}
                className="min-w-0 overflow-hidden"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="truncate font-inter font-semibold text-[14px] text-charcoal leading-tight"
                    title={user.name}
                  >
                    {user.name}
                  </span>
                  {/* Pro Plan pill */}
                  <span
                    className="inline-flex items-center flex-shrink-0 rounded-full bg-indigo-light px-2 py-0.5 font-inter font-semibold text-indigo leading-none"
                    style={{ fontSize: 10 }}
                  >
                    Pro Plan
                  </span>
                </div>
                <span className="block truncate font-inter text-[12px] text-stone leading-tight mt-0.5">
                  @{user.username}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── 3. NAVIGATION ─────────────────────────────────────────────────────── */}
      <nav
        className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3"
        aria-label="Sidebar navigation"
      >
        {NAV_SECTIONS.map((section, sectionIndex) => {
          const isLastSection = sectionIndex === NAV_SECTIONS.length - 1;

          return (
            <div
              key={section.title}
              className={cn(!isLastSection && 'mb-4')}
            >
              {/* Section label — hidden when collapsed */}
              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.p
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 8, transition: { duration: 0.18, ease: EASE } }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0, transition: { duration: 0.14, ease: EASE } }}
                    className="text-label-caps text-stone px-3 overflow-hidden whitespace-nowrap"
                  >
                    {section.title}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Section divider in collapsed state */}
              {isCollapsed && sectionIndex > 0 && (
                <div className="mb-3 border-t border-hairline mx-1" />
              )}

              {/* Nav items */}
              <ul role="list" className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/' && pathname.startsWith(item.href));

                  return (
                    <li key={item.href}>
                      <NavItemButton
                        item={item}
                        isCollapsed={isCollapsed}
                        isActive={isActive}
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* ── 4. NEW PROJECT BUTTON ─────────────────────────────────────────────── */}
      <div
        className={cn(
          'flex-shrink-0 pb-2',
          isCollapsed ? 'flex justify-center' : 'mx-3',
        )}
      >
        {isCollapsed ? (
          /* Collapsed: square icon button */
          <button
            type="button"
            aria-label="New Project"
            className={cn(
              'group relative flex h-10 w-10 items-center justify-center rounded-md',
              'bg-indigo text-white transition-colors duration-150',
              'hover:bg-indigo-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo focus-visible:ring-offset-2',
            )}
          >
            <Plus size={18} strokeWidth={2} />
            {/* Tooltip */}
            <span
              role="tooltip"
              className={cn(
                'pointer-events-none absolute left-full ml-3 z-50',
                'flex items-center h-8 px-3 rounded-md',
                'bg-charcoal text-white font-inter font-medium text-[12px] whitespace-nowrap',
                'opacity-0 -translate-x-1 scale-95',
                'group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100',
                'transition-all duration-150 ease-out shadow-card',
              )}
            >
              New Project
              <span
                className="absolute right-full top-1/2 -translate-y-1/2"
                style={{
                  borderTop: '5px solid transparent',
                  borderBottom: '5px solid transparent',
                  borderRight: '5px solid #2a2a2a',
                }}
                aria-hidden="true"
              />
            </span>
          </button>
        ) : (
          /* Expanded: full-width button */
          <button
            type="button"
            className={cn(
              'btn-indigo w-full rounded-md py-2.5 px-4 text-[14px]',
              'font-inter font-semibold leading-none',
            )}
          >
            <Plus size={16} strokeWidth={2} aria-hidden="true" />
            New Project
          </button>
        )}
      </div>

      {/* ── 5. COLLAPSE TOGGLE ────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-t border-hairline">
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!isCollapsed}
          className={cn(
            'group flex h-12 w-full items-center gap-2 transition-colors duration-150',
            'text-stone hover:bg-gray-50 hover:text-charcoal',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo',
            isCollapsed ? 'justify-center px-0' : 'px-5',
          )}
        >
          {/* Rotating chevron */}
          <motion.span
            animate={{ rotate: isCollapsed ? 180 : 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="flex-shrink-0"
            aria-hidden="true"
          >
            <ChevronLeft size={18} strokeWidth={1.75} />
          </motion.span>

          {/* 'Collapse' label — hidden when collapsed */}
          <AnimatePresence initial={false}>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto', transition: { duration: 0.18, ease: EASE } }}
                exit={{ opacity: 0, width: 0, transition: { duration: 0.14, ease: EASE } }}
                className="overflow-hidden whitespace-nowrap font-inter font-medium text-[13px]"
              >
                Collapse
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
