<div align="center">

<img src="likho-app/src-tauri/icons/128x128@2x.png" alt="Likho Logo" width="96" height="96" />

# Likho

### The AI-powered, block-based workspace that thinks with you.

*Write notes. Run meetings. Build knowledge. All offline-capable, all yours.*

<br/>

[![Build](https://img.shields.io/github/actions/workflow/status/twobroslab/likho/release.yml?style=flat-square&logo=github&label=build)](https://github.com/twobroslab/likho/actions/workflows/release.yml)
[![Release](https://img.shields.io/github/v/release/twobroslab/likho?style=flat-square&logo=github&color=blue)](https://github.com/twobroslab/likho/releases/latest)
[![License: MIT](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)
[![Stars](https://img.shields.io/github/stars/twobroslab/likho?style=flat-square&logo=github&color=yellow)](https://github.com/twobroslab/likho/stargazers)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square&logo=github)](https://github.com/twobroslab/likho/pulls)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows-lightgrey?style=flat-square&logo=tauri)](https://github.com/twobroslab/likho/releases)
[![Tauri](https://img.shields.io/badge/Tauri-v2-FFC131?style=flat-square&logo=tauri)](https://tauri.app)
[![Bun](https://img.shields.io/badge/Bun-1%2B-f9f1e1?style=flat-square&logo=bun)](https://bun.sh)

<br/>

[**Download**](https://github.com/twobroslab/likho/releases/latest) · [**Docs**](docs/) · [**Report a Bug**](https://github.com/twobroslab/likho/issues/new?template=bug_report.md) · [**Request a Feature**](https://github.com/twobroslab/likho/issues/new?template=feature_request.md)

</div>

---

## ✨ What is Likho?

**Likho** (लिखो — Hindi for *"write"*) is an open-source, AI-powered note-taking and knowledge workspace, packaged as a native desktop app. It combines a rich block-based editor, real-time collaboration, local LLM inference, and cloud AI features into a single cohesive tool — so your ideas, meetings, documentation, and journal entries all live together and talk to each other.

> **Offline-first by design.** Local AI inference via `llama.cpp` means your notes stay private. Cloud AI features are opt-in and powered by your own API keys.

---

## 🖼️ Screenshot

> *Screenshot coming soon — contributions welcome!*

<!-- Replace with actual screenshot once available -->
<!-- ![Likho workspace screenshot](docs/assets/screenshot.png) -->

---

## 🚀 Features

### 📝 Editor & Pages
- **Block-based rich editor** powered by [BlockNote](https://www.blocknotejs.org/) — headings, bullets, code, embeds, and more
- **Multiple page types:** Notes, Meeting, Documentation, Journal, Kanban, Brainstorm, Canvas, Project
- **Drag-and-drop Kanban board** for task and project tracking
- **Knowledge graph & backlinks** — connect your ideas with `[[wikilinks]]`
- **Temp notes** — capture quick thoughts and let AI sort them later

### 🤖 Local AI (Offline · Private)
Powered by `llama.cpp` and `fastembed` running entirely on your machine:

| Feature | Description |
|---|---|
| Summarize | Condense any note to key points |
| Improve & Rewrite | Enhance clarity, tone, and grammar |
| Auto-complete | Continue writing from your cursor |
| Suggest Title | Generate a fitting title for any note |
| Find Related Notes | Surface semantically similar notes |
| Auto-group Notes | Cluster notes into topic folders |
| Local Semantic Search | Vector + keyword hybrid search across all notes |
| RAG Chat | Ask questions about your local knowledge base |

*Default model:* `TinyLlama-1.1B-Chat-v1.0-Q4_K_M.gguf` (~637 MB). Upgradeable to Phi-3-Mini, Llama-3.2-3B, or Qwen2.5-7B via settings.

### ☁️ Cloud AI (Optional · Bring Your Own Keys)
Powered by Claude / OpenAI — opt-in, key never leaves your machine:

| Feature | Description |
|---|---|
| Writing Assistant | Rewrite, expand, condense, fix grammar inline |
| Semantic Cloud Search | pgvector-backed search across your whole workspace |
| Auto-tagging | AI-suggested semantic tags on every page save |
| Meeting Intelligence | Extract action items, decisions, open questions from meeting pages |
| Journal Insights | Sentiment trends, recurring themes, weekly reflection prompts |
| Contextual Team Q&A | RAG-powered workspace Q&A — "What did we decide about X?" |
| Smart Templates | Describe what you need → AI generates a ready-to-use template |
| Smart Export | AI-polished Markdown, PDF, or email export |
| Temp Note Classification | Server-side classification with confidence scoring |
| Note Health Report | Stale, orphaned, incomplete, and broken-link detection |

### 👥 Collaboration
- **Real-time co-editing** via Yjs WebSocket
- **Workspaces & sharing** with role-based access
- **User presence** indicators in the editor

### 🔧 Platform
- **Native desktop app** — macOS (aarch64) & Windows (x64) via Tauri v2
- **Auto-updater** baked in
- **Feature flags & remote config**
- **Smart export** — Markdown & PDF

---

## 🏗️ Architecture

```
likho/
├── backend/                  # FastAPI Python backend (cloud/online space)
│   ├── app/
│   │   ├── modules/          # auth, ai, collaboration, workspaces,
│   │   │                     # users, sharing, temp_notes, …
│   │   ├── api/              # Route definitions
│   │   ├── core/             # Config, security, database session
│   │   └── services/         # Business logic services
│   ├── alembic/              # Database migrations
│   └── main.py               # FastAPI app entrypoint
│
├── likho-app/                # Tauri v2 desktop application
│   ├── src/                  # React 19 + TypeScript frontend
│   │   ├── components/       # Shared UI components
│   │   ├── pages/            # auth, dashboard, onboarding,
│   │   │                     # settings, landing
│   │   ├── hooks/            # Custom React hooks
│   │   ├── store/            # Global state (Zustand)
│   │   └── types/            # TypeScript type definitions
│   └── src-tauri/            # Rust backend (Tauri shell)
│       └── src/              # Local AI, SQLite, embeddings,
│                             # llama.cpp bindings, fastembed
│
├── docs/                     # Project documentation
├── docker-compose.yml        # Full-stack Docker setup
└── schema.sql                # Reference database schema
```

### Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Desktop shell | [Tauri v2](https://tauri.app) (Rust) | Native app wrapper, IPC, auto-updater |
| Frontend | [React 19](https://react.dev) + TypeScript | UI framework |
| Build tool | [Vite](https://vitejs.dev) | Frontend bundler |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) | Utility-first CSS |
| Editor | [BlockNote](https://www.blocknotejs.org/) | Block-based rich text editor |
| Local AI | [llama.cpp](https://github.com/ggerganov/llama.cpp) (Rust bindings) | Local LLM inference |
| Local embeddings | [fastembed](https://github.com/Anush008/fastembed-rs) (Rust) | Local vector embeddings |
| Local DB | SQLite (via Tauri) | Offline note storage |
| Real-time | [Yjs](https://yjs.dev) WebSocket | Collaborative editing |
| Cloud backend | [FastAPI](https://fastapi.tiangolo.com) + Python | REST API & AI orchestration |
| Database | [PostgreSQL 15](https://www.postgresql.org) + pgvector | Relational + vector storage |
| Cache / queues | [Redis 7](https://redis.io) | Caching, background tasks |
| Migrations | [Alembic](https://alembic.sqlalchemy.org) | DB schema migrations |
| Cloud AI | [Anthropic Claude](https://www.anthropic.com) / [OpenAI](https://openai.com) | Cloud AI features |
| Frontend pkg mgr | [Bun 1+](https://bun.sh) | Fast JS package manager |
| Backend pkg mgr | [uv](https://github.com/astral-sh/uv) | Fast Python package manager |
| CI/CD | [GitHub Actions](https://github.com/features/actions) | Automated builds & releases |

---

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:

### All Platforms
| Tool | Version | Notes |
|---|---|---|
| [Bun](https://bun.sh) | 1.0+ | Frontend package manager |
| [Rust](https://rustup.rs) | stable | Desktop app compilation |
| [Python](https://www.python.org) | 3.10+ | Backend runtime |
| [uv](https://github.com/astral-sh/uv) | latest | Python package manager |
| [PostgreSQL](https://www.postgresql.org) | 15+ | Or use Docker (recommended) |
| [Redis](https://redis.io) | 7+ | Or use Docker (recommended) |

### macOS
```
xcode-select --install    # Xcode Command Line Tools
brew install cmake        # Required by llama.cpp Rust bindings
```

### Windows
- [LLVM/Clang 17](https://releases.llvm.org/download.html) — required by `llama-cpp-2` crate
- [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) — C++ workload
- Set `LIBCLANG_PATH` to your LLVM `bin/` directory

---

## ⚡ Quick Start

### 1 — Clone the repository

```
git clone https://github.com/twobroslab/likho.git
cd likho
```

### 2 — Start infrastructure (PostgreSQL + Redis)

The easiest way to spin up the required services is Docker:

```
docker compose up db redis -d
```

### 3 — Set up the backend

```
cd backend
cp .env.example .env          # fill in your values (see Environment Variables)
uv sync                       # install Python dependencies
uv run alembic upgrade head   # run database migrations
uv run uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

### 4 — Set up the desktop app

In a new terminal:

```
cd likho-app
bun install
bun run tauri dev
```

The Tauri development window will open automatically. Hot-reload is active for both the React frontend and (on file save) the Rust backend.

---

## 🐳 Docker — Full Stack

To run the entire stack (backend + frontend web build + database + Redis) in Docker:

```
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend (web) | `http://localhost:8080` |
| Backend API | `http://localhost:8000` |
| API Docs (Swagger) | `http://localhost:8000/docs` |
| PostgreSQL | `localhost:5432` |
| Redis | `localhost:6379` |

> **Note:** The Docker setup runs the React app as a static web build. For the full native desktop experience, run `bun run tauri dev` locally.

---

## 🔑 Environment Variables

Create a `.env` file in the `backend/` directory. The backend reads these at startup.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string — e.g. `postgresql://user:pass@localhost:5432/likhodb` |
| `REDIS_URL` | ✅ | Redis connection string — e.g. `redis://localhost:6379/0` |
| `SECRET_KEY` | ✅ | Long random string used to sign JWT tokens |
| `ANTHROPIC_API_KEY` | ☁️ optional | Enables Claude-powered cloud AI features |
| `OPENAI_API_KEY` | ☁️ optional | Enables OpenAI embedding generation for pgvector search |

> **Security:** Never commit `.env` to version control. The `.gitignore` already excludes it. For production, use a secrets manager (Doppler, AWS Secrets Manager, etc.).

---

## 📦 Building for Release

### Local build

```
cd likho-app
bun run tauri build
```

Artifacts are placed in `likho-app/src-tauri/target/release/bundle/`.

### CI/CD — Automated releases

Push a version tag to trigger a full cross-platform build via GitHub Actions:

```
git tag v1.0.0
git push origin v1.0.0
```

The `release.yml` workflow will:
1. Create a GitHub Release (draft)
2. Build for **macOS aarch64** (Apple Silicon) and **Windows x64** in parallel
3. Upload the signed installers as release assets
4. Publish the release

> **macOS builds** use `aarch64-apple-darwin`. Intel (x86_64) builds can be added to the matrix in `.github/workflows/release.yml`.

---

## 🗺️ Roadmap

### In Progress / Coming Next

| Feature | Priority | Notes |
|---|---|---|
| pgvector semantic search | P0 | Cloud vector search across all workspace pages |
| Cloud Writing Assistant | P0 | Inline AI rewrite/expand/condense via Claude |
| Auto-tagging | P0 | Background AI tagging on every page save |
| Meeting Intelligence | P1 | Action items, decisions, open questions extracted automatically |
| Temp Notes cloud sync | P1 | Cross-device sync + server-side AI classification |
| Note Health Report | P1 | Stale/orphan/incomplete/broken-link dashboard |
| AI Backlink Suggestions | P2 | Suggest `[[wikilinks]]` based on semantic similarity |
| Team Q&A (RAG) | P2 | "What did we decide about X?" — workspace-wide RAG |
| Note Digest (daily/weekly) | P2 | Pinned digest page auto-generated from your activity |
| Journal Insights | P2 | Sentiment trends + weekly reflection prompts |
| Smart Templates | P3 | Describe a template → AI generates BlockNote JSON |
| Duplicate Detection | P3 | "This looks similar to [Note X]" banner on save |
| Collaborative Write Assist | P3 | Real-time ghost suggestions during live co-editing |
| Smart Export | P3 | AI-polished Markdown / PDF / email export |

### Template Roadmap

A rich set of additional page templates is planned (Q1–Q4):

**Q1:** Weekly Review, Book Notes, Retrospective, Decision Log  
**Q2:** 1-on-1 Notes, PRD, User Interview Notes  
**Q3:** SOP, Habit Tracker, Travel Planner  
**Q4:** Recipe, Study Notes, Standup Log, Content Brief  

See [`TEMPLATES_ROADMAP.md`](TEMPLATES_ROADMAP.md) for full detail on each template's structure and planned AI features.

---

## 🤝 Contributing

Contributions of all kinds are welcome — bug fixes, features, documentation, design, and ideas.

### Getting started

1. **Fork** the repository and create a branch from `main`:
   ```
   git checkout -b feat/my-awesome-feature
   ```
2. Make your changes, following the code style of the surrounding code.
3. **Test** your changes locally:
   - Frontend: `bun run typecheck && bun run lint`
   - Backend: `uv run pytest`
   - Desktop: `bun run tauri build`
4. **Commit** with a descriptive message following [Conventional Commits](https://www.conventionalcommits.org/):
   ```
   git commit -m "feat(editor): add slash-command for inline AI rewrite"
   ```
5. **Open a Pull Request** — fill in the PR template and link any related issues.

### What to work on

- Browse [open issues](https://github.com/twobroslab/likho/issues) — especially those tagged `good first issue` or `help wanted`
- Check the [Roadmap](#️-roadmap) for planned features
- Found a bug? [Open an issue](https://github.com/twobroslab/likho/issues/new?template=bug_report.md) first before sending a fix

### Code structure guide

| Area | Where to look |
|---|---|
| New page type / template | `likho-app/src/pages/dashboard/` + `types/workspace.ts` |
| New Tauri command (Rust) | `likho-app/src-tauri/src/` |
| New API route (Python) | `backend/app/modules/<module>/` + `backend/app/api/` |
| Database migration | `backend/alembic/versions/` via `uv run alembic revision` |
| New AI feature (local) | `likho-app/src-tauri/src/` (llama.cpp / fastembed) |
| New AI feature (cloud) | `backend/app/modules/ai/` + `backend/app/api/` |

---

## 📄 License

This project is licensed under the **MIT License** — see the [`LICENSE`](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 Two Bros Lab

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
```

---

## 🙏 Acknowledgements

Likho is built on the shoulders of some fantastic open-source projects:

- **[Tauri](https://tauri.app)** — for making beautiful, lightweight native apps a joy to build in Rust + web tech
- **[BlockNote](https://www.blocknotejs.org/)** — for the excellent block-based editor that powers every page
- **[llama.cpp](https://github.com/ggerganov/llama.cpp)** — for making local LLM inference possible on consumer hardware
- **[fastembed-rs](https://github.com/Anush008/fastembed-rs)** — for fast, zero-dependency local embeddings in Rust
- **[Yjs](https://yjs.dev)** — for the CRDT-based real-time collaboration framework
- **[FastAPI](https://fastapi.tiangolo.com)** — for the clean, high-performance Python API framework
- **[pgvector](https://github.com/pgvector/pgvector)** — for vector similarity search directly in PostgreSQL
- **[Bun](https://bun.sh)** — for blazing-fast JS tooling
- **[uv](https://github.com/astral-sh/uv)** — for making Python dependency management sane again

---

<div align="center">

Made with ❤️ by [Two Bros Lab](https://github.com/twobroslab)

**[⬆ back to top](#likho)**

</div>