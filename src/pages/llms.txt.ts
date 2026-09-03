import type { APIRoute } from "astro"
import { getPageContent } from "@/lib/cms"

export const GET: APIRoute = async () => {
  const { profile } = await getPageContent()
  const description = profile.description ?? ""
  const position = profile.position ?? ""

  return new Response(
    `# ${profile.name}

${profile.name} ${position ? `– ${position}` : ""}. ${description}

## Oldal célja

Személyes szakmai linkgyűjtő: projektek, nyílt forrású munkák és elérhetőségek egy helyen.
`,
    { headers: { "content-type": "text/plain; charset=utf-8" } }
  )
}
