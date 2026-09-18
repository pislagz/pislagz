# pawelpisulski.pl

Personal demo page. Built with **Next.js 15** (App Router) and CSS modules.

## Run

```bash
yarn install
yarn dev
```

Open [http://localhost:3000](http://localhost:3000). Production build: `yarn build && yarn start`.

## Inventory

### Routes

| Path | Feature | Notes |
|------|---------|-------|
| `/` | `home` | Landing hero and ASCII portrait. |
| `/arsenal` | `arsenal` | Bento of tools and availability. |
| `/play` | `play` | CRT arcade. Invaders from 684px up; pong below. |
| `/resume` | `resume` | Intro copy and PDF download. |
| `/hire-me` | `contact` | Hire-me form. |
| `POST /api/contact` | `contact` | Server route for the form; one send per calendar day. |
| `/projects` | — | Redirects to `/`. No projects feature in the tree. |

### Features

| Feature | Description |
|---------|-------------|
| `home` | Hero with rotating headline, ASCII portrait, and “see my arsenal” glass button. |
| `arsenal` | Bento grid of daily tools, contract facts, and a continue CTA into play. Data via `arsenalApi.getArsenal()`. |
| `play` | CRT arcade: Space Invaders from 684px up, vertical pong below that. No API module. |
| `resume` | Intro copy and résumé PDF download. |
| `contact` | Hire-me form (name, contact, message). `contactApi.sendMessage()` posts to `/api/contact`. |

### Shared

| Area | What it is |
|------|------------|
| `shared/App.tsx` | Shell: header, footer, atmosphere, error boundary. |
| `shared/components/` | Header, footer, menus, page background, route sound. |
| `shared/developer/` | Preview-only layout and liquid-glass controls (logo trigger). |
| `shared/errors/` | `ErrorBoundary`, `AppError`, `showErrorPopup`. |
| `shared/ui/` | `Button`, `GlassSurface` (`liquid-glass-react`). |
| `shared/styles/` | Tokens, fonts, global reset. |

There is no `shared/api` HTTP client. Feature-owned data lives next to that feature. `shared` does not import `features`.

## Folder structure

```
src/
├── app/                         # Thin App Router pages + contact API route
├── features/
│   ├── home/                    # pages, components, lib (ASCII portrait)
│   ├── arsenal/                 # pages, components, api
│   ├── play/                    # pages, components
│   ├── resume/                  # pages
│   └── contact/                 # pages, components, hooks, api, lib
└── shared/
    ├── App.tsx
    ├── ThemeShell.tsx
    ├── components/
    ├── developer/
    ├── errors/
    ├── ui/
    ├── hooks/
    ├── styles/
    └── constants.ts
```

`app/` only wires routes. Domain UI lives in `features/`. Cross-cutting chrome lives in `shared/`.

## Path aliases

| Alias | Path |
|-------|------|
| `@features/*` | `src/features/*` |
| `@shared/*` | `src/shared/*` |

## Naming conventions

- **PascalCase** `.tsx` files that export React components, so the file matches the component.
- **kebab-case** for hooks, utils, layout modules, and API modules, so non-UI files stay distinct in large folders.
- **API modules** use a domain suffix and an object export:

```ts
// features/contact/api/contact-api.ts
export const contactApi = { sendMessage };

contactApi.sendMessage(payload);
```

- **`index.ts` is a barrel only** — re-exports, no logic.
- Domain helpers that are not hooks live in `lib/` on that feature (e.g. home ASCII, contact send limits).
- Do not add empty `assets/` or `utils/` folders.
