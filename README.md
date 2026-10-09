# ROCKHOUND-GO — ONE-LOCATION OWN-SERVER DEPLOY

RockHound-GO is being consolidated into one controlled deploy target: **one repo, one build, one URL, one server path**.

This repository is the active deployment target for the RockHound-GO PWA / web app build.

## Product direction

RockHound-GO is a field intelligence and geological adventure platform for modern rockhounds. The core app should remain shippable around:

- **Explore** — map-based discovery, site context, hazards, land/access notes, saved/offline regions.
- **Scan** — camera-first specimen identification, quick result, deep analysis, confidence, test prompts.
- **GeoDex / Collection** — personal geological archive with photos, provenance, notes, tests, rarity, XP, and discovery chains.
- **Safety / Legal / Offline** — ethical collecting prompts, geo privacy, offline queue, cached field mode.

Roadmap/demo layers can include Community, Market, Clover AI, Land Access, Learning, Quests, and AR glasses support, but future-facing modules must not be represented as fully production-ready unless actually implemented.

## Build directive and plan

- [`docs/RHGO_BUILD_DIRECTIVE.md`](docs/RHGO_BUILD_DIRECTIVE.md) — product scope, priorities and guardrails for the next implementation pass.
- [`docs/DISCOVERY_PSYCHOLOGY_LAYER.md`](docs/DISCOVERY_PSYCHOLOGY_LAYER.md) — the post-scan Discovery Choice, XP categories and discovery chains.
- [`docs/plan/`](docs/plan/README.md) — the master plan: how this repo, `RockHound-GO_HUB` and `Ai-i-want-for-game` fit together, and the work needed to make them shippable and maintainable.

## Development

```bash
npm ci
cp .env.example .env.local     # then set VITE_BASE44_APP_ID (see "Configuration")
npm run dev
```

| Command | What it checks |
| --- | --- |
| `npm run lint` | ESLint — must be clean |
| `npm test` | Vitest unit tests |
| `npm run build` | Production build |
| `npm run typecheck:ratchet` | Type errors may only go down (baseline in `.github/typecheck-baseline.json`) |
| `deno lint && deno test -A` | Base44 backend functions in `base44/` |

CI (`.github/workflows/`) runs all of the above on every pull request.

### Edge functions: returning errors

Never put an exception's text in a response: `error.message` carries host names, entity names and
query fragments. In a `catch`, return `safeError('functionName', error)` from
`base44/shared/httpErrors.ts`. It logs the full error under a short reference and answers
`{ error, request_id }`, so a user can quote the reference and you can find the log line. Messages you
chose on purpose (validation, 401/403/404/429) stay plain `Response.json({ error: '…' }, { status })`.
`base44/errorLeakGuard_test.ts` fails CI if any file under `base44/` reads an error's `.message` or `.stack`, or turns a caught error into text (`String(e)`, `` `${e}` ``, `e.toString()`). To log a failure, pass the error object: `console.error('what failed', error)`.

## Configuration

The app talks to a Base44 backend. Vite inlines `VITE_*` values into the bundle **at build time**, so they must be set when you run `npm run build`, not just on the server. See [`.env.example`](.env.example).

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_BASE44_APP_ID` | yes | Identifies your Base44 app. Without it the build succeeds but every API call fails. |
| `VITE_BASE44_APP_BASE_URL` | yes, off `*.base44.app` | Public URL of your Base44 app. The SDK uses it for the login redirect, the Google sign-in flow and logout; if it is empty on a self-hosted origin those URLs resolve against your own server and sign-in breaks. Also the target of the dev-server `/api` proxy. |
| `VITE_BASE44_FUNCTIONS_VERSION` | no | Pins the Base44 functions version. |

> The SDK sends API calls to `https://base44.app/api` by default (see `src/api/base44Legacy.js`). When you host the frontend yourself (Caddy or Firebase), confirm that Base44 accepts requests and sign-in redirects from your origin before going live.

## Own-server PWA deployment

### 1. Build

```bash
npm install
VITE_BASE44_APP_ID=<your app id> \
VITE_BASE44_APP_BASE_URL=<your Base44 app url> \
npm run build
```

### 2. Deploy with Docker + Caddy

```bash
docker compose up -d --build
```

Caddy serves the built app from `./dist`. The configured `rhgo.me` site enables automatic HTTPS, redirects HTTP requests to HTTPS, and sends HSTS on HTTPS responses. Private SPA routes receive `X-Robots-Tag: noindex, nofollow` before the HTML fallback; they remain crawlable in `robots.txt` so search engines can read that directive.

## Custom domain

1. Point your domain A/AAAA records to the server IP and make ports 80 and 443 reachable so Caddy can obtain and renew certificates.
2. For a different domain, replace only the `rhgo.me` site address in `Caddyfile`, preserving its headers and route matchers. Update the canonical URLs and sitemap for your domain too.

3. Restart:

```bash
docker compose restart
```

## Update later

```bash
git pull
npm install
npm run build
docker compose up -d --build
```
![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/rockhoundgocody-spec/RHgo-v-2.0?utm_source=oss&utm_medium=github&utm_campaign=rockhoundgocody-spec%2FRHgo-v-2.0&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)

## Build doctrine

RockHound-GO is not a basic rock ID app. It is a serious field platform that turns real-world exploration into a structured, ethical, science-forward discovery loop.
