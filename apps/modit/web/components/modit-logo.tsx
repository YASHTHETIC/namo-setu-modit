export function ModitLogo({ className = "h-[42px] w-auto", dark = true }: { className?: string; dark?: boolean }) {
  return (
    <img
      src="/modit-logo.png"
      alt="MODIT — Materials On Door"
      className={className}
      style={dark ? {} : { filter: "brightness(0) saturate(100%)" }}
    />
  );
}
