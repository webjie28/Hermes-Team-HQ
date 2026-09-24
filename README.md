# Hermes Team HQ

Public, read-only showcase of BENJIE's virtual development campus.

## Privacy boundary

This repository intentionally contains no Telegram topic URLs, Hermes filesystem paths, approval database, credentials, or write-capable APIs. The public site uses representative preview data. The private localhost dashboard remains the operational control plane connected to Hermes.

## Stack

- Vanilla JavaScript modules
- Three.js isometric campus
- WorkAdventure/Pipoya-compatible character artwork
- GitHub Pages deployment

## Local preview

Serve this folder over HTTP, for example with `python -m http.server 8080`, then open `http://localhost:8080`.

## Deployment

Every push to `main` deploys the static site through GitHub Pages. The workflow contains no secrets.

## Asset attribution

Character sprites are derived from the WorkAdventure map starter assets and retain their original licensing requirements. See the upstream [WorkAdventure map starter kit](https://github.com/workadventure/map-starter-kit) before redistributing modified assets.
