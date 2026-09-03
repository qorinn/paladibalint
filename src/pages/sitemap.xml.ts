import type { APIRoute } from "astro"

export const GET: APIRoute = ({ site }) => {
  const pageUrl = site ? new URL("/", site).toString() : undefined
  const urls = pageUrl ? `\n  <url>\n    <loc>${pageUrl}</loc>\n  </url>\n` : ""

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
    { headers: { "content-type": "application/xml; charset=utf-8" } }
  )
}
