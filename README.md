<div align="center">

# Hermes Team HQ

### A living virtual office for an AI-assisted development team

[![GitHub Pages](https://img.shields.io/github/actions/workflow/status/webjie28/MY-PERSONAL-TEAM-AGENT/pages.yml?label=live%20site&style=flat-square)](https://webjie28.github.io/MY-PERSONAL-TEAM-AGENT/)
![Three.js](https://img.shields.io/badge/Three.js-isometric%20campus-222?style=flat-square)
![Privacy](https://img.shields.io/badge/public%20build-read--only-35664d?style=flat-square)

**[Open the live campus →](https://webjie28.github.io/MY-PERSONAL-TEAM-AGENT/)**

</div>

---

## What this is

Hermes Team HQ turns a multi-agent development workflow into a visual office. It shows who is working, what each specialist owns, recorded activity, the shared project board, and scheduled personal routines in one interactive campus.

The public site is a safe, read-only showcase. BENJIE's private localhost dashboard remains the operational control plane connected to Hermes, Telegram topics, the review ledger, and task creation.

## Inside the campus

- Interactive isometric office rendered with Three.js
- Individual workstations, meeting room, lounge, dining area, gym, smoking area, and rest quarters
- Seven specialist profiles with roles, skills, active assignments, and work-time summaries
- Team and skills directory
- Shared development board
- Owner review desk interface
- Responsive layout for desktop and smaller screens

## Team

| Team member | Position | Focus |
| --- | --- | --- |
| Judith | Lead Senior · Technical Research & Architecture | Research, architecture, APIs, security review |
| David | Senior Product Engineer | Requirements, stories, acceptance criteria |
| Fer | Senior Frontend Engineer | TypeScript, responsive UI, accessibility |
| Inciong | Senior Developer Tooling Engineer | Automation, builds, CLI workflows |
| Rick | Senior Full-stack Engineer | Frontend, backend, integrations, performance |
| Fulton | Senior QA & Security Engineer | Test automation, regression, security |
| Joem | Senior DevOps & Release Engineer | CI/CD, deployment, observability |

## Architecture

```text
Public GitHub Pages              Private localhost
──────────────────              ─────────────────
Read-only preview data           Live Hermes status
Three.js campus                  Telegram topic links
Team / skills / board UI         Task assignment
No credentials                   Approval ledger
No write-capable API             Local filesystem access
```

This separation prevents a public static site from becoming an exposed administration panel.

## Technology

- HTML5 and modern CSS
- Vanilla JavaScript modules
- Three.js for the 3D/isometric campus
- WorkAdventure/Pipoya-compatible character sprites
- GitHub Actions and GitHub Pages

## Run locally

Clone the repository, then serve it over HTTP:

```bash
python -m http.server 8080
```

Open `http://localhost:8080`. Opening `index.html` directly is not supported because the browser must load JavaScript modules over HTTP.

## Deployment

Every push to `main` deploys through the included GitHub Pages workflow. The workflow requires no repository secrets.

## Security and privacy

The public repository intentionally excludes:

- Telegram chat and topic URLs
- Local Hermes paths and databases
- Review decisions and approval tokens
- Environment files and credentials
- Write-capable task, leave, deployment, or access APIs

## Asset attribution

Character sprites are based on assets used by the WorkAdventure map starter ecosystem. Review the upstream [WorkAdventure map starter kit](https://github.com/workadventure/map-starter-kit) and preserve the applicable asset licenses when redistributing or modifying them.

---

<div align="center">
Built for BENJIE's development team.
</div>
