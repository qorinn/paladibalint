Implement the **public Developer Link Hub only** in this repository.

A separate repository/application will handle:

* CMS/admin interface
* content editing
* publishing workflow
* analytics dashboard
* analytics reporting
* CMS-side Netlify build-hook triggering

Do **not** build any of those systems here.

This repository is responsible only for the **public-facing link hub website** and the small server-side tracking layer required by that website.

---

# Project context

The project is already set up with:

* Astro
* TypeScript
* Tailwind CSS
* shadcn
* Netlify

Hosting will be on Netlify.

Content is stored in Supabase and managed by a CMS located in another repository.

The public site should be statically generated from published Supabase content.

The site is primarily intended to be linked from:

* CV / Resume
* LinkedIn
* GitHub
* job applications

The result should feel like a professional developer-oriented Linktree / personal link hub.

It must **not** become a traditional portfolio website.

---

# Main product goal

Build a single-page professional link hub containing:

* profile image
* name
* position
* short description
* primary professional links
* social links
* selected work
* open-source projects
* optional additional CMS-defined link sections
* footer

Example profile:

```text
Paládi Bálint

Full-stack Developer

I build web apps, mobile apps and digital products.
```

Typical links:

```text
GitHub
LinkedIn
Resume
Email
Instagram
```

Projects should contain only lightweight supporting information.

Example:

```text
Morf

Open-source browser toolkit for everyday file and design tasks.

Website ↗
GitHub ↗
```

Do not create:

* project detail pages
* case studies
* skills section
* experience timeline
* services section
* testimonials
* large portfolio navigation
* giant hero section
* complex animations
* traditional portfolio structure

The main interaction must always remain:

```text
click a link
```

---

# Important architecture constraint

The homepage must remain **Astro SSG**.

Do not convert the site to SSR.

Expected content flow:

```text
Supabase
 ↓
astro build
 ↓
fetch published content
 ↓
generate static HTML
 ↓
Netlify CDN
```

The CMS will trigger Netlify builds externally when content is published.

This repository does NOT need to implement that CMS workflow.

---

# Supabase responsibilities in this repository

This repository only needs to:

1. read published CMS content during `astro build`
2. resolve tracked redirect URLs server-side
3. write page-view and click events server-side

Do not implement:

* CMS forms
* CRUD dashboard
* login/admin area
* project editor
* link editor
* publish buttons
* analytics dashboard
* charts
* reporting UI

---

# Expected existing data model

Assume Supabase uses these entities:

```text
site_profile
sections
projects
section_projects
links
analytics_sessions
analytics_events
```

Do not redesign the CMS.

Build the frontend against this model.

---

# `site_profile`

Expected fields include:

```text
id
name
position
description
avatar_path
location
availability_text
footer_text

meta_title
meta_description
og_image_path

expand_label
collapse_label

status
```

Only published profile data should be used.

---

# `sections`

Expected fields:

```text
id
key
title
description
section_type
sort_order
status
```

Supported initial section types:

```text
primary_links
social_links
links
projects
```

Important:

Do not hardcode semantic section names such as:

```text
Selected Work
Open Source
```

Both may use:

```text
section_type = "projects"
```

The CMS-provided title determines what the user sees.

Sort sections using:

```text
sort_order ASC
```

Render only published sections.

---

# `projects`

Expected fields:

```text
id
title
slug
short_description
expanded_description
image_path
status
```

Projects must not receive individual pages.

Do not implement:

```text
/projects/[slug]
```

Projects exist only as entries inside the link hub.

---

# `section_projects`

Projects can appear in multiple sections.

Expected relationship:

```text
section_id
project_id
sort_order
```

A project may therefore appear in both:

```text
Selected Work
Open Source
```

without duplicating the project.

Respect section-specific:

```text
sort_order
```

---

# Unified `links`

All clickable external links come from one links model.

Expected fields:

```text
id
section_id
project_id

label
description
icon

target_url
redirect_slug

trackable
open_in_new_tab
style

sort_order
status
```

A link belongs either:

* directly to a section
* or to a project

Project links and ordinary links must use the same frontend link primitives where possible.

---

# Tracked links

Do not render the actual external destination into the href for trackable links.

For example, instead of:

```text
https://github.com/example
```

render:

```text
/go/github
```

based on:

```text
redirect_slug
```

For non-trackable links, direct URLs may be used.

The stable analytics identity is the database link ID / redirect slug, not the visible label or target URL.

---

# Supabase client architecture

Create a centralized build-time CMS layer.

Suggested structure:

```text
src/
  lib/
    cms/
      supabase.ts
      profile.ts
      sections.ts
      projects.ts
      links.ts
      get-page-content.ts
      index.ts
```

Do not query Supabase directly from individual UI components.

Build one normalized page model first.

Example:

```ts
{
  profile,

  sections: [
    {
      ...section,

      links: [],

      projects: [
        {
          ...project,
          links: []
        }
      ]
    }
  ]
}
```

Pass this normalized data into presentation components.

---

# Supabase environment variables

Use environment variables such as:

```text
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
```

