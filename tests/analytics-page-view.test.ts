import { describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  recordAnalyticsEvent: vi.fn(),
}))

vi.mock("../src/lib/server/analytics", () => ({
  recordAnalyticsEvent: mocks.recordAnalyticsEvent,
}))

import pageView from "../netlify/functions/analytics-page-view"

describe("link-hub page views", () => {
  it("returns the session cookie before a pending analytics write", async () => {
    let finishAnalytics: (() => void) | undefined
    const analyticsPromise = new Promise<void>((resolve) => {
      finishAnalytics = resolve
    })
    const waitUntil = vi.fn()
    mocks.recordAnalyticsEvent.mockReturnValueOnce(analyticsPromise)

    const response = await pageView(
      new Request("https://hub.test/api/analytics/page-view", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pathname: "/" }),
      }),
      { params: {}, waitUntil }
    )

    expect(response.status).toBe(204)
    expect(response.headers.get("set-cookie")).toContain("lh_sid=")
    expect(waitUntil).toHaveBeenCalledTimes(1)
    expect(mocks.recordAnalyticsEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "page_view",
        pathname: "/",
      })
    )

    finishAnalytics?.()
    await expect(waitUntil.mock.calls[0]?.[0]).resolves.toBeUndefined()
  })
})
