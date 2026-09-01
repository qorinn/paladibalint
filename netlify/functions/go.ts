import { recordAnalyticsEvent } from "../../src/lib/server/analytics"
import { runtimeSelect } from "../../src/lib/server/supabase"
import { getSession, withSession, type FunctionContext } from "./_http"

export const config = { path: "/go/:slug" }

type RuntimeLink = {
  id: string
  section_id: string | null
  project_id: string | null
  target_url: string
}

type PublishedRecord = { id: string; status: string }
type SectionProject = { section_id: string; project_id: string }

async function isPublishedParent(link: RuntimeLink) {
  if (link.section_id) {
    const sections = await runtimeSelect<PublishedRecord>("sections", {
      id: `eq.${link.section_id}`,
      status: "eq.published",
      limit: "1",
    })
    return sections.length === 1
  }
  if (!link.project_id) return false

  const projects = await runtimeSelect<PublishedRecord>("projects", {
    id: `eq.${link.project_id}`,
    status: "eq.published",
    limit: "1",
  })
  if (projects.length !== 1) return false

  const memberships = await runtimeSelect<SectionProject>("section_projects", {
    project_id: `eq.${link.project_id}`,
  })
  for (const membership of memberships) {
    const sections = await runtimeSelect<PublishedRecord>("sections", {
      id: `eq.${membership.section_id}`,
      status: "eq.published",
      limit: "1",
    })
    if (sections.length === 1) return true
  }
  return false
}

function isSafeRedirectTarget(target: string) {
  try {
    const url = new URL(target)
    return (
      url.protocol === "https:" ||
      url.protocol === "http:" ||
      url.protocol === "mailto:"
    )
  } catch {
    return false
  }
}

export default async function redirect(
  request: Request,
  context: FunctionContext
) {
  const slug = context.params.slug
  if (!slug || !/^[a-zA-Z0-9_-]+$/.test(slug))
    return new Response("Not Found", { status: 404 })

  let link: RuntimeLink | undefined
  try {
    link = (
      await runtimeSelect<RuntimeLink>("links", {
        redirect_slug: `eq.${slug}`,
        status: "eq.published",
        limit: "1",
      })
    )[0]
    if (
      !link ||
      !(await isPublishedParent(link)) ||
      !isSafeRedirectTarget(link.target_url)
    ) {
      return new Response("Not Found", { status: 404 })
    }
  } catch (error) {
    console.error("Could not resolve link-hub redirect", error)
    return new Response("Not Found", { status: 404 })
  }

  const session = getSession(request)
  try {
    await recordAnalyticsEvent({
      sessionId: session.id,
      eventType: "link_click",
      linkId: link.id,
    })
  } catch (error) {
    console.error("Could not record link-hub click", error)
  }

  return withSession(
    new Response(null, {
      status: 302,
      headers: { location: link.target_url, "cache-control": "no-store" },
    }),
    session.setCookie
  )
}
