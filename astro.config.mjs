// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	// Deployed to GitHub Pages as a project site, so every URL lives under /clickhouse-guide/.
	// Starlight applies `base` to the sidebar and its own links, but not to links written in
	// Markdown, which is why content links start with /clickhouse-guide/.
	site: 'https://sydneydoyle.github.io',
	base: '/clickhouse-guide',
	integrations: [
		starlight({
			title: 'Getting started with ClickHouse',
			description:
				'A small, hands-on guide to loading data into ClickHouse and running your first queries.',
			// Customization hook: overrides Starlight's CSS variables (see src/styles/custom.css).
			customCss: ['./src/styles/custom.css'],
			// Component override: shows each page's description as a lead under the title.
			components: { PageTitle: './src/components/PageTitle.astro' },
			// The sidebar is listed explicitly so the reading order is intentional,
			// rather than alphabetical (which is what `autogenerate` would give you).
			sidebar: [
				{
					label: 'Get started',
					items: [
						{ label: 'What is ClickHouse?', link: '/' },
						{ label: 'Quickstart', slug: 'quickstart' },
					],
				},
				{
					label: 'Start here by role',
					items: [
						{ label: 'Analysts', slug: 'guides/analysts' },
						{ label: 'Data engineers', slug: 'guides/data-engineers' },
					],
				},
				{
					label: 'Understand how it works',
					items: [{ label: 'How ClickHouse stores data', slug: 'concepts' }],
				},
				{ label: 'Troubleshooting', slug: 'troubleshooting' },
				{
					label: 'About this site',
					items: [{ label: 'Engineering notes', slug: 'engineering-notes' }],
				},
			],
		}),
	],
});
