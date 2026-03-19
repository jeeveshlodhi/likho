# Likho — Template Roadmap

## Currently Shipped

| Template | PageType | Status |
|---|---|---|
| Blank Note | `note` | ✅ |
| Documentation | `documentation` | ✅ |
| Meeting Notes | `meeting` | ✅ |
| Project Plan | `project` | ✅ |
| Daily Journal | `journal` | ✅ |
| Brainstorm Canvas | `brainstorm` | ✅ |
| Blank Canvas | `canvas` | ✅ |
| Kanban Board | `kanban` | ✅ |

---

## Proposed Templates

### 🔵 Tier 1 — High Value, Fits Existing Architecture

These are straightforward structured-editor templates that follow the exact same pattern as Meeting Notes and Daily Journal — minimal new infrastructure needed.

---

#### 1. Weekly Review
**PageType:** `weekly-review`
**Category:** Productivity

A Sunday/Monday ritual page to look back at the week and plan the next one.

**Sections:**
- Week range (date picker: Mon → Sun)
- ⭐ Wins — what went well (bullet list)
- 📉 Didn't go well — honest reflection (bullet list)
- 🧠 Key learnings — insights or lessons (bullet list)
- ✅ Tasks completed vs. planned (checklist comparison)
- 🎯 Next week's top 3 priorities
- 💬 Personal note / mood rating (1–10 slider)
- 🔗 Linked notes from the week (auto-pulled from backlinks)

**AI Feature:** `POST /api/v1/ai/weekly-summary`
- Scans journal entries and meeting notes from the week range
- Generates a narrative summary: themes, energy pattern, productivity score

---

#### 2. Book / Article Notes
**PageType:** `reading`
**Category:** Knowledge

Capture notes while reading — books, papers, articles, blog posts.

**Sections:**
- Title + Author + Source URL
- Type toggle: Book / Article / Paper / Podcast / Video
- Status: Reading / Finished / Abandoned
- ⭐ Rating (1–5 stars)
- 📌 Key highlights (numbered list with page/timestamp reference)
- 💡 My takeaways — personal synthesis (rich text)
- ❓ Questions this raised
- 🔗 Related notes (wiki-links)
- 📤 Action items (checklist — things to apply)

**AI Feature:** `POST /api/v1/ai/reading-summary`
- Paste highlights → AI generates a concise synthesis and extracts actionable takeaways
- Suggests related notes in the workspace via semantic search

---

#### 3. Retrospective
**PageType:** `retro`
**Category:** Planning

Sprint retro for teams or personal project post-mortems. Classic 4-quadrant format.

**Sections:**
- Sprint / Period name + date range
- 😊 What went well (sticky-note-style cards)
- 😔 What didn't go well (sticky-note-style cards)
- 💡 Ideas to try next time (cards)
- ✅ Action items from this retro (assignee + due date)
- 📊 Team mood vote (emoji poll: 😞😐😊🤩)
- Previous retro action items — did we follow through? (checklist)

**AI Feature:** `POST /api/v1/ai/retro-insights`
- Reads all previous retro pages in the workspace
- Spots recurring problems or stalled action items
- Generates a "pattern report": "This is the 3rd sprint where testing was flagged"

---

#### 4. Decision Log
**PageType:** `decision`
**Category:** Knowledge

One page per important decision. Acts as an organizational memory — why we chose X over Y.

**Sections:**
- Decision title (short, verb-first: "Choose auth library", "Hire senior designer")
- Date decided
- Status: Proposed / Decided / Reversed
- Context — background and why this needed a decision (rich text)
- Options considered (repeating block: name + pros + cons)
- Decision made — the chosen option + rationale
- Trade-offs accepted
- 📅 Review date — when to revisit this
- 👥 Decision makers (people tags)
- Outcome — filled in later, how did it go?

**AI Feature:** `POST /api/v1/ai/decision-analysis`
- Given context + options, AI plays devil's advocate
- Flags overlooked risks and suggests a review date based on decision type

