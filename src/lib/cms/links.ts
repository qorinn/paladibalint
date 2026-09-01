import { fetchPublishedRows } from "./supabase"
import type { Link } from "./types"

export function getPublishedLinks() {
  return fetchPublishedRows<Link>("links", { order: "sort_order.asc" })
}
