# Tracker

A folder of markdown files. Status is the parent folder, slug is the filename. A transition is `git mv tickets/<from>/<slug>.md tickets/<to>/<slug>.md`, then stamp `updatedAt` and any changed frontmatter, then add a `## History` line. `git log --name-status -- tickets/` is the timeline.

## Layout

```
tickets/
├── needs-triage/   intake, unsorted
├── needs-info/     waiting on the user
├── ready/          triaged, claimable
├── in-progress/    claimed
├── in-review/      awaiting batch review (afk) or human sign-off (hitl)
├── done/           verified and committed
├── regression/     failed or stuck, needs re-triage
├── wontfix/        rejected
├── prds/           one PRD per file
├── research/       notes and audit reports (scour writes here)
├── .out-of-scope/  rejected-enhancement records (TRIAGE.md)
└── README.md
```

Find a ticket in any state: `ls tickets/*/<slug>.md`.

Shell note: list ticket folders with `find` or `grep -r`, never a `tickets/<state>/*.md` glob. Under zsh an unmatched glob aborts the whole command, so an empty folder silently breaks the step.

## Ticket File

```markdown
---
slug: claim-ttl
title: Add claim TTL and stale-claim release
category: enhancement        # bug | enhancement (intake may omit until triaged)
kind: afk                    # afk | hitl — the only field the scripts schema-check
priority: p1                 # p0 | p1 | p2
lane: agent                  # agent | manual
parentPrd: tracker-hardening # or null
blockedBy: []                # ticket slugs; claimable only when all are in done/
claimedAt: null              # stamped on claim
changedFiles: []             # every path this ticket touches, written at scope time
resolution: null             # one line, required for done/
reviewRounds: null           # 1 on entering in-review/, 2 after the one fix round
createdAt: 2026-06-05T10:00:00Z
updatedAt: 2026-06-05T10:00:00Z
---

## Parent

prds/tracker-hardening.md, or "none — filed as intake"

## What to build

**Current behavior:** what happens now. For a bug, the confirmed repro and code path.

**Desired behavior:** what should happen, including edge cases and errors.

**Key interfaces:** types, signatures, config shapes that change. Name the owning package if ambiguous.

## Acceptance criteria

- [ ] Concrete, independently testable statement
- [ ] Another one

## Out of scope

Adjacent behavior that must NOT change.

## Verification

Lane: agent | manual

---

## QA Reports

## History

- 2026-06-05T10:00:00Z  created → ready
```

Write the body to survive days in `ready/` while the code moves: name types and contracts, never file paths or line numbers. Say what the system should do, not how. Acceptance criteria are the QA source of truth.

Timestamps: `date -u +%Y-%m-%dT%H:%M:%SZ`. When writing `blockedBy`, check every slug exists and there is no cycle.

## PRD File (`prds/<slug>.md`)

```markdown
---
slug: tracker-hardening
title: Tracker hardening
status: active            # draft | active | superseded | archived
version: 1
supersedes: null
createdAt: ...
updatedAt: ...
---

## Problem Statement
## Solution
## Implementation Decisions   (modules, contracts, schema; no file paths)
## Testing Decisions
## Out of Scope
```

PRDs don't move folders, so they keep `status`. To supersede: old one `status: superseded`, new one `version: 2`, `supersedes: <old-slug>`, re-slice affected tickets.

## State Machine

```
needs-triage  →  needs-info | ready | wontfix
needs-info    →  needs-triage | ready | wontfix
ready         →  in-progress          (claim)
in-progress   →  in-review | regression
in-review     →  done | regression
done          →  regression           (rejected at the run-level stop, LOOP.md)
regression    →  needs-triage | ready | wontfix
any           →  needs-triage
```

Guards: `ready/` needs non-empty acceptance criteria. `done/` needs a `resolution` and passes `verify.mjs done`.

Claim order: `kind: afk` only, all `blockedBy` in `done/`, then `p0 → p2`, then oldest `createdAt`.

## Lint

```bash
node <skill-dir>/scripts/verify.mjs lint --repo .
```

Silence is a pass. Checks `kind` is exactly `afk`|`hitl`, `done/` has `resolution`, `in-progress/` has `claimedAt`, afk tickets in `in-review/` have `reviewRounds` and none exceed 2. It does not check `blockedBy`. `preflight` is lint plus every stale claim and dead review.

