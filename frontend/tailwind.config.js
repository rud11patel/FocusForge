/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        forge: {
          50: "#f7f5ef",
          100: "#efe9da",
          200: "#dfd0af",
          300: "#cdb17f",
          400: "#bc9657",
          500: "#a27a3d",
          600: "#825f2f",
          700: "#634825",
          800: "#44311b",
          900: "#2a1e11"
        }
      },
      fontFamily: {
        display: ["Georgia", "serif"],
        body: ["ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        ember: "0 30px 80px rgba(251, 146, 60, 0.18)"
      }
    }
  },
  plugins: []
};
