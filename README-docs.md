# pawelpisulski.pl

Personal demo page. Built with **Next.js 15** (App Router) and CSS modules.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Production build: `npm run build && npm start`.

## Folder structure

```
src/
├── app/                         # Next.js routing (thin pages + API routes)
├── features/
│   ├── home/                    # Hero landing
│   ├── projects/                # Project grid + feature API
│   ├── arsenal/                 # Tool icons + feature API
│   ├── resume/                  # PDF download
│   └── contact/                 # Hire-me form + feature API
└── shared/
    ├── App.tsx                  # App shell (header, footer, background)
    ├── api/                     # HTTP client, auth headers, 401 handling
    ├── components/              # Header, Footer, Logo, MobileMenu, background
    ├── errors/                  # ErrorBoundary, codes, showErrorPopup
    ├── ui/                      # Pill Button
    ├── hooks/                   # Cross-cutting hooks
    ├── styles/                  # Tokens + global reset
    └── constants.ts
```

`app/` only wires routes. Domain UI lives in `features/`. Cross-cutting chrome lives in `shared/`. `shared` does not import from `features`.

## Path aliases

| Alias | Path |
|-------|------|
| `@features/*` | `src/features/*` |
| `@shared/*` | `src/shared/*` |

## Features

| Feature | Description |
|---------|-------------|
| `home` | Hero with headline, project CTA, and isometric illustration. |
| `projects` | Lists personal/work projects as cards with tech tags and links. |
| `arsenal` | Grid of daily tools and technologies. |
| `resume` | Short intro and PDF download. |
| `contact` | Email plus a hire-me form that posts to `/api/contact`. |

## Naming conventions

- **PascalCase** `.tsx` files that export React components, so the file matches the component.
- **kebab-case** for hooks, utils, stores, and API modules, so non-UI files stay distinct in large folders.
- **API modules** use a domain suffix and an object export:

```ts
// features/contact/api/contact-api.ts
export const contactApi = { sendMessage };

contactApi.sendMessage(payload);
```

- **`index.ts` is a barrel only** — re-exports, no logic.
- Feature-only HTTP lives in `features/<feature>/api/*-api.ts`. Shared HTTP helpers live in `shared/api`.
- Do not add empty `assets/` or `utils/` folders.
