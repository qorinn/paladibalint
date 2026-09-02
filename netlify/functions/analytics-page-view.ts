import { recordAnalyticsEvent } from "../../src/lib/server/analytics"
import {
  clientAddress,
  getSession,
  safeString,
  sanitizeReferrer,
  withSession,
  type FunctionContext,
} from "./_http"

export const config = { path: "/api/analytics/page-view" }

const requestCounts = new Map<string, { count: number; expiresAt: number }>()
const rateLimitWindowMs = 60_000
const rateLimitMaxRequests = 30

function isRateLimited(address: string) {
  const now = Date.now()
  const current = requestCounts.get(address)
  if (!current || current.expiresAt <= now) {
    requestCounts.set(address, { count: 1, expiresAt: now + rateLimitWindowMs })
    return false
  }
  current.count += 1
  return current.count > rateLimitMaxRequests
}

export default async function pageView(
  request: Request,
  context: FunctionContext
) {
  if (request.method !== "POST")
    return new Response("Method Not Allowed", { status: 405 })
  if (isRateLimited(clientAddress(request)))
    return new Response(null, { status: 429 })

  const session = getSession(request)
  try {
    const body = (await request.json()) as Record<string, unknown>
    context.waitUntil(
      recordAnalyticsEvent({
        sessionId: session.id,
        eventType: "page_view",
        pathname: safeString(body.pathname, 512),
        referrer: sanitizeReferrer(body.referrer),
        utm: {
          utm_source: safeString(body.utm_source, 120) || null,
          utm_medium: safeString(body.utm_medium, 120) || null,
          utm_campaign: safeString(body.utm_campaign, 120) || null,
          utm_content: safeString(body.utm_content, 120) || null,
          utm_term: safeString(body.utm_term, 120) || null,
        },
      }).catch((error: unknown) => {
        console.error("Could not record link-hub page view", error)
      })
    )
  } catch (error) {
    console.error("Could not record link-hub page view", error)
  }

  return withSession(
    new Response(null, {
      status: 204,
      headers: { "cache-control": "no-store" },
    }),
    session.setCookie
  )
}
