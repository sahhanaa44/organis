/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        warmwhite: "#FAF9F6",
        paper: "#F5F3EE",
        charcoal: "#1C1E1C",
        ink: "#14161A",
        forest: {
          50: "#EEF3EE",
          100: "#D7E3D8",
          200: "#B2C8B4",
          300: "#8CAD8F",
          400: "#63886A",
          500: "#3F6146",
          600: "#2F4A36",
          700: "#243A2A",
          800: "#1A2B1F",
          900: "#111D15",
        },
        sage: {
          50: "#F4F6F2",
          100: "#E6EAE1",
          200: "#CFD8C6",
          300: "#B4C2A6",
          400: "#98A889",
          500: "#7C8E6D",
        },
        stone: {
          50: "#FAFAF8",
          100: "#F1F0EC",
          200: "#E4E2DB",
          300: "#CFCCC1",
          400: "#A8A398",
          500: "#7C776C",
          600: "#5C584F",
          700: "#43413A",
        },
      },
      fontFamily: {
        serif: ["Fraunces", "ui-serif", "Georgia", "serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(20, 22, 26, 0.04), 0 8px 24px rgba(20, 22, 26, 0.06)",
        lifted: "0 2px 8px rgba(20, 22, 26, 0.06), 0 16px 40px rgba(20, 22, 26, 0.10)",
      },
      backdropBlur: {
        xs: "2px",
      },
      transitionTimingFunction: {
        organic: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      letterSpacing: {
        tightest: "-0.045em",
      },
    },
  },
  plugins: [],
};
