// @ts-check

import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "astro/config"
import react from "@astrojs/react"

// https://astro.build/config
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL ?? process.env.URL,
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [react()],
})
