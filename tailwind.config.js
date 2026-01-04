/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dimo-blue': '#1E4D92',
        'dimo-green': '#8BC53F',
        'dimo-dark': '#0A2540',
      },
    },
  },
  plugins: [],
}

