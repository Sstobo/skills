# Grilling

An in-house interview that sharpens a raw idea or an underspecified ticket before it becomes a PRD or an agent brief. Ship-it owns this. Do not reach for an external grilling skill.

Three jobs, in order: get the information, challenge what you assumed while getting it, then decide what the docs must say afterwards.

## When to grill

- Phase 1, before drafting a PRD, when the idea is still fuzzy.
- Triage, when a ticket is underspecified and moving it to `needs-info/` would bounce it back to the user without narrowing anything.

Skip it when the answer would not change what gets built. A grill that produces no decision was ceremony.

## 1 — Ask, one question at a time

Every question goes through `AskUserQuestion` (Claude Code; in another harness use its multiple-choice tool, or a numbered list if it has none), never as open prose.

- Two to four options, arrow-selectable.
- Ranked. Your recommendation is first and carries `(Recommended)`.
- Each option says what happens if it is chosen, not what it is.
- One question per call, unless two are genuinely independent — then put both in the same call as separate questions rather than stacking prose confirms.
- Where the tool supports it, use an option `preview` when the choice is easier to see than to describe: a shape, a diff, a layout, a schema.
- Never ask what you can read. Check the code, the docs, and `tickets/.out-of-scope/` first, and ask only what the repo cannot answer.

Stop when the next question would not change the implementation.

## 2 — Challenge your own assumptions

Before writing anything down, run one adversarial pass over your own reading.

Write the list first: every load-bearing thing you believe that the user did not say and you did not verify. Then for each, either verify it against the tree — grep it, read it, run it, not memory — or ask about it.

The four that go wrong most often:

- **Scope.** You assumed this is one feature. Is it two, and is the second one the hard one?
- **Existing behavior.** You assumed the current code does X. Did you actually read it?
- **The real goal.** You answered the question asked. Is the thing behind it a different question?
- **Prior decisions.** Is there an ADR or an out-of-scope record that already settled this, and are you about to relitigate it?

Report what the pass changed. If it changed nothing, say so in one line. Do not manufacture a finding to look thorough.

## 3 — Documentation direction and accuracy

Grilling produces decisions, and decisions rot the docs. Answer both before exiting.

**Direction — what should exist that does not?**

- A decision made here that a future reader would otherwise have to reconstruct is a new ADR or concept, not a code comment.
- A term the user and the code name differently is a glossary entry.
- Say where it goes and who writes it: this grill, or the ticket that implements it.

**Accuracy — what is now wrong?**

- Which existing docs did this conversation falsify?
- Name the file and the claim. Never "docs may need updating".
- Route each one: fixed here, folded into a ticket's doc ingest, or explicitly deferred with a reason.

If the repo runs OKF, this is the same question the Phase 3 grounding frame asks later. Getting it right here means the frame confirms rather than discovers.

## Exit

A grill is finished when you can state:

1. The decisions made, one line each.
2. What you assumed, what you verified, and what the challenge pass changed.
3. Docs to create, docs to correct, and where each lands.

Feed that into the PRD (Phase 1) or straight into the ticket body (triage). Nothing else — a grill does not write code and does not create tickets.
