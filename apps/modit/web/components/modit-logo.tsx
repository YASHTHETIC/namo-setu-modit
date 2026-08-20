export function ModitLogo({ className = "h-[42px] w-auto", dark = true }: { className?: string; dark?: boolean }) {
  const c = dark ? "#FFFFFF" : "#150726";
  const g = "#7CB518";

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 95" fill="none" className={className}>
      {/* M */}
      <path d="M0 72V10h9l25 42 25-42h9v62h-8V28L30 68h-6L6 28v44H0z" fill={c} />
      {/* Green O - circular refresh arrows */}
      <g transform="translate(80, 0)">
        {/* Top arrow arc */}
        <path d="M36 4C22 4 11 14 9 27l7 2c1.5-8 8-14 17-14 10 0 18 8 18 18s-8 18-18 18c-5 0-9-2-12.5-5L9 53l3 7 10-3c4.5 5 11 8 18 8C39 65 50 54 50 41S49 18 36 4z" fill={g} transform="translate(6, 0)"/>
        {/* Bottom arrow arc */}
        <path d="M36 78c14 0 25-10 27-23l-7-2c-1.5 8-8 14-17 14-10 0-18-8-18-18S12 31 22 31c5 0 9 2 12.5 5l10-3-3-7-10 3C27 24 21 21 14 21 1 21-10 32-12 45s11 33 25 33c5 0 9-2 12.5-5L36 78z" fill={g} transform="translate(6, 0)"/>
      </g>
      {/* D */}
      <path d="M155 10h11c17 0 30 12 30 30s-13 30-30 30h-11V10zm8 8v44h3c13 0 22-9 22-22s-9-22-22-22h-3z" fill={c} />
      {/* I */}
      <path d="M204 10h8v62h-8V10z" fill={c} />
      {/* T */}
      <path d="M226 10h8v52h24v8H226V10z" fill={c} />
      {/* Subtitle: MATERIALS ON DOOR */}
      <text x="0" y="88" fontFamily="Inter, Arial Black, sans-serif" fontWeight="800" fontSize="22" letterSpacing="1">
        <tspan fill={c}>MATERIALS ON </tspan>
        <tspan fill={g}>DOOR</tspan>
      </text>
    </svg>
  );
}
