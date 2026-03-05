# CLAUDE.md

This file provides guidance for AI assistants working in this codebase.

## Product Vision

This project is evolving into a **group decision-making platform** — a web app that helps teams, communities, and groups reach collective decisions efficiently and fairly.

### Core Purpose

Users come to the platform when a group needs to make a decision together. The platform provides multiple decision-making mechanisms, from simple polls to more rigorous scientific methods, so groups can choose the approach best suited to their situation.

### Decision-Making Methods to Support

- **Polls** — simple majority/plurality voting on options
- **Ranked-choice voting** — voters rank options; winners determined by instant-runoff or Borda count
- **Approval voting** — voters approve any number of options; most approved wins
- **Weighted voting** — participants assigned different vote weights (e.g. by stake or expertise)
- **Consensus / Delphi method** — iterative rounds where participants refine estimates until convergence
- **Quadratic voting** — participants distribute a budget of vote credits across options
- **Priority matrix** — pairwise comparisons to rank options by impact vs. effort

### Key User Flows

1. **Create a decision** — set a question, choose a method, define options, set a deadline
2. **Invite participants** — share a link; participants join without requiring an account (or with one)
3. **Vote / respond** — UI adapts to the selected method
4. **View results** — real-time results with visualizations; method-appropriate outcome calculation
5. **Archive** — past decisions stored and browsable

### Design Principles

- **Method transparency** — explain each voting method clearly so users understand what they're choosing and why it matters
- **Accessibility first** — decisions should be easy to participate in on any device
- **No dark patterns** — results are shown honestly; no nudging toward any outcome
- **Stateless participation** — participants should be able to vote via a shared link without friction

---

## Project Overview

**astro-platform-starter** is the technical foundation for the group decision-making platform, built on Astro.js and deployed on Netlify.

- **Framework:** Astro 5 + React 18 + Tailwind CSS 4 + TypeScript
- **Adapter:** `@astrojs/netlify` (SSR via Netlify Functions)
- **Storage:** Netlify Blobs (decisions, votes, participant data)

---

## Development Commands

```bash
# Preferred: uses Netlify CLI for full platform feature support (blobs, edge functions)
netlify dev          # Starts dev server at localhost:8888

# Standard Astro commands
npm run dev          # Dev server at localhost:4321 (no Netlify context)
npm run build        # Production build to ./dist/
npm run preview      # Preview production build locally
```

> **Important:** Use `netlify dev` (not `npm run dev`) when working with Netlify Blobs, Edge Functions, or cache APIs. These features require the Netlify CLI to inject context.

---

## Repository Structure

```
astro-platform-starter/
├── netlify/
│   └── edge-functions/
│       └── rewrite.js          # Geo-routing edge function
├── public/
│   ├── favicon.svg
│   └── images/
│       ├── corgi.jpg           # Sample image for CDN demo
│       └── noise.png           # Background texture
├── src/
│   ├── assets/
│   │   └── corgi.jpg           # Astro-optimized image source
│   ├── components/             # Reusable Astro components
│   ├── layouts/
│   │   └── Layout.astro        # Root layout (header + footer + slot)
│   ├── pages/
│   │   ├── index.astro
│   │   ├── image-cdn.astro
│   │   ├── revalidation.astro
│   │   ├── api/                # API route handlers
│   │   ├── blobs/              # Blob storage demo
│   │   └── edge/               # Edge function geo-routing demo
│   ├── styles/
│   │   └── globals.css         # Global Tailwind + custom theme
│   ├── types.ts                # Shared TypeScript types
│   └── utils.ts                # Shared utility functions
├── astro.config.mjs
├── tsconfig.json
├── .prettierrc
└── package.json
```

---

## Key Architecture Patterns

### Pages and Routing

- Astro uses **file-based routing** under `src/pages/`
- Pages that must be server-rendered (dynamic data, API calls at request time) must export:
  ```ts
  export const prerender = false;
  ```
- API routes export named handler functions (`GET`, `POST`, etc.) typed as `APIRoute`

### Component Types

**Astro components** (`.astro`) — use for layouts, static/SSR UI, and server-side logic:
```astro
---
interface Props { title: string; }
const { title } = Astro.props;
---
<h1>{title}</h1>
```

**React components** (`.tsx`) — use for interactive client-side UI:
```tsx
import { useState } from 'react';
export default function Counter() { ... }
```

React components used in Astro pages require a `client:*` directive:
```astro
<ShapeEditor client:load />
```

### API Routes Pattern

```ts
import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    const data = await request.json();
    // ...
    return new Response(JSON.stringify({ result }), {
        headers: { 'Content-Type': 'application/json' }
    });
};
```

### Netlify Blobs

