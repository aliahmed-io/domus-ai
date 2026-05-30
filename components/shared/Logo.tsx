import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { icon: 24, wordmark: 'text-[15px]', gap: 'gap-2' },
  md: { icon: 32, wordmark: 'text-[18px]', gap: 'gap-2.5' },
  lg: { icon: 40, wordmark: 'text-[22px]', gap: 'gap-3' },
} as const;

/** Domus logo — server component, no 'use client' needed */
export default function Logo({
  size = 'md',
  showWordmark = true,
  className,
}: LogoProps) {
  const { icon, wordmark, gap } = sizeMap[size];

  return (
    <div
      className={cn('flex items-center', gap, className)}
      aria-label="Domus"
    >
      {/* Premium Monogram D (Architectural arch + column + house outline) */}
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        role="img"
      >
        {/* Left column/pillar (stem of D) */}
        <rect x="9" y="8" width="4" height="24" rx="2" fill="#8C7662" />
        
        {/* Architectural Dome Arch (curves of D) */}
        <path d="M11 8 C25 8, 31 15, 31 20 C31 25, 25 32, 11 32" stroke="#8C7662" strokeWidth="3" strokeLinecap="round" />
        
        {/* Minimal House silhouette inside the D arch */}
        {/* Roof Pitch */}
        <path d="M15 16.5 L20.5 12.5 L26 16.5 Z" stroke="#C2A585" strokeWidth="2" strokeLinejoin="round" fill="none" />
        {/* House base/walls */}
        <rect x="17.5" y="16.5" width="6" height="7.5" stroke="#8C7662" strokeWidth="1.5" rx="0.5" fill="none" />
        {/* Glowing architectural design core */}
        <circle cx="20.5" cy="20.5" r="1.5" fill="#C2A585" />
      </svg>

      {/* Wordmark */}
      {showWordmark && (
        <span
          className={cn(
            'font-jakarta font-bold tracking-tight text-charcoal select-none',
            wordmark,
          )}
        >
          Domus
        </span>
      )}
    </div>
  );
}