---

#### 5. 1-on-1 Notes
**PageType:** `one-on-one`
**Category:** Meeting (variant)

Recurring manager ↔ report check-in. Accumulates entries over time — one page per relationship.

**Sections:**
- Person name + role + relationship (manager of / report of)
- Meeting frequency (weekly / bi-weekly / monthly)
- Meeting entries (repeating block per session):
  - Date
  - 🙌 Wins since last meeting
  - 🚧 Blockers / concerns
  - 📋 Agenda items (checklist)
  - 📝 Notes
  - ✅ Action items with owners
  - 💬 Feedback given / received
- Long-term goals tracked (persistent across entries)
- Career development notes

**AI Feature:** `POST /api/v1/ai/one-on-one-prep`
- Reads previous entries and open action items
- Generates a pre-meeting briefing: outstanding items, talking points, trend in mood/blockers

---

### 🟡 Tier 2 — High Value, Needs Some New Infrastructure

These need a new UI pattern or a new backend route, but fit naturally into the product.

---

#### 6. PRD — Product Requirements Document
**PageType:** `prd`
**Category:** Documents

Lightweight product spec. Not a 40-page Word doc — a focused, living Likho page.

**Sections:**
- Feature name + product area
- Status: Draft / Review / Approved / Shipped
- Problem statement — what user pain are we solving?
- User personas affected
- Success metrics (KPIs, measurable outcomes)
- Scope: In / Out of scope (two columns)
- User stories (repeating: As a ___, I want ___, so that ___)
- Design links (embed or URL field)
- Open questions (tracked checklist)
- Technical notes
- 📅 Timeline: target dates by milestone
- Stakeholders (people tags + their role: author / reviewer / approver)

**AI Feature:** `POST /api/v1/ai/prd-review`
- Checks for missing sections (no success metrics? No out-of-scope defined?)
- Flags vague user stories ("make it faster" → needs specificity)
- Suggests related PRDs or decisions in workspace

---

#### 7. User Interview Notes
**PageType:** `interview`
**Category:** Knowledge

UX research template — capture what real users say, feel, and do.

**Sections:**
- Participant name / ID (anonymize toggle)
- Date + interviewer name
- Research goal / hypothesis being tested
- Participant background (role, experience, context)
- Interview questions (pre-loaded list, editable)
- Responses (Q + A pairs)
- 💡 Observations (non-verbal, unexpected reactions)
- Direct quotes (highlighted blocks)
- Insights / patterns noticed
- Follow-up needed (checklist)

**AI Feature:** `POST /api/v1/ai/interview-analysis`
- Extracts top themes and quotes across multiple interview pages in the workspace
- Identifies contradictions between participants
- Generates an insight synthesis report

---

#### 8. SOP — Standard Operating Procedure
**PageType:** `sop`
**Category:** Documents

How-to document for repeatable processes. Reference during execution, not just filing.

**Sections:**
- Process name + owner + department
- Version + last updated date
- Purpose — why this process exists
- Scope — when to use this SOP
- Prerequisites — what must be true before starting
- Steps (numbered, each with: description + expected output + common mistakes)
- Decision points (if/then branches)
- Tools / resources needed (links)
- Escalation path — who to contact if something breaks
- Change log

**AI Feature:** `POST /api/v1/ai/sop-check`
- Reads the steps and checks for ambiguity or missing decision branches
- Suggests missing edge cases based on process type

---

#### 9. Habit Tracker
**PageType:** `habit-tracker`
**Category:** Productivity

A monthly view of daily habits — works as a persistent tracker, not a one-day journal.

**Sections:**
- Month + year
- Habit list (with emoji, target frequency: daily / weekdays / 3× week)
- Monthly grid (days × habits) — check cells
- Streak count (auto-calculated)
- Notes per week (free text)
- Monthly score (% completion per habit)
- Reflection (end of month: what worked, what to drop or add)

**UI Note:** Needs a custom grid component — the most UI-heavy template on this list.

