Guidance for AI agents working in this repository. Read it fully before touching code.

## What this is

A private, password-protected website that renders the Beltrami family tree.
The tree data is a GEDCOM export from MyHeritage, parsed into JSON by the
sibling project **Rootsy** (Python), uploaded to Firestore, and drawn in the
browser with React Flow.

Two audiences are planned:

- **Public site** (no family data): an explanatory home with a demo tree
  (the owner's cats), flat-illustration style, playful animations, and a page
  explaining what GEDCOM is.
- **Private site** (Firebase Auth required): the real family tree.

Real family data must never be reachable without authentication, never
committed to the repo, and never bundled into the public pages.

## Stack

- Next.js (App Router, `src/app`), React 19, TypeScript strict
- Tailwind CSS, `clsx` for conditional classes
- `@xyflow/react` (React Flow v12) for the tree canvas
- Firebase: Auth (email/password) and Firestore, client SDK v11 modular API
- `firebase-admin` only in `scripts/` (Node, never shipped to the browser)
- Biome for lint and format (tabs, double quotes)
- lefthook for git hooks (installed on `pnpm install` via `prepare`)
- Package manager: **pnpm**. Never use npm or yarn; never commit another lockfile.

## Commands

```sh
pnpm install            # also installs git hooks
pnpm dev                # local dev server
pnpm build              # production build; must pass before a PR is done
pnpm lint               # biome check .
pnpm format             # biome format .
pnpm type-check         # tsc --noEmit
pnpm upload-tree ./data/beltrami.json   # push a Rootsy JSON export to Firestore
```

Before declaring any task finished run `pnpm lint`, `pnpm type-check`. If you changed anything under `src/app` also run `pnpm build`.

## Repository layout

```
src/
  app/                 Next.js App Router: routes, layouts, page-level types
    family-tree/       protected route rendering the tree
    layout.tsx         wraps everything in AuthUserProvider + NavBar
  components/          reusable UI; one folder per component with index.tsx re-export
    family-tree/       FamilyTree canvas + FamilyNode custom node
    protected-layout/  createProtectedLayout HOC (redirects unauthenticated users)
  contexts/            React contexts (user-context = auth)
  hooks/               custom hooks (use-family-tree fetches from Firestore)
  lib/                 side-effectful modules: auth (Firebase), firestore
    family/            domain types shared by the app and scripts/
  helpers/             pure helpers and config (env var access lives here only)
scripts/               Node-only tooling (Firestore upload)
public/                static assets
```

Path aliases are configured with `baseUrl: src`, so imports look like
`import { FamilyTree } from "components/family-tree"` and
`import { useAuth } from "contexts/user-context"`. Use them; no `../../`.

## Conventions

### TypeScript

- `strict` is on. No `any`; use `unknown` and narrow. No non-null `!` unless a
  comment explains why it is safe.
- Prefer `type` over `interface` except when declaration merging is needed.
- Export named symbols. Default exports only where Next.js requires them
  (`page.tsx`, `layout.tsx`).
- Runtime data from Firestore is untrusted: validate with a type guard (see
  `isValidFamilyData`) rather than casting. If validation grows, move to `zod`.
- The domain types (`FamilyMember`, `FamilyData`) live in
  `src/lib/family/types.ts` and nowhere else. App code imports them as
  `lib/family/types`; `scripts/` uses a relative path, because the path
  aliases only cover `src`. Never add a second copy.

### React and Next.js

- Server Components by default. Add `"use client"` only to files that use
  hooks, browser APIs, or React Flow, and keep those leaf-level.
- Files and folders are `kebab-case`; components are `PascalCase`; hooks are
  `use-*.ts(x)` exporting `useX`.
- One component per file. A component folder exports through `index.tsx`.
- Type props explicitly; avoid `React.FC` for new components (it is used in a
  few older files, do not churn them for style alone).
- No `useEffect` for derived data; derive with `useMemo`. Fetching stays in
  hooks under `src/hooks`, never inside components.
- Never read `process.env` outside `src/helpers/config.ts`. Only
  `NEXT_PUBLIC_*` variables may be used in client code.
- Remove `console.log` before finishing; use `console.error` only in catch
  blocks that surface the error to the UI.

### Styling

- Tailwind utility classes in JSX, `clsx` for conditionals. No CSS modules and
  no inline `style={}` unless the value is computed (e.g. canvas coordinates).
- Do not add a component library. Small hand-written components are preferred.
- Italian is the UI language of the private site. Keep user-facing strings in
  Italian; keep code, comments and commit messages in English.

### Git

- Small, focused atomic commits, no prefix
```
Capitalized, short (70 chars or fewer) summary

More detailed explanatory text, if necessary. Wrap it to about 72 characters
or so. 
```
- Hooks run Biome and type-check on commit; do not bypass them with `--no-verify`.

## Domain model

Firestore document `familyTrees/beltrami` holds the whole tree:

```ts
type FamilyData = {
  individuals: Record<string, FamilyMember>; // keyed by GEDCOM xref, e.g. "@I12@"
  families: Record<string, { id: string; husband?: string; wife?: string; children: string[] }>;
};

type FamilyMember = {
  id: string;
  name: string;            // raw "Given /Surname/"
  given_name?: string;
  surname?: string;
  sex?: string;
  birth?: { date?: { raw: string } };
  death?: { date?: { raw: string } };
  child_of_families: string[];  // FAMC
  spouse_in_families: string[]; // FAMS
};
```

GEDCOM semantics to respect:

- A **FAM** record is the unit of relationship: two partners and their
  children. Draw parent→child links from the family, not from each parent
  separately, or every child gets two overlapping edges.
- `FAMC` on an individual = family they are a child of; `FAMS` = family they
  are a partner in. Do not conflate the two.
- Names arrive as `Given /Surname/`; empty parts are valid (`Deanna //`,
  `/Manghi/`). Render given + surname, never the raw slashed string.
- Dates can be qualified (`ABT 1890`, `BET 1900 AND 1910`, `1890`). Treat them
  as strings for display unless a proper date type exists upstream in Rootsy.

## Areas that need care

- `src/contexts/user-context` and `src/lib/auth` are stable and tested in
  production. Do not restructure them without an explicit request.
- `scripts/firebase/upload-family-data.ts` needs
  `config/firebase/service-account.json`, which is git-ignored. Never commit
  credentials, never log their contents.

## Known problems (as of September 2026)

- Tree layout is a fixed 5-column grid in insertion order. Replace with a
  generational layout (family-chart, or elkjs layered layout feeding React
  Flow). The layout must be a pure function `FamilyData → { nodes, edges }`
  living outside the component so it can be unit-tested.
- `FamilyNode` handle positions and ids are inconsistent (targets at bottom,
  sources at top, ids that do not match). Parent→child edges should leave a
  parent's bottom and enter a child's top.
- `FamilyNode` reads `data.name` (raw slashed GEDCOM name); the computed
  `label` is never used.

## Roadmap (in order)

1. Fix data upstream in Rootsy (events, FAMS/FAMC, clean names), regenerate
   the JSON, re-upload.
2. Consolidate types; write the `FamilyData → nodes/edges` transform with
   tests; implement a real layout.
3. Dependency upgrades (Tailwind 4, Biome 2, latest Next/React/xyflow),
   one major at a time, each in its own PR, build green after each.
4. Public site: home, cats demo tree with illustration and animation, GEDCOM
   explainer. Private site remains behind auth.
5. Person detail panel, search, pedigree/descendant views, accessibility pass.

When in doubt, prefer the smallest change that leaves the codebase easier to
read than you found it.
