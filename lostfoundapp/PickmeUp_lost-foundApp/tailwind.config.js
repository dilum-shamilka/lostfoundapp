/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.tsx","./components/**/*.tsx"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        darkBg: "#0B0F19",
        darkCard: "#161F30",
        darkBorder: "#243249",
        cyberCyan: "#00F0FF",
        cyberViolet: "#D946EF",
        cyberGreen: "#00E676",
        cyberRose: "#FF007F",
        cyberText: "#F8FAFC",
        cyberMuted: "#8A99AD",
      }
    }
  },
  plugins: []
}
