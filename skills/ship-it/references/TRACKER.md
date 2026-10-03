# Tracker Reference

The tracker is a folder of markdown files. A ticket's **status is the folder it lives in**; its **slug is its filename**. A transition is a `git mv` plus a frontmatter edit and a `## History` line. No database, no schema, no admin route.

Load this to set up a tracker, to check a file's shape, or to run the lint.

## Folder Layout

```
tickets/
├── needs-triage/      intake, unsorted
├── needs-info/        underspecified — waiting on the user
├── ready/             triaged, grabbable work
├── in-progress/       claimed by an agent
├── in-review/         awaiting a verdict (batch review if kind: afk, human if kind: hitl)
├── done/             verified and committed
├── regression/        failed or stuck — needs re-triage
├── wontfix/           rejected
├── prds/              one PRD per file
├── research/          one research note per file
├── .out-of-scope/     rejected-enhancement knowledge base (see TRIAGE.md)
└── README.md          how the tracker works (written at setup)
```

**Status is the parent folder — not a frontmatter field.** A ticket's status is wherever its file currently lives. Moving the file is the status transition. There is no `status:` key to drift out of sync with the folder. This is the single source of truth.

**Identity is the filename.** A ticket's slug is its filename without `.md`. `tickets/ready/claim-ttl.md` has slug `claim-ttl`. Blockers, parents, and references all use the slug. To find a ticket regardless of status: `ls tickets/*/<slug>.md`.

## Ticket File

```markdown
---
slug: claim-ttl
title: Add claim TTL and stale-claim release
category: enhancement
kind: afk
priority: p1
lane: agent
parentPrd: tracker-hardening
blockedBy: []
claimedAt: null
changedFiles: []
resolution: null
reviewRounds: null
implementer: null
createdAt: 2026-06-05T10:00:00Z
updatedAt: 2026-06-05T10:00:00Z
---

## Parent

Tracker hardening (prds/tracker-hardening.md)

## Category

enhancement

## What to build

End-to-end behavior for this vertical slice.

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2

## Verification

Lane: agent

## Blocked by

None, or blocking ticket slugs.

---

## QA Reports

<!-- newest first; appended by the loop -->

## History

<!-- status transitions, newest first -->
```

### Frontmatter fields

| Field | Values | Notes |
|---|---|---|
| `slug` | kebab-case | Matches the filename. Stable identity. |
| `title` | string | Short human title. |
| `category` | `bug` \| `enhancement` | A fresh `needs-triage` ticket may omit it until triaged. |
| `kind` | `afk` \| `hitl` | `afk` = agent can complete alone. Default `afk`. |
| `priority` | `p0` \| `p1` \| `p2` | Default `p1`. Drives claim order. |
| `lane` | `agent` \| `manual` | Verification lane. Default `agent`. |
| `parentPrd` | prd slug \| `null` | Links to `prds/<slug>.md`. |
| `blockedBy` | list of ticket slugs | A ticket is claimable only when every blocker is in `done/`. When authoring it, verify every referenced slug exists and introduces no cycle (A blocking B blocking A). |
| `claimedAt` | ISO8601 \| `null` | Set on claim. Stale if old and still `in-progress`. |
| `changedFiles` | list of paths | Every file this ticket will touch. Written at claim time (LOOP Step 2a) — it is what stops another ticket claiming the same files. |
| `resolution` | one-liner \| `null` | Required when moved to `done/`. |
| `reviewRounds` | integer | `1` on first move to `in-review/`, `2` after the one permitted fix round. At 2 without a pass the ticket parks (LOOP.md). |
| `implementer` | agent name \| `null` | Optional override of the default implementer agent for this ticket. Read at Step 3 dispatch (LOOP.md). |
| `createdAt` / `updatedAt` | ISO8601 | Stamp `updatedAt` on every edit. |

Get a UTC timestamp with `date -u +%Y-%m-%dT%H:%M:%SZ`.

### Body sections

- `## Acceptance criteria` is a checklist — **this is the QA source of truth.** Keep it concrete and independently testable.
- `## QA Reports` and `## History` are appended in-place by the loop (see LOOP.md). Newest entries first.

## PRD File (`prds/<slug>.md`)

