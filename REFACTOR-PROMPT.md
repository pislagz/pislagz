# Prompt: Feature-based SPA refactor (copy into Cursor)

Use this prompt on a **similar React + Vite SPA** (JS or TS) that still has a flat/monolithic layout (`src/pages`, `src/components`, single giant `api.js`, mixed naming). Adapt paths and brand names to the target repo.

---

## Role

You are a senior frontend engineer. Refactor this codebase toward a **feature-based architecture** with clear `features/` vs `shared/` boundaries, consistent file naming, and domain-scoped API modules. Prefer incremental, build-verified steps. Do not invent new product features. Preserve behavior.

## Goals (definition of done)

1. `src/features/<domain>/` for domain code; `src/shared/` for cross-cutting code only.
2. Naming:
   - **PascalCase** `.jsx`/`.tsx` files that export React components.
   - **kebab-case** for everything else (hooks, atoms, utils, stores, API modules).
   - `index.js` / `index.ts` **only** as barrels (re-exports), never for logic.
3. Monolithic HTTP/API layer split:
   - Endpoints used by **one feature** → that feature’s `api/`.
   - Endpoints used by **multiple features or shared UI** → `shared/api/`.
4. Every API surface is an **object export**:
   - File: `auth-api.js` (kebab-case).
   - Export: `export const authApi = { changePassword, … }`.
   - Call sites: `authApi.changePassword(…)`.
5. Empty placeholder `assets/` / `utils/` folders removed.
6. README documents folder structure, naming rules (with why), and a one-line description per feature.
7. `npm run build` (or project equivalent) passes after each major phase.

## Non-goals

- Do not rewrite UI/UX or change API contracts/payloads.
- Do not force-move code into a feature if **shared UI** (e.g. 3D, story carousel) is the only consumer — keep that API in `shared`.
- Do not rename shadcn/ui primitives if the project already uses kebab-case component files there (`button.jsx`) unless asked.
- Large legacy trees (e.g. `components/3d` with dozens of `index.jsx`) may be deferred if noted as follow-up — but call them out.

## Target layout

```
src/
├── features/
│   ├── <feature>/
│   │   ├── api/
│   │   │   ├── <feature>-api.js   # export const <feature>Api = { … }
│   │   │   └── index.js           # barrel only
│   │   ├── pages/                 # optional
│   │   ├── components/            # optional
│   │   ├── hooks/                 # kebab-case files
│   │   ├── utils/                 # only if non-empty
│   │   ├── assets/                # only if non-empty
│   │   └── …
│   └── …
└── shared/
    ├── App.jsx                    # app shell (not inside routing feature)
    ├── main.jsx
    ├── api/
    │   ├── client.js              # base URL, auth headers, 401 interceptor
    │   ├── <domain>-api.js        # export const <domain>Api = { … }
    │   └── index.js               # re-export client helpers + *Api objects
    ├── components/
    ├── errors/                    # ErrorBoundary, ErrorModal, definitions, helpers
    ├── modals/
    ├── ui/
    ├── utils/
    ├── styles/
    ├── hooks/
    ├── assets/
    └── constants.js
```

Path aliases (configure if missing):

| Alias | Path |
|-------|------|
| `@features/*` | `src/features/*` |
| `@shared/*` | `src/shared/*` |

## Phase 0 — Inventory

1. Map current `src/` tree (pages, components, api, hooks, store).
2. List all exports from the central API module and **every import site**.
3. Classify each export:
   - **Feature-only** → move to that feature.
   - **Cross-feature (2+ features, no shared UI)** → pick an owner domain (e.g. products owns category list; dashboard imports from products) **or** keep in shared if ownership is unclear.
   - **Shared UI / multi-domain** → stay in `shared/api`.
   - **Dead/broken unused** → remove (confirm zero importers first).
4. List React component files that are not PascalCase; list non-component `.js` files that are not kebab-case.
5. Present a short plan, then execute phase by phase.

## Phase 1 — Features / shared skeleton (if not already done)

1. Create `src/features` and `src/shared`.
2. Move domain pages into features; move cross-cutting UI into shared.
3. Keep `App.jsx` / `main.jsx` in `shared` (routing feature owns routes/guards only).
4. Add aliases; update imports in batches; keep the app building.
5. Per feature: add `utils/` / `assets/` **only when there is something to put there**. Do not create empty folders “for later”.

## Phase 2 — Errors module

1. Move error-related shared modules out of generic `components/` into `shared/errors/`:
   - Error boundary, error modals, error code definitions, `showErrorPopup` helpers.
2. Flatten former `ErrorHandling/` into `definitions.js` + kebab-case helper file if it contained logic (e.g. `show-error-popup.js`).
3. `index.js` in `errors/` may barrel-only.
4. Update all imports to `@shared/errors/...`.
5. Do **not** move game-specific screens named `ErrorScreen` that are local to a modal/flow.

## Phase 3 — File naming pass

Rules:

