export function ModitLogo({ className = "h-[42px] w-auto", dark = true }: { className?: string; dark?: boolean }) {
  const textColor = dark ? "#FFFFFF" : "#150726";
  const green = "#7CB518";

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 100" fill="none" className={className}>
      {/* M */}
      <path d="M2 75V5h10l28 48 28-48h10v70h-9V22L35 70h-7L11 22v53H2z" fill={textColor} />

      {/* O — green circular arrows */}
      <g transform="translate(88, 8)">
        {/* Top arrow arc */}
        <path d="M36 2C20 2 8 14 6 28l8 2c1.5-9 9-15 19-15 11 0 20 9 20 20s-9 20-20 20c-6 0-10-2-14-6l-8 2 2 8 10-3c4 5 11 8 19 8 17 0 30-13 30-29S53 5 36 2z" fill={green} />
        {/* Bottom arrow arc */}
        <path d="M36 86c16 0 29-12 30-28l-8-2c-1.5 9-9 15-19 15-11 0-20-9-20-20s9-20 20-20c6 0 10 2 14 6l8-2-2-8-10 3c-4-5-11-8-19-8-17 0-30 13-30 29s13 29 30 29z" fill={green} />
      </g>

      {/* D */}
      <path d="M165 5h12c19 0 34 14 34 34s-15 34-34 34h-12V5zm9 9v52h3c14 0 25-11 25-26S191 14 177 14h-3z" fill={textColor} />

      {/* I */}
      <path d="M218 5h9v70h-9V5z" fill={textColor} />

      {/* T */}
      <path d="M242 5h9v58h28v9H242V5z" fill={textColor} />

      {/* Subtitle: MATERIALS ON DOOR */}
      <text x="3" y="96" fontFamily="Inter, Arial Black, sans-serif" fontWeight="800" fontSize="18" letterSpacing="2">
        <tspan fill={textColor}>MATERIALS ON </tspan>
        <tspan fill={green}>DOOR</tspan>
      </text>
    </svg>
  );
}
