---
name: ship-it
description: Task-writing and task-completing flow for any codebase. Use when the user says "ship it", "let's build this", "start a feature", "kick off a build", "complete the queue", "triage tickets", "repair the tracker", "create a ticket", "review incoming bugs", "prep a ticket for an agent", or wants to turn an idea or PRD into tickets and drive them to verified trunk commits. Runs one integrated pipeline: tracker setup, PRD, QA-ready tickets, triage, and an implement/verify/review loop with atomic commits. Grilling and code review are in-house; research and codebase audits are out of scope. Artifacts live in a file-based tracker — markdown files under the repo's tickets/ folder, not GitHub Issues or a database.
---

# Ship It

Write tasks, complete tasks. Raw idea or PRD to verified trunk commit. One skill, one loop, all artifacts in markdown files under `tickets/`.

ship-it does two things well: it turns work into well-formed tickets, and it drives those tickets to verified commits. It grills an idea when the idea is not ready (see Upstream Prep) and it owns its own code review. It does **not** research APIs, audit the codebase, or run standalone quality passes. Keeping the scope this tight is the point.

The tracker is a folder. A ticket is a markdown file. Its status is the folder it lives in (`tickets/ready/`, `tickets/in-progress/`, `tickets/done/`, …); its slug is its filename. A status transition is moving the file. No database, no scaffold, no admin route.

Phases run in sequence. Skip any phase whose artifact already exists in `tickets/`. Triage is cross-cutting — runs any time the board needs sorting. Phase 0 always runs first if the tracker folder is missing.

## Entry Point

Check the board first:

```bash
ls tickets/*/ 2>/dev/null
```

```
tickets/ folder missing?            → load references/TRACKER.md → Phase 0
Tracker OK, small ask (1-2 slices)? → skip the PRD → Phase 2 → Phase 3
Tracker OK, raw idea?               → optional Upstream Prep → Phase 1 → Phase 2 → Phase 3
Tracker OK, active PRD in prds/?    → Phase 2 → Phase 3
Tracker OK, files in ready/?        → load references/LOOP.md → Phase 3
"triage" / "sort the board"?        → load references/TRIAGE.md → Triage
"repair the tracker" / "fix the board"? → load references/TRACKER.md → Repair
Preflight prints more than a few lines? → same — repair before claiming
User files a bug or ad-hoc request? → create ticket in tickets/needs-triage/ → load references/TRIAGE.md
```

**Small work skips the PRD.** Before drafting one, slice the idea in your head. If it comes out as one or two tickets, write those tickets and go — a seven-section planning document for "add a filter chip" is the kind of ceremony that makes people stop reaching for the tool. A PRD earns its keep when several tickets have to agree on a contract, a schema, or a sequence. Say in one clause that you skipped it.

## Upstream Prep — Grilling (optional, before Phase 1)

When the idea is raw, the terms are fuzzy, or decisions are unmade, grill it before drafting a PRD. Ship-it owns this: load [references/GRILL.md](references/GRILL.md). It is a multiple-choice interview that also challenges what you assumed while running it, and decides what the docs must say afterwards.

Prototyping a throwaway UI ad hoc in the working tree is fine when interaction shape is load-bearing — it is not a phase. Grilling is not required; an explicit "not needed" is a valid skip.

## Reference Files — Load On Demand

Do not read all of these upfront. Load only what the current session needs.

| When | Load |
|---|---|
| Phase 3 — the loop, verification, doc-grounding, commit | [references/LOOP.md](references/LOOP.md) |
| Triage — plus agent briefs and the out-of-scope base | [references/TRIAGE.md](references/TRIAGE.md) |
| Tracker setup, file shapes, state machine, lint | [references/TRACKER.md](references/TRACKER.md) |
| An idea needs sharpening, or a ticket is underspecified | [references/GRILL.md](references/GRILL.md) |

## Phase 0 — Tracker Setup

Load [references/TRACKER.md](references/TRACKER.md) and work its Tracker Check. Run before any other work if the tracker folder is missing.

## Phase 1 — PRD

Only for work that slices to three or more tickets — below that, go straight to Phase 2 (see Entry Point). Draft from conversation context plus any Upstream Prep output (grill decisions, research notes). Do not re-interview unless a missing answer materially changes scope — if the idea is still fuzzy, grill it first per [references/GRILL.md](references/GRILL.md).

**Before drafting:**
- Explore the repo enough to understand the current implementation
- Identify modules to build or modify
- Respect all ADRs in the affected area
- Confirm module and test strategy with the user when it affects scope

**Template (body of `tickets/prds/<slug>.md`):**

```md
## Problem Statement

The problem from the user's perspective.

## Solution

The solution from the user's perspective, including who wants it and why.

## Implementation Decisions

- Modules or boundaries to build or modify.
- API contracts, schema changes, and architectural decisions.
- No file paths unless a prototype snippet captures a decision better than prose.

## Testing Decisions

- What behavior needs verification.
- Which criteria belong to agent-lane evals vs manual QA.
- Prior art in the repo.

## Out of Scope

What this PRD deliberately does not cover.
```

