import type { APIRoute } from "astro"

export const GET: APIRoute = ({ site }) => {
  const sitemap = site ? `\nSitemap: ${new URL("/sitemap.xml", site)}` : ""

  return new Response(
    `User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: bingbot
Allow: /${sitemap}
`,
    { headers: { "content-type": "text/plain; charset=utf-8" } }
  )
}