```markdown
---
slug: tracker-hardening
title: Tracker hardening
status: active            # draft | active | superseded | archived
version: 1
supersedes: null          # prd slug or null
createdAt: 2026-06-05T09:00:00Z
updatedAt: 2026-06-05T09:00:00Z
---

## Problem Statement
## Solution
## Implementation Decisions
## Testing Decisions
## Out of Scope
```

PRDs keep a `status:` field because they do not move between folders. To supersede: set the old PRD's `status: superseded`, create the new file with `version: 2` and `supersedes: <old-slug>`.

## Research Note (`research/<topic>.md`)

```markdown
---
topic: convex-rate-limiting
parentPrd: tracker-hardening
createdAt: 2026-06-05T09:30:00Z
---

What it does, constraints, gotchas, canonical docs, and how it affects this feature.
```

## Timeline

There is no global progress log. Every transition is a committed `git mv`, so `git log --name-status -- tickets/` is the cross-ticket timeline — with an author, in order, unable to drop an entry, and with nothing to conflict on when several agents commit. Per-ticket detail lives in that ticket's `## History` and `## QA Reports`.

## State Machine

A status transition is `git mv tickets/<from>/<slug>.md tickets/<to>/<slug>.md`, then an edit to `updatedAt` and the relevant frontmatter, then a `## History` line.

```
needs-triage  →  needs-info | ready | wontfix
needs-info    →  needs-triage | ready | wontfix
ready         →  in-progress            (claim — atomic via git mv)
in-progress   →  in-review | regression
in-review     →  done | regression      (review verdict if afk, human verdict if hitl)
done          →  regression             (rejected at the run-level stop — git revert, see LOOP.md)
regression    →  needs-triage | ready | wontfix
any           →  needs-triage           (always valid — reopen/re-evaluate)
```

Guards (enforced by you, not a database):

- Moving to `done/` **requires** a non-empty `resolution` in frontmatter.
- Moving to `ready/` **requires** non-empty `## Acceptance criteria`.
- A ticket in `ready/` is claimable only when every slug in `blockedBy` is currently in `done/`.

## Claim Order

When picking the next ticket from `ready/`:

1. Only `kind: afk` tickets (agents skip `hitl`).
2. Only tickets whose `blockedBy` are all in `done/`.
3. Sort by priority `p0 → p1 → p2`, then oldest `createdAt` first.

List ready AFK tickets with their priority:

```bash
grep -rH -e 'priority:' -e 'kind:' --include='*.md' tickets/ready
```

## Tracker Lint

The file tracker has no database to reject a bad value, so the guards above are only as good as the last agent that honoured them. The lint is a script; run it before a loop and after a triage pass. Every line it prints is a violation; silence is a pass.

```bash
node ~/.claude/skills/ship-it/scripts/verify.mjs lint --repo .
```

It checks: `kind` is exactly `afk`|`hitl` in every state (whole value — `hitl-ish`, `AFK` and empty all fail; `lane` and `category` are not linted — the loop never branches on them); `done/` has a `resolution`; `in-progress/` has a stamped `claimedAt`; a non-`hitl` ticket in `in-review/` has `reviewRounds`, and none is above the cap of 2. The same script's `done` subcommand gates every move into `done/` (LOOP.md), and `preflight` adds the stale claims and dead reviews a human has to decide on.

Fix what it finds before claiming work. An off-schema `kind` is the worst of them: preflight recovery branches on `afk` vs `hitl` and nothing else, so a ticket carrying any other value strands in `in-review/` forever. An earlier grep version matched a prefix and let `hitl-ish` through; the script compares the whole value.

The lint does not check `blockedBy` for cycles or dangling slugs. Verify those by hand when authoring.

## Repair

The script reports; you repair. Run this when the user says "repair the tracker", "fix the board", "clean up tickets", or when preflight prints more than a couple of lines. End state: `verify.mjs preflight` prints nothing, every folder and README exists, and the docs that describe the tracker are true.

Work it top to bottom. Do not skip a step because it looks clean.

**1. Structure.** Run the Tracker Check above. Create any missing status or artifact folder with its `.gitkeep`. Write `tickets/README.md` from the template if absent. Add the AGENTS.md trigger block if absent. Do not rewrite an existing README or block that already says the same thing.

**2. Run preflight and classify every line.**

```bash
node ~/.claude/skills/ship-it/scripts/verify.mjs preflight --repo .
```