**AI Feature:** `POST /api/v1/ai/habit-insights`
- Reads 3 months of habit pages
- Identifies your most-missed habit, best streak, correlation between habits ("you exercise more on days you journal")

---

#### 10. Travel Planner
**PageType:** `travel`
**Category:** Productivity

One page per trip — from planning to packing to post-trip notes.

**Sections:**
- Destination(s) + dates + trip purpose (leisure / work / mixed)
- Status: Planning / Booked / In Progress / Completed
- Itinerary (day-by-day: date + activities + location + notes)
- Flights + accommodation (name, confirmation #, check-in/out times)
- Budget tracker (category + estimated + actual columns)
- Packing list (categorized checklist: clothes / tech / docs / toiletries)
- Restaurants / places to visit (bookmarks with status: want to go / been)
- Emergency contacts + important numbers
- Post-trip: highlights, photos note, would return?

**AI Feature:** `POST /api/v1/ai/trip-suggestions`
- Given destination + dates + trip type, suggests must-do activities and packing list items
- Warns about visa requirements, time zone differences, weather

---

### 🟠 Tier 3 — Specialized, Build Later

High value for specific users but niche enough to do after Tier 1 & 2 ship.

---

#### 11. Recipe
**PageType:** `recipe`
**Category:** Personal

| Section | Notes |
|---|---|
| Name + cuisine + servings | |
| Prep / Cook / Total time | |
| Ingredients | Amount + unit + item, scalable |
| Steps | Numbered, with timers |
| Variations | |
| Rating + notes | |
| Photos | |

**AI:** Scale ingredients to any serving count, suggest substitutions for dietary restrictions.

---

#### 12. Study Notes
**PageType:** `study`
**Category:** Knowledge

| Section | Notes |
|---|---|
| Subject + topic + source | |
| Learning objectives | |
| Summary / outline | Rich text |
| Key concepts | Term → definition pairs |
| Flashcards | Front / back, exportable |
| Practice questions | With answers (expandable) |
| Mind map link | Links to a brainstorm page |

**AI:** Generate flashcards and practice questions from the summary text.

---

#### 13. Standup Log
**PageType:** `standup`
**Category:** Productivity

Daily async or sync standup — one page per person or team, entries accumulate.

| Section | Notes |
|---|---|
| Today's date | |
| ✅ Yesterday | What did I complete? |
| 🎯 Today | What will I work on? |
| 🚧 Blockers | Anything in the way? |
| 💬 FYI | Optional team updates |

**AI:** Weekly standup digest — summarize the week's standups into a progress report.

---

#### 14. Content Brief
**PageType:** `content-brief`
**Category:** Documents

For writers, marketers, or developer advocates — plan a piece of content before writing it.

| Section | Notes |
|---|---|
| Title (working) | |
| Content type | Blog / Video / Social / Email / Doc |
| Target audience | |
| Goal | What should the reader do/feel/know after? |
| SEO keyword | |
| Outline | H2/H3 structure |
| Key messages (3 max) | |
| Call to action | |
| Due date + status | |

**AI:** Generate a full outline and suggest a hook given the title and target audience.

---

## Implementation Priority

```
Q1  → Weekly Review, Book Notes, Retrospective, Decision Log
Q2  → 1-on-1 Notes, PRD, User Interview
Q3  → SOP, Habit Tracker, Travel Planner
Q4  → Recipe, Study Notes, Standup Log, Content Brief
```

## Template Registry Notes

Every new template needs:
1. `PageType` added to the union in `types/workspace.ts`
2. `createDefault*Data()` factory in `types/*.ts`
3. `TemplateContent` union extended in `templateRegistry.ts`
4. Editor component in `pages/dashboard/*Editor.tsx`
5. Case added to `PageEditor.tsx` switch
6. Backend schemas + service method + route (if AI-powered)
7. RightSidebar tab config updated if it needs a new tab (e.g., meeting-specific tabs)
