# Triage

Cross-cutting mode. Runs on demand — not a numbered phase. All tracker state is files under `tickets/` — see [TRACKER.md](TRACKER.md). Two inputs:

- **Intake** — tickets filed outside the PRD-slicing flow (bug reports, ad-hoc requests). They land in `tickets/needs-triage/`.
- **Regressions** — tickets the Phase 3 loop moved to `tickets/regression/`. Each needs a triage decision before re-entering the loop.

PRD-sliced tickets from Phase 2 do not need triage — they publish straight to `tickets/ready/`.

## Triage State Machine

State is the folder the file lives in. A transition is a `git mv` plus a frontmatter + `## History` edit. No separate label system.

```
needs-triage  →  needs-info               underspecified; need more from user
needs-triage  →  ready (afk)              agent can do it — write agent brief
needs-triage  →  ready (hitl)             needs human — write brief + note why
needs-triage  →  wontfix                  reject — write reason in body

needs-info    →  needs-triage             user answered the open questions
needs-info    →  ready (afk | hitl)
needs-info    →  wontfix

regression    →  needs-triage             needs re-evaluation
regression    →  ready                    fix is clear — refresh agent brief
regression    →  wontfix                  behavior should not be pursued

any           →  needs-triage             always valid — reopen/re-evaluate
```

Every triaged ticket has exactly one `category` (`bug` or `enhancement`) in its frontmatter. A fresh `needs-triage` ticket may not have a category yet — assigning one is the first triage act. `kind` (`afk`/`hitl`) encodes ready-for-agent vs ready-for-human.

Moving to `ready/` requires non-empty `## Acceptance criteria`. Do not move a ticket to `ready/` without them.

## Show What Needs Attention

```bash
find tickets/needs-triage tickets/needs-info tickets/regression -name '*.md' 2>/dev/null
```

Present as three buckets (needs-triage, needs-info, regression) with counts and one-line summaries per ticket — read `title` from frontmatter, do not dump bodies. Let the user pick.

## Triage a Ticket

**1. Gather context.**

```bash
cat tickets/<status>/<slug>.md
```

Read the body and `## Acceptance criteria`. For regressions, read the `## QA Reports` section in the same file — the failure is recorded there.

Explore the codebase in the relevant area, respecting ADRs. List `tickets/.out-of-scope/` and open only the files whose concept name plausibly matches this ticket. Match by concept, not keyword — "night theme" matches `dark-mode.md`.

**2. Recommend.**

Tell the user your `category` and target-folder recommendation with one paragraph of reasoning. Include a short codebase summary relevant to the ticket. Wait for direction.

**3. Reproduce (bugs only).**