Preferred responsibilities:

```text
Astro build:
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
```

```text
Netlify tracking functions:
SUPABASE_URL
SUPABASE_SECRET_KEY
```

Never expose the secret key in frontend JavaScript.

Never prefix the secret with:

```text
PUBLIC_
```

---

# Profile image

The actual profile image should remain in the repository:

```text
/public/images/profile.webp
```

Supabase stores only its path:

```text
/images/profile.webp
```

Do not implement image upload.

Do not require Supabase Storage.

The same local-path model may be used for other optional static images.

---

# UI requirements

Build a polished but deliberately minimal UI.

It should feel closer to:

```text
Linktree
personal profile hub
creator link page
minimal professional link hub
```

than:

```text
developer portfolio
agency website
personal brand landing page
```

Use the existing:

* Tailwind
* shadcn

setup.

Do not introduce another component system.

---

# Suggested visual hierarchy

Top:

```text
[Profile image]

Paládi Bálint
Full-stack Developer

Short description
```

Then prominent primary links:

```text
GitHub
LinkedIn
Resume
Email
```

Then social:

```text
Social

Instagram
...
```

Then selected projects:

```text
Selected Work

SEOoops
AI-assisted SEO platform.

Website ↗
GitHub ↗

Morf
Open-source browser toolkit.

Website ↗
GitHub ↗
```

Then:

```text
Open Source

Dictara
Contributions to an open-source macOS transcription app.

Pull Requests ↗
Repository ↗
```

Then any additional CMS-configured sections.

Footer last.

---

# Component structure

Use reusable components.

Approximate structure:

```text
src/components/link-hub/

ProfileHeader.astro
Section.astro
LinkButton.astro
SocialLinks.astro
ProjectItem.astro
ProjectLinks.astro
ExpandableDescription.astro
Footer.astro
```

Exact component names may change if the existing architecture suggests something cleaner.

Avoid unnecessary React components.

Prefer `.astro` components for static rendering.

---

# Expandable project descriptions

A project may have:

```text
short_description
expanded_description
```

Always show the short description if present.

If `expanded_description` exists, optionally provide a subtle:

```text
More
```

interaction.

The labels must come from CMS settings:

```text
expand_label
collapse_label
```

Do not let this become a complex project modal or detail view.

A native HTML solution or minimal JavaScript is preferred.

---

# Icons

Supabase contains semantic icon identifiers such as:

```text
github
linkedin
instagram
mail
file-text
globe
external-link
x
youtube
```

Map these identifiers to frontend icons.

Prefer Lucide.

Do not store or render arbitrary SVG/HTML from Supabase.

Unknown icons must gracefully fall back to no icon.

---

# Link styles

CMS may provide:

```text
default
primary
subtle
```

Map these semantic values to predefined frontend styles.

Do not accept arbitrary CSS classes from CMS data.

---

# Tracking layer

Implement only the tracking functionality required by this public site.

Do NOT implement the analytics dashboard.

---

# Anonymous session

Use a first-party anonymous cookie:

```text
lh_sid
```

If it does not exist, generate:

```ts
crypto.randomUUID()
```

server-side.

Cookie settings:

```text
HttpOnly
Secure
SameSite=Lax
Path=/
Max-Age=1800
```

The browser should never need to read the session ID.

---

# Page-view tracking

After the static homepage loads, make one small request to:

```text
POST /api/analytics/page-view
```

Send only data needed for analytics:

```text
pathname
referrer

utm_source
utm_medium
utm_campaign
utm_content
utm_term
```

Use:

```text
credentials: same-origin
keepalive: true
```

Do not collect:

* names
* email addresses
* browser fingerprints
* stored IP addresses

The page must work normally if analytics fails.

---

# Tracked redirect

Implement a Netlify Function for:

```text
/go/:slug
```

Preferred configuration:

```ts
export const config = {
  path: "/go/:slug"
}
```

Flow:

```text
GET /go/morf

1. read lh_sid
2. create session UUID when needed
3. resolve redirect_slug in Supabase
4. ensure link is published
5. ensure its parent section/project is published
6. record link_click event
7. return 302 redirect
```

Response:

```text
302
Location: actual external URL
Cache-Control: no-store
```

---

# Critical redirect behavior

Analytics must never block navigation.

If tracking fails:

```text
log the error
continue redirecting
```

Do not show an analytics error to the user.

---

# Redirect security

Never accept arbitrary target URLs from request parameters.

Do NOT implement something like:

```text
/go?url=https://example.com
```

Only redirect to URLs retrieved from the CMS database using a known:

```text
redirect_slug
```

If a slug does not exist or is not published:

```text
return 404
```

This endpoint must not become an open redirect.

---

# Analytics writes

Assume analytics tables exist or will be created by the system responsible for the CMS/analytics backend.

Do not build an analytics schema-management UI here.

If required for local development, create only the minimal TypeScript/database integration expected by the existing schema.

Expected tables:

```text
analytics_sessions
analytics_events
```

Expected event types:

```text
page_view
link_click
```

Use:

```text
link_id
```

