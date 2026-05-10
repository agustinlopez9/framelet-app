# Framelet

A portfolio platform for visual creatives (models, photographers, stylists). Each user gets one portfolio they can render through different showcase templates — minimalist grid, side-titled editorial, immersive 3D — without re-uploading anything.

## Stack

- Vite + React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- React Router v6, React Query, React Hook Form + Zod
- Supabase (auth, Postgres, storage)
- Three.js + @react-three/fiber for the 3D template

## Setup

```bash
cp .env.example .env
# fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm install
```

Provision the schema and storage bucket by running every file in `supabase/migrations/` in order against your Supabase project (SQL editor or `supabase db push`).

## Scripts

| Command             | Purpose                                    |
| ------------------- | ------------------------------------------ |
| `npm run dev`       | Start the Vite dev server.                 |
| `npm run build`     | Type-check and produce a production build. |
| `npm run preview`   | Preview the production build locally.      |
| `npm run typecheck` | Run `tsc -b --noEmit`.                     |
| `npm run lint`      | Run ESLint over the project.               |
| `npm run format`    | Run Prettier in write mode.                |
| `npm run test`      | Run the Vitest test suite once.            |

## Source layout

```
src/
  app/                  router, providers, root layouts
  components/ui/        shadcn primitives
  components/           shared app-level components
  features/
    auth/               signup/login/logout, session hook
    portfolio/          dashboard, upload, image management, settings
    public-showcase/    public route + template host
  templates/
    types.ts            Template / TemplateProps / TemplateConfig
    registry.ts         register / get / list
    simple-grid/
    side-titles/
    gallery-3d/
  lib/
    env.ts              typed env-var access
    supabase.ts         supabase client singleton
    api/                typed wrappers around the database
    utils.ts            shadcn cn() helper
  hooks/
  types/                shared domain types
supabase/
  migrations/           ordered SQL migrations + RLS policies
```