## Repair

Run on "repair the tracker", or when preflight prints more than a couple of lines. End state: `verify.mjs preflight` prints nothing. Repair never claims work.

**1. Structure.** Missing folders get created with a `.gitkeep`. Missing `tickets/README.md` or AGENTS.md block gets written from § Setup. Don't rewrite ones that already say the same thing.

**2. Preflight, one line at a time.** Open one ticket per fix; never bulk-edit with sed.

| Line says | Do |
|---|---|
| `kind "<x>" not afk\|hitl` | Agent can finish alone → `afk`; needs a human decision, credential, or manual test → `hitl`. Old aliases: `agent`/`feature`/`adhoc`/`user-directed` → `afk`; `manual`/`design` → `hitl`. |
| `done/ without resolution` | Write it from the last History or QA line, or from the commit (`git log --oneline -- tickets/done/<slug>.md`). Never invent one. |
| `unstamped claimedAt`, or `claimed Nh ago` | `git status --short` against its `changedFiles`. Work in tree → stamp `claimedAt` if missing, leave it, tell the user. No work → release to `ready/`, `claimedAt: null`, History `released stale claim`. |
| `afk in in-review/ without reviewRounds` | Set `reviewRounds: 1`, then treat as a dead review. |
| `reviewRounds N over cap` | Park: `git mv` to `regression/`, QA `fail` block `unresolved after N review rounds`. |
| `afk review never returned` | Landed and committed (`git log -S<symbol> -- <changedFiles>`) → QA `pass` block naming the commit, set `resolution`, `verify.mjs done`, move to `done/`. Uncommitted work in tree → ask the user: re-review or revert. Neither → release to `ready/`. Never auto-re-dispatch a reviewer. |

`hitl` tickets in `in-review/` are waiting on a human by design. Leave them.

**3. By hand.** `ready/` ticket with no acceptance criteria → `needs-triage/`. Dangling `blockedBy` slug → remove it, note in History. Missing `parentPrd` file → `null`. Same slug in two folders → keep the one furthest along, move the other to `wontfix/` as `duplicate of <folder>/<slug>`. Intake older than 30 days → list for the user with a recommendation; don't move without an answer.

**4. Rerun preflight** until silent.

**5. Commit tracker files only:**

```bash
git commit -m "tickets: repair tracker — <N> fixed, <M> released, <K> parked" -- tickets/ AGENTS.md
```

**6. Docs.** Check `tickets/README.md` and the AGENTS.md block still match § Setup. If the repo has a docs bundle, run `doc-ground.mjs -- tickets/README.md AGENTS.md` and fix any doc it names. Separate commit.

**7. Report** counts per folder, what was released, parked or completed, and what is left for the user.

## Setup

```bash
for d in needs-triage needs-info ready in-progress in-review done regression wontfix prds research .out-of-scope; do
  mkdir -p "tickets/$d" && touch "tickets/$d/.gitkeep"
done
```

Commit the scaffold (`tickets: scaffold file-based tracker`) only if the user wants it committed.

Optional: a `docs/` or `knowledge/` bundle whose markdown carries `sources` frontmatter (the `okf` format). Without one, doc-grounding returns nothing and the loop carries on.

**`tickets/README.md`:**

```markdown
# Tickets

The single source of truth for work. One markdown file per ticket. Its status is
the folder it lives in; its slug is its filename. Moving the file is the status change.

    ls tickets/*/                                        # board
    grep -rH priority: --include='*.md' tickets/ready    # ready queue
    git mv tickets/ready/x.md tickets/in-progress/x.md   # claim
    git log --name-status -- tickets/                    # timeline

Acceptance criteria in each ticket body are the QA source of truth.
```

**Root `AGENTS.md` block:**

```markdown
## Tickets

`tickets/` is the only work queue: one markdown file per ticket, status = parent
folder, slug = filename. Not GitHub Issues, Linear, memory, or TODO comments.

When the user mentions tickets, todos, the queue, backlog, triage, or incoming bugs,
inspect `tickets/` first. Survey with filenames and frontmatter; open one body at a time.
A status change is a `git mv` plus a frontmatter and History edit. Claiming is moving
from `ready/` to `in-progress/`; a failed move means someone else claimed it.
```
