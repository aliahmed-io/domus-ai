export default function PlanIllustration({
  variant = "plan",
}: {
  variant?: "plan" | "scan";
}) {
  return (
    <svg
      viewBox="0 0 520 390"
      fill="none"
      className="plan-illustration"
      role="img"
      aria-label="Illustrated two bedroom floor plan"
    >
      <defs>
        <pattern
          id={`grid-${variant}`}
          width="20"
          height="20"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M20 0H0V20"
            stroke="currentColor"
            strokeOpacity=".09"
            strokeWidth=".7"
          />
        </pattern>
      </defs>
      <rect width="520" height="390" fill={`url(#grid-${variant})`} />
      <g stroke="currentColor" strokeWidth="1.2" opacity=".45">
        <path d="M70 40V20M450 40V20M70 29H450M40 65H20M40 320H20M29 65V320" />
        <path d="m65 34 10-10m370 10 10-10M24 70l10-10m-10 265 10-10" />
      </g>
      <g fill="currentColor" fontSize="10" fontFamily="sans-serif" opacity=".7">
        <text x="245" y="23">
          12.40 m
        </text>
        <text x="13" y="205" transform="rotate(-90 13 205)">
          8.60 m
        </text>
      </g>
      <path
        d="M70 65H450V320H70Z"
        fill="var(--plan-paper, #fff)"
        stroke="currentColor"
        strokeWidth="7"
      />
      <path
        d="M305 65V320M70 190H305M305 205H450"
        stroke="currentColor"
        strokeWidth="5"
      />
      <path
        d="M167 65H255M70 235V288M450 93V170M350 320H414"
        stroke="var(--plan-paper, #fff)"
        strokeWidth="9"
      />
      <path
        d="M167 65H255M70 235V288M450 93V170M350 320H414"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M260 190h42M305 225v45M350 205h40"
        stroke="var(--plan-paper, #fff)"
        strokeWidth="8"
      />
      <g stroke="currentColor" strokeWidth="1" opacity=".5">
        <path d="M260 190v-42a42 42 0 0 1 42 42M305 270h45a45 45 0 0 0-45-45M350 205v-40a40 40 0 0 1 40 40" />
      </g>
      <g
        stroke="currentColor"
        strokeWidth="1.4"
        fill="var(--plan-furniture, #e5ebdf)"
      >
        <rect x="92" y="85" width="92" height="49" rx="5" />
        <rect x="98" y="79" width="80" height="15" rx="4" />
        <rect x="120" y="146" width="55" height="24" rx="12" />
        <rect x="222" y="90" width="59" height="72" rx="3" />
        <path d="M222 111h59M251 90v21" />
        <rect x="330" y="85" width="93" height="92" rx="3" />
        <rect x="335" y="89" width="37" height="22" rx="3" />
        <rect x="380" y="89" width="37" height="22" rx="3" />
        <path d="M90 212H180V231H108V294H90Z" />
        <circle cx="134" cy="222" r="5" />
        <circle cx="153" cy="222" r="5" />
        <rect x="219" y="234" width="48" height="44" rx="15" />
        <path d="M226 226v-8m33 8v-8m-33 77v-9m33 9v-9" />
        <rect x="327" y="226" width="34" height="66" rx="13" />
        <ellipse cx="403" cy="245" rx="13" ry="17" />
        <circle cx="283" cy="92" r="10" />
        <path d="m278 86 9 11m-11-4 13-3" />
      </g>
      <g fill="currentColor" fontFamily="sans-serif" fontSize="10">
        <text x="94" y="177">
          Living
        </text>
        <text x="364" y="191">
          Bedroom
        </text>
        <text x="114" y="307">
          Kitchen & dining
        </text>
        <text x="377" y="302">
          Bath
        </text>
      </g>
      <circle
        cx="449"
        cy="65"
        r="9"
        fill="#ff835b"
        stroke="white"
        strokeWidth="3"
      />
      <path
        d="M463 350v-19m-5 7 5-7 5 7"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <text x="460" y="365" fill="currentColor" fontSize="9">
        N
      </text>
    </svg>
  );
}
