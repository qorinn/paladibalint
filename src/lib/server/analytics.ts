import { runtimePost } from "./supabase"

export type AnalyticsEvent = {
  sessionId: string
  eventType: "page_view" | "link_click"
  linkId?: string
  pathname?: string
  referrer?: string
  utm?: Record<string, string | null>
}

/**
 * Analytics writes are isolated so the CMS backend can replace the direct
 * insert with its record_analytics_event RPC without changing function code.
 */
export async function recordAnalyticsEvent(event: AnalyticsEvent) {
  await runtimePost("analytics_events", {
    session_id: event.sessionId,
    event_type: event.eventType,
    link_id: event.linkId ?? null,
    pathname: event.pathname ?? null,
    referrer: event.referrer ?? null,
    ...event.utm,
  })
}
