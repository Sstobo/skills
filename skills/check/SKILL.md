---
name: check
description: Send a skeptical senior engineer (a fresh subagent) to quickly look over the work just done in this session and come back with an honest review of real problems only. Use when the user says "/check", "check my work", "check this over", "get a second pair of eyes", "sanity check this", or "have someone look at this".
metadata:
  tags: review, quality, conventions, second-opinion
---

# Check

A senior colleague walks over, looks at what you just did, and tells you
straight what's wrong with it. Quick, skeptical, useful. Not an audit, not a
planning session, not a list of ideas.

The reviewer is a fresh subagent. It has none of this conversation, so the
brief you write is everything it knows.

## 1. Write the brief

Gather, then put it in the prompt:

- **The ask.** What the user wanted, in their words.
- **The files.** Every file this session created, changed, or deleted, by
  path. Only these. Other agents work in this tree too; their changes are not
  under review.
- **The standards.** Paths to the project's CLAUDE.md / AGENTS.md, any docs
  covering the touched area, and lint / type / test config.
- **What was verified.** Checks you ran and their results. What you didn't
  run, say so.
- **What you're unsure about.** Anything you'd want a senior to look at.

## 2. Send the reviewer

One `Agent` call, `general-purpose`, foreground (`run_in_background: false`).
Prompt: the brief, then this:

> You are a skeptical senior engineer doing a quick check of a colleague's
> work. Read-only: do not edit, create, or delete anything.
>
> Read the diff for the listed files (`git diff` / `git status`, or read new
> files whole) and enough surrounding code to judge it. Read the listed
> standards. Run the project's fast checks (typecheck, lint, tests for the
> touched files) if they exist; skip slow suites.
>
> Look for:
> - It doesn't do what was asked, or only partly does.
> - Bugs, broken edge cases, anything that loses data or fails at runtime.
> - Breaks a written project convention (cite where it's written).
> - Mess left behind: dead code, debug output, unused imports, stale comments.
> - Scope creep: changes that don't trace back to the ask.
> - Over-building: abstraction or config nothing needs yet.
> - Claims of "verified" that don't hold up.
>
> The bar is real problems. No nice-to-haves, no "consider adding", no new
> features, no refactors of code that wasn't touched, no style opinions the
> project hasn't written down. Every finding cites a file and line you
> actually opened. If the work is good, say so plainly; a clean pass is a
> good answer.
>
> Return a full written review. Detail is the point; don't compress.
> 1. **Verdict.** **Ship it** / **Fix first** / **Rethink**, then a paragraph
>    or two on the overall state: does it do the job, how solid is it, what
>    you'd tell the colleague if you were standing at their desk.
> 2. **Findings**, worst first. For each:
>    - `file:line` and a **must** / **should** tag
>    - What's wrong, in full
>    - Evidence: the code, the check output, or the convention it breaks
>    - Why it matters: what goes wrong, and when
>    - The fix, concretely
> 3. **Checks run.** Each command and its real result.
> 4. **Looked at and fine.** What you reviewed that holds up, and why, so
>    the gaps in coverage are visible.

## 3. Report back

This skill returns information. It doesn't act on it.

- Don't take the review at face value. Open anything that looks off; drop
  findings that are wrong and say which you dropped and why.
- Relay the review in full: verdict, reasoning, every surviving finding
  with its detail and evidence. Don't summarise it down.
- Don't fix anything. Stop after the report.
