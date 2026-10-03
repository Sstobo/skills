# ship-it

A build pipeline that keeps its tickets as markdown files in your repo. It turns an idea or PRD into tickets with acceptance criteria, then runs a loop that claims each ticket, has an agent implement it, verifies it, reviews it, and makes one local git commit per ticket. A ticket's status is the folder it sits in under `tickets/`. It grills fuzzy ideas and reviews code itself; it does not research or audit (the `scour` skill audits an area and files tickets for ship-it).

## Use it when

- You want to turn an idea or PRD into agent-ready tickets
- You have a `tickets/ready/` queue to work through to commits
- Bugs or ad-hoc requests need filing and triage
- The tracker has drifted and needs repair

## How it works

1. **Tracker setup.** `tickets/` with status folders plus `prds/`, `research/`, `.out-of-scope/`, a README, and a block in root `AGENTS.md`.
2. **PRD**, only when the work slices into three or more tickets. Optional grilling first.
3. **Tickets.** Vertical slices; you approve the table before files are written to `tickets/ready/`.
4. **The loop.** Preflight, then batches: claim with `git mv`, register scoped files, read the docs covering them, implement in parallel, build check, verify, one review per batch, pathspec-scoped commits. It stops mid-run only on risky tickets (schema, new dependency, public API, auth/billing/security/routing). At the end it shows the whole run's diff and fixes any docs the run made wrong.
5. **Triage**, on demand, for `needs-triage/` and `regression/`.

`scripts/verify.mjs` enforces the gates: `done` refuses a move to `done/` without a passing QA block, a clean review, a resolution, a checked criterion, a valid `kind`, and at most 2 review rounds; `lint` and `preflight` check the board. `scripts/doc-ground.mjs` lists the docs whose `sources` frontmatter covers given files.

## What it needs

- A git repo. Commits locally on the current branch, never branches, never pushes unless asked.
- Node 18+ for the scripts.
- A subagent tool (Claude Code's `Agent`) for parallel implementers and review. Without one, tickets run one at a time.
- The project's own lint, typecheck and test commands.
- Optional: a `docs/` or `knowledge/` bundle in the `okf` format.

## Install

```bash
npx skills add Sstobo/skills --skill ship-it
```

## Example prompts

- "ship it: add CSV export to the reports page"
- "Complete the queue"
- "Triage the incoming bugs"
- "Repair the tracker"

## Files

- `SKILL.md`: entry point, phases, rules
- `references/TRACKER.md`: layout, ticket and PRD formats, state machine, lint, repair, setup
- `references/LOOP.md`: the Phase 3 loop
- `references/TRIAGE.md`: triage outcomes and out-of-scope records
- `references/GRILL.md`: the grilling interview
- `scripts/verify.mjs`, `scripts/doc-ground.mjs`, plus tests: `node --test scripts/*.test.mjs`
