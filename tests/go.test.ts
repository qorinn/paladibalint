import { describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  recordAnalyticsEvent: vi.fn(),
  runtimeRpc: vi.fn(),
}))

vi.mock("../src/lib/server/analytics", () => ({
  recordAnalyticsEvent: mocks.recordAnalyticsEvent,
}))

vi.mock("../src/lib/server/supabase", () => ({
  runtimeRpc: mocks.runtimeRpc,
}))

import redirect, { isSafeRedirectTarget } from "../netlify/functions/go"

describe("link-hub redirects", () => {
  it("returns the redirect before a pending analytics write and schedules it with waitUntil", async () => {
    let finishAnalytics: (() => void) | undefined
    const analyticsPromise = new Promise<void>((resolve) => {
      finishAnalytics = resolve
    })
    const waitUntil = vi.fn()

    mocks.runtimeRpc.mockResolvedValueOnce([
      {
        link_id: "3bd8ee11-dce9-4f89-b13d-4458a91874a5",
        target_url: "https://example.com",
      },
    ])
    mocks.recordAnalyticsEvent.mockReturnValueOnce(analyticsPromise)

    const response = await redirect(
      new Request("https://hub.test/go/portfolio"),
      {
        params: { slug: "portfolio" },
        waitUntil,
      }
    )

    expect(response.status).toBe(302)
    expect(response.headers.get("location")).toBe("https://example.com")
    expect(response.headers.get("cache-control")).toBe("no-store")
    expect(waitUntil).toHaveBeenCalledTimes(1)
    expect(mocks.recordAnalyticsEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "link_click",
        linkId: "3bd8ee11-dce9-4f89-b13d-4458a91874a5",
      })
    )

    finishAnalytics?.()
    await expect(waitUntil.mock.calls[0]?.[0]).resolves.toBeUndefined()
  })

  it("keeps the redirect successful when analytics fails", async () => {
    const waitUntil = vi.fn()
    mocks.runtimeRpc.mockResolvedValueOnce([
      {
        link_id: "9b60c16a-3979-4b6d-9e6c-8de647da1b49",
        target_url: "mailto:hello@example.com",
      },
    ])
    mocks.recordAnalyticsEvent.mockRejectedValueOnce(
      new Error("analytics unavailable")
    )

    const response = await redirect(
      new Request("https://hub.test/go/contact"),
      {
        params: { slug: "contact" },
        waitUntil,
      }
    )

    expect(response.status).toBe(302)
    await expect(waitUntil.mock.calls[0]?.[0]).resolves.toBeUndefined()
  })

  it("rejects missing RPC matches and unsafe targets", async () => {
    const waitUntil = vi.fn()
    mocks.runtimeRpc.mockResolvedValueOnce([])
    const missing = await redirect(new Request("https://hub.test/go/missing"), {
      params: { slug: "missing" },
      waitUntil,
    })

    mocks.runtimeRpc.mockResolvedValueOnce([
      {
        link_id: "5b5f5676-d0b1-4b2a-817e-77d15ec218b1",
        target_url: "javascript:alert(1)",
      },
    ])
    const unsafe = await redirect(new Request("https://hub.test/go/unsafe"), {
      params: { slug: "unsafe" },
      waitUntil,
    })

    expect(missing.status).toBe(404)
    expect(unsafe.status).toBe(404)
    expect(waitUntil).not.toHaveBeenCalled()
  })

  it("accepts only http, https, and mailto targets", () => {
    expect(isSafeRedirectTarget("https://example.com")).toBe(true)
    expect(isSafeRedirectTarget("http://example.com")).toBe(true)
    expect(isSafeRedirectTarget("mailto:hello@example.com")).toBe(true)
    expect(isSafeRedirectTarget("ftp://example.com")).toBe(false)
  })
})