**Publish:** write the file to `tickets/prds/<slug>.md` with the PRD frontmatter (see TRACKER.md): `slug`, `title`, `status: active`, `version: 1`, `createdAt`, `updatedAt`. The slug is the parent reference for tickets.

Exit: one active PRD file in `tickets/prds/`.

## Phase 2 — Tickets

Break the PRD into independently grabbable vertical slices. Each ticket is a tracer bullet through the relevant layers — not a horizontal "backend task" or "UI task."

Some work is genuinely horizontal and forcing it vertical makes it worse. A schema migration and its backfill ship on their own timeline and must stay revertable, so they do not belong inside a feature ticket. Dependency upgrades, build and CI config, and type-level refactors are the same. Give those their own ticket and say so in the body.

### Drafting Each Ticket

Define:
- **Title** and **slug**
- **Kind:** `afk` (agent can complete alone) or `hitl` (needs human — design approval, credentials, judgment call, manual testing)
- **Priority:** `p0`, `p1`, `p2` — default `p1`
- **Blockers:** ticket slugs this depends on (`blockedBy`). Declare every real dependency — a shared symbol or contract counts, not just a shared filename.
- **Lane:** `agent` (automated eval) or `manual` (human reviews)
- **Acceptance criteria:** concrete, independently testable statements

Prefer `afk`. Use `hitl` only when the agent cannot complete it without the user.

PRD-sliced tickets are written straight into `tickets/ready/` — the slicing process is their triage. Tickets filed outside this flow (bug reports, ad-hoc requests, findings from an audit) are written into `tickets/needs-triage/`.

### User Approval

Present before writing files:

```
| Slug | Title | Kind | Priority | Blocked by | Lane | Acceptance criteria |
```

Ask whether granularity, dependencies, kind split, and lanes are right. Iterate until approved.

### Publish (in dependency order so blocker slugs exist)

Write each ticket as `tickets/ready/<slug>.md` using the ticket file format (frontmatter + body) from TRACKER.md. Body template:

```md
## Parent

<PRD slug — prds/<slug>.md>

## Category

bug | enhancement

## What to build

End-to-end behavior for this vertical slice.

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2

## Out of scope

What must NOT change — adjacent features that look related but are separate work.

## Verification

Lane: agent | manual

## Blocked by

None, or blocking ticket slugs.

---

## QA Reports

## History

- <ISO8601>  created → ready
```

The `## Acceptance criteria` checklist is the QA source of truth.

Exit: approved ticket files in `tickets/ready/` with correct frontmatter (kind, priority, lane, blockedBy, parentPrd) and complete acceptance criteria.

## Phase 3 — Implement, Verify, Review Loop

Load [references/LOOP.md](references/LOOP.md). The loop is a trigger, an action, a verifier and a stop rule; the verifier and stop rule are enforced by `scripts/verify.mjs` (preflight before claiming, `done` gate before every move to `done/`), not by reading the rules. Do not split implementation and QA into separate phases. The main agent orchestrates; it does **not** write ticket code itself — implementation is delegated to an implementer agent (default `tanstack-convex-agent` on Convex + TanStack projects, otherwise `general-purpose`; `model: opus`; overridable per-ticket via the `implementer` frontmatter field).

**Doc-grounding — a reading list per ticket, a write-back once per run.** After claim and scope, before any edit, `scripts/doc-ground.mjs` names the docs that declare the files you are about to change. Read them. Fill and record the frame including its ELI14 block. It **stops for a human** only on real risk: a doc naming a source that no longer exists, a schema change or migration, a new dependency, a public signature change, or a path on the risk list. Everything else proceeds on the criteria approved in Phase 2, because a gate that fires on every ticket stops being read by the twentieth. Doc write-back happens once, at the run-level stop, against the run's actual diff. Never gate a build on documentation.

**Claim and scope serially, implement in parallel, review once.** The orchestrator claims and scopes a batch itself, one ticket at a time, so every scope is on disk before the next claim checks against it. Then it dispatches an implementer per ticket concurrently — their scopes are provably disjoint — waits for all, and runs one review over the batch. Cap six concurrent agents; all of them must share one working directory. The first review uses the ticket's acceptance criteria. On `needs-changes`, the implementer agent makes the fix, the main agent authors the followup review criteria, and a followup review is dispatched — capped at 1 followup (`reviewRounds` reaches 2) before the ticket parks to `regression/` for human re-triage. At the end of the run the loop stops once and shows the human the whole run's diff, the collected human-judgement criteria, and any commit that skipped review.

## Triage

Load [references/TRIAGE.md](references/TRIAGE.md). Runs on demand — not a numbered phase. Handles intake tickets (`tickets/needs-triage/`) and QA regressions (`tickets/regression/`).

## Hard Rules