Before grilling, attempt reproduction: follow the report's steps, trace the code path, run the relevant eval. Report one of:
- Confirmed repro (code path, failing output)
- Failed repro (behavior not observed — strong `needs-info` signal)
- Insufficient detail (can't follow the steps)

A confirmed repro makes a far stronger agent brief.

**4. Grill if needed.**

If the ticket is underspecified, sharpen it per [GRILL.md](GRILL.md): multiple-choice questions one at a time, an adversarial pass over your own assumptions, then a call on what the docs must say. Do not improvise a different interview here.

**5. Apply the outcome** (see below).

**Every transition is the same three moves:** `git mv` the file to its new folder, stamp frontmatter (`updatedAt`, plus `category` / `kind` if they changed), and add a `## History` line saying what happened and why. There is no global log to also update — `git log --name-status -- tickets/` is the board's timeline. The outcomes below only note what is different about each.

## Triage Outcomes

### → `ready/`, `kind: afk`

Rewrite the body as a durable agent brief (**Writing Agent Briefs** below) with concrete, independently testable `## Acceptance criteria`. Set `category` and `kind: afk`.

### → `ready/`, `kind: hitl`

The same brief, plus one sentence on why it cannot be delegated: judgment call, external access, design decision, or manual testing. Set `kind: hitl`.

### → `needs-info/`

Append a `## Triage Notes` section holding what is already established and what is still open. The open questions have to be specific and answerable — "please provide more info" bounces the ticket back unchanged.

### → `wontfix/`, bug

Append an honest explanation of why the behavior is acceptable or outside the fix boundary.

### → `wontfix/`, enhancement

Write the rejection to `tickets/.out-of-scope/<concept>.md` (**Out-of-Scope Knowledge Base** below) and reference it from the ticket body, so the reasoning outlives the ticket.

## Quick State Override

If the user says "move `<slug>` to ready-for-agent" — trust them. Confirm the exact changes (target folder, `kind`, `category`, body changes), then apply. Skip grilling. If moving to `ready (afk)` without a full brief, ask whether they want the brief written first. If they decline, do not move it to `ready/` unless the ticket already has a non-empty `## Acceptance criteria` list — the `ready/` guard ([TRACKER.md](TRACKER.md)) is not optional even under override.

Find the file regardless of current status: `ls tickets/*/<slug>.md`.

## Handling Regressions

A regression ticket carries a `## QA Reports` fail block with the failure. Read it first (`cat tickets/regression/<slug>.md`). Then triage:

- **Expectation was right, fix is clear** — grill if needed, rewrite the agent brief with the new reproduction context, move to `ready/`.
- **Expectation was wrong** — update the PRD/ticket body to reflect the correct desired behavior, then move to `ready/`.
- **Behavior should not be pursued** — move to `wontfix/`.
- **It was never a failure, just an unmet prerequisite** — if that condition is now met, refresh the brief and move to `ready/`; if not, say what is still missing in a `## History` line and leave it.

### PRD Drift

If QA reveals the PRD itself is wrong:

1. Set the old PRD's frontmatter `status: superseded` in `tickets/prds/<old-slug>.md`.
2. Create `tickets/prds/<new-slug>.md` with `version: 2` and `supersedes: <old-slug>`.
3. Re-slice affected tickets (Phase 2).

Regressions never re-enter the loop in the same run. They re-enter only after triage moves them back to `ready/`.

## Resuming Triage

If a ticket already has `## Triage Notes`, read it, check whether the open questions were answered, and present an updated picture before continuing. Do not re-ask resolved questions.

## Stale Claims

A ticket sitting in `tickets/in-progress/` with an old `claimedAt` is likely from a dead run.

```bash
grep -rH 'claimedAt:' --include='*.md' tickets/in-progress 2>/dev/null
```

Surface stale tickets to the user before releasing. Never silently move another agent's claim. To release a specific stale ticket back to ready:

```bash
git mv tickets/in-progress/<slug>.md tickets/ready/<slug>.md
```
Then clear `claimedAt: null`, set `updatedAt`, and add a `## History` line: `- <ISO8601>  released stale claim`.

A `kind: afk` ticket sitting in `tickets/in-review/` with an old `updatedAt` is a dead review — the reviewer was dispatched but the run died before it returned, and the scoped edits are uncommitted in the tree. Surface it; never auto-re-dispatch (that resurrects a dead run's reviewer and risks a double review). The user decides: re-review (release back to `ready/` and let the loop re-implement) or accept. `kind: hitl` in `in-review/` is waiting on a human by design — leave it.

---

## Writing Agent Briefs

The body of a ticket sitting in `tickets/ready/` with `kind: afk`. It is the contract the implementing agent works from — the original report and the conversation around it are context; the brief is what counts. Write it during triage, alongside the move into `ready/`.

### The part that is not obvious

A ticket can sit in `ready/` for days while the code changes around it. Everything in the brief has to survive that.

- Name types, function signatures and behavioral contracts.
- Never name file paths or line numbers. They go stale before the ticket is claimed.
- If a named type could refer to more than one module — two `Config` types in a monorepo — say which package owns it, or scoping the work later is guesswork.

Say what the system should do, not how to build it. The agent explores fresh and makes its own implementation calls.

### Structure

```md
## Parent

<PRD slug, or "no parent PRD — filed as intake">

## Category

bug | enhancement

## What to build

**Current behavior:** What happens now. For a bug, the broken behavior with a
confirmed reproduction and code path if you have one. For an enhancement, the
status quo it builds on.

**Desired behavior:** What should happen once complete, including edge cases
and error conditions.

**Key interfaces:** The named types, signatures or config shapes that change.
The contract, not the location.

**Out of scope:** What must NOT change. Without this, agents gold-plate into
adjacent features.

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2

## Verification

Lane: agent | manual

## Blocked by

None, or blocking ticket slugs.
```

Each criterion has to be concrete and independently verifiable — "`generateReport` returns `null` when the date range contains no events", not "reporting should work correctly". This checklist is the QA source of truth for the whole pipeline.

A `kind: hitl` brief uses the same structure plus one sentence on why it cannot be delegated: judgment call, external access, design decision, or manual testing.

---

## Out-of-Scope Knowledge Base

`tickets/.out-of-scope/` holds one file per rejected **enhancement concept**, so the reasoning survives the ticket and nobody relitigates it in six months. It pairs with `wontfix/`: the ticket records *that* something was rejected, this records *why*.

One file per concept, not per ticket. Several tickets asking for the same thing share one file, named so it is recognizable from the directory listing: `dark-mode.md`, `plugin-system.md`.

### Shape

A short design document, not a database entry.

```markdown
# Dark Mode

This project does not support dark mode or user-facing theming.

## Why this is out of scope

<The real reason: project scope, a technical constraint, or a strategic
decision. Durable ones only — "we are too busy right now" is a deferral,
not a rejection.>

## Prior tickets

- `add-dark-mode` — "Add dark mode support"
- `night-theme-a11y` — "Night theme for accessibility"
```

### Reading it during triage

List the directory and open only the files whose concept plausibly matches the ticket in hand. Match by concept, not keyword — "night theme" matches `dark-mode.md`.

On a match, surface it rather than deciding: name the file, give the prior reason, ask whether it still holds. The user either confirms (append the slug to Prior tickets, move the ticket to `wontfix/`), reconsiders (delete or update the file, the ticket proceeds through normal triage), or says the two are distinct (normal triage).

### Writing it

Only when an **enhancement** is triaged to `wontfix`. Append to the matching file if one exists, otherwise create it. Reference it from the ticket body, then move the ticket to `wontfix/`.

Bug rejections do not come here — they get an honest explanation in the ticket body and a move to `wontfix/`.

If the user later changes their mind, delete the file. Historical `wontfix` tickets stay as they are; they are records, not live work.
