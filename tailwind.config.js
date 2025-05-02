const {heroui} = require('@heroui/theme');
import {nextui} from '@nextui-org/react'

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./layouts/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/components/(button|card|date-picker|dropdown|input|kbd|link|listbox|modal|navbar|popover|progress|select|spinner|toggle|ripple|calendar|date-input|form|menu|divider|scroll-shadow).js"
  ],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [nextui(),heroui()],
}