Each line is one of six shapes. Fix each per the table, then move on. Open one ticket at a time; never bulk-edit with sed across the folder.

| Line says | Do this |
|---|---|
| `kind "<x>" not afk\|hitl` | Read the ticket. Could an agent finish it alone? Set `kind: afk`. Needs a human decision, credential, design call, or manual test? Set `kind: hitl`. Old aliases: `agent`, `feature`, `adhoc`, `user-directed` → `afk`; `manual`, `design` → `hitl`. If the ticket is in `done/`, use the History to decide; it does not change anything downstream, only stops the line. |
| `done/ without resolution` | Read the last `## History` or QA `pass` line and write the one-line resolution from it. If nothing says what was done, read the commit: `git log --oneline -- tickets/done/<slug>.md` and the product files it touched. Never invent one. |
| `in-progress/ with unstamped claimedAt` | Check `git status --short` against the ticket's `changedFiles`. Uncommitted work present → stamp `claimedAt` from `git log -1 --format=%cI -- tickets/in-progress/<slug>.md` and leave it claimed. No work in tree → release: `git mv` back to `ready/`, `claimedAt: null`, History line `released stale claim`. |
| `afk in in-review/ without reviewRounds` | Set `reviewRounds: 1` and fall through to the dead-review row below. |
| `reviewRounds N over cap` | Park it: `git mv` to `regression/`, QA `fail` block saying `unresolved after N review rounds`, History line. Do not try to review it again here. |
| `afk review never returned` (dead review) | Check whether its work already landed: `git log --oneline -S<a symbol from the ticket> -- <its changedFiles>` or `git status --short -- <changedFiles>`. Landed and committed → the ticket file was left behind; write a QA `pass` block naming the commit, set `resolution`, `reviewRounds: 1` if null, run `verify.mjs done`, `git mv` to `done/`. Uncommitted work in tree → surface to the user: re-review or revert is their call. Neither → release to `ready/` with a History line. |
| `claimed Nh ago` (stale claim, stamped) | Same test as the unstamped row: work in tree → leave it and tell the user; none → release to `ready/`. |

**3. Guards the script cannot see.** Check these by hand:

- Every `ready/` ticket has a non-empty `## Acceptance criteria`. One without goes to `needs-triage/` with a History line; do not write criteria you cannot verify from the ticket.
- Every `blockedBy` slug exists somewhere in `tickets/*/` and forms no cycle. A dangling slug: remove it from the list and say so in History.
- Every `parentPrd` names a file in `prds/`. A missing one: set `parentPrd: null`.
- Duplicate slugs across folders (`ls tickets/*/<slug>.md` returns two). Keep the one furthest along the state machine; move the other to `wontfix/` with History `duplicate of <folder>/<slug>`.
- Tickets older than 30 days in `needs-triage/` or `needs-info/`. List them for the user with title and age; recommend `wontfix` for each unless the title still obviously matters. Do not move them without an answer.

**4. Rerun preflight.** Repeat step 2 until it prints nothing. Then run `lint` once more as a final check.

**5. Commit the repair on its own.** Tracker files only, pathspec-scoped, nothing from the product tree:

```bash
git add tickets/ AGENTS.md
git commit -m "tickets: repair tracker — <N> tickets fixed, <M> released, <K> parked" -- tickets/ AGENTS.md
```

If the tree has product changes in a ticket's `changedFiles` that you did not make, they are another session's. Leave them.

**6. Docs.** The repair changed what the tracker contains, so check what describes it:

- `tickets/README.md` still matches the folder layout and the commands in the template above.
- The AGENTS.md trigger block still matches the one in this file.
- If the repo has a docs bundle, run `node ~/.claude/skills/ship-it/scripts/doc-ground.mjs --json --repo . -- tickets/README.md AGENTS.md` and re-read any doc it names against the tracker as it now stands. Fix what is wrong; commit doc changes in a second commit.

**7. Report.** Counts per state from the filesystem, what was released, parked, or moved to done, every ticket left for the user to decide, and the list of stale intake with your recommendation. Then stop. Repair does not claim work.

## Tracker Check

Run at the start of every Ship It session. Fix failures before continuing.

