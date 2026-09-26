# Poker Drills

A personal drill app for No-Limit Texas Hold'em maths: an arithmetic package (A1–A6) and poker levels 1–10 up to GTO range construction, each with a cheat sheet, with Silver / Gold / Platinum medals per level. It is an installable, offline-first web app (PWA). [`SPEC.md`](SPEC.md) is the source of truth.

## Develop

```sh
npm install
npm test          # Vitest: engine, generators, progress
npm run dev       # local dev server
npm run build     # type-check + production build to dist/
```

## Layout

| Folder | What lives there |
|---|---|
| `src/config.ts` | Every tunable number: time limits, medal thresholds, tolerances, bet sizes |
| `src/engine/` | Pure poker maths: cards, dealing, hand evaluation, outs, draws, nuts check, formulas |
| `src/questions/` | One generator per level (`level0.ts` … `level10.ts`), grading, run builder |
| `src/progress/` | `StorageAdapter` interface, IndexedDB adapter, medals, stats, versioned schema, export/import |
| `src/ui/` | Screens (home, level, run, results, backup) and the run session state |
| `tests/` | Vitest suites |

Adding VPS sync later: implement `StorageAdapter` (in `src/progress/adapter.ts`) against the VPS API and return it from `createAdapter()` in `src/main.ts`. Nothing else changes.

## Deploy

`.github/workflows/deploy.yml` runs the tests, builds and publishes to GitHub Pages on every push to `main`. In the repo's **Settings → Pages**, set **Source** to **GitHub Actions** once.

## Install on iPhone / iPad

1. Open the Pages URL in **Safari**.
2. Tap **Share** → **Add to Home Screen** → **Add**.
3. Open it once from the home screen while online. After that it works offline (test in airplane mode).

Progress is stored per device. Use **Backup → Export backup** to save it or move it to your other device (then **Import backup** there; runs are merged).
