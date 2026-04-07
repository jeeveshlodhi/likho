# Changelog

All notable changes to **Likho** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

> Work in progress — features currently in active development or planned for the next release.

### Added

- **pgvector Semantic Search** — Upgraded semantic search pipeline powered by pgvector, enabling
  faster and more accurate embedding-based retrieval across all note types.
- **Collaborative Write Assist** — Real-time AI writing suggestions and co-authoring assistance
  surfaced inline during collaborative editing sessions.
- **Meeting Intelligence** — Automatic meeting note summarisation, action-item extraction, and
  participant tagging from meeting-type pages.
- **Journal Insights** — Periodic AI-generated reflections and mood/theme trends derived from
  journal entries over time.
- **Smart Templates** — Context-aware template recommendations that adapt to note type, workspace,
  and recent activity patterns.
- **Digest Pages** — Auto-generated daily and weekly digest pages that surface highlights,
  incomplete tasks, and relevant backlinks from across the workspace.
- **Linux Build Support** — Official Linux desktop builds (`.AppImage` and `.deb`) added to the
  release pipeline alongside existing macOS and Windows targets.

---

## [0.1.0] — 2025-01-01

Initial public release of Likho. 🎉

### Added

#### Editor & Page Types
- **BlockNote Rich Editor** — Full-featured block-based rich text editor with slash commands,
  drag-and-drop block reordering, inline formatting, and embeds.
- **Multiple Page Types** — Support for five distinct page types out of the box:
  - `note` — General-purpose freeform notes.
  - `meeting` — Structured meeting notes with agenda and attendee fields.
  - `journal` — Date-anchored personal journal entries.
  - `kanban` — Drag-and-drop kanban board with customisable columns and cards.
  - `docs` — Long-form documentation pages with heading navigation.

#### AI & Intelligence
- **Local AI Inference (llama.cpp)** — On-device language model inference via llama.cpp,
  enabling AI-powered features with full data privacy and no external API dependency.
- **Semantic Search** — Embedding-based semantic search across all workspace content,
  powered by locally generated vector embeddings.
- **Knowledge Graph & Backlinks** — Automatic backlink detection and a visual knowledge graph
  showing relationships between pages across the workspace.

#### Collaboration
- **Real-Time Collaboration (Yjs)** — Conflict-free real-time collaborative editing using Yjs
  CRDTs, supporting simultaneous multi-user editing with live cursor presence.
- **Sharing** — Shareable page links with configurable access levels (view / comment / edit).

#### Workspace & Organisation
- **Workspace Management** — Create and switch between multiple isolated workspaces, each with
  its own pages, members, and settings.
- **Drag-and-Drop Kanban** — Fully interactive kanban boards with drag-and-drop card management,
  column reordering, and card detail views.
- **Temp Notes** — Lightweight ephemeral scratch-pad notes that live outside the main workspace
  hierarchy for quick, disposable capture.

#### Auth & Security
- **User Authentication** — Secure email/password authentication with session management,
  protected routes, and workspace-level role-based access control.

#### Export & Portability
- **Smart Export (PDF / Markdown)** — One-click export of any page to PDF (with preserved
  formatting) or plain Markdown for portability and archiving.

#### Platform & Infrastructure
- **Auto-Updater** — Built-in over-the-air auto-updater that checks for and installs new
  releases in the background with user confirmation.
- **Feature Flags** — Internal feature flag system enabling gradual rollout and per-workspace
  opt-in for experimental features.
- **macOS & Windows Builds** — Official signed desktop builds for macOS (Apple Silicon + Intel
  universal binary) and Windows (x64 NSIS installer).

---

[Unreleased]: https://github.com/likho-app/likho/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/likho-app/likho/releases/tag/v0.1.0