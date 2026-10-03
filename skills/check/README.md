# check

Sends a fresh subagent, briefed as a skeptical senior engineer, to review the work done in the current session and report real problems only. The reviewer has none of the conversation, so the main agent writes it a brief: what you asked for, the files and commits touched, the project's standards, what was already verified, and what it is unsure about. The reviewer is read-only. The main agent then double-checks the review, drops findings that do not hold up (and says which), and relays the rest in full. It does not fix anything.

## Use it when

- You finished a chunk of work and want a second pair of eyes
- Something feels off but you can't say what
- You want to know whether an agent's "verified" claims hold up

## How it works

1. The main agent writes the brief.
2. One foreground subagent reads the diff and the listed standards, runs the project's fast checks (typecheck, lint, tests for touched files) if they exist, and looks for: not doing what was asked, bugs, broken written conventions, leftover mess, scope creep, over-building, and false claims of verification. No style opinions or nice-to-haves.
3. It returns a verdict (**Ship it** / **Fix first** / **Rethink**), findings worst first with `file:line`, evidence and a concrete fix, the checks it ran with results, and what it looked at and found fine.
4. The main agent verifies the findings and reports. It stops there.

## What it needs

- A subagent tool. It is written for Claude Code's `Agent` tool (`general-purpose`, foreground); other harnesses need an equivalent fresh-context subagent.
- Git, for the diff.

## Install

```bash
npx skills add Sstobo/skills --skill check
```

## Example prompts

- "/check"
- "Check my work before I commit"

## Files

- [`SKILL.md`](SKILL.md): the brief, the reviewer prompt and the reporting rules
