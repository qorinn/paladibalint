export interface FunctionContext {
  params: Record<string, string | undefined>
}

const sessionCookieName = "lh_sid"
const sessionMaxAge = 1800

export function readCookie(request: Request, name: string) {
  const prefix = `${name}=`
  return request.headers
    .get("cookie")
    ?.split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(prefix))
    ?.slice(prefix.length)
}

export function getSession(request: Request) {
  const existing = readCookie(request, sessionCookieName)
  if (existing) return { id: existing, setCookie: undefined }
  const id = crypto.randomUUID()
  return {
    id,
    setCookie: `${sessionCookieName}=${id}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${sessionMaxAge}`,
  }
}

export function withSession(response: Response, setCookie?: string) {
  if (setCookie) response.headers.set("set-cookie", setCookie)
  return response
}

export function clientAddress(request: Request) {
  return (
    request.headers.get("x-nf-client-connection-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  )
}

export function safeString(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.slice(0, maxLength) : ""
}

export function sanitizeReferrer(value: unknown) {
  const referrer = safeString(value, 2048)
  if (!referrer) return ""
  try {
    const url = new URL(referrer)
    return `${url.origin}${url.pathname}`
  } catch {
    return ""
  }
}
