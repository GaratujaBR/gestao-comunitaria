/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      // ─── shadcn/ui (não alterar) ───────────────────────────────────────────
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        card: "20px",
        panel: "28px",
        pill: "9999px"
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        },

        // ─── Terra de Canaã — Design System ──────────────────────────────────
        // App transacional
        "app-bg": "#F8F7F4",
        "ds-primary": "#1F6B3A",
        "ds-primary-dk": "#154B28",
        "ds-border": "#E7E5E4",
        "ds-nav-active": "#ECF7EE",

        // Promo / marketing
        canaa: {
          "bg-primary": "#4CAF50",
          "bg-surface": "#F3EFE0",
          "bg-section": "#D5E8D4",
          accent: "#88C9A1",
          "accent-dark": "#2D5A27",
          "accent-pink": "#F8BBD0",
          text: "#1A1A1A",
          "text-muted": "#4D4D4D",
          border: "#6B8E23",
          "border-dark": "#4A5D23",
          success: "#90EE90",
          alert: "#FF80AB"
        },

        green: {
          100: "#D5E8D4",
          200: "#90EE90",
          300: "#88C9A1",
          500: "#4CAF50",
          700: "#6B8E23",
          900: "#2D5A27"
        }
      },

      fontFamily: {
        sans: ["Montserrat", "system-ui", "-apple-system", "sans-serif"]
      },

      spacing: {
        "canaa-xs": "4px",
        "canaa-sm": "8px",
        "canaa-md": "16px",
        "canaa-lg": "24px",
        "canaa-xl": "32px",
        "canaa-2xl": "48px"
      },

      boxShadow: {
        card: "0 2px 8px rgba(45, 90, 39, 0.10)",
        elevated: "0 4px 16px rgba(45, 90, 39, 0.15)"
      },

      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" }
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out"
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
}
