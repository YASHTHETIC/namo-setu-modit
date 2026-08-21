export function ModitLogo({ className = "h-[42px] w-auto", dark = true }: { className?: string; dark?: boolean }) {
  const textColor = dark ? "#FFFFFF" : "#150726";
  const green = "#7CB518";

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 105" fill="none" className={className}>
      {/* M — bold, wide */}
      <path d="M0 80V0h12l30 52 30-52h12v80h-10V24L38 76h-8L8 24v56H0z" fill={textColor} />

      {/* O — green circular arrows, vertically centered with letters */}
      <g transform="translate(100, 8)">
        <path d="M40 0C22 0 9 13 7 28l9 2c1.5-10 10-17 21-17 12 0 22 10 22 22s-10 22-22 22c-6 0-11-2-15-7l-9 2 2 9 11-3c5 6 12 9 21 9 19 0 34-15 34-33S59 0 40 0z" fill={green} />
        <path d="M40 88c19 0 34-15 34-33l-9-2c-1.5 10-10 17-21 17-12 0-22-10-22-22s10-22 22-22c6 0 11 2 15 7l9-2-2-9-11 3c-5-6-12-9-21-9C21 0 6 15 6 33s15 33 34 33z" fill={green} />
      </g>

      {/* D */}
      <path d="M180 0h14c22 0 38 16 38 38s-16 38-38 38h-14V0zm10 10v60h4c16 0 28-13 28-30S210 10 194 10h-4z" fill={textColor} />

      {/* I */}
      <path d="M242 0h12v80h-12V0z" fill={textColor} />

      {/* T — proper T shape: horizontal bar + centered vertical stem */}
      <path d="M270 0h52v12H296v68h-12V12h-14V0z" fill={textColor} />

      {/* Subtitle: MATERIALS ON DOOR */}
      <text x="2" y="98" fontFamily="Inter, Arial Black, sans-serif" fontWeight="800" fontSize="18" letterSpacing="3">
        <tspan fill={textColor}>MATERIALS ON </tspan>
        <tspan fill={green}>DOOR</tspan>
      </text>
    </svg>
  );
}
