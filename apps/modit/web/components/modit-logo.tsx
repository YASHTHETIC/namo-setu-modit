export function ModitLogo({ className = "h-[42px] w-auto", dark = true, light = false }: { className?: string; dark?: boolean; light?: boolean }) {
  return (
    <img
      src={light ? "/modit-logo-light.png" : "/modit-logo.png"}
      alt="MODIT — Materials On Door"
      className={className}
      style={dark && !light ? {} : { filter: "brightness(0) saturate(100%)" }}
    />
  );
}
