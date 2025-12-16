import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
	],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
      },
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1400px",
      },
    },
    screens: {
      xs: "475px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      fontSize: {
        'fluid-xs': 'clamp(0.625rem, 1.5vw + 0.5rem, 0.75rem)',
        'fluid-sm': 'clamp(0.75rem, 1.5vw + 0.625rem, 0.875rem)',
        'fluid-base': 'clamp(0.875rem, 1.5vw + 0.75rem, 1rem)',
        'fluid-lg': 'clamp(1rem, 1.5vw + 0.875rem, 1.125rem)',
        'fluid-xl': 'clamp(1.125rem, 1.5vw + 1rem, 1.25rem)',
        'fluid-2xl': 'clamp(1.25rem, 1.5vw + 1.125rem, 1.5rem)',
        'fluid-3xl': 'clamp(1.5rem, 2vw + 1.25rem, 1.875rem)',
        'fluid-4xl': 'clamp(1.875rem, 2.5vw + 1.5rem, 2.25rem)',
      },
      spacing: {
        'fluid-1': 'clamp(0.25rem, 0.5vw + 0.125rem, 0.5rem)',
        'fluid-2': 'clamp(0.5rem, 1vw + 0.25rem, 1rem)',
        'fluid-4': 'clamp(1rem, 1.5vw + 0.5rem, 1.5rem)',
        'fluid-6': 'clamp(1.5rem, 2vw + 1rem, 2rem)',
        'fluid-8': 'clamp(2rem, 2.5vw + 1.5rem, 2.5rem)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config