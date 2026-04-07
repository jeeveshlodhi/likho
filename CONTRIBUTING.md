# Contributing to Likho 🌱

Thank you for your interest in contributing to **Likho** — an AI-powered note-taking and workspace desktop app built for thinkers, builders, and learners. Whether you're fixing a typo, squashing a bug, or proposing a major new feature, every contribution matters and is deeply appreciated.

This document will walk you through everything you need to get started as a contributor. Please read it carefully before opening an issue or submitting a pull request.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Ways to Contribute](#ways-to-contribute)
3. [Development Setup](#development-setup)
4. [Project Structure](#project-structure)
5. [Branch Naming Convention](#branch-naming-convention)
6. [Commit Message Convention](#commit-message-convention)
7. [Pull Request Process](#pull-request-process)
8. [Code Style](#code-style)
9. [Testing](#testing)
10. [Running the Linters](#running-the-linters)
11. [Issue Labels](#issue-labels)
12. [Good First Issues](#good-first-issues)
13. [Getting Help](#getting-help)

---

## Code of Conduct

This project follows a [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you agree to uphold a welcoming and respectful environment for everyone. Please read it before contributing.

---

## Ways to Contribute

There are many ways to contribute to Likho — you don't have to write code to make a meaningful impact!

### 🐛 Bug Reports
Found something broken? Open an issue with a clear title, steps to reproduce, expected behaviour, actual behaviour, and your environment (OS, app version, etc.). The more detail, the better.

### ✨ Feature Requests
Have an idea for something Likho should do? Open a [GitHub Discussion](https://github.com/jeeveshlodhi/likho/discussions) or an issue tagged `enhancement`. Describe the problem it solves and how you envision it working.

### 📝 Documentation
Improving READMEs, fixing typos, clarifying setup steps, adding code comments, or writing guides all make Likho more accessible. Documentation PRs are always welcome.

### 💻 Code Contributions
From small bug fixes to large features — code contributions are the heart of open source. See the setup guide below to get your environment running.

### 🎨 Design
If you have UX/UI ideas, mockups, or feedback on the current interface, open an issue or discussion with your proposal. Screenshots, Figma links, or even rough sketches are all helpful.

---

## Development Setup

### 1. Fork & Clone

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/<your-username>/likho.git
cd likho
```

Add the upstream remote so you can stay in sync:

```bash
git remote add upstream https://github.com/jeeveshlodhi/likho.git
```

---

### 2. Prerequisites

Make sure you have the following installed before proceeding:

| Dependency | Version | Notes |
|---|---|---|
| [Node.js](https://nodejs.org/) | 20+ | Required for tooling |
| [Bun](https://bun.sh/) | Latest | Frontend package manager & runtime |
| [Rust](https://rustup.rs/) | Stable | Tauri native layer |
| [Python](https://www.python.org/) | 3.10+ | Backend runtime |
| [uv](https://docs.astral.sh/uv/) | Latest | Python package manager |
| [PostgreSQL](https://www.postgresql.org/) | 15+ | Primary database |
| [Redis](https://redis.io/) | 7+ | Caching & real-time pub/sub |
| **cmake** | Latest | macOS only — required to build native deps |
| **LLVM 17** | 17 | Windows only — required by `llama-cpp-2` |

**macOS (Homebrew):**
```bash
brew install cmake postgresql@15 redis
```

**Windows:**
- Install [LLVM 17](https://releases.llvm.org/download.html) and ensure it is on your `PATH`.
- Install PostgreSQL 15 and Redis via [WSL2](https://learn.microsoft.com/en-us/windows/wsl/) or Windows installers.

**Linux:**
```bash
sudo apt install cmake libssl-dev libgtk-3-dev libwebkit2gtk-4.1-dev \
  libayatana-appindicator3-dev librsvg2-dev postgresql redis-server
```

> 💡 Rust's `stable` toolchain is required. Run `rustup default stable && rustup update` to ensure you're up to date.

---

### 3. Backend Setup

```bash
cd backend

# Install all Python dependencies (creates a virtual environment automatically)
uv sync

# Copy the example environment file and fill in your values
cp .env.example .env

# Run database migrations
uv run alembic upgrade head

# Start the development server
uv run uvicorn main:app --reload --port 8000
```

Make sure PostgreSQL and Redis are running before starting the server. You can verify connectivity with:

```bash
# PostgreSQL
psql -U postgres -c "\l"

# Redis
redis-cli ping   # should respond with PONG
```

---

### 4. Frontend / Desktop Setup

```bash
cd likho-app

# Install dependencies
bun install

# Start the Tauri desktop app in development mode
bun run tauri dev
```

This will launch both the Vite dev server and the Tauri webview window. Hot-reloading is enabled for the React layer. Rust changes require a full recompile.

> 💡 On first run, Rust will download and compile all crates — this can take several minutes. Subsequent builds are much faster thanks to caching.

---

## Project Structure

```
likho/
├── backend/                  # FastAPI Python backend
│   ├── app/
│   │   ├── api/              # Route handlers (endpoints)
│   │   ├── core/             # Config, security, database setup
│   │   ├── dependencies/     # FastAPI dependency injection
│   │   ├── middleware/        # Custom middleware (auth, logging, rate limiting)
│   │   ├── modules/          # Domain modules (notes, users, workspaces, AI, …)
│   │   └── services/         # Reusable business logic / service layer
│   ├── alembic/              # Database migration scripts
│   ├── migrations/           # Additional migration files
│   ├── main.py               # Application entry point
│   └── pyproject.toml        # Python project config & dependencies
│
├── likho-app/                # Tauri desktop application
│   ├── src/                  # React + TypeScript frontend source
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Top-level route/page components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── store/            # Zustand global state stores
│   │   ├── providers/        # React context providers
│   │   ├── lib/              # Third-party library wrappers & utilities
│   │   ├── utils/            # Pure helper functions
│   │   ├── types/            # Shared TypeScript type definitions
│   │   └── constants/        # App-wide constants
│   ├── src-tauri/            # Rust / Tauri native layer
│   │   ├── src/
│   │   │   ├── commands/     # Tauri IPC command handlers
│   │   │   ├── db.rs         # Local SQLite database logic
│   │   │   ├── embeddings.rs # Local AI embeddings (fastembed)
│   │   │   ├── llm.rs        # Local LLM inference (llama-cpp-2)
│   │   │   ├── rag.rs        # Retrieval-augmented generation pipeline
│   │   │   ├── search.rs     # Full-text & vector search
│   │   │   └── lib.rs        # Tauri app setup & plugin registration
│   │   ├── Cargo.toml        # Rust dependencies
│   │   └── tauri.conf.json   # Tauri app configuration
│   ├── package.json          # Frontend dependencies (managed via Bun)
│   └── vite.config.ts        # Vite build configuration
│
├── docs/                     # Project documentation
├── docs-site/                # Documentation website source
├── scripts/                  # Automation & helper scripts
└── docker-compose.yml        # Local development services (Postgres, Redis)
```

---

## Branch Naming Convention

Branch names should clearly communicate intent. Use the following prefixes:

| Prefix | When to use |
|---|---|
| `feat/` | A new feature |
| `fix/` | A bug fix |
| `docs/` | Documentation-only changes |
| `chore/` | Dependency updates, config, tooling |
| `refactor/` | Code restructuring with no behaviour change |
| `test/` | Adding or fixing tests |
| `perf/` | Performance improvements |

**Examples:**
```
feat/ai-chat-sidebar
fix/note-sync-conflict
docs/contributing-setup
chore/upgrade-tauri-v2
refactor/note-store-zustand
```

Keep branch names lowercase, hyphen-separated, and concise.

---

## Commit Message Convention

Likho follows [Conventional Commits](https://www.conventionalcommits.org/). This keeps the git history readable and enables automated changelogs.

### Format

```
<type>(<scope>): <short summary>

[optional body]

[optional footer: e.g. Closes #42]
```

### Types

| Type | Description |
|---|---|
| `feat` | A new feature visible to users |
| `fix` | A bug fix |
| `docs` | Documentation changes only |
| `chore` | Build process, dependencies, config |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test` | Adding or updating tests |
| `perf` | Performance improvement |
| `style` | Formatting, whitespace (no logic change) |
| `ci` | CI/CD pipeline changes |

### Scope (optional but encouraged)

Use the affected part of the codebase as scope: `frontend`, `backend`, `tauri`, `ai`, `auth`, `editor`, `db`, `search`, etc.

### Examples

```
feat(editor): add slash command menu for block insertion
fix(auth): resolve token refresh race condition
docs(setup): clarify redis installation on macOS
chore(deps): upgrade fastembed to 4.1
refactor(tauri): extract embedding logic into dedicated module
test(backend): add pytest coverage for note CRUD endpoints
perf(search): cache embedding vectors for repeated queries
```

> ⚠️ Commits that introduce breaking changes should append `!` after the type and include a `BREAKING CHANGE:` footer.
> Example: `feat(api)!: rename /notes endpoint to /documents`

---

## Pull Request Process

### Before You Open a PR

- [ ] Your branch is up to date with `upstream/main`
- [ ] All tests pass locally
- [ ] Linters pass with no errors
- [ ] New behaviour is covered by tests
- [ ] Documentation is updated if needed

### Syncing with upstream

```bash
git fetch upstream
git rebase upstream/main
```

### PR Description Requirements

When opening a pull request, please include:

1. **Summary** — What does this PR do? Why?
2. **Type of change** — Bug fix / New feature / Docs / Refactor / etc.
3. **Related issue(s)** — Reference with `Closes #<issue-number>` or `Relates to #<issue-number>`
4. **How to test** — Steps to verify the change works correctly
5. **Screenshots / recordings** — For UI changes, before/after screenshots are extremely helpful

### PR Checklist

```
- [ ] I have read the CONTRIBUTING guide
- [ ] My code follows the project's code style
- [ ] I have added tests for my changes
- [ ] All existing tests pass
- [ ] I have updated relevant documentation
- [ ] My commits follow the Conventional Commits convention
- [ ] I have linked the relevant issue(s)
```

### Review Process

- Every PR requires **at least one approving review** from a maintainer before merging.
- Reviewers may request changes. Please address feedback promptly and re-request review.
- Once approved, a maintainer will merge your PR — contributors do not self-merge.
- PRs are merged using **squash merge** by default to keep the main branch history clean.

> 🙏 Be patient — maintainers are often juggling many things. If your PR has had no activity for more than a week, feel free to leave a polite comment to bump it.

---

## Code Style

Consistent code style makes the codebase easier to navigate and review. Please follow the guidelines below for each layer of the stack.

### TypeScript (Frontend)

- **Strict mode** is enabled in `tsconfig.json` — all type errors must be resolved.
- Use **ESLint** to catch common issues. Config is in `likho-app/`.
- Prefer `const` over `let`; avoid `any`.
- Use explicit return types on exported functions.
- Component files follow PascalCase (`NoteEditor.tsx`); utility files use camelCase (`formatDate.ts`).
- Use Tailwind CSS utility classes for styling; avoid inline styles.
- State management uses **Zustand** — keep stores small and domain-specific.

### Python (Backend)

- All code is formatted with **[Black](https://black.readthedocs.io/)** (line length: 88).
- **[Ruff](https://docs.astral.sh/ruff/)** is used as the linter — all warnings must be resolved before merging.
- **Type hints are required** on all function signatures and class attributes. Use `from __future__ import annotations` for forward references.
- Follow **FastAPI** best practices: use dependency injection, Pydantic schemas for request/response models, and keep route handlers thin.
- Use `mypy` for static type checking on critical modules.

### Rust (Tauri layer)

- Run `cargo fmt` before committing — all Rust code must be formatted.
- Run `cargo clippy` and resolve all warnings (treat `clippy::all` as errors in CI).
- Use descriptive variable names; avoid single-letter names outside iterators.
- Document public functions and structs with `///` doc comments.
- Prefer `thiserror` for defining error types and `anyhow` for propagation in application code.

---

## Testing

Likho has three test surfaces that map to the three layers of the stack.

### Backend — pytest

```bash
cd backend

# Run the full test suite
uv run pytest

# Run with verbose output
uv run pytest -v

# Run a specific test file
uv run pytest tests/test_notes.py

# Run with coverage report
uv run pytest --cov=app --cov-report=term-missing
```

Tests live in `backend/tests/`. New features **must** include corresponding tests. Use `pytest-asyncio` for testing async FastAPI routes.

### Frontend — Vitest

The frontend uses **[Vitest](https://vitest.dev/)** as the test runner (compatible with Vite's build pipeline).

```bash
cd likho-app

# Run tests
bun run test

# Run tests in watch mode
bun run test --watch

# Run tests with UI
bun run test --ui
```

Unit tests live alongside their source files as `*.test.ts` / `*.test.tsx`. Focus on testing hooks, utility functions, and complex component logic.

### Rust — cargo test

```bash
cd likho-app/src-tauri

# Run all Rust tests
cargo test

# Run a specific test
cargo test <test_name>

# Run tests with output
cargo test -- --nocapture
```

Add unit tests for any non-trivial Rust logic, especially in `embeddings.rs`, `search.rs`, and `rag.rs`.

---

## Running the Linters

Before opening a PR, run all linters to ensure your changes are clean.

### Frontend (TypeScript)

```bash
cd likho-app

# Type-check
bunx tsc --noEmit

# Lint with ESLint
bun run lint
```

### Backend (Python)

```bash
cd backend

# Format with Black
uv run black .

# Lint with Ruff
uv run ruff check .

# Auto-fix Ruff issues where possible
uv run ruff check . --fix

# Type-check with mypy
uv run mypy app/
```

### Rust

```bash
cd likho-app/src-tauri

# Format
cargo fmt

# Lint (all warnings treated as errors)
cargo clippy -- -D warnings
```

### Run Everything at Once

A convenience script is available at the repo root:

```bash
./scripts/lint-all.sh
```

---

## Issue Labels

Labels help maintainers and contributors quickly understand and triage issues. Here's the taxonomy used in this project:

| Label | Description |
|---|---|
| `bug` | Something is broken or behaving unexpectedly |
| `enhancement` | A new feature or improvement to an existing one |
| `documentation` | Improvements or additions to docs |
| `good first issue` | Ideal for first-time contributors — well-scoped and clearly described |
| `help wanted` | Maintainers need outside assistance on this issue |
| `question` | A question or request for clarification |
| `duplicate` | Already reported or tracked elsewhere |
| `wontfix` | Intentionally not addressed (out of scope, by design, etc.) |
| `invalid` | Not a valid bug report or doesn't reproduce |
| `breaking change` | Introduces a backwards-incompatible change |
| `performance` | Related to speed, memory, or efficiency |
| `security` | Security-sensitive issue — handle with care |
| `frontend` | Affects the React/TypeScript UI layer |
| `backend` | Affects the FastAPI/Python layer |
| `tauri` | Affects the Rust/Tauri native layer |
| `ai` | Related to AI features (embeddings, LLM, RAG) |
| `dependencies` | Dependency upgrade or vulnerability fix |
| `ci/cd` | Changes to GitHub Actions or build pipelines |

---

## Good First Issues

New to Likho or open source in general? 👋 Welcome — we're glad you're here!

Look for issues tagged **[`good first issue`](https://github.com/jeeveshlodhi/likho/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22)** — these are hand-picked by maintainers to be approachable for newcomers. They typically involve:

- Fixing a small, well-defined bug
- Improving error messages or UI copy
- Adding a missing test case
- Updating documentation or comments
- Refactoring a small utility function

**Tips for first-time contributors:**

1. Comment on the issue before starting to avoid duplicate work.
2. Ask questions early — there are no dumb questions here.
3. Keep your first PR small and focused. A tight, well-tested PR is always preferred over a large one.
4. Don't be discouraged by review feedback — it's how we all grow!

---

## Getting Help

Stuck on something? Not sure where to start? Here are the best ways to get support:

- **[GitHub Discussions](https://github.com/jeeveshlodhi/likho/discussions)** — For open-ended questions, ideas, architecture discussions, and general chat. This is the preferred place for non-bug conversations.
- **[GitHub Issues](https://github.com/jeeveshlodhi/likho/issues)** — For specific bugs or well-defined feature requests. Please search existing issues before opening a new one.

When asking for help, please include:
- What you were trying to do
- What you expected to happen
- What actually happened
- Relevant logs, error messages, or screenshots
- Your OS, app version, and relevant dependency versions

---

Thank you for being part of Likho. Every contribution — big or small — helps build something meaningful. We're excited to build with you. 🚀