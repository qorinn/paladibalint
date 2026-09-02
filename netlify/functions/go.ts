import { recordAnalyticsEvent } from "../../src/lib/server/analytics"
import { runtimeRpc } from "../../src/lib/server/supabase"
import { getSession, withSession, type FunctionContext } from "./_http"

export const config = { path: "/go/:slug" }

type ResolvedRedirect = {
  link_id: string
  target_url: string
}

export function isSafeRedirectTarget(target: string) {
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

  let redirectTarget: ResolvedRedirect | undefined
  try {
    redirectTarget = (
      await runtimeRpc<ResolvedRedirect>("resolve_published_redirect", {
        p_slug: slug,
      })
    )[0]
    if (!redirectTarget || !isSafeRedirectTarget(redirectTarget.target_url)) {
      return new Response("Not Found", { status: 404 })
    }
  } catch (error) {
    console.error("Could not resolve link-hub redirect", error)
    return new Response("Not Found", { status: 404 })
  }

  const session = getSession(request)
  context.waitUntil(
    recordAnalyticsEvent({
      sessionId: session.id,
      eventType: "link_click",
      linkId: redirectTarget.link_id,
    }).catch((error: unknown) => {
      console.error("Could not record link-hub click", error)
    })
  )

  return withSession(
    new Response(null, {
      status: 302,
      headers: {
        location: redirectTarget.target_url,
        "cache-control": "no-store",
      },
    }),
    session.setCookie
  )
}
