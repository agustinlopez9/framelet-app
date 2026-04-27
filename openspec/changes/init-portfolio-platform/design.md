## Context

The repository is empty: no application code, no toolchain, no backend. The proposal commits to a Vite + React + TypeScript SPA with Tailwind and shadcn/ui, and to a "template-as-renderer" abstraction where one portfolio's content can be re-rendered by any registered template. Every later change in this project will inherit the foundations chosen here, so the design must cover client structure, the template contract, persistence, auth, and image storage as a coherent whole.

The target user is a single creative (model, photographer, stylist) publishing one portfolio with up to a few hundred images. We need to be deployable end-to-end (signup → upload → public URL) without standing up a custom backend.

## Goals / Non-Goals

**Goals:**
- A buildable, type-safe, lint-clean SPA scaffold with conventions documented in code (folder layout, path aliases, formatting).
- A *typed template contract* that any future showcase template can implement — the contract is the only thing future templates must agree on.
- An end-to-end happy path: signup → set handle/title → upload images → pick a template → publish → view at `/u/:handle`.
- Three templates that exercise the contract from different angles: a flat grid, a side-titled editorial layout, and a 3D gallery — proving the contract is general.
- Image upload that tolerates slow connections (progress, retry, cancel) and reasonable file-size limits.

**Non-Goals:**
- Server-side rendering, SEO meta-tag generation, custom domains, monetization, multiple portfolios per user, video/audio assets, social features, analytics. All deferred to later changes.
- Pixel-perfect template polish — templates need to be clearly distinct and functional, not finished products.

## Decisions

### Decision: Use Supabase for auth, Postgres, and image storage
**What**: Supabase provides email/password auth, a Postgres database accessed via PostgREST, and S3-compatible object storage with signed-URL uploads — all from a single SDK.
**Why**: The MVP needs auth, a relational store for portfolios/images, and large-blob storage. Supabase delivers all three behind one client and one billing surface, with a free tier that comfortably covers early users. Postgres keeps the door open to richer queries (search, tags, multi-portfolio) without a migration to another store later.
**Alternatives considered**:
- *Firebase* — equivalent feature set, but Firestore's document model would force us to denormalize the image-ordering and tagging schema we already know we need.
- *Custom Node + Postgres + S3* — most flexible, slowest to ship; rejected for an MVP.
- *Local-only mock backend* — fastest to scaffold but we'd build the integration twice.

### Decision: Define `Template` as a typed React component plus metadata
**What**: A template is `{ id: string; name: string; description: string; thumbnail: string; Component: React.FC<TemplateProps>; defaultConfig: TemplateConfig }`. `TemplateProps` is `{ portfolio: Portfolio; images: PortfolioImage[]; config: TemplateConfig }`. Templates live under `src/templates/<id>/` and self-register into `src/templates/registry.ts`.
**Why**: Treating templates as plain React components keeps the contract minimal, avoids a custom DSL, and lets templates pull in template-specific dependencies (e.g. Three.js) without leaking them into the host app.
**Alternatives considered**:
- *JSON-driven templates with a fixed renderer* — too rigid for visually distinct layouts (3D would not fit).
- *MDX templates* — flexible but adds a build pipeline and a learning curve for template authors.

### Decision: One portfolio per user for the MVP
**What**: The `portfolios` table has a unique constraint on `owner_id`. The handle is stored on `users` and used to resolve the public route.
**Why**: Removes a layer of UI (portfolio picker, slug routing within an account) without closing the door — adding multi-portfolio later only requires dropping the unique constraint and adding a slug column.

### Decision: Direct-to-storage upload via signed URLs
**What**: The client requests a signed upload URL from Supabase Storage and PUTs the file directly. Only the resulting object path + metadata is written to Postgres.
**Why**: Avoids streaming megabytes through any custom backend, keeps upload latency low, and gives us per-file progress/cancel for free via `XMLHttpRequest`/`fetch` streaming.
**Trade-off**: The bucket must enforce per-user path prefixes via a row-level-security policy so a user cannot overwrite another user's files.

