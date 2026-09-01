export type SectionType =
  "primary_links" | "social_links" | "links" | "projects"
export type LinkStyle = "default" | "primary" | "subtle"

export interface SiteProfile {
  id: string
  name: string
  position: string | null
  description: string | null
  avatar_path: string | null
  location: string | null
  availability_text: string | null
  footer_text: string | null
  meta_title: string | null
  meta_description: string | null
  og_image_path: string | null
  expand_label: string | null
  collapse_label: string | null
  status: string
}

export interface Section {
  id: string
  key: string
  title: string | null
  description: string | null
  section_type: SectionType
  sort_order: number
  status: string
}

export interface Project {
  id: string
  title: string
  slug: string
  short_description: string | null
  expanded_description: string | null
  image_path: string | null
  status: string
}

export interface SectionProject {
  section_id: string
  project_id: string
  sort_order: number
}

export interface Link {
  id: string
  section_id: string | null
  project_id: string | null
  label: string
  description: string | null
  icon: string | null
  target_url: string
  redirect_slug: string | null
  trackable: boolean
  open_in_new_tab: boolean
  style: LinkStyle | null
  sort_order: number
  status: string
}

export interface PageProject extends Project {
  links: Link[]
}

export interface PageSection extends Section {
  links: Link[]
  projects: PageProject[]
}

export interface PageContent {
  profile: SiteProfile
  sections: PageSection[]
}
