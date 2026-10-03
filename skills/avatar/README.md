# avatar

Builds a verified picture of one thing in your project (a feature, system, concept, bug or decision): what it is, where it lives, how it connects, what the docs say about it, and how it came to be. One set of subagents gathers the facts, a second set tries to disprove each one, and the result is a single HTML report in which every fact is either confirmed or marked uncertain.

## Use it when

- You need to fully understand a feature before changing it
- You suspect the docs and the code disagree and want to know where
- You want the history behind a decision, with the commits that explain it

## How it works

1. **Lock the target.** Restate what is being mapped; ask one question only if the name is ambiguous.
2. **Research.** Parallel subagents each cover one dimension: code, connections, docs, git history, tests. Small targets collapse to two agents.
3. **Draft.** The main session writes a draft with a numbered claims register (C1, C2, ...).
4. **Challenge.** A second wave of subagents tries to refute each claim against the cited file and line, plus one gap-hunter looking for what the map left out. Wrong claims are corrected; anything unconfirmed goes in an "Uncertain" section.
5. **Present.** A self-contained HTML report (Tailwind and Mermaid from a CDN) with identity, file map, connection diagrams, current state, doc references with drift badges, a decision timeline and open questions. Then a five-line summary in the terminal.

## What it needs

- Subagents. It is written for Claude Code's `Explore` agents; in a harness without subagents the agent runs each dimension itself.
- Git history for the timeline.
- Write access: the report is saved to `docs/avatars/<target>-<YYYY-MM-DD>.html` in your repo (the folder is created if missing), or a temp directory outside a git repo. It is opened with `open` (macOS) or `xdg-open` (Linux).
- Network access when viewing the report, since Tailwind and Mermaid load from a CDN.

## Install

```bash
npx skills add Sstobo/skills --skill avatar
```

## Example prompts

- "Build an avatar of the checkout flow"
- "Give me the full verified picture of how auth sessions work here, including why it was built this way"

## Files

- [`SKILL.md`](SKILL.md): the workflow, report structure and rules
