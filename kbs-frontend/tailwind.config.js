/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      // ── Design tokens KBS ──────────────────────────────
      colors: {
        // Surfaces
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        "surface-dim": "rgb(var(--color-surface-dim) / <alpha-value>)",
        "surface-bright": "rgb(var(--color-surface-bright) / <alpha-value>)",
        "surface-lowest": "rgb(var(--color-surface-lowest) / <alpha-value>)",
        "surface-low": "rgb(var(--color-surface-low) / <alpha-value>)",
        "surface-container": "rgb(var(--color-surface-container) / <alpha-value>)",
        "surface-high": "rgb(var(--color-surface-high) / <alpha-value>)",
        "surface-highest": "rgb(var(--color-surface-highest) / <alpha-value>)",

        // On-Surface
        "on-surface": "rgb(var(--color-on-surface) / <alpha-value>)",
        "on-surface-variant": "rgb(var(--color-on-surface-variant) / <alpha-value>)",
        "inverse-surface": "rgb(var(--color-inverse-surface) / <alpha-value>)",
        "inverse-on-surface": "rgb(var(--color-inverse-on-surface) / <alpha-value>)",

        // Outlines
        outline: "rgb(var(--color-outline) / <alpha-value>)",
        "outline-variant": "rgb(var(--color-outline-variant) / <alpha-value>)",

        // Primary (Deep Blue/Black)
        primary: {
          DEFAULT: "rgb(var(--color-primary) / <alpha-value>)",
          container: "rgb(var(--color-primary-container) / <alpha-value>)",
          fixed: "rgb(var(--color-primary-fixed) / <alpha-value>)",
          "fixed-dim": "rgb(var(--color-primary-fixed-dim) / <alpha-value>)",
          inverse: "rgb(var(--color-primary-inverse) / <alpha-value>)",
        },
        "on-primary": "rgb(var(--color-on-primary) / <alpha-value>)",
        "on-primary-container": "rgb(var(--color-on-primary-container) / <alpha-value>)",
        "on-primary-fixed": "rgb(var(--color-on-primary-fixed) / <alpha-value>)",
        "on-primary-fixed-variant": "rgb(var(--color-on-primary-fixed-variant) / <alpha-value>)",

        // Secondary (Chocolate Brown)
        secondary: {
          DEFAULT: "rgb(var(--color-secondary) / <alpha-value>)",
          container: "rgb(var(--color-secondary-container) / <alpha-value>)",
          fixed: "rgb(var(--color-secondary-fixed) / <alpha-value>)",
          "fixed-dim": "rgb(var(--color-secondary-fixed-dim) / <alpha-value>)",
        },
        "on-secondary": "rgb(var(--color-on-secondary) / <alpha-value>)",
        "on-secondary-container": "rgb(var(--color-on-secondary-container) / <alpha-value>)",
        "on-secondary-fixed": "rgb(var(--color-on-secondary-fixed) / <alpha-value>)",
        "on-secondary-fixed-variant": "rgb(var(--color-on-secondary-fixed-variant) / <alpha-value>)",

        // Tertiary
        tertiary: {
          DEFAULT: "rgb(var(--color-tertiary) / <alpha-value>)",
          container: "rgb(var(--color-tertiary-container) / <alpha-value>)",
          fixed: "rgb(var(--color-tertiary-fixed) / <alpha-value>)",
          "fixed-dim": "rgb(var(--color-tertiary-fixed-dim) / <alpha-value>)",
        },
        "on-tertiary": "rgb(var(--color-on-tertiary) / <alpha-value>)",
        "on-tertiary-container": "rgb(var(--color-on-tertiary-container) / <alpha-value>)",

        // Error
        error: {
          DEFAULT: "rgb(var(--color-error) / <alpha-value>)",
          container: "rgb(var(--color-error-container) / <alpha-value>)",
        },
        "on-error": "rgb(var(--color-on-error) / <alpha-value>)",
        "on-error-container": "rgb(var(--color-on-error-container) / <alpha-value>)",

        // KBS métier
        kbs: {
          navy: "#131b2e",
          brown: "#725a42",
          "brown-light": "#fedcbe",
          gold: "#c8a96e",
          slate: "#45464d",
        },
      },

      fontFamily: {
        montserrat: ["Montserrat", "sans-serif"],
        inter: ["Inter", "sans-serif"],
      },

      fontSize: {
        "display-lg": ["48px", { lineHeight: "56px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline-lg": ["32px", { lineHeight: "40px", fontWeight: "700" }],
        "headline-lg-mobile": ["24px", { lineHeight: "32px", fontWeight: "700" }],
        "headline-md": ["24px", { lineHeight: "32px", fontWeight: "600" }],
        "title-lg": ["20px", { lineHeight: "28px", fontWeight: "600" }],
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "label-md": ["14px", { lineHeight: "20px", fontWeight: "500", letterSpacing: "0.01em" }],
        "label-sm": ["12px", { lineHeight: "16px", fontWeight: "600" }],
      },

      borderRadius: {
        sm: "0.25rem",
        DEFAULT: "0.5rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.5rem",
        full: "9999px",
      },

      spacing: {
        18: "4.5rem",
        22: "5.5rem",
      },

      maxWidth: {
        container: "1280px",
      },

      boxShadow: {
        // Ombres KBS — légères avec teinte bleue
        card: "0 1px 3px rgba(15,23,42,0.08), 0 1px 2px rgba(15,23,42,0.04)",
        "card-hover": "0 8px 24px rgba(15,23,42,0.12), 0 2px 8px rgba(15,23,42,0.06)",
        sidebar: "4px 0 24px rgba(15,23,42,0.10)",
        modal: "0 20px 60px rgba(15,23,42,0.20)",
        input: "0 0 0 3px rgba(19,27,46,0.10)",
      },

      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-in": "slideIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
      },

      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideIn: { from: { transform: "translateX(-16px)", opacity: "0" }, to: { transform: "translateX(0)", opacity: "1" } },
        slideUp: { from: { transform: "translateY(16px)", opacity: "0" }, to: { transform: "translateY(0)", opacity: "1" } },
      },
    },
  },
  plugins: [],
};
