export function ModitLogo({ className = "h-[42px] w-auto", dark = true }: { className?: string; dark?: boolean }) {
  const textColor = dark ? "#150726" : "#FFFFFF";

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 130" fill="none" className={className}>
      {/* M */}
      <path d="M0 100V28h12l30 52 30-52h12v72h-10V46l-28 48h-8L8 46v54H0z" fill={textColor} />
      {/* Green circular arrows (O) */}
      <g transform="translate(100, 14)">
        <path d="M24 2C14 2 5.5 9 3 19l7 3c1.5-6 6.5-10 13-10 7.5 0 13.5 6 13.5 13.5S33.5 39 26 39c-4 0-7.5-1.7-10-4.5L9 37l3 10 10-3c3 4.5 8 7 14 7 10 0 18.5-8 18.5-18S34 8 24 2z" fill="#7CB518" transform="translate(4, 0)"/>
        <path d="M44 86c10 0 18.5-7 21-17l-7-3c-1.5 6-6.5 10-13 10-7.5 0-13.5-6-13.5-13.5S37 39 44.5 39c4 0 7.5 1.7 10 4.5l3-8-10-3-3 8c-3-4.5-8-7-14-7C17 34 8 42 8 52s8 18 18 18c4 0 7.5-1.7 10-4.5l10 3-3 9-10-3c-3.5 5.5-9 9.5-16 11.5z" fill="#7CB518" transform="translate(4, 0)"/>
      </g>
      {/* D */}
      <path d="M198 28h14c20 0 36 14 36 36s-16 36-36 36h-14V28zm10 10v52h4c15 0 26-10 26-26s-11-26-26-26h-4z" fill={textColor} />
      {/* I */}
      <path d="M260 28h10v72h-10V28z" fill={textColor} />
      {/* T */}
      <path d="M290 28h10v62h28v10h-38V28z" fill={textColor} />
      {/* Subtitle: MATERIALS ON DOOR */}
      <text x="0" y="120" fontFamily="Inter, Arial Black, sans-serif" fontWeight="800" fontSize="28" letterSpacing="1">
        <tspan fill={textColor}>MATERIALS ON </tspan>
        <tspan fill="#7CB518">DOOR</tspan>
      </text>
    </svg>
  );
}
