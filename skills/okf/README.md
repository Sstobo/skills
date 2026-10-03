# okf

A convention for a repo's knowledge layer: a folder of small markdown docs (usually `docs/`), each holding only what the code cannot state (the why, cross-file invariants, landmines) and each declaring in frontmatter the code files that would make it wrong. There is no engine, no timestamps and no scheduled check. A doc is verified by reading it against its sources when you work in that area. The skill covers how to write docs, how to verify them, whether a comment belongs in code or in a doc, and a repair pass for a bundle that has drifted.

## Use it when

- Writing or fixing project docs
- Finding which docs cover a file you are about to change
- Deciding whether a code comment should stay or move into a doc
- Auditing or repairing an existing docs folder ("okf repair", "repair the docs")

## How it works

Each doc has four frontmatter fields:

```yaml
---
type: Gotcha
title: Sealed dice rolls
description: One line someone can skim.
sources:
  - convex/agents/storyTeller/resolveSealedRoll.ts
---
```

`sources` lists the files a change to which would invalidate the doc. Finding the docs that cover a file is one grep: `grep -rl --include='*.md' -- 'path/to/file.ts' docs/`.

The skill then defines a few passes:

- **Write**: one doc per thing that can independently become wrong, then delete every line that only restates the code.
- **Verify**: read every doc in an area against its sources and sort each claim into confirmed / contradicted / paraphrase / unverifiable.
- **Ask**: answer a question from the docs, but only after opening the cited code.
- **Comments**: per-file triage of which comments stay in code and which move to a doc, with the user making the call on each batch.
- **Router audit**: pull facts out of always-loaded files like `AGENTS.md` and `CLAUDE.md` into docs, leaving links.
- **Repair**: missing sources, entry-file facts, duplicated claims, catch-all docs, line-number citations and docs with no `sources`, then one list of proposed deletes and moves for approval and one commit.

The rules that run through all of it: always read the code, never write a path or symbol you have not checked, cite symbols rather than line numbers, and write corrections as dated history.

## What it needs

- A git repo. The repair pass uses `grep`, `git` and `python3`, and its commands assume the bundle is in `docs/` (substitute your folder if not).
- Nothing else. The `ship-it` skill in this repo can run the routing query for you before each ticket. The skill also mentions a separate domain-modeling skill that owns `CONTEXT.md`; it is not in this repo and okf works without it.

## Install

```bash
npx skills add Sstobo/skills --skill okf
```

## Example prompts

- "Which docs cover `src/billing/invoice.ts`?"
- "okf repair on the docs folder"
- "Should this header comment stay in the file or become a doc?"

## Files

- [`SKILL.md`](SKILL.md): the contract, rules, doc types and the list of passes
- [`references/authoring.md`](references/authoring.md): what a doc may hold, the deletion test, the ten types, choosing `sources`
- [`references/comments.md`](references/comments.md): the code-or-doc test for comments and the triage protocol
- [`references/repair.md`](references/repair.md): the step-by-step repair pass with its commands
