# Personal site

Portfolio site built with Jekyll 4 and deployed to GitHub Pages with GitHub Actions.
Content lives in YAML and Markdown: adding a project, a writeup, a timeline entry,
a certificate, a CTF or a menu tab never requires touching HTML, CSS or JavaScript.

- [Run it locally](#run-it-locally)
- [Deploy](#deploy)
- [How to add content](#how-to-add-content)
- [The date rule](#the-date-rule)
- [Field reference](#field-reference)
- [How it is built](#how-it-is-built)
- [Before you publish](#before-you-publish)

## Run it locally

Requirements: Ruby 3.1 or newer and Bundler.

```sh
bundle install
bundle exec jekyll serve
```

The site is served at <http://localhost:4000> and rebuilds when a file changes
(restart the server after editing `_config.yml`).

After the first `bundle install`, commit the generated `Gemfile.lock` so local
and CI builds use the same gem versions.

## Deploy

1. Push this repository to GitHub as `<username>.github.io`.
2. On GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Set `url` in `_config.yml` to `https://<username>.github.io` (your real username, without angle brackets).

Every push to `main` runs `.github/workflows/pages.yml` and updates the site in
1–2 minutes. You can also run the workflow by hand from the **Actions** tab.

## How to add content

Every recipe below is a single edit. IDs and folder names are kebab-case.
Dates are always quoted (see [the date rule](#the-date-rule)).

### A timeline entry

Add a block to `_data/timeline.yml`. `education` and `experience` are branches;
`hackathon` is a dot on the main line.

```yaml
- id: summer-internship-2026
  type: experience
  organization: Example Corp
  title: Security Intern          # the role you started with
  location: Porto, Portugal
  start: "2026-06"
  end: "2026-09"                  # leave empty while it is ongoing
  summary: One line shown in the list.
  details: |
    Longer **markdown** text shown in the dialog.
  links:
    - name: Example Corp
      url: https://example.com
```

### A promotion or milestone

Add an item to `milestones` of that entry. It is drawn as a commit on the
entry's branch; `kind: promotion` gives it the `↑` marker. For `experience`
entries the milestones are read as role changes, so the current role is the
title of the latest one.

```yaml
  milestones:
    - date: "2026-01-15"
      title: Project Manager
      kind: promotion             # omit for a plain milestone
      description: Leading a team of 5 on client projects.
```

### A certificate or award

Add a block to `_data/certificates.yml` and, if you have it, put the PDF in
`assets/docs/certificates/`.

```yaml
- id: oscp
  kind: certification             # certification | award | participation
  title: OSCP
  issuer: OffSec
  date: "2026-05"
  description: Optional sentence.
  file: /assets/docs/certificates/oscp.pdf
  verify_url: https://example.com/verify/123
  event: msc-information-security # optional: id from timeline.yml or ctfs.yml
```

With `event`, the certificate shows "Related: …" and the event's dialog lists
the certificate. You only write the link on the certificate.

### A project

Create `_projects/<slug>/index.md` and put its images in the same folder.
The page is published at `/projects/<slug>/`.

```markdown
---
title: My Project
summary: One line for the card.
start: "2026-01"
end: "2026-02"
categories: [security, web]
tech: [Go, PostgreSQL]
context: personal
status: completed
cover: cover.png
links:
  github: https://github.com/you/my-project
event: hackathon-x-2026          # optional
featured: false
---

Description in markdown. Images in this folder are referenced by file name:

![Architecture](architecture.png)
```

### A writeup

Create `_writeups/<ctf-id>/<category>/<challenge-slug>/index.md` and put its
images in the same folder. The page is published at the same path under
`/writeups/`. The CTF and the category come from the front matter; the folders
are only there to keep things tidy.

````markdown
---
title: Baby Pwn
ctf: picoctf-2025
category: pwn
difficulty: easy
points: 150
summary: Classic stack overflow into a win function.
tags: [bof, ret2win]
flag: "picoCTF{...}"
---

## Challenge

...

## Solution

![Crash in gdb](gdb.png)

```python
from pwn import *
```
````

Liquid is switched off inside projects and writeups, so payloads such as
`{{7*7}}` or `{% debug %}` can be pasted as they are.

### A new CTF

Add a block to `_data/ctfs.yml`. It appears on the writeups page as soon as a
writeup uses its `id`. With `in_person: true` it also appears on the timeline.

```yaml
- id: hacktheboo-2026
  name: Hack The Boo 2026
  start: "2026-10-23"
  end: "2026-10-25"
  in_person: false
  team: TeamName
  placement: 120th
  url: https://example.com
  ctftime: https://ctftime.org/event/0000
  summary: One line.
```

### A project category

Add a line to `_data/categories.yml`. The filter chip appears once a project
uses it. (CTF categories work the same way in `_data/ctf_categories.yml`.)

```yaml
- id: hardware
  name: Hardware
```

A category that is used but not listed still works: its id is shown as its name.

### A new tab in the menu

Create the page, for example `talks.md` in the repository root:

```markdown
---
layout: page
title: Talks
heading: ~/talks
permalink: /talks/
---

Content in markdown.
```

Then add a line to `_data/navigation.yml`:

```yaml
- title: Talks
  url: /talks/
```

### Change the order of the home sections

Reorder (or remove names from) the list in `_data/home.yml`:

```yaml
sections: [hero, about, timeline, interests, certificates, contact]
```

Each name maps to `_includes/home/<name>.html`.

## The date rule

- Dates have three precisions: `"2024"`, `"2024-10"` or `"2024-10-15"`.
- **Always quote them.** Without quotes YAML turns `2024-10-15` into a date object
  and `2024-10` into a string, and the two behave differently.
- They are shown with the precision you wrote: `2024`, `Oct 2024`, `15 Oct 2024`.
- Sorting is plain ISO string comparison, which works with mixed precisions.
- An empty or missing `end` means **Present**. For point events (hackathons,
  CTFs) an empty `end` simply means a single day.
- **Never use the key `date` in the front matter of projects or writeups.**
  Jekyll parses it strictly and rejects partial dates. Use `start` / `end`.
  (`date` is fine inside `_data/*.yml`.)

The formatting is implemented twice and must stay identical:
`_includes/date.html` (Liquid) and `assets/js/dates.js` (JavaScript).

## Field reference

"Required" fields are the ones the templates need to show something sensible.
Nothing here can break the build: a missing optional field is skipped and a
reference to an id that does not exist is ignored, leaving a
`<!-- build warning: ... -->` comment in the generated HTML.

### `_data/navigation.yml`

| Field | | Notes |
|---|---|---|
| `title` | required | Text of the tab. |
| `url` | required | Site path (`/projects/`) or a full external URL. |

### `_data/home.yml`

| Field | | Notes |
|---|---|---|
| `sections` | required | Ordered list. Allowed: `hero`, `about`, `interests`, `timeline`, `certificates`, `contact` (any file in `_includes/home/`). |

### `_data/profile.yml`

| Field | | Notes |
|---|---|---|
| `name` | required | Shown in the header, hero and footer. |
| `headline` | required | Output of `$ whoami` in the hero. |
| `location` | optional | Second line of the hero terminal. |
| `photo` | optional | Site path to the picture. |
| `cv` | optional | Site path to the PDF behind "Download CV". |
| `bio` | required | Markdown, shown in `~/about`. |
| `interests` | optional | List of strings, shown as chips. |
| `socials` | optional | Map of `name: url`. `github` and `linkedin` also become hero buttons. `email` is assembled by JavaScript and never written to the HTML as plain text. Any other key is listed with its name capitalised. |

### `_data/timeline.yml`

| Field | | Notes |
|---|---|---|
| `id` | required | Unique across `timeline.yml` **and** `ctfs.yml`. |
| `type` | required | `education` (branch on the right), `experience` (branch on the left), `hackathon` (dot on main). `volunteering` is reserved: for now it is drawn like `experience`. |
| `title` | required | Degree, starting role, or event name. |
| `organization` | required for `experience` | School, company or organizer. For `experience` it is the name of the branch. |
| `start` | required | Date. |
| `end` | optional | Date. Empty = Present (branches) or a single day (hackathons). |
| `location` | optional | |
| `summary` | optional | One line for the list view and the dialog. |
| `details` | optional | Markdown, dialog only. |
| `tag` | optional | One label shown as a chip (e.g. `Student organization`). |
| `tags` | optional | List of labels shown as chips. |
| `links` | optional | List of `{ name, url }`, external. |
| `milestones` | optional | List of `{ date (required), title (required), kind, description }`. `kind`: `promotion` or omitted. |
| `result` | optional | Hackathons: shown as a badge (`2nd place`). |
| `highlight` | optional | `true` turns the result badge gold. |
| `projects` | optional | List of project slugs (folder names). |
| `writeups` | optional | List of writeup slugs (folder names). If two writeups share a folder name, use the full path, e.g. `picoctf-2025/web/cookie-monster`. |
| `short` | optional | Short name for the faint "merge" line. Default: the title up to " in " (`BSc in …` → `BSc`). |

### `_data/ctfs.yml`

| Field | | Notes |
|---|---|---|
| `id` | required | Unique across `ctfs.yml` **and** `timeline.yml`. Writeups point to it with `ctf:`. |
| `name` | required | |
| `start` | required | Date. |
| `end` | optional | Date. |
| `in_person` | optional | `true`: also shown on the timeline as an achievement, with an "On-site" badge. Default `false`. |
| `location`, `team`, `placement`, `summary` | optional | `placement` is shown as the result badge. |
| `highlight` | optional | `true` turns the badge gold on the timeline. |
| `url`, `ctftime` | optional | External links. |

### `_data/certificates.yml`

| Field | | Notes |
|---|---|---|
| `id` | required | Unique in this file. |
| `kind` | optional | `certification` (default), `award`, `participation`. |
| `title` | required | |
| `issuer` | optional | |
| `date` | optional | Date. Certificates are listed newest first. |
| `description` | optional | |
| `file` | optional | Site path to the PDF ("View certificate"). |
| `verify_url` | optional | External URL ("Verify ↗"). |
| `event` | optional | An `id` from `timeline.yml` or `ctfs.yml`. |

### `_data/categories.yml` and `_data/ctf_categories.yml`

| Field | | Notes |
|---|---|---|
| `id` | required | What you write in front matter. |
| `name` | required | What the site shows. The order of the file is the order of the filter chips. |

### Project front matter (`_projects/<slug>/index.md`)

| Field | | Notes |
|---|---|---|
| `title` | required | |
| `summary` | optional | Card text and page description. |
| `start` | optional | Date. Used for ordering (newest first). |
| `end` | optional | Date. Empty = Present. |
| `categories` | optional | List of ids from `categories.yml`. Several allowed. |
| `tech` | optional | List of strings. Searchable. |
| `context` | optional | `school`, `personal`, `hackathon`, `professional`. |
| `course` | optional | Shown next to the context (for `school`). |
| `team`, `role` | optional | |
| `status` | optional | `completed`, `in-progress`, `archived`. |
| `cover` | optional | Image file name, relative to the project folder. |
| `links` | optional | Map: `github`, `demo`, `report`, `video` (any key works; empty ones are skipped). |
| `event` | optional | An `id` from `timeline.yml` or `ctfs.yml`. |
| `featured` | optional | `true` lists the project first. |

### Writeup front matter (`_writeups/<ctf-id>/<category>/<slug>/index.md`)

| Field | | Notes |
|---|---|---|
| `title` | required | |
| `ctf` | required | An `id` from `ctfs.yml`. |
| `category` | required | An id from `ctf_categories.yml`. |
| `difficulty` | optional | `easy`, `medium`, `hard`, `insane`. |
| `points` | optional | Number. Writeups of a CTF are ordered by category, then points. |
| `summary` | optional | Dialog text and page description. |
| `tags` | optional | List of strings. Searchable. |
| `flag` | optional | Quoted string, hidden behind "Reveal flag". |

## How it is built

```
_config.yml              site settings, collections, timeline.default_order
_data/                   all structured content (see the field reference)
_projects/, _writeups/   one folder per item: index.md + its images
_layouts/                default, page, project, writeup
_includes/               header, footer, modal, date, cards, helpers, home/<section>
_plugins/                folder_documents.rb (permalinks for folder-based documents)
assets/css/tokens.css    every colour, font, radius and spacing value
assets/css/main.css      all other styles, built on the tokens
assets/js/               main, modal, filters, timeline, dates (ES modules, no dependencies)
assets/fonts/            JetBrains Mono, self-hosted (SIL Open Font License, see OFL.txt)
```

- **Rendering.** Everything is rendered by Liquid at build time. JavaScript only
  adds the modal, the filters, the timeline graph and small conveniences (copy
  buttons, mobile menu, email link). Without JavaScript every page stays readable:
  cards link to their own pages and the timeline is a plain list.
- **No requests for data.** The timeline graph reads JSON embedded in the page;
  modal content sits in `<template>` elements rendered by Liquid.
- **Theme.** Edit `assets/css/tokens.css` only. A light theme can be added by
  overriding the colour tokens under a `[data-theme="light"]` selector.
- **Timeline order.** `timeline.default_order` in `_config.yml` is `newest` or
  `oldest`; visitors can flip it with the button next to the filters.
- **Plugin.** `_plugins/folder_documents.rb` publishes `_projects/foo/index.md`
  at `/projects/foo/` (Jekyll's `:path` placeholder would give `/projects/foo/index/`
  and break relative image paths). It also sets `slug`, `ref` and `uid` on every
  project and writeup. Custom plugins are the reason the site is built by GitHub
  Actions rather than the classic Pages builder.
- **No tracking.** No analytics, no third-party requests, no npm.