### Decision: Lazy-load the 3D template
**What**: `gallery-3d` is imported via `React.lazy` and registered with a loader function rather than an eager `Component` reference.
**Why**: Three.js + drei adds ~600KB gzipped. Users on the grid or side-titles templates should not pay that cost. The registry exposes `loadComponent(): Promise<React.FC<TemplateProps>>` for templates that opt into lazy loading; eager templates wrap their component in `Promise.resolve`.

### Decision: shadcn/ui component vendoring
**What**: shadcn components are copied into `src/components/ui/` via the shadcn CLI and tracked in source control. Tailwind config is the project's source of truth for tokens.
**Why**: shadcn is a vendoring pattern, not an npm dependency. Keeping components in-repo lets templates restyle them when needed without forking.

### Decision: Path aliases via `@/`
**What**: `tsconfig.json` and `vite.config.ts` map `@/*` to `src/*`. This matches shadcn defaults and survives folder moves.

### Decision: Validation with Zod, forms with React Hook Form
**What**: Every form (signup, profile, upload metadata) uses `react-hook-form` with a Zod resolver. Zod schemas double as runtime guards for any data crossing the network boundary.
**Why**: Single source of truth for shape + validation; integrates cleanly with shadcn's `Form` primitives.

### Decision: Routing with React Router v6
**What**: `react-router-dom` v6 with a layout-route split: a public layout for `/`, `/login`, `/signup`, `/u/:handle`; an authed layout (with `<RequireAuth>`) for `/dashboard/*`.
**Why**: Idiomatic for an SPA, no SSR needed, handles the protected-route pattern via outlet layouts.

### Decision: Folder layout
```
src/
  app/                  # router setup, providers, root layouts
  components/ui/        # shadcn primitives
  components/           # app-level shared components
  features/
    auth/               # signup/login forms, session hook
    portfolio/          # portfolio CRUD, image upload, dashboard pages
    public-showcase/    # public route resolver, template host
  templates/
    registry.ts
    types.ts            # Template, TemplateProps, TemplateConfig
    simple-grid/
    side-titles/
    gallery-3d/
  lib/
    supabase.ts         # singleton client
    api/                # typed wrappers: portfolios, images, auth
  hooks/
  types/                # shared domain types: Portfolio, PortfolioImage, User
```

## Risks / Trade-offs

- **3D bundle weight** → Mitigation: lazy-load `gallery-3d`; show a lightweight skeleton until it resolves.
- **Image upload reliability on slow connections** → Mitigation: per-file progress, cancel, and retry; cap file size at 10MB and reject unsupported MIME types client-side before requesting a signed URL.
- **Public route enumeration / unpublished leaks** → Mitigation: a Postgres RLS policy gates `select` on `portfolios` to `published = true OR owner_id = auth.uid()`. Storage objects under unpublished portfolios remain reachable by direct URL — accepted for MVP since URLs are unguessable UUIDs; a follow-up change can introduce signed read URLs if needed.
- **Vendor lock-in to Supabase** → Mitigation: data access is funneled through `src/lib/api/` so swapping providers means rewriting that layer, not the UI.
- **Template contract churn** → Mitigation: the contract is captured in `src/templates/types.ts` and treated as a stability surface; spec changes that alter `TemplateProps` must go through a follow-up OpenSpec change.
- **Three templates may not be enough to validate the contract is general** → Mitigation: the three were chosen to span layout primitives (grid), text-image relationships (side rail), and rendering paradigm (WebGL). If a fourth template forces a contract change during implementation, that is a signal to revisit `TemplateProps` before shipping.

## Migration Plan

Greenfield change — no migration. Deployment is a static build of the SPA (any static host) plus a Supabase project (one-time provisioning). Rollback = redeploy previous static bundle; the database schema is created from versioned SQL migrations checked into the repo.

## Open Questions

- Free-tier Supabase storage caps egress and total volume; at what user count do we revisit?
- Should `gallery-3d` support touch / mobile gestures in this first cut, or fall back to a swipeable carousel on small viewports? (Tasks default to: fall back on mobile, full 3D on `pointer: fine`.)
- Image transformations (thumbnails for the dashboard list) — use Supabase's image transform endpoint or render full images at smaller sizes? Defaulting to Supabase transforms; revisit if pricing shifts.
