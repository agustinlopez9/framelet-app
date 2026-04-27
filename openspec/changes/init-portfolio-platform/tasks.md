## 1. Toolchain & repo scaffolding

- [x] 1.1 Initialize a Vite + React + TypeScript project at the repo root (preserve existing `openspec/` and `.claude/` directories).
- [x] 1.2 Add `package.json` scripts: `dev`, `build`, `preview`, `typecheck`, `lint`, `format`, `test`.
- [x] 1.3 Configure ESLint (typescript-eslint, react, react-hooks, jsx-a11y) and Prettier; commit configs.
- [x] 1.4 Configure path alias `@/*` → `src/*` in `tsconfig.json` and `vite.config.ts`.
- [x] 1.5 Set up Vitest + React Testing Library; add a smoke test that renders an empty `<App />`.
- [x] 1.6 Create a `.env.example` with the Supabase keys the app expects (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) and read them via a typed `src/lib/env.ts` helper that throws on missing values.
- [x] 1.7 Add a README with run/build/test commands and the env-var requirements.

## 2. Tailwind & shadcn/ui

- [x] 2.1 Install Tailwind, configure `tailwind.config.ts`, `postcss.config.js`, and the global stylesheet.
- [x] 2.2 Initialize shadcn/ui (`components.json`) targeting `src/components/ui/`.
- [x] 2.3 Vendor the shadcn primitives the dashboard and forms need: `button`, `input`, `label`, `form`, `card`, `dialog`, `dropdown-menu`, `toast`, `progress`, `tabs`, `switch`, `textarea`, `tooltip`, `skeleton`.
- [x] 2.4 Add `lucide-react` and verify icons render.

## 3. Domain types & API layer

- [x] 3.1 Define shared types in `src/types/`: `User`, `Portfolio`, `PortfolioImage`, `TemplateConfig`.
- [x] 3.2 Create the Supabase client singleton at `src/lib/supabase.ts`.
- [x] 3.3 Write SQL migrations under `supabase/migrations/` for `users`, `portfolios` (unique on `owner_id`), and `images` tables, plus the storage bucket and RLS policies (owner-only mutation; public select gated by `published = true OR owner_id = auth.uid()`).
- [x] 3.4 Add typed API wrappers under `src/lib/api/`: `auth.ts`, `portfolios.ts`, `images.ts`. Each function takes typed input and returns typed output; no UI imports Supabase directly.
- [x] 3.5 Set up React Query and a `QueryClientProvider` in the app root.

## 4. Routing & layouts

- [x] 4.1 Install `react-router-dom` v6 and create the router in `src/app/router.tsx`.
- [x] 4.2 Implement `<PublicLayout>` (header + outlet) and `<DashboardLayout>` (sidebar + outlet, behind `<RequireAuth>`).
- [x] 4.3 Wire routes: `/`, `/login`, `/signup`, `/u/:handle`, `/dashboard`, `/dashboard/upload`, `/dashboard/templates`, `/dashboard/settings`.
- [x] 4.4 Implement `<RequireAuth>` that redirects unauthenticated users to `/login` with a `?next=` parameter, and a redirect from `/login` and `/signup` to `/dashboard` when already authenticated.

## 5. Auth feature (`auth` capability)

- [x] 5.1 Build `useSession` hook subscribing to Supabase auth state and exposing `{ user, status, signIn, signUp, signOut }`.
- [x] 5.2 Build the signup form (email, password ≥ 8 chars, handle matching `^[a-z0-9][a-z0-9-]{2,29}$`) with React Hook Form + Zod, surfacing per-field errors and the "handle taken" case.
- [x] 5.3 Build the login form with a generic "invalid email or password" error.
- [x] 5.4 Build the logout control in the dashboard header that clears the session and redirects to `/`.
- [x] 5.5 On successful signup, transactionally provision the user row, the handle, and a default `portfolios` row (`template_id = 'simple-grid'`, `published = false`). Implemented as a Postgres `after insert on auth.users` trigger so the rows land in a single transaction with the auth row.

## 6. Template system (`template-system` capability)

