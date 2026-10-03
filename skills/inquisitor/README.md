# inquisitor

Interrogates a project, feature, plan or decision from the outside. Before looking at anything it writes down its own definition of success for the target, then lists the assumptions the target depends on, attacks them from several outside perspectives, and reports only the findings that survive an evidence check, ranked by how much damage they do to that definition of success. It also says what holds up. It reports; it does not fix.

## Use it when

- You want a plan stress-tested before committing to it
- "What am I missing?" or "Is this actually a good idea?"
- You want someone to play devil's advocate on a decision
- You want the claims or assumptions behind something verified

## How it works

1. **Target and success frame.** Restate the target and write one paragraph on what success looks like to a disinterested observer. If that differs from your stated goal, the difference is the first finding.
2. **Assumption harvest.** Read the code, docs, plan and recent commits; number the stated, structural and "silent" assumptions (A1, A2, ...).
3. **Interrogation.** Parallel subagents each take one perspective (newcomer, skeptic with money, maintainer in two years, adversary, economist; 3 to 5 chosen to fit) and attack the assumptions with cited evidence.
4. **Tribunal.** The main session checks each finding's evidence and whether it actually threatens success. Each finding is convicted, suspected (reported, labeled unverified) or dismissed (dropped).
5. **Verdict.** Small targets get a terminal answer. Larger ones get a self-contained HTML report (Tailwind and Mermaid from a CDN) with the assumption docket, one card per convicted finding, suspected items, what holds, and the single thing most worth doing. Then a five-line summary in the terminal.

## What it needs

- Subagents. It is written for Claude Code's `Explore` agents; in a harness without subagents the agent takes each perspective itself.
- For larger targets, write access: the report is saved to `docs/inquisitions/<target>-<YYYY-MM-DD>.html` in your repo (the folder is created if missing), or a temp directory outside a git repo, and opened with `open` (macOS) or `xdg-open` (Linux).

## Install

```bash
npx skills add Sstobo/skills --skill inquisitor
```

## Example prompts

- "Inquisitor: tear down our plan to move billing to usage-based pricing"
- "Poke holes in this architecture. What am I missing?"

## Files

- [`SKILL.md`](SKILL.md): posture, workflow, verdict format and rules