| Kind | Filename | Why |
|------|----------|-----|
| React component (`.jsx`/`.tsx`) | `PascalCase.jsx` | Matches component identity; React convention |
| Hook / atom / util / store / plain JS | `kebab-case.js` | Distinguishes non-UI modules; readable in large folders |
| API module | `kebab-case-api.js` | Same as other non-UI; domain suffix |
| Barrel | `index.js` only | Re-exports only — no logic |

Actions:

1. Rename mis-cased component files via **two-step rename** on case-insensitive filesystems (macOS default).
2. Rename hooks/atoms/utils: `useSession.js` → `use-session.js`, `userAtom.js` → `user-atom.js`, `Helpers.js` → `helpers.js`, `store3d.jsx` → `store-3d.js` if not a component.
3. Replace any logic-bearing `index.js`/`index.jsx` with a named file; leave barrels as thin re-exports.
4. Update all imports; run build.

## Phase 4 — Remove empty feature folders

Delete empty `features/*/assets` and `features/*/utils` (ignore `.DS_Store`). Keep folders that contain real files.

## Phase 5 — Split monolithic API

### 5a. Shared client

Extract to `shared/api/client.js`:

- Base URL(s) / env
- Auth header helper (**export** it for feature APIs)
- Global axios/fetch interceptor (e.g. 401 → login)

### 5b. Move feature-only endpoints

For each export, move code into:

```
features/<feature>/api/<feature>-api.js
```

Pattern:

```js
import axios from "axios";
import { API_URL, getAuthHeaders } from "@shared/api";

const changePassword = async ({ … }) => { /* unchanged request body */ };

export const authApi = {
  changePassword,
};
```

```js
// features/auth/api/index.js
export { authApi } from "./auth-api";
```

Update call sites:

```js
// before
import { changePassword } from "@/api";
changePassword(payload);
mutationFn: changePassword,

// after
import { authApi } from "@features/auth/api";
authApi.changePassword(payload);
mutationFn: authApi.changePassword,
```

Also rewrite **reference** usages (not only `fn(` calls): `mutationFn: x`, `queryFn: x`.

### 5c. Shared API modules as objects

Split remaining shared endpoints into kebab-case files, each exporting one object:

```
shared/api/
  client.js
  consumer-api.js    → consumerApi
  prize-api.js       → prizeApi
  story-api.js       → storyApi
  …
  index.js           → export client helpers + all *Api objects
```

Usage:

```js
import { consumerApi, prizeApi, storyApi } from "@shared/api";
consumerApi.checkLoginStatus(token);
storyApi.getStoryList();
storyApi.STORY_STALE_TIME; // constants may live on the object
```

Keep exporting `API_URL` / `getAuthHeaders` (and similar) as **named** exports from `client` via the barrel — feature API files need them.

### 5d. Deduplicate local `getAuthHeaders`

If a feature API reimplemented auth headers, switch it to `@shared/api`’s `getAuthHeaders`.

### 5e. Preserve payloads

Copy request/response shapes **exactly** from the original module (prize redeem body, trailing spaces in paths if backend depends on them, hardcoded consents, etc.). Verify against git/`HEAD` before deleting the old file.

## Phase 6 — README

Replace or extend README with:

1. Short stack + run commands.
2. Folder structure diagram (`features` vs `shared`).
3. Alias table.
4. **Features table**: every feature folder + one sentence description.
5. Naming conventions section: PascalCase vs kebab-case **and why**; API object pattern examples; barrel rule.

## Execution rules

- Work in phases; after each phase run the production build.
- Prefer automated renames + import rewrites, then spot-fix:
  - glued imports (`";import`) after bulk replace
  - case-only renames on macOS (temp filename intermediate)
  - unused imports left after moves
- Do not commit unless asked.
- Do not push.
- If shared depends on a feature API, **prefer moving the API to shared** or lifting the shared UI dependency — avoid `shared → features` imports when possible. Exception: rare shared widgets that are clearly feature-owned may import from `@features/...` if the team accepts that coupling; document it.

## Suggested feature descriptions template

Fill for the target app:

| Feature | Description |
|---------|-------------|
| `auth` | … |
| `dashboard` | … |
| … | … |

## Acceptance checklist

- [ ] No giant root `api.js` with mixed domains
- [ ] Feature-only endpoints live under `features/*/api/*-api.js` as `*Api` objects
- [ ] Cross-cutting endpoints under `shared/api/*-api.js` as `*Api` objects
- [ ] Call sites use `fooApi.method` (including `mutationFn` / `queryFn` references)
- [ ] Component files PascalCase; other modules kebab-case
- [ ] No logic in `index.js` except re-exports
- [ ] No empty `assets/` / `utils/` placeholders
- [ ] Errors live under `shared/errors` (or equivalent)
- [ ] README documents structure, naming + why, and feature list
- [ ] Build passes

## Start now

1. Inventory the repo against this prompt.
2. Propose the phase plan tailored to **this** codebase (list concrete files to move).
3. Execute Phase 1 (or the first phase still needed), then continue until the checklist is green.
