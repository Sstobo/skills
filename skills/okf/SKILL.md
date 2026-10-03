---
name: okf
description: A repo's knowledge layer — small markdown docs that hold what the code cannot state, each declaring the code files it is about. Four frontmatter fields, no engine, no stamps, no scheduled checks. A doc is verified by reading it against its sources when you are working in that area, not by a timestamp. Use when the user wants to write or fix project docs, work out whether something belongs in a comment or a doc, find which docs cover a file they are changing, or says "okf", "okf repair", "repair the docs", "knowledge bundle", "llm wiki", "which docs cover this", "document this", "audit our documentation".
---

# OKF

A folder of small markdown docs. Each declares the code files it is about. That is the whole structure.

Docs never replace reading the code. They do two things reading cannot: **route** you to the files that matter without nine exploratory reads, and **hold what no single file states** — the why, the cross-file invariant, the landmine that cost someone a day. A doc that substitutes for reading its source is paraphrase and gets deleted.

## Doubt

Every sentence in a doc, a ticket, a commit message, a memory, and **in the brief you were
handed** is a claim under audit, not a premise. That includes the ones you wrote yourself
earlier in the same session.

- **Confirm before you assert.** A claim earns its place in a doc only after a command you
  ran returned the thing. Name that command to yourself before you type the sentence; if
  you cannot name one, you are guessing.
- **Never assert what you did not see.** If you cannot open the file, run the query, or
  observe the behaviour, the finding is *unverifiable* — report it as unverifiable and say
  what would settle it. An inference dressed as a finding is the worst thing this skill
  ships, because it arrives pre-formatted as knowledge.
- **A grep that found nothing has not proved absence.** Try the other casing, the other
  quote style, the other wording, the symbol instead of the phrase, and the whole repo
  rather than the directory you assumed. In one session five separate "it lives nowhere"
  results were all wrong: three were phrased differently, one used double quotes where the
  search used single, and one sat one directory outside the search path. Acting on any of
  them would have deleted real knowledge or invented a contradiction.
- **Absence framed as absence is not fiction.** A mature bundle deliberately names deleted
  functions, retired env vars and removed tables, because "this is gone, do not look for
  it" is knowledge. Before reporting a missing symbol, read the sentence around it: a
  sweep of 99 docs flagged 33 for naming symbols not in the code, and every one was a
  correctly dated retirement note. Grep finds candidates; only the sentence decides.
- **A number is a claim about a method.** Before repeating a count, a percentage or a
  tally, ask what was counted and against which denominator. A naive `grep -rl … | wc -l`
  over-counts every file that merely mentions the thing; one repo carried two different
  wrong eval tallies for months because nobody re-derived them.
- **Reconfirm yourself.** A first pass is a hypothesis. Before you report, re-derive your
  load-bearing findings by a different route than the one that produced them, and say which
  survived.
- **Delegated work is unverified work.** A subagent's report is a claim like any other.
  Re-derive its load-bearing findings before relaying them — and re-check hardest whatever
  traces back to context *you* put in its brief. That is how your own assumption comes back
  wearing the costume of an independent finding.

## The contract

```yaml
---
type: Gotcha
title: Sealed dice rolls
description: One line. This is what someone skims.
sources:
  - convex/agents/storyTeller/resolveSealedRoll.ts
  - convex/agents/storyTeller/lifecycle.ts
---
```

Four fields. `sources` are **invalidators**: the files a change to which would make this doc wrong. Not everything mentioned. Files, never directories. Paths relative to the repo root, verified to exist before you write them.

Older bundles use `- { resource: /path.ts }` and carry `generated:` / `verified:` stamps. Both still parse. The stamps are inert now — strip them when you next edit the doc, never in a mass pass.

## Freshness

There is no freshness check. A doc is verified by reading it against its sources when you are working in its area. When you want to know whether the code moved since a doc was last touched: `git log -1 --format=%cI -- <doc>` then `git log --since=<that> -- <sources>`.

## Rules

