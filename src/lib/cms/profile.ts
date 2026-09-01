import { fetchPublishedRows } from "./supabase"
import type { SiteProfile } from "./types"

export async function getPublishedProfile(): Promise<SiteProfile> {
  const profiles = await fetchPublishedRows<SiteProfile>("site_profile", {
    limit: "1",
  })
  const profile = profiles[0]
  if (!profile)
    throw new Error("No published site_profile was found in Supabase.")
  return profile
}