1. **Tracker first.** No work starts without a passing Phase 0 check.
2. **`tickets/` is source of truth.** Not GitHub Issues, Linear, Notion, a database, or memory. Status is the folder; slug is the filename, and the timeline is `git log --name-status -- tickets/`.
3. **Typed boundaries** (product code). Validate inputs and outputs at every boundary, in the project's idiom — e.g. Convex functions get typed args in / returns out via a shared validator registry; a REST handler gets schema validation. Match what the codebase already does.
4. **Surgical.** Touch only files the current ticket needs.
5. **Ask or decide.** Ambiguous and it changes implementation? Ask. Otherwise make the conservative local-codebase-shaped call.
6. **Doc-ground before edit; stop only on risk.** Every ticket runs LOOP Step 2 and records its frame. The frame is printed and the run halts for a confirm only when a risk trigger fires (LOOP.md 2d). When it does fire, it is a hard stop: no product edits, no implementer dispatch. `abort` returns the ticket to `ready/`.
7. **Done = verified + reviewed, and the script says so.** A ticket reaches `tickets/done/` only after verification passes *and* the batch review returns clean — a verification pass alone moves it to `in-review/`, not `done/`. Every move to `done/` is gated by `node scripts/verify.mjs done <ticket>`; if it prints anything the ticket does not move. Verification that is not written into the `## QA Reports` block did not happen. One narrow **fast lane** lets a low-risk mechanical ticket commit on verification alone; its conditions live in LOOP.md Step 6 and are not duplicated here. If any condition is unmet, or you are unsure, run the full pipeline. Doc write-back is closed out once at the run-level stop, not per ticket.
8. **Dirty tree is normal.** You share this trunk, often with your own other sessions. Never require, wait for, or restore a clean tree, and never stash. A scoped file that is already dirty is context, not a stop — work in it and commit your own work.
9. **Other people's files are untouchable.** Never edit, stage, or revert a path outside your scoped list, whatever state it is in. Inside the list, foreign changes ride along in your commit — note it, don't block. Stop only if those changes are visibly broken.
10. **Your paths only.** Stage explicit paths. Never `git add -A` or `git add .`.
11. **Claims are atomic.** Claim a ticket with `git mv tickets/ready/<slug>.md tickets/in-progress/<slug>.md`. A failed move means another agent claimed it — pick the next. Never read-then-write to claim.
12. **Summaries on survey.** Never `cat` full ticket bodies when surveying the board — list filenames and read frontmatter only. Open one file for the ticket you are about to work.
13. **Never push.** Commit locally. Push only on explicit user request.
14. **Own the loop, not the world.** Grilling ([GRILL.md](references/GRILL.md)) and code review (LOOP.md Step 6) are ship-it's own — it does not call an external skill for either. Research, codebase audits, and standalone quality passes are out of scope entirely. Docs: ship-it reads the ones covering its scoped files and fixes what a run made wrong (LOOP.md **Docs**); writing, restructuring or auditing a bundle is `okf` work, run deliberately.

## Common Deviations

- **User skips upstream prep.** Name the risk once (fuzzy spec → weaker tickets) and continue.
- **User wants one specific ticket.** Find it (`ls tickets/*/<slug>.md`), run Step 2 announce+confirm, then implement/verify/review/commit only that ticket, stop.
- **User pre-confirms in the same message as /ship-it.** Only a risk-triggered gate needs waiving at all now. When one fires and the message explicitly waived it, check the frame matches that waiver before proceeding. When unsure, wait.
- **User files a bug or an ad-hoc feature.** Create the file in `tickets/needs-triage/` with the right `category`, then triage. Do not drop straight into the loop.
- **Stale claim.** A file stuck in `tickets/in-progress/` or `tickets/in-review/` with an old timestamp. Surface to the user — never silently move another agent's claim.
- **No agent harness.** Agent-lane QA cannot run for agent-behavior tickets. Create the harness only if the ticket explicitly requires it; otherwise move the ticket to `tickets/regression/` and report.

## Optional Supporting Skills

Load only when the implementation domain matches and the skill is available. These are stack-specific — use them when the project is built on that stack, otherwise reach for whatever skill fits the project's actual tooling.

| Need | Skill |
|---|---|
| Convex + TanStack implementation | `convex-tanstack` |
| Better Auth setup | `better-auth-convex` |
| Convex unit tests | `convex-testing` |
| Writing or restructuring the docs bundle | `okf` — ship-it reads docs and fixes what a run broke; it never runs an annotate or restructure pass |
| Readability pass over what a run produced | `code-simplification` — offered at the run-level stop, never run inside the loop |

Do not invoke any supporting skill as a stopping point. Read what's relevant and continue.

## Final Response Shape

```
Phases run: [list]
Tickets: done=N  regression=N  committed=N
Doc-grounded: N recorded, N stopped for confirm  docs-ingested=N
Human-judgement: N criteria logged for manual review
In-review unresolved: N  (hung/dead reviews — recovered next run)
Remaining decisions: [list or "none"]
```

Do not paste full logs unless the user asks.
