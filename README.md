# ROCKHOUND-GO V2.5 — ONE-LOCATION OWN-SERVER DEPLOY

RockHound-GO is being consolidated into one controlled deploy target: **one repo, one build, one URL, one server path**.

This repository is the active deployment target for the RockHound-GO PWA / web app build.

## Product direction

RockHound-GO is a field intelligence and geological adventure platform for modern rockhounds. The core app should remain shippable around:

- **Explore** — map-based discovery, site context, hazards, land/access notes, saved/offline regions.
- **Scan** — camera-first specimen identification, quick result, deep analysis, confidence, test prompts.
- **GeoDex / Collection** — personal geological archive with photos, provenance, notes, tests, rarity, XP, and discovery chains.
- **Safety / Legal / Offline** — ethical collecting prompts, geo privacy, offline queue, cached field mode.

Roadmap/demo layers can include Community, Market, Clover AI, Land Access, Learning, Quests, and AR glasses support, but future-facing modules must not be represented as fully production-ready unless actually implemented.

## Applied file package

The uploaded RHGO project files have been consolidated into:

```text
/docs/APPLY_THE_FILES_TO_RHGO.md
```

That document is the build directive for the next implementation pass.

## Own-server PWA deployment

### 1. Build

```bash
npm install
npm run build
```

### 2. Deploy with Docker + Caddy

```bash
docker compose up -d --build
```

Caddy serves the built app from `./dist` and can provide HTTPS automatically when the domain is configured.

## Custom domain

1. Point your domain A-record to the server IP.
2. Edit `Caddyfile` and replace `:80` or `localhost` with your real domain, for example:

```text
app.rockhoundgo.com {
  root * /srv
  encode gzip zstd
  try_files {path} /index.html
  file_server
}
```

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

## Build doctrine

RockHound-GO is not a basic rock ID app. It is a serious field platform that turns real-world exploration into a structured, ethical, science-forward discovery loop.
