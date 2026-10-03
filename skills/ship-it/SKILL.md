---
name: ship-it
description: >-
  Task-writing and task-completing flow for any codebase. Use when the user says "ship it", "let's build this", "start a feature", "kick off a build", "complete the queue", "triage tickets", "repair the tracker", "create a ticket", "review incoming bugs", "prep a ticket for an agent", or wants to turn an idea or PRD into tickets and drive them to verified trunk commits. Runs one integrated pipeline: tracker setup, PRD, QA-ready tickets, triage, and an implement/verify/review loop with atomic commits. Grilling and code review are in-house; research and codebase audits are out of scope. Artifacts live in a file-based tracker — markdown files under the repo's tickets/ folder, not GitHub Issues or a database.
---

# Ship It

Raw idea or PRD to verified trunk commit. Ship-it writes tickets and completes them. It grills fuzzy ideas and reviews its own code. It does not research, audit, or run quality passes.

The tracker is `tickets/`. A ticket is a markdown file; its status is the folder it sits in, its slug is its filename. Moving the file is the status change.

## Entry Point

```bash
ls tickets/*/ 2>/dev/null
```

| Board state / ask | Go to |
|---|---|
| `tickets/` missing | Phase 0 |
| Small ask (1-2 tickets) | Phase 2, then 3 |
| Raw idea | Grill if fuzzy, then Phase 1, 2, 3 |
| Active PRD in `prds/` | Phase 2, then 3 |
| Tickets in `ready/` | Phase 3 |
| "triage", a new bug, an ad-hoc request | File it in `needs-triage/`, then [TRIAGE.md](references/TRIAGE.md) |
| "repair the tracker", or preflight prints more than a few lines | [TRACKER.md](references/TRACKER.md) § Repair |
| One specific ticket | `ls tickets/*/<slug>.md`, then Phase 3 for that ticket only |

Skip any phase whose artifact already exists.

## References

Load on demand. `<skill-dir>` is the folder this file lives in. Scripts need Node 18+, no dependencies.

| When | Load |
|---|---|
| Phase 3 | [LOOP.md](references/LOOP.md) |
| Triage, agent briefs, out-of-scope records | [TRIAGE.md](references/TRIAGE.md) |
| Setup, file formats, state machine, repair | [TRACKER.md](references/TRACKER.md) |
| An idea or ticket needs sharpening | [GRILL.md](references/GRILL.md) |

## Phase 0 — Tracker

[TRACKER.md](references/TRACKER.md) § Setup. Runs first whenever `tickets/` is missing.

## Phase 1 — PRD

Only when the work slices to three or more tickets that must agree on a contract, schema, or sequence. Otherwise skip it and say so in one clause.

Read enough of the repo to know the current implementation and the ADRs in the area. If the idea is still fuzzy, grill it first. Write `tickets/prds/<slug>.md` (format in TRACKER.md).

## Phase 2 — Tickets

Slice into vertical tracer bullets through every layer, not "backend task" / "UI task". Genuinely horizontal work (a migration and backfill, a dependency upgrade, CI config) gets its own ticket.

Per ticket: title, slug, `kind` (`afk` unless it needs a human), `priority` (default `p1`), `blockedBy` (every real dependency, including a shared contract), `lane` (`agent` or `manual`), and concrete acceptance criteria.

Show this table and iterate until approved:

```
| Slug | Title | Kind | Priority | Blocked by | Lane | Acceptance criteria |
```

Write approved tickets to `tickets/ready/` in dependency order, using the ticket format in TRACKER.md. Slicing is their triage. Tickets from anywhere else go to `needs-triage/`.

## Phase 3 — Loop

[LOOP.md](references/LOOP.md). Claim and scope serially, implement in parallel through subagents, review the batch once, commit one ticket per commit, stop once at the end to show the human the run's diff.

## Rules

1. `tickets/` is the only work queue. Not GitHub Issues, Linear, memory, or TODO comments.
2. Claim with `git mv tickets/ready/<slug>.md tickets/in-progress/<slug>.md`. A failed move means someone else has it.
3. A ticket reaches `done/` only after verification and a clean review, and only if `node <skill-dir>/scripts/verify.mjs done <ticket>` prints nothing.
4. Touch only the ticket's scoped files. A dirty tree is normal (other sessions share the trunk): never stash, never stage or restore another session's files.
5. Stage explicit paths and commit with a pathspec: `git commit -m "..." -- <paths>`. Never `git add -A`. Never push unless asked.
6. Validate inputs and outputs at boundaries, in the project's existing idiom.
7. Ambiguous and it changes the implementation? Ask. Otherwise make the conservative call.
8. When surveying the board, read filenames and frontmatter only. Open full bodies one at a time.
9. Ship-it reads the docs covering its files and fixes what a run broke. Writing or restructuring a docs bundle is `okf` work.
