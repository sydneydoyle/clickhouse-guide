---
title: Engineering notes
description: How this documentation site was built and validated.
---

This page explains how the site itself works: the tooling, how it's put together, and how the content is checked.

## Stack

- **[Astro](https://astro.build)**: a static site generator. It turns the Markdown in `src/content/docs/` into plain HTML at build time.
- **[Starlight](https://starlight.astro.build)**: an Astro integration that adds a docs layout, sidebar, search, dark mode, and components like `<Steps>`, `<Tabs>` and `<Aside>`.

## How the pieces fit

| File | What it does |
| --- | --- |
| `astro.config.mjs` | Registers Starlight; sets the site title, sidebar order and custom CSS |
| `src/content.config.ts` | Defines the `docs` content collection and its frontmatter schema (Astro feature) |
| `src/content/docs/*.md(x)` | One file per page. The file path becomes the URL |
| `src/styles/custom.css` | Overrides Starlight's `--sl-color-accent*` CSS variables to change the theme color |

**Astro vs. Starlight, in one line:** Astro decides how a Markdown file becomes a page (content collections, routing, MDX). Starlight decides what that page looks like and what navigation surrounds it.

### Markdown vs. MDX

Pages that only need text, tables and callouts are `.md`. Pages that import components (the home page's cards, the quickstart's `<Steps>` and `<Tabs>`) are `.mdx`. Starlight's `:::note` callout syntax works in both.

### Customizations made

1. **Explicit sidebar.** Listed by hand in `astro.config.mjs` rather than `autogenerate`, and grouped by what the reader wants to do: get started, start by role, understand how it works, fix problems.
2. **Theme color.** Accent color changed in `src/styles/custom.css`, with separate values for light and dark mode.
3. **Page lead.** Starlight only puts a page's `description` in its `<meta>` tags. `src/components/PageTitle.astro` overrides Starlight's built-in title component to also show it under the title, so every page opens with a one-sentence summary. It wraps the original component rather than copying it, so Starlight updates still apply.
4. **Synced tabs.** The quickstart's install tabs share `syncKey="install"`, so picking "Docker" once switches every tab group on the page.

## Content model

Each page follows one of five page types. Each type has a fixed structure, so readers learn where to look, and a new page has a pattern to follow.

| Page type | Purpose | Structure | Example |
| --- | --- | --- | --- |
| **Welcome** | Answer "what is this?" and route readers to the right start | One-sentence definition, "With ClickHouse, you can:", how the parts fit in one example, start-by-role table, grouped list of pages | [What is ClickHouse?](/clickhouse-guide/) |
| **Quickstart** | Take a reader from nothing to one working result | Overview with one running example, "Before you begin", numbered steps with a reason for each, a separate step to confirm it worked, options to go further, next steps | [Quickstart](/clickhouse-guide/quickstart/) |
| **Role guide** | Orient one kind of reader | How the work runs, "Find your way around" table, "Before you begin", "yourself vs. requires setup" table, "Find the docs for your task" table, troubleshooting, next steps | [Analysts](/clickhouse-guide/guides/analysts/) |
| **Concept overview** | Explain how something works and when to use it | Terms defined with one example, "When to use" tables, what happens step by step, why numbers differ, get started | [How ClickHouse stores data](/clickhouse-guide/concepts/) |
| **Troubleshooting** | Fix one problem per entry | When it happens, what you see, cause, fix, how I found it | [Troubleshooting](/clickhouse-guide/troubleshooting/) |

### Writing conventions

- Second person and present tense: "You load the file," not "The user will load the file."
- Headings name the task or question, in sentence case.
- Each step starts with a verb, and says why it matters when that isn't obvious.
- Tables for comparisons and lookups; prose for explanations.
- One running example per page, carried through every step.
- Every number on a page comes from a query that was actually run.

## Validation

| Check | How | Status |
| --- | --- | --- |
| Site builds with no errors | `npm run build` | Passing |
| Internal links resolve | Every internal link in the built output checked against the generated files | Passing (24 Nov 2026) |
| External links resolve | Every ClickHouse docs link checked for a 200 response, using the final URL after redirects | Passing (24 Nov 2026) |
| Quickstart runs end to end (single binary) | Followed on macOS, Apple Silicon, ClickHouse 26.12.1.349; problems recorded in [Troubleshooting](/clickhouse-guide/troubleshooting/) | Passing (24 Nov 2026) |
| Quickstart runs end to end (Docker) | Same, using the Docker tabs | **Not yet run** |
| SQL returns the stated results | Every snippet on every page run against the server and compared with the text | Passing (24 Nov 2026) |
| Claims in the text are true | `rand()` behavior, index skipping, parts and merges, and column sizes each checked with a query; results quoted on the page | Passing (24 Nov 2026) |

### How the quickstart was tested

1. Downloaded the install script to a file and read it before running it. That turned up two undocumented behaviors (see Troubleshooting).
2. Ran each step exactly as written, in a fresh folder, pasting the SQL straight from the page.
3. Where a page explains *why* something happens, ran a query that would show it if it were wrong, and quoted the real output.
4. Recorded every surprise as a Troubleshooting entry, including how it was found.

### Ideas for stronger validation

- Add [`starlight-links-validator`](https://github.com/HiDeoo/starlight-links-validator) so a broken internal link fails the build.
- Put every SQL snippet in a `.sql` file and run them all with `clickhouse client --multiquery < file.sql` in CI, so the docs can't drift from what ClickHouse actually accepts.
- Deploy previews on every pull request (Netlify, Vercel or Cloudflare Pages all support Astro).

## Deployment

The site is hosted on GitHub Pages at `https://sydneydoyle.github.io/clickhouse-guide/`.

- `.github/workflows/deploy.yml` runs on every push to `main`. It builds the site with the official `withastro/action` and publishes the output with `actions/deploy-pages`.
- Because it's a *project* site (served from a subpath, not the domain root), `astro.config.mjs` sets `site` and `base: '/clickhouse-guide'`. Starlight applies `base` to the sidebar, search and assets, but **not** to links written in Markdown, so content links include the `/clickhouse-guide/` prefix. Forgetting that prefix gives links that work in some places and 404 in others, which is a good example of a bug that a link checker would catch.

## Run it locally

```sh
npm install
npm run dev      # http://localhost:4321/clickhouse-guide/, live reload
npm run build    # writes the static site to dist/
npm run preview  # serves dist/ to check the production build
```