- **The code is required reading, always.** A doc tells you *which* files and *what to check*. It never licenses skipping them. An answer citing only docs, with no source opened, is not grounded.
- **Never invent a symbol.** Every path, name, command and count is a claim. Verify it with a command *before* writing it. Fabricated-plausible detail is this skill's characteristic failure — see [Doubt](#doubt).
- **Never restate the code.** A doc holds only what the code cannot state. Apply the deletion test per line ([authoring.md](references/authoring.md)).
- **Entry files route.** `AGENTS.md`, `CLAUDE.md`, `SKILL.md`, `index.md`, `README.md`, `CONTEXT.md` are never docs — pull knowledge out of them and leave links. Facts accrete in the always-loaded files by convenience and rot hardest there.
- **Verbatim stays verbatim.** Transcripts and vendor specs get no frontmatter. Describe them from a sibling `Reference` doc.
- **Corrections are dated history, never present tense.** "`resolveRoll` in `x.ts` said X until 2026-07-30" — not "says X, which is wrong", which goes false the moment someone fixes it. History lives in the **covering doc** (or the ADR). A router or `CONTEXT.md` entry carries only the current meaning: when a term changes, rewrite its entry and move the old meaning, with its date, into the doc that covers it. A glossary entry that reads as a changelog has stopped being a glossary (field report: one repo's `CONTEXT.md` grew to 4.3k words this way).
- **Cite symbols, not line numbers.** `` `isProductionDomain` in `server/config.ts` ``, never `` `server/config.ts:18` ``. Lines drift on every edit above them and nothing catches it; a repair pass found three wrong anchors in one 60-line doc. A line number is acceptable only inside a dated-history sentence, where it describes the past.
- **Move nothing without approval.** Frontmatter is additive and revertible; moving or deleting files breaks inbound links. Restructures happen from an approved plan with every inbound reference grepped and rewritten in the same commit.

## Which docs cover this file?

```bash
grep -rl --include='*.md' -- '<path/to/file.ts>' docs/
```

That is the routing query, and it is the one thing worth automating. If the `ship-it` skill from this repo is installed, it runs this for you through `ship-it/scripts/doc-ground.mjs`, which prints the frame it shows before editing.

## Types

Ten: **Module, Flow, Decision, Convention, Term, Attested Computation, Gotcha, Audit, Playbook, Reference**. [authoring.md](references/authoring.md) has the table. **Gotcha** and **Convention** hold what code cannot state and are where the value is. **Module** and **Flow** are the paraphrase-risk types — write them only when the routing genuinely saves reads.

A useful diagnostic from the field: young bundles are Module/Flow-heavy and mature ones are Gotcha/Convention-heavy. If your mix is inverted, you have written documentation rather than knowledge.

## Passes

- **Write** — one doc per thing that can independently become wrong. Deletion test over your own output before committing; expect to cut a meaningful fraction. Report: docs written, and bundle word count before → after. Growth is not thoroughness.
- **Verify** — pick an area, read every doc covering it against the code, fix what is wrong, delete what is paraphrase. This is the only thing with a track record of finding real errors: one bundle's first pass found 26 doc-versus-code contradictions, another found four wrong line anchors on a day the old automated check reported everything clean. Sort every claim into **confirmed / contradicted / paraphrase / unverifiable**, and never let the fourth bucket quietly become the first. Then reconfirm your own contradictions before reporting them — a doc is usually right, so a claimed contradiction deserves the same doubt as the doc did. Report: each contradiction as doc path, claim, what the code says, fix applied; plus the unverifiable list with what would settle each.
- **Ask** — find the docs, **open the cited code before asserting anything**, answer citing doc paths and `file.ts:line`. If the docs cannot answer, answer from code and offer to write it back. If neither settles it, say so rather than reasoning to a plausible answer. Report: the answer, then the docs and `file.ts:line` it rests on, then anything you could not confirm.
- **Comments** — code-or-doc triage per [comments.md](references/comments.md).
- **Repair** — fiction, entry-file facts, cross-doc duplication, the paraphrase catch-all, line anchors, unrouted docs, then verify what you touched and reconfirm your own edits. Run it in the repo by the agent working there: [repair.md](references/repair.md). "okf repair" or "repair the docs" triggers it.
- **Router audit** — grep the always-loaded entry files for claim-dense prose: symbol names, `file.ts:line` cites, figures. Each hit either already lives in a doc (trim the router to a digest plus link) or lives nowhere (write the doc, then trim). This is where the worst rot hides, and no automated check reaches it. Report: per entry file, the claims found and where each went.

## Where things live

Wherever knowledge already lives (`docs/` or `knowledge/`). Never a parallel tree. Entry files route, skills hold procedure (*when X, do Y*), the bundle holds facts (*Z is true*), `CONTEXT.md` holds the language (owned by a domain-modeling skill if you use one), and an agent harness's own memory folder (Claude Code's `memory/`, for example) belongs to the harness, not the bundle.

## Plays with

- **/domain-modeling** (a separate skill, not in this repo; skip this bullet if you do not use it) owns `CONTEXT.md` and `CONTEXT-MAP.md`, and authors ADRs in `docs/adr/NNNN-slug.md`. OKF's only addition to an ADR is frontmatter: `type: Decision` plus the `sources` it governs. Never rewrite an ADR body to satisfy this skill.
- **/ship-it** (in this repo) is the write-back loop, and the pairing has exactly three touchpoints, all in `ship-it/references/LOOP.md`:
  1. **Step 2b, reading list.** `doc-ground.mjs` names the docs whose `sources` cover the scoped files. The agent reads them, and records any doc-versus-code contradiction it notices as a `doc-contradiction:` History line. That is the verify pass, taken for free while both are open.
  2. **Run-level write-back.** Once per run, against the real diff: re-read the covering docs, fix what the run made wrong, fix every recorded contradiction, mine finished tickets for Gotchas. One doc commit.
  3. **Router check.** Entry files have no `sources`, so the script cannot see them; the write-back diffs them directly and moves any parked fact into a covering doc, per [repair.md](references/repair.md) § Router audit.
  ship-it's rules block points here rather than restating this file. Anything the loop keeps finding is a field report for **repair**, run deliberately, not something a ticket does on its way past.

## Is it working?

Occasionally check: does an agent with **source plus docs** beat one with source alone — more correct, fewer files read? If the docs feel redundant with the code, that is a paraphrase detector, not a framing problem. Find the docs restating code and delete them.

The other check is on yourself. Take any five confident claims from your last pass and re-derive them cold. If one in five fails, the pass was hypothesis, not verification, and its output should be treated that way until it has been re-run.
