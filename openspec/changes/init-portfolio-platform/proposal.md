## Why

Visual creatives like models, photographers, and stylists need a fast way to publish a polished image-driven portfolio without hand-rolling a website. Existing builders are either generic page makers or rigid template marketplaces — neither lets a creative pick a *display style* (e.g. immersive 3D gallery, minimalist grid, side-titled editorial) and swap it instantly while keeping the same content. Framelet's wedge is the *template-as-renderer* model: one portfolio, many showcase presentations.

This change bootstraps the platform from an empty repo to a deployable MVP that can be shown to early users.

## What Changes

- Scaffold a Vite + React + TypeScript single-page app at the repo root, wired with Tailwind CSS and shadcn/ui as the component library.
- Introduce client-side routing with public portfolio pages (`/u/:handle`) and authenticated owner pages (`/dashboard`, `/dashboard/upload`, `/dashboard/templates`).
- Add account creation, login, and session handling so each portfolio belongs to an owner.
- Add image upload with drag-and-drop, ordering, captions, and basic metadata (title, description, tags) per image.
- Introduce a **template registry**: a typed contract any showcase template implements, so a portfolio can be re-rendered by switching templates without re-uploading assets.
- Ship three initial templates that prove the contract is general enough:
  - `simple-grid` — responsive masonry grid (default).
  - `side-titles` — full-bleed images with editorial captions in a side rail.
  - `gallery-3d` — WebGL/Three.js immersive carousel.
- Public portfolio pages render the owner's selected template; owners can preview and switch templates from the dashboard.
- Owners can mark a portfolio as published or unlisted; unpublished portfolios return 404 to the public.

## Capabilities

### New Capabilities
- `auth`: account signup, login, logout, and session-based access control for owner-only routes.
- `portfolio-management`: CRUD for a portfolio's metadata, images (upload, reorder, caption, delete), and publish state.
- `template-system`: the typed template contract, the registry, and the three initial showcase templates plus the per-portfolio template selection.
- `public-showcase`: the public read path that resolves a handle to a published portfolio and renders it through the owner's chosen template.

### Modified Capabilities
<!-- None — this is a greenfield change. -->

## Impact

- Affected code: the entire repo. This change defines the source layout (`src/`), tooling (Vite, ESLint, Prettier, Vitest), and the conventions every later change inherits.
- Dependencies introduced: `react`, `react-dom`, `react-router-dom`, `typescript`, `vite`, `tailwindcss`, `@radix-ui/*` (via shadcn), `lucide-react`, `zod`, `react-hook-form`, `three` and `@react-three/fiber` (for `gallery-3d`), an HTTP client, and a backend-as-a-service or local mock for auth + storage (decision deferred to `design.md`).
- APIs: defines the shape of the template contract — once published this is a stability surface for future templates.
- Systems: introduces the need for image storage and a session store; `design.md` picks the concrete services.
- Out of scope (future changes): custom domains, paid plans / monetization, analytics, SEO/OG image generation, comments or social features, multi-portfolio per user, video assets.
