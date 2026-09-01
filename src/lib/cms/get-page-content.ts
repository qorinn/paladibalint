import { getPublishedLinks } from "./links"
import { getPublishedProfile } from "./profile"
import { getPublishedProjects, getSectionProjects } from "./projects"
import { getPublishedSections } from "./sections"
import type { PageContent, PageProject, PageSection } from "./types"

export async function getPageContent(): Promise<PageContent> {
  const [profile, sections, projects, sectionProjects, links] =
    await Promise.all([
      getPublishedProfile(),
      getPublishedSections(),
      getPublishedProjects(),
      getSectionProjects(),
      getPublishedLinks(),
    ])
  const projectsById = new Map(projects.map((project) => [project.id, project]))

  const normalizedSections: PageSection[] = sections.map((section) => {
    const sectionLinks = links.filter(
      (link) => link.section_id === section.id && link.project_id === null
    )
    const sectionProjectEntries = sectionProjects.filter(
      (entry) => entry.section_id === section.id
    )
    const sectionProjectItems: PageProject[] = sectionProjectEntries.flatMap(
      (entry) => {
        const project = projectsById.get(entry.project_id)
        if (!project) return []
        return [
          {
            ...project,
            links: links.filter((link) => link.project_id === project.id),
          },
        ]
      }
    )

    return { ...section, links: sectionLinks, projects: sectionProjectItems }
  })

  return { profile, sections: normalizedSections }
}