for link-click identity.

Do not duplicate project metadata inside analytics events unless required by the existing database contract.

---

# Analytics database logic

If the Supabase database already exposes an RPC such as:

```text
record_analytics_event
```

prefer using it.

If it does not yet exist, isolate analytics DB access behind one small server-side module so the implementation can easily switch to an RPC later.

Do not tightly couple Netlify Function logic to UI components.

---

# Rate limiting

Add lightweight rate limiting to the public page-view Netlify Function where the existing Netlify setup supports it.

The goal is to prevent trivial analytics spam.

Do not implement custom persistent IP tracking.

The redirect endpoint should prioritize reliable navigation over aggressive limiting.

---

# Netlify

The website is hosted on Netlify.

Use Netlify Functions only for dynamic functionality such as:

```text
/api/analytics/page-view
/go/:slug
```

The homepage remains static.

Do not add SSR for these endpoints.

If Netlify Function regions are configured, choose a region close to the existing Supabase deployment when possible.

Do not invent a database region; inspect existing configuration or leave it configurable.

---

# SEO metadata

Use CMS values:

```text
meta_title
meta_description
og_image_path
```

for:

```text
<title>
meta description
Open Graph
```

This does not need to become a complex SEO system.

---

# Accessibility

Ensure:

* semantic structure
* keyboard-accessible links
* visible focus states
* proper heading order
* sufficient contrast
* link text remains understandable without icons
* expandable descriptions use proper buttons and `aria-expanded`
* external-link icons are decorative where appropriate

---

# Performance requirements

Performance is a priority.

Avoid:

* unnecessary hydration
* React islands for static content
* runtime browser Supabase queries
* large JavaScript dependencies
* large animation libraries
* image-heavy cards
* project galleries

Use Astro's static strengths.

The normal homepage should require very little client-side JavaScript besides page-view tracking and tiny optional interactions.

Use explicit image dimensions to prevent CLS.

---

# Error handling

If required CMS content cannot be fetched during production build:

```text
fail the build
```

with a useful error.

Do not deploy an empty page silently.

Optional content fields may be null.

The page must gracefully support missing:

```text
description
expanded_description
image_path
location
availability_text
section title
section description
```

---

# TypeScript

Create proper types for:

```text
SiteProfile
Section
Project
SectionProject
Link
PageContent
```

Avoid `any`.

Keep CMS/database types separate from presentation logic where sensible.

---

# Scope exclusions

Very important: do NOT implement any of the following in this repository:

```text
CMS dashboard
CMS authentication
CMS editor
project CRUD UI
link CRUD UI
section editor
publishing UI
Netlify build-hook trigger UI
analytics dashboard
analytics charts
analytics reports
admin pages
user management
```

Those systems exist or will exist in another repository.

This repository is only:

```text
PUBLIC LINK HUB
+
PUBLIC-SITE TRACKING ENDPOINTS
```

---

# Suggested implementation order

1. Inspect the existing Astro + shadcn project.
2. Keep existing project conventions.
3. Add/verify Supabase client setup.
4. Create CMS TypeScript models.
5. Implement build-time CMS data layer.
6. Normalize published content.
7. Build ProfileHeader.
8. Build generic link components.
9. Build section renderer.
10. Build project renderer.
11. Support many-to-many project sections.
12. Add CMS-driven metadata.
13. Add local profile image handling.
14. Implement `/go/:slug`.
15. Implement anonymous session cookie.
16. Implement click event writing.
17. Implement page-view endpoint.
18. Add minimal page-view client script.
19. Add error handling.
20. Run lint/typecheck/build.
21. Fix all issues.

---

# Acceptance criteria

The work is complete when:

* homepage builds with Astro SSG
* no homepage SSR is introduced
* public content is loaded from Supabase at build time
* only published CMS content is rendered
* profile data is CMS-driven
* section names are CMS-driven
* section order is CMS-driven
* primary links are CMS-driven
* social links are CMS-driven
* projects are CMS-driven
* one project may appear in multiple sections
* project ordering may differ between sections
* project descriptions are optional
* open-source projects use the same project renderer
* all project and standalone links use the unified links model
* trackable links use `/go/:slug`
* non-trackable links can use their direct destination
* invalid redirect slugs return 404
* tracking failures do not block redirects
* page views can be sent to the analytics backend
* link clicks can be sent to the analytics backend
* anonymous session cookies work
* Supabase privileged credentials never reach browser JavaScript
* no CMS/admin UI exists in this repository
* no analytics dashboard exists in this repository
* no project detail pages exist
* TypeScript passes
* production build passes

---

# Final instruction

Before making changes, inspect the current repository carefully.

Do not regenerate the Astro project.

Do not replace existing Tailwind, shadcn, Astro, or Netlify configuration unless genuinely necessary.

Reuse existing components and conventions where sensible.

Make the smallest clean set of changes needed to build the public link hub.

Do not add features outside this scope.

Priorities:

```text
1. clean architecture
2. static performance
3. CMS compatibility
4. tracking reliability
5. security
6. simple professional UX
```