1. **`tickets/` exists** at the repo root.
2. **Status folders exist:** `needs-triage`, `needs-info`, `ready`, `in-progress`, `in-review`, `done`, `regression`, `wontfix`.
3. **Artifact folders exist:** `prds`, `research`, `.out-of-scope`.
5. **`tickets/README.md` exists** (explains the tracker).
6. **AGENTS.md trigger block.** Root `AGENTS.md` has the Tickets section (see below).
7. **Docs bundle (optional).** A `docs/` or `knowledge/` folder whose markdown carries
   `sources` frontmatter. Phase 3 Step 2 uses `ship-it/scripts/doc-ground.mjs` to name the
   docs covering each ticket's files. No bundle is not a Phase 0 failure — the frame just
   comes back empty. See the `okf` skill to start one.

All present → continue. Only AGENTS.md missing the trigger block → add it and continue.

```bash
ls -d tickets/{needs-triage,needs-info,ready,in-progress,in-review,done,regression,wontfix,prds,research,.out-of-scope} 2>/dev/null
```

## Setup Procedure (Phase 0)

```bash
mkdir -p tickets/{needs-triage,needs-info,ready,in-progress,in-review,done,regression,wontfix,prds,research,.out-of-scope}
```

Empty git-tracked folders need a placeholder — add a `.gitkeep` to each so the structure survives a clean checkout:

```bash
for d in tickets/{needs-triage,needs-info,ready,in-progress,in-review,done,regression,wontfix,prds,research,.out-of-scope}; do touch "$d/.gitkeep"; done
```

And `tickets/README.md` (the durable explainer — see the README Template below).

Add `.ship-it/` to `.gitignore` if it is not already there (scratch logs for the loop).

Stage and commit the scaffold as one atomic commit (`tickets: scaffold file-based tracker`) only if the user is starting fresh and wants it committed. Otherwise leave it in the working tree.

## README Template (`tickets/README.md`)

```markdown
# Tickets

This folder is the single source of truth for all work. Each ticket is one
markdown file. Its **status is the folder it lives in**; its **slug is its
filename**. Moving a file between folders is a status transition.

## Folders

- `needs-triage/` `needs-info/` — intake and underspecified work
- `ready/` — triaged, grabbable work
- `in-progress/` — claimed by an agent
- `in-review/` — awaiting review: `kind: afk` tickets await the batch review verdict, `kind: hitl` tickets await human sign-off
- `done/` — verified and committed
- `regression/` `wontfix/` — failed or stuck, and rejected
- `prds/` `research/` `.out-of-scope/` — supporting artifacts

## Working the board

    ls tickets/*/                       # board at a glance
    grep -rH priority: --include='*.md' tickets/ready   # ready queue
    git mv tickets/ready/x.md tickets/in-progress/x.md   # claim
    git log --name-status -- tickets/                    # timeline

Frontmatter (priority, kind, lane, blockedBy, resolution) lives at
the top of each file. Acceptance criteria live in the body and are the QA
source of truth. Do NOT use GitHub Issues, Linear, Notion, or memory as the
queue — this folder is it.
```

## Tickets Trigger Block (AGENTS.md)

Add this section to root `AGENTS.md`:

```markdown
## Tickets

The `tickets/` folder is the single source of truth for all work. Each ticket is
a markdown file whose status is its parent folder and whose slug is its filename.

Do NOT use GitHub Issues, Linear, Notion, chat history, or memory as the work
queue. Do NOT scatter TODOs across the codebase.

When the user mentions tickets, todos, queue, next up, kanban, backlog, ready
work, triage, incoming bugs, or classifying an issue — inspect `tickets/` before
answering:

    ls tickets/*/                          # board at a glance
    grep -rH priority: --include='*.md' tickets/ready   # ready AFK queue

List filenames and read frontmatter when surveying. Never dump full ticket
bodies for the whole board — `cat` only the one ticket you are about to act on.

A status transition is `git mv tickets/<from>/<slug>.md tickets/<to>/<slug>.md`
plus a frontmatter + History edit. Claiming a ticket is moving it from `ready/`
to `in-progress/`; a failed move means another agent claimed it first.
```


## Why Files, Not a Database

The board is `ls tickets/*/`, claiming is `git mv`, and the history travels with the repo and reviews like any other code. Note that `git mv` is a check, a rename, then an index write — not a lock. The failure is loud and the window is microseconds, but do not build anything that depends on it being atomic.

