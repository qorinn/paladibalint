import { fetchPublishedRows, fetchRows } from "./supabase"
import type { Project, SectionProject } from "./types"

export function getPublishedProjects() {
  return fetchPublishedRows<Project>("projects")
}

export function getSectionProjects() {
  return fetchRows<SectionProject>("section_projects", {
    order: "sort_order.asc",
  })
}
