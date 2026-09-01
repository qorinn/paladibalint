const publishedStatus = "published"

function getBuildConfig() {
  const url = import.meta.env.SUPABASE_URL
  const key =
    import.meta.env.SUPABASE_PUBLISHABLE_KEY ??
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY for the link-hub build."
    )
  }

  return { key, url: url.replace(/\/$/, "") }
}

export async function fetchPublishedRows<T>(
  table: string,
  query: Record<string, string> = {}
): Promise<T[]> {
  const { key, url } = getBuildConfig()
  const params = new URLSearchParams({
    select: "*",
    status: `eq.${publishedStatus}`,
    ...query,
  })
  const response = await fetch(`${url}/rest/v1/${table}?${params}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })

  if (!response.ok) {
    throw new Error(
      `Could not load published ${table} from Supabase (${response.status}): ${await response.text()}`
    )
  }

  return (await response.json()) as T[]
}

export async function fetchRows<T>(
  table: string,
  query: Record<string, string> = {}
): Promise<T[]> {
  const { key, url } = getBuildConfig()
  const params = new URLSearchParams({ select: "*", ...query })
  const response = await fetch(`${url}/rest/v1/${table}?${params}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })

  if (!response.ok) {
    throw new Error(
      `Could not load ${table} from Supabase (${response.status}): ${await response.text()}`
    )
  }

  return (await response.json()) as T[]
}
