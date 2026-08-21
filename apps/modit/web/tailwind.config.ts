import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./widgets/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "../../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-body)", "ui-sans-serif", "system-ui"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          DEFAULT: "var(--brand)",
          light: "var(--brand-light)",
          dark: "var(--brand-dark)",
        },
        green: {
          DEFAULT: "#7CB518",
          light: "#F0F9E8",
          dark: "#5A8010",
        },
        pink: {
          DEFAULT: "#E91E63",
          light: "#FCE4EC",
          dark: "#AD1457",
        },
        cyan: {
          DEFAULT: "#00BCD4",
          light: "#E0F7FA",
          dark: "#00838F",
        },
        action: { DEFAULT: "#7CB518", hover: "#6A9C14", light: "#F0F9E8" },
        urgency: { DEFAULT: "#E91E63", hover: "#C2185B", light: "#FCE4EC" },
        info: { DEFAULT: "#00BCD4", hover: "#0097A7", light: "#E0F7FA" },
        structure: { DEFAULT: "#2D1B69", dark: "#150726", light: "#F0ECF9" },
      },
      boxShadow: {
        glow: "0 20px 80px rgba(45, 27, 105, 0.15)",
        "brand-sm": "var(--shadow-brand-soft)",
        "brand-md": "var(--shadow-brand)",
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
        sm: "var(--radius-xs)",
        md: "var(--radius-sm)",
        lg: "var(--radius)",
        xl: "var(--radius-lg)",
        "2xl": "var(--radius-xl)",
        pill: "999px",
        btn: "10px",
        card: "16px",
        sheet: "24px",
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "fade-up": "fadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "slide-up": "slideUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "slide-down": "slideDown 0.4s ease-out forwards",
        "scale-in": "scaleIn 0.4s ease-out forwards",
        float: "float 4s ease-in-out infinite",
        glow: "glowPulse 3s ease-in-out infinite",
        shimmer: "shimmer 1.8s infinite",
        "bolt-flash": "boltFlash 0.4s ease-out",
        "cart-pop": "cartBadgePop 0.3s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
        "slide-in-up": "slideInUp 0.3s ease-out",
        "shimmer-card": "shimmerCard 1.8s infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(24px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          from: { opacity: "0", transform: "translateY(-16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(45, 27, 105, 0.15)" },
          "50%": { boxShadow: "0 0 40px rgba(45, 27, 105, 0.3)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        boltFlash: {
          "0%": { transform: "scale(1)" },
          "30%": { transform: "scale(0.92)" },
          "60%": { transform: "scale(1.08)", boxShadow: "0 0 12px rgba(124,181,24,.4)" },
          "100%": { transform: "scale(1)", boxShadow: "none" },
        },
        cartBadgePop: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.3)" },
          "100%": { transform: "scale(1)" },
        },
        slideInRight: {
          from: { transform: "translateX(20px)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        slideInUp: {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        shimmerCard: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
