const runtimeUrl = process.env.SUPABASE_URL?.replace(/\/$/, "")
const runtimeKey =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY

function getRuntimeConfig() {
  if (!runtimeUrl || !runtimeKey) {
    throw new Error(
      "Missing SUPABASE_URL and SUPABASE_SECRET_KEY for the tracking function."
    )
  }
  return { key: runtimeKey, url: runtimeUrl }
}

export async function runtimeSelect<T>(
  table: string,
  query: Record<string, string>
): Promise<T[]> {
  const { key, url } = getRuntimeConfig()
  const response = await fetch(
    `${url}/rest/v1/${table}?${new URLSearchParams({ select: "*", ...query })}`,
    {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    }
  )
  if (!response.ok)
    throw new Error(`Supabase ${table} lookup failed (${response.status}).`)
  return (await response.json()) as T[]
}

export async function runtimePost(path: string, body: unknown) {
  const { key, url } = getRuntimeConfig()
  const response = await fetch(`${url}/rest/v1/${path}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "content-type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(body),
  })
  if (!response.ok)
    throw new Error(`Supabase write to ${path} failed (${response.status}).`)
}
