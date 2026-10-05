import Image from "next/image";

export function ModitLogo({ className = "h-[42px] w-auto", dark = true, light = false }: { className?: string; dark?: boolean; light?: boolean }) {
  return (
    <Image
      src={light ? "/modit-logo-light.png" : "/modit-logo.png"}
      alt="MODIT — Materials On Door"
      width={2714}
      height={901}
      priority={false}
      className={className}
    />
  );
}
