# scour

A read-only code auditor for one area of a codebase. It sends a group of agents (up to five), each given your project's own convention docs and one "lens", to look for shallow modules, oversized files, convention drift, untestable code and React composition problems. Bugs, security, performance, dependencies, DX, docs and product direction are optional lenses you can add. Every finding needs a `path:line` anchor, and a skeptic agent tries to disprove it before it reaches the report. A second agent judges whether the fix is worth doing. Findings you approve become ticket files that the `ship-it` skill can build. Scour never edits source code and never commits.

## Use it when

- An area of the codebase has grown messy and you want a quality pass
- You want to find god-files, shallow wrappers or duplicated logic in a directory or feature
- You want to check an area against your own style guides, ADRs or `AGENTS.md` rules
- You want an audit turned into tickets another agent can pick up

Scour is not for reviewing a diff, editing a single file, or sweeping a whole repo. It asks you to pick an area.

## How it works

1. **Intake.** Asks which area (a path or glob), which docs define "good", and which lenses to run. Reads `CONTEXT.md`, ADRs, `CLAUDE.md`/`AGENTS.md` and earlier scour reports on its own. Lists the files in the area and flags every file over the size threshold (default 1,000 lines).
2. **Swarm.** Up to five finder agents run in parallel. The lead pastes each finder's lens criteria and the docs into its brief. Duplicates are merged. Then 1 skeptic and 1 pragmatist check the findings (a thorough audit uses 3 skeptics, the pragmatist and a "cold reader" who sees the area fresh).
3. **Report, then tickets.** One severity-ordered report, saved to `tickets/research/scour-<area>-<date>.md` when a tracker exists. You pick which findings become tickets. Each is written to `tickets/needs-triage/` in ship-it's ticket format with draft acceptance criteria. For larger refactors, scour first has 3 to 5 agents propose different interfaces and writes the chosen one into the ticket.

It may also add a term to `CONTEXT.md` and, with your OK, a new ADR recording a rejected finding. It never edits existing ADRs.

## What it needs

- A subagent tool that runs agents in parallel (Claude Code's `Agent`). The skill is written around it.
- Claude Code's `AskUserQuestion` for intake questions, or your harness's equivalent. A numbered list works as a fallback.
- For tickets: ship-it's `tickets/` tracker. If it is missing, scour offers to set it up with ship-it's Phase 0. If you decline, you get the report only and no ticket files.
- The `ship-it` skill installed alongside it. Scour reads ship-it's `references/TRACKER.md` for the ticket format and relies on ship-it to triage and build the tickets.
- Optional: your own best-practice docs. Without them, scour uses its built-in lenses plus whatever `CLAUDE.md`, `AGENTS.md`, `CONTEXT.md` and ADRs the repo already has.

## Install

```bash
npx skills add Sstobo/skills --skill scour
npx skills add Sstobo/skills --skill ship-it   # scour hands its tickets to ship-it
```

## Example prompts

- "Scour `src/features/billing/` against our style guide"
- "Quality pass on `convex/`, add the security and performance lenses"

## Files

- `SKILL.md`: the three acts (intake, swarm, report and tickets) and the operating rules
- `references/LENSES.md`: the five core lenses, including the over-threshold file check
- `references/EXTENDED-LENSES.md`: the seven optional lenses
- `references/DEEPENING.md`: shared vocabulary (module, interface, seam, depth, leverage, locality) and the deletion test
- `references/COMPOSITION.md`: the React composition problems the Composition lens looks for
- `references/SWARM.md`: finder brief template, dedup, skeptic, pragmatist and cold-reader prompts, verdict tallying
- `references/REPORT.md`: report format, finding-to-ticket template, how much spec each ticket gets
- `references/INTERFACE-DESIGN.md`: the "design it twice" pass for refactor tickets
