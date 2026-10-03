# ship-it

A build pipeline that keeps its tickets as markdown files in your repo. It takes an idea or a PRD, turns it into tickets with acceptance criteria, then runs a loop that claims each ticket, has an agent implement it, verifies it, reviews it, and makes one local git commit per ticket. A ticket's status is the folder it sits in under `tickets/`; moving the file is the status change. It grills fuzzy ideas and reviews code itself. It does not do research or codebase audits (the `scour` skill audits an area and files its findings as tickets for ship-it).

## Use it when

- You want to turn an idea or PRD into agent-ready tickets
- You have a `tickets/ready/` queue and want it worked through to commits
- Bugs or ad-hoc requests need filing and triage
- The tracker has drifted (bad frontmatter, stale claims, dead reviews) and needs repair

## How it works

1. **Phase 0, tracker setup.** Creates `tickets/` with status folders (`needs-triage`, `needs-info`, `ready`, `in-progress`, `in-review`, `done`, `regression`, `wontfix`) plus `prds/`, `research/`, `.out-of-scope/`, a `tickets/README.md`, and a Tickets section in the root `AGENTS.md`.
2. **Optional grilling.** A multiple-choice interview that sharpens a raw idea before it becomes a PRD.
3. **Phase 1, PRD.** Only when the work slices into three or more tickets. Written to `tickets/prds/<slug>.md`.
4. **Phase 2, tickets.** Vertical slices with kind (`afk` or `hitl`), priority, blockers, lane and acceptance criteria. You approve the table before any file is written to `tickets/ready/`.
5. **Phase 3, the loop.** A preflight check, then batches: claim each ticket with `git mv`, record the files it will touch, list the docs that cover those files, dispatch implementers in parallel, run the build check, verify, run one review over the batch, and commit approved tickets with pathspec-scoped commits. Mid-run it stops for you only on risky tickets (schema change, new dependency, public API change, auth/billing/security/routing paths). At the end it stops once to show the whole run's diff and fix any docs the run made wrong.
6. **Triage.** On demand: sorts `needs-triage/` and `regression/` tickets, writes agent briefs, and records rejected enhancements in `tickets/.out-of-scope/`.

Two scripts enforce the rules. `verify.mjs done` refuses a move to `done/` unless the ticket has a passing QA block, a resolution, a checked acceptance criterion, a `kind` of `afk` or `hitl`, and no more than 2 review rounds. `doc-ground.mjs` names the docs whose `sources` frontmatter lists the files a ticket touches.

## What it needs

- A git repo. It commits locally on the current branch, never creates branches, and never pushes unless you ask.
- Node 18+ for the scripts. No dependencies.
- A subagent tool (Claude Code's `Agent`) for parallel implementers and the batch review. Without one, the agent implements tickets itself, one at a time.
- Claude Code's `AskUserQuestion` for multiple-choice prompts, or your harness's equivalent. A numbered list works as a fallback.
- The project's own lint, typecheck and test commands.
- Optional: a `docs/` or `knowledge/` folder whose markdown carries `sources` frontmatter (the `okf` skill's format). Without one, doc-grounding returns an empty reading list and the loop carries on.

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

- `SKILL.md`: entry point, phase routing, PRD and ticket templates, hard rules
- `references/TRACKER.md`: folder layout, ticket and PRD file formats, state machine, lint, repair procedure, setup
- `references/LOOP.md`: the Phase 3 loop: preflight, claiming, doc-grounding, delegation, verification, batch review, commits, run-level stop
- `references/TRIAGE.md`: triage states and outcomes, agent brief template, out-of-scope knowledge base
- `references/GRILL.md`: the grilling interview
- `scripts/verify.mjs`: the `done` gate, tracker `lint`, and `preflight`
- `scripts/doc-ground.mjs`: lists the docs covering a set of files and prints the grounding frame
- `scripts/verify.test.mjs`, `scripts/doc-ground.test.mjs`: tests, run with `node --test scripts/*.test.mjs`