```ts
import { getStore } from '@netlify/blobs';

const store = getStore('shapes');                  // basic (eventual consistency)
const store = getStore({ name: 'shapes', consistency: 'strong' }); // strong consistency

await store.setJSON(key, value);
const item = await store.get(key, { type: 'json' });
const list = await store.list();                  // returns { blobs: [{ key }] }
```

### Cache Revalidation

The `cacheHeaders()` utility in `src/utils.ts` sets CDN cache headers with tags:
```ts
import { cacheHeaders } from '../utils';
Astro.response.headers.set('Cache-Control', ...cacheHeaders(365, ['my-tag']));
```

Purge a tag via the API:
```ts
import { purgeCache } from '@netlify/functions';
await purgeCache({ tags: ['my-tag'] });
```

### Edge Functions

Edge functions live in `netlify/edge-functions/` and export a default handler plus a `config`:
```js
export default async (request, context) => {
    const country = context.geo?.country?.code;
    return Response.redirect(new URL('/some-path', request.url));
};
export const config = { path: '/edge' };
```

---

## Code Style & Conventions

### Formatting (Prettier)

- **Indent:** 4 spaces (2 for `.md`, `.yaml`)
- **Quotes:** Single quotes
- **Trailing commas:** None
- **Print width:** 160

Run Prettier: `npx prettier --write .`

### Naming

| Kind | Convention | Example |
|---|---|---|
| Components | PascalCase | `ShapeEditor.tsx`, `Alert.astro` |
| Functions/variables | camelCase | `generateBlob()`, `uploadDisabled` |
| TypeScript types/interfaces | PascalCase | `BlobProps`, `BlobParameterProps` |
| CSS classes | kebab-case | `diff-resizer`, `bg-primary` |
| API route files | camelCase | `blob.ts`, `blobs.ts` |

### TypeScript

- Shared types live in `src/types.ts`
- Use `import type` for type-only imports
- React component props are typed with inline interfaces
- Astro component props use `interface Props` inside the frontmatter

### Imports Order (conventional)

1. Framework imports (`astro`, `react`)
2. Third-party packages
3. Internal aliases / relative paths
4. Type imports (separate `import type` statements)

---

## Styling

Styling uses **Tailwind CSS v4** with a custom theme defined in `src/styles/globals.css` using the `@theme` directive:

```css
@theme {
    --color-primary: #f67280;
    --color-complementary: #355c7d;
}
```

**Global utility classes defined in `globals.css`:**

- `.btn` — base button style
- `.btn-primary` — primary colored button
- `.markdown` — prose content with spacing
- Heading styles (`h1`–`h4`) applied globally

When adding new pages, import `globals.css` via the `Layout.astro` layout (already included).

---

## Environment Variables

| Variable | Purpose | Default |
|---|---|---|
| `PUBLIC_DISABLE_UPLOADS` | Set to `"true"` to disable blob uploads | unset (uploads enabled) |
| `CONTEXT` | Injected by Netlify — deployment context (`dev`, `deploy-preview`, `production`) | unset locally |

- `PUBLIC_` prefix makes variables available on the client side (Astro convention)
- `.env` and `.env.production` are gitignored

---

## Feature Flags

```ts
import { uploadDisabled } from '../utils';
// uploadDisabled === (process.env.PUBLIC_DISABLE_UPLOADS === 'true')
```

---

## Shared Utilities (`src/utils.ts`)

| Function | Description |
|---|---|
| `getNetlifyContext()` | Returns current Netlify deploy context string |
| `randomInt(min, max)` | Inclusive random integer |
| `uniqueName()` | Generates `adjective-animal-###` style unique names |
| `generateBlob(parameters?)` | Creates a random blob SVG with gradient |
| `cacheHeaders(maxAgeDays, cacheTags)` | Returns CDN cache-control header value |
| `uploadDisabled` | Boolean flag from `PUBLIC_DISABLE_UPLOADS` env var |

---

## No Test Suite

There is currently no testing framework configured. When adding tests, **Vitest** is the recommended choice for Astro projects.

---

## Deployment

This project deploys to **Netlify**. The Netlify adapter is configured in `astro.config.mjs`:
```js
import netlify from '@astrojs/netlify';
export default defineConfig({
    adapter: netlify(),
    integrations: [react()],
    vite: { plugins: [tailwindcss()] }
});
```

Deploy button available in README.md. Automated dependency updates are managed by Renovate (`renovate.json`).

---

## VS Code Setup

The `.vscode/` directory configures:
- Format on save with Prettier
- ESLint auto-fix on save
- `*.css` files treated as Tailwind CSS for IntelliSense
- Recommended extension: `astro-build.astro-vscode`

Install the [Astro VS Code extension](https://marketplace.visualstudio.com/items?itemName=astro-build.astro-vscode) for syntax highlighting and IntelliSense in `.astro` files.