- [x] 6.1 Define `Template`, `TemplateProps`, `TemplateConfig` types in `src/templates/types.ts`. Templates expose `loadComponent(): Promise<React.FC<TemplateProps>>` so eager and lazy templates share a signature.
- [x] 6.2 Implement the registry in `src/templates/registry.ts` with `register`, `get(id)` (returns `Template | undefined`), `list()` (stable order). Throws on duplicate id at module init.
- [x] 6.3 Implement `simple-grid` template: responsive masonry, preserves order, sets `alt` on every image.
- [x] 6.4 Implement `side-titles` template: full-bleed images, side rail with title + description, collapses below image under 768px.
- [x] 6.5 Add `three`, `@react-three/fiber`, `@react-three/drei` and implement `gallery-3d`: 3D carousel with mouse + keyboard navigation; dynamic-imported (Vite splits it into its own chunk and the entry chunk has zero references to `three`).
- [x] 6.6 Implement the touch fallback for `gallery-3d`: a 2D swipeable carousel rendered when `(pointer: coarse)` matches, using the same image order.
- [x] 6.7 Implement `<TemplateHost>` that takes a portfolio + images, looks up the template, awaits `loadComponent()`, shows a skeleton during load, and falls back to `simple-grid` (with a console warning) when the stored id is unknown.

## 7. Portfolio management (`portfolio-management` capability)

- [x] 7.1 Dashboard home: shows portfolio title, bio, image count, current template, publish toggle, and link to the public URL.
- [x] 7.2 Settings page: edit title (1–80 chars) and bio (≤ 500 chars) with React Hook Form + Zod.
- [x] 7.3 Upload page: drag-and-drop area + file picker, accepts `image/jpeg`, `image/png`, `image/webp`, max 10MB; client-side validation rejects invalid files with per-file errors before upload starts.
- [x] 7.4 Direct-to-storage upload via signed URLs: per-file progress bar, cancel button (aborts the request), retry on failure. Image record is only inserted in Postgres after the storage PUT succeeds.
- [x] 7.5 Image list with edit (title ≤ 80, description, alt text ≤ 200) via a dialog, drag-and-drop reordering that persists `position`, and delete with a confirmation prompt that also removes the storage object.
- [x] 7.6 Publish toggle on the dashboard updates `portfolios.published` and surfaces a toast confirming the new state.
- [ ] 7.7 Verify owner-only mutation by attempting an update as a second account in an integration test — RLS must reject it. **Blocked on a provisioned Supabase project.** RLS policies are written in `supabase/migrations/0002_rls.sql`; the test cannot run until the schema is applied to a Supabase instance.

## 8. Public showcase (`public-showcase` capability)

- [x] 8.1 `/u/:handle` route: fetch the portfolio + ordered images by handle in a single query; render a "portfolio not found" page on miss.
- [x] 8.2 Treat unpublished portfolios as not-found for non-owners; for the authenticated owner viewing their own unpublished portfolio, render with an "unpublished — only you can see this" banner.
- [x] 8.3 Render via `<TemplateHost>` using the portfolio's `template_id`; the public page exposes only navigation and viewing affordances. Templates contain no edit/upload/delete/template-switch/publish controls — those live in `features/portfolio/*` and are mounted only inside `<DashboardLayout>`.
- [x] 8.4 Empty-state: published portfolio with zero images renders title + bio + an empty-state message instead of erroring (covered by `templates.test.tsx`).
- [ ] 8.5 Owner switching templates and a visitor reloading must show the new template — **integration test blocked on a provisioned Supabase project.** The code path is straightforward: `getPortfolioByHandle` reads `template_id` on every fetch, and `<TemplateHost>` re-resolves the template when its id changes.

## 9. Template picker UX

- [x] 9.1 `/dashboard/templates` lists every registered template (name, description, thumbnail) in registry order.
- [x] 9.2 Highlighting a template renders a live preview of the owner's actual portfolio through that template (uses `<TemplateHost>` with the previewed id).
- [x] 9.3 Confirming the choice persists `portfolios.template_id` and shows a toast.

## 10. Quality gates

- [x] 10.1 Unit tests: registry `register`/`get`/`list` and duplicate-id failure; Zod schemas for signup, login, portfolio metadata, image metadata; image-upload validation.
- [x] 10.2 Component tests: `simple-grid` and `side-titles` render with empty images and many images, preserve order, and set alt text. (`gallery-3d` is not asserted via JSDOM because Three.js needs WebGL — coarse-pointer fallback is implemented in `Gallery3D.tsx` via `matchMedia('(pointer: coarse)')`.)
- [ ] 10.3 Integration tests (against a local Supabase instance): signup → upload → publish → public render; non-owner mutation is rejected; unpublished portfolio is hidden from non-owners. **Blocked on a provisioned Supabase project.**
- [x] 10.4 `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build` all pass.
- [x] 10.5 Inspect the production bundle and confirm `three` is not in the entry chunk. Verified: `dist/assets/index-*.js` contains zero references to `WebGLRenderer`, `TextureLoader`, or `@react-three`; all live in the lazy `dist/assets/Gallery3D-*.js` chunk.
- [ ] 10.6 Manual smoke test of the full happy path in the browser before declaring the change ready to archive. **Requires a provisioned Supabase project plus a human in the browser.**
