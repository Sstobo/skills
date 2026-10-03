---
name: avatar
description: This skill should be used when the user wants a complete, verified picture of a thing in their project — a feature, system, concept, bug, or decision. The verified result is presented as an "avatar" — current state, all details, doc references, and decision-making history.
---

# Avatar

Build a perfect, verified "avatar" (an HTML reader containing confirmed detail) of one thing in a project: what it is, where it lives, how it connects, what the docs say about it, and how it came to be. Two waves of agents — researchers, then challengers — so nothing in the final picture is an unverified claim.

## Workflow

### Step 0 — Lock the target

Restate the target in one sentence ("Building an avatar of: <X> — the <what it is> in this project"). If the target is genuinely ambiguous (two things share the name), ask one multiple-choice question. Otherwise proceed.

### Step 1 — Recon fan-out (research team)

Launch parallel read-only research subagents in a single message, one per dimension (in Claude Code, `Explore` agents; in a harness without subagents, run the dimensions yourself one at a time and keep the challenge pass separate). Each prompt must demand raw structured data with `file:line` citations, not prose. Dimensions (skip any with no plausible material):

1. **Code** — every file, function, type, and export that implements or touches the target. Return a list: path, symbol, one-line role.
2. **Connections** — what calls it, what it calls, data flow in/out, config/env vars it reads, schema/tables it owns. Return edges: `A -> B (why)`.
3. **Docs** — every mention in READMEs, CLAUDE.md files, docs/, comments, tickets/. Return: path, quote, whether the doc matches current code (flag suspected drift, verified later).
4. **History** — `git log` for the relevant paths: when introduced, major rewrites, reverts, and the commit messages that explain *why*. Also PR/ticket references in messages. Return a dated timeline.
5. **Tests & runtime** — tests covering it, what they assert, gaps; plus how to observe it live if applicable.

For a small target (single file / small util), collapse to two agents: code+connections and docs+history.

### Step 2 — Draft avatar

Synthesize into a working draft (a temp or scratchpad file, not shown yet):

- **Identity** — what it is, in three sentences.
- **Where it lives** — file list with roles.
- **How it connects** — mermaid `graph` of components/data flow; a `sequenceDiagram` if there's a meaningful request/event flow.
- **Current state** — behavior, config, invariants, known quirks.
- **Doc references** — every doc mention, with drift flags.
- **Decision history** — mermaid `timeline` or dated list of decisions with the "why" from commit messages.
- **Claims register** — number every factual claim (C1, C2, …). This is the input to Step 3.

### Step 3 — Challenge pass (adversarial team)

Launch a second wave of parallel read-only subagents (`Explore` in Claude Code). Split the claims register among 2–4 challengers, plus one gap-hunter. Prompts must be adversarial:

- Challengers: "Attempt to REFUTE each claim. Open the cited file:line and confirm it says what's claimed. Check doc quotes against current code. Verdict per claim: CONFIRMED / WRONG (with correction) / STALE (doc drift) / UNVERIFIABLE."
- Gap-hunter: "Here is a map of X. What is missing? Search for callers, configs, docs, or history the map doesn't mention. Return only genuinely missing items with evidence."

Apply corrections. Claims that stay WRONG or UNVERIFIABLE either get fixed with fresh evidence or moved to an explicit "Uncertain" section — never silently kept.

### Step 4 — Present the avatar

Deliver as a self-contained HTML report: dark theme, Tailwind + Mermaid via CDN, single file. Write to `docs/avatars/<target>-<YYYY-MM-DD>.html` in a git repo (create dir if absent), else a temp directory; then open it in a browser (`open` on macOS, `xdg-open` on Linux) and give the absolute path.

Report structure:

1. Header: target name + three-sentence identity.
2. Scoreboard: files touched, claims checked, confirmed/corrected/uncertain counts, doc-drift count.
3. Where it lives (table of files + roles).
4. How it connects (mermaid graph, sequence diagram if relevant).
5. Current state (the verified details).
6. Doc references — each with a drift badge: `In sync` / `Drifted` / `Missing from docs`.
7. Decision history (timeline with commit hashes and the why).
8. Uncertain / open questions — anything the challenge pass couldn't confirm.

Close in the terminal with a five-line TLDR: what it is, healthiest fact, scariest fact, worst doc drift, path to the report.

## Rules

- Every fact in the final avatar is either challenger-CONFIRMED or explicitly marked uncertain. No middle state.
- Citations everywhere: `file:line` for code, commit hash for history, path for docs.
- Research agents gather; the main session synthesizes. Never let one agent both claim and verify its own claim.
- Scale to the target: a small util gets 2 researchers + 1 challenger; a subsystem gets the full fan-out. Don't ceremony a one-file target.
