<div align="center">

# Hermes Team HQ

### A living virtual office for an AI-assisted development team

[![Vercel](https://img.shields.io/badge/live%20site-Vercel-000?style=flat-square&logo=vercel)](https://hermes-team-hq.vercel.app/)
![Three.js](https://img.shields.io/badge/Three.js-isometric%20campus-222?style=flat-square)
![Privacy](https://img.shields.io/badge/public%20build-read--only-35664d?style=flat-square)
![JavaScript](https://img.shields.io/badge/JavaScript-61.7%25-F7DF1E?style=flat-square&logo=javascript&logoColor=111)
![CSS](https://img.shields.io/badge/CSS-32.2%25-663399?style=flat-square&logo=css&logoColor=fff)
![HTML](https://img.shields.io/badge/HTML-6.1%25-E34F26?style=flat-square&logo=html5&logoColor=fff)

**[Open the live campus →](https://hermes-team-hq.vercel.app/)**

</div>

---

![The standing Hermes development team inside the campus](assets/hermes-team-standing.png)

## What this is

Hermes Team HQ turns a multi-agent development workflow into a visual office. It shows who is working, what each specialist owns, recorded activity, the shared project board, and scheduled personal routines in one interactive campus.

The public site is a safe, read-only showcase. BENJIE's private localhost dashboard remains the operational control plane connected to Hermes, Telegram topics, the review ledger, and task creation.

## Inside the campus

- Interactive isometric office rendered with Three.js
- Single-monitor workstations with Red, Espina and Marielle beside the private office, a 12-seat meeting room with an open doorway, 10-seat dining area, gym, covered smoking area, nine staff beds inside the former specialist room, and a horizontal queen bed in BENJIE and Judith's private office
- Ten specialist profiles with roles, skills, active assignments, and work-time summaries
- Dayao, the robot personal-ops assistant, has a separate office beside dining with a laptop, chair, sofa and bed; his visual routines stay inside
- Team and skills directory
- Shared development board
- Owner review desk interface
- Responsive layout for desktop and smaller screens

## Team and operating ideas

| Team member | Position | What they can own independently | What comes back to BENJIE |
| --- | --- | --- | --- |
| Judith | Lead Senior · Technical Research & Architecture | Research options, compare APIs, write architecture decisions, identify technical and security risks | Recommended direction, sources, trade-offs, and any high-risk decision |
| David | Senior Product Engineer | Turn a goal into requirements, user stories, edge cases, and acceptance criteria | Product brief and decisions that change scope |
| Fer | Senior Frontend Engineer | Build responsive interfaces, reusable components, accessibility, and browser behavior | Visual preview, implementation report, and UI decisions needing approval |
| Inciong | Senior Developer Tooling Engineer | Improve scripts, automation, local tooling, build checks, and repeatable workflows | Tooling changes, command output, and environment-impacting proposals |
| Rick | Senior Full-stack Engineer | Implement application flows, APIs, data integration, validation, and performance fixes | Working feature, test evidence, and data/schema changes |
| Fulton | Senior QA & Security Engineer | Create tests, reproduce defects, run regression checks, and review common security risks | Pass/fail report, evidence, blockers, and release recommendation |
| Joem | Senior DevOps & Release Engineer | Prepare CI/CD, preview releases, health checks, observability, and rollback instructions | Release candidate and exact deployment request; production remains approval-gated |
| Red | Junior UI/UX apprentice | Wireframes, property-card design, HTML/CSS practice | Espina's design review and BENJIE's approval |
| Espina | Senior UI/UX & Design Systems Designer | Create user flows, wireframes, prototypes, reusable design tokens, and usability reviews | Design direction, interactive prototype, accessibility decisions, and visual sign-off |
| Marielle | Junior UI/UX apprentice | User flows, usability checks, design QA | Espina's review, evidence, and BENJIE's approval |
| Dayao | Personal Ops & Job Search Reporter | Read-only mail/calendar summaries, job tracking, reports and reading reminders | Any application or external action remains with BENJIE |

BENJIE remains the owner, project manager, engineering-standards lead, code reviewer, and final approver. Judith additionally owns documentation and knowledge management, so architectural decisions, sources, runbooks, and handoffs stay connected instead of becoming a separate documentation silo.

### How autonomous are they?

They are **role-based AI agents, not conscious people**. They do not have feelings, personal beliefs, or a human mind. Within an assigned task, however, each agent can inspect context, break work into steps, use allowed local tools, produce artifacts, test its work, report blockers, and recommend the next action.

Their autonomy is deliberately bounded:

1. BENJIE provides the objective and constraints.
2. The assigned specialist plans and executes only within its role and available permissions.
3. The agent records evidence and submits a report when work is ready, blocked, or complete.
4. The report remains in the **Approval inbox** until BENJIE approves, holds, sends it back, or adds an instruction.
5. Production deployment, cloud access, secrets, public publishing, and destructive actions never become automatic merely because an agent finished its task.

## 24/7 approval inbox

The private localhost dashboard stores review items and decisions in a local SQLite ledger. `review`, `done`, `blocked`, and access-request items remain available when BENJIE is away and appear again in **Review desk → Approval inbox · 24/7** when the dashboard is reopened.

```text
Assigned → Agent works → Tests and report → Approval inbox
                                              ├─ Approve
                                              ├─ Hold
                                              ├─ Send back
                                              └─ Instruct
```

“24/7 inbox” means the queue is durable. The current local runtime keeps working while the host computer is running; there is no verified always-on cloud worker, and the Google Cloud rollout was stopped. The public Vercel site stays read-only and never exposes the private approval ledger.

## Architecture

```text
Public Vercel site               Private Hermes runtime
──────────────────              ──────────────────────
Read-only preview data           Live Hermes status
Three.js campus                  Telegram topic links
Team / skills / board UI         Task assignment
No credentials                   Approval ledger
No write-capable API             Gmail and A2A gateways
```

This separation prevents a public static site from becoming an exposed administration panel.

## Technology and languages

| Layer | Technology | Use |
| --- | --- | --- |
| Interface | HTML5, CSS3 | Accessible structure, responsive dashboard, visual campus shell |
| Application | Modern JavaScript ES modules | Status UI, board, review desk, scheduling, interactions |
| Campus rendering | Three.js + WebGL | Isometric office, rooms, furniture, movement, camera controls |
| Characters | WorkAdventure/Pipoya-compatible sprites | Standing, walking, working, resting, and personal-routine states |
| Private control plane | Python + SQLite | Local API, Hermes status aggregation, durable approval ledger |
| Delivery | GitHub + Vercel | Automated read-only public deployment on every push to `main` |
| Agent communication | A2A JSON-RPC 2.0 | Agent Cards, durable context IDs, parent-child delegation, and task state history |

GitHub's language panel is generated automatically from tracked source files. The README badges are a historical snapshot of the repository mix: JavaScript 61.7%, CSS 32.2%, and HTML 6.1%. Python powers the private localhost control plane and is intentionally excluded from the public static build.

## Run locally

Clone the repository, then serve it over HTTP:

```bash
python -m http.server 8080
```

Open `http://localhost:8080`. Opening `index.html` directly is not supported because the browser must load JavaScript modules over HTTP.

## Runtime readiness

Each specialist has a separate Hermes profile and role; profiles can share the local model without sharing conversation history. A different model subscription per character is not required. Task model overrides must match the harness context-window requirement, and CLI workers need file/terminal tools to produce artifacts. A task marked complete is not proof of a tested artifact. Production and promotions still require owner review.

Dayao reuses the former Mia/co-worker runtime and existing scheduled reports. These Codex-hosted reports are distinct from a continuously running Hermes worker. Telegram connection is not verified until the intended bot is identified and tested.

## Deployment

Every push to `main` deploys automatically to [Vercel](https://hermes-team-hq.vercel.app/). The public build requires no repository secrets.

## A2A agent network

The private Hermes gateway is configured for one localhost-only A2A listener on port `9900`. Espina is the parent reviewer; Red and Marielle are child agents. Configured Agent Card routes are `/espina`, `/red`, and `/marielle`. Tasks retain a context ID and move through A2A task states before Espina's review and BENJIE's final approval. The agents cannot self-approve deployment, credential, purchase, or promotion decisions.

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

## Zero to Hero promotion trial

Espina is the parent design agent and mentor for Red and Marielle, two recent Computer Science graduates on a 30-day Junior UI/UX apprenticeship from September 25 through October 24, 2026. Promotion is based on weighted quality, completion, first-pass acceptance, evidence, collaboration, and growth. It requires at least eight completed tasks, six reviewed tasks, no unresolved critical defect, Espina's recommendation, and BENJIE's final approval.

## Project operating cadence

Each new project receives an isolated workspace and Kanban board, a written business-day estimate, named owners and dependencies, daily evidence updates, recorded meeting notes, required documents, QA/security gates, release and rollback instructions, and final approval by BENJIE. The public site does not claim live worker activity when no authenticated backend is connected; private task content and approval records stay local.
