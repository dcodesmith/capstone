# BBO Strategy History

A small React app that presents the **Bayesian black-box optimisation (BBO)** capstone as an interactive timeline. For each of **eight hidden functions (F1–F8)** you can see how the search strategy evolved from the initial setup through **week-by-week rounds (Initial → W12)**: acquisition choices, hyperparameters (for example β in GP-UCB), observed results, and short narrative notes (“what happened” / “rationale”). The **all-time best week** is highlighted; rows expand for full detail.

Content is **static** (typed in `src/data.ts`); there is no backend or live optimisation—this is a reader for the story of the runs.

## Stack

- React 19, TypeScript, Vite 8
- Tailwind CSS v4 (via `@tailwindcss/vite`)

## Prerequisites

- [Node.js](https://nodejs.org/) (current LTS is fine)
- [pnpm](https://pnpm.io/) (recommended; the repo includes `pnpm-lock.yaml`)

## Run locally

From this directory (`bbo-strategy/`):

```bash
pnpm install
pnpm dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

### Other commands

| Command        | Purpose                          |
|----------------|----------------------------------|
| `pnpm build`   | Production build to `dist/`      |
| `pnpm preview` | Serve the production build locally |
| `pnpm lint`    | Run ESLint                       |

If you use npm instead of pnpm: `npm install`, `npm run dev`, etc.

## Project layout (high level)

- `src/App.tsx` — function picker (F1–F8) and main view
- `src/WeekRow.tsx` — expandable row for a single week
- `src/data.ts` — all copy and structured history
- `src/types.ts` — TypeScript types for the data model
