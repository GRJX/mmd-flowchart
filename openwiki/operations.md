# Operations

## Running locally

```bash
npm install
npm run dev        # vite dev server, http://localhost:5173
```

Requires **Chrome or another Chromium-based browser** — the File System Access API (folder
picker, direct disk read/write) has no Firefox/Safari support, and the app degrades to an
"unsupported browser" state without it (`src/lib/fs/fsAccess.ts` →
`isFileSystemAccessSupported()`). Node version is pinned via `.nvmrc`.

Other scripts (`package.json`):

```bash
npm run build       # tsc -b && vite build  -> dist/
npm run preview      # serve the production build locally
npm run lint         # tsc -b --noEmit (type-checking only — there is no separate linter configured)
```

## Docker / deployment

`Dockerfile` is a two-stage build: `node:20-alpine` builds the Vite app (`npm ci && npm run
build`), then the static `dist/` output is copied into an `nginx:1.27-alpine` runtime image serving
on port 8080, using `nginx.conf` for routing/config and a `wget`-based container healthcheck.

```bash
docker build -t mmd-flowchart .
docker run -p 8080:8080 mmd-flowchart
# or
docker compose up   # docker-compose.yml
```

The README documents a hosted internal deployment URL for this app's actual users (see
`README.md`) — treat that URL as informational/organizational context, not something to reproduce
in a generic environment.

## No automated test suite — what to check by hand

There is currently **no test framework configured** and no test files in `src/`. This is a
deliberate/incidental state worth knowing: an earlier iteration of this project had a full
Playwright e2e suite (page objects, asserters, steppers, per-epic spec files under `e2e/`) that was
removed wholesale in commit `b2c05de` ("Verwijder alles en begin op nieuw" — "Delete everything and
start over"), which reset most of the app and rebuilt it from scratch on a new architecture. The
tests were never reintroduced for the rebuilt app.

Practical implication for anyone changing behavior in this repo: **there is no safety net**.
Before considering a change to any of the following areas done, manually exercise it in a running
dev server:

- **`.mmd` round-trip** — open a file, save without changes, diff the result byte-for-byte
  (except the accepted label-escaping edge case, see
  [architecture/mmd-format.md](architecture/mmd-format.md#label-escaping)).
- **Save conflict flow** — edit the same file externally while it's open in the editor, confirm
  the Overwrite/Reload toast appears at both save-time and on tab refocus.
- **Read-only gating** — open a non-flowchart Mermaid file and a >200-block flowchart, confirm
  both open read-only with the correct banner and export disabled.
- **Undo/redo** — for any new mutation, confirm it's captured as exactly one undo step and that
  redo restores it.
- **Connection limits / Decision Y-N** — confirm `blockConfig.ts` limits are enforced and that
  `computeViolations` still flags the intended over-limit cases if you touch that logic.

If you add real automated tests, this section (and `docs/FO.md` if relevant) should be updated to
document how to run them.

## Linting / type-checking

`npm run lint` runs `tsc -b --noEmit` — this is the only enforced check in the repo. There is no
ESLint/Prettier config present, so match existing code style by hand (see `docs/FO.md`'s own note
about config-over-conditionals as the main structural convention to preserve).

## Generated/ignored artifacts

- `graphify-out/` — output of an external code-graph analysis tool that was run against this repo
  (see its own `graphify-out/GRAPH_REPORT.md`). It is not part of the application; ignore it when
  exploring source, and don't treat it as documentation of current behavior.
- `.gitignore` excludes `node_modules/`, `dist`, `dist-ssr`, `test-diagrams/` (a local scratch
  folder for manually testing the editor against real `.mmd` files), and OpenWiki's own secret
  store (`.openwiki/`, `.env.openwiki`).
