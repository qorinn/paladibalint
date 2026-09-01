import { fetchPublishedRows } from "./supabase"
import type { Section } from "./types"

export function getPublishedSections() {
  return fetchPublishedRows<Section>("sections", { order: "sort_order.asc" })
}
