# Getting started with ClickHouse

A small, hands-on documentation site for new ClickHouse users, built with [Astro](https://astro.build) and [Starlight](https://starlight.astro.build).

**Live site:** https://sydneydoyle.github.io/clickhouse-guide/

## What's in it

| Page | Purpose |
| --- | --- |
| What is ClickHouse? (home) | What ClickHouse is, when to use it, and where to start by role |
| Quickstart | Run ClickHouse locally, load 1M rows of synthetic data, run a first query |
| Analysts, Data engineers | Role guides: the tools you use, what others set up, and tested first tasks |
| How ClickHouse stores data | Columns, parts, merges, the sorting key, `LowCardinality` |
| Troubleshooting | Problems found while actually testing the quickstart, and how each was found |
| Engineering notes | How the site is built, validated and deployed |

## How the content was tested

The quickstart was run end to end against ClickHouse 26.12 on macOS (Apple Silicon). Every SQL snippet was executed and real output is quoted on the page. Claims in the text, such as how `rand()` behaves and how the sorting key lets queries skip data, were each checked with a query. See [Engineering notes](https://sydneydoyle.github.io/clickhouse-guide/engineering-notes/) for details and what is not yet tested.

## Run it locally

Requires Node.js 22.23.4 or later (Astro 7's minimum).

```sh
npm install
npm run dev      # http://localhost:4321/clickhouse-guide/
npm run build    # production build into dist/
npm run preview  # serve the production build
```

## Project layout

```
astro.config.mjs           Site config: title, sidebar, base path, custom CSS
src/content/docs/          One Markdown/MDX file per page; file path = URL
src/styles/custom.css      Theme color overrides (Starlight CSS variables)
.github/workflows/         GitHub Pages deploy
```
