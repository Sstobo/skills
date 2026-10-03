# Triage

On demand, not a phase. Two inputs: intake in `needs-triage/` (bugs, ad-hoc requests, scour findings) and failures in `regression/`. PRD-sliced tickets skip triage.

Every transition is `git mv` + frontmatter stamp + History line (TRACKER.md).

## Show the board

```bash
find tickets/needs-triage tickets/needs-info tickets/regression -name '*.md' 2>/dev/null
```

Three buckets with counts and one line per ticket from its `title`. Let the user pick.

## Triage one ticket

1. **Context.** Read the ticket. For a regression, its QA `fail` block says what broke. Read the relevant code and ADRs. List `tickets/.out-of-scope/` and open any file whose concept matches (by meaning: "night theme" matches `dark-mode.md`).
2. **Reproduce bugs.** Report a confirmed repro with code path, a failed repro (strong `needs-info` signal), or not enough detail to try.
3. **Recommend** a `category` and target folder with one paragraph of reasoning. Wait for direction.
4. **Grill** if it's underspecified, per [GRILL.md](GRILL.md).
5. **Apply** the outcome.

## Outcomes

| To | Do |
|---|---|
| `ready/`, `afk` | Rewrite the body as an agent brief (TRACKER.md § Ticket File) with concrete acceptance criteria. |
| `ready/`, `hitl` | Same brief, plus one sentence on why a human is needed. |
| `needs-info/` | Add `## Triage Notes`: what's established, and specific answerable questions. Never "please provide more info". |
| `wontfix/`, bug | Explain honestly in the body why the behavior stands. |
| `wontfix/`, enhancement | Record the reason in `.out-of-scope/` (below) and link it from the body. |

Regressions: if the expectation was right, refresh the brief with the new repro and move to `ready/`. If the expectation was wrong, fix the ticket (or supersede the PRD, TRACKER.md) then `ready/`. If it was an unmet prerequisite that's still unmet, add a History line and leave it. Regressions never re-enter the loop in the same run.

If the ticket already has `## Triage Notes`, check which questions got answered and don't re-ask the rest.

**User override** ("move X to ready"): confirm the exact changes and apply, no grilling. The `ready/` guard still holds: no acceptance criteria, no move.

## Out-of-Scope Records

`tickets/.out-of-scope/<concept>.md`, one per rejected enhancement concept (not per ticket), so the reasoning outlives the ticket.

```markdown
# Dark Mode

This project does not support dark mode or user-facing theming.

## Why

<a durable reason: scope, a technical constraint, a strategic call. "Too busy" is a deferral, not a rejection.>

## Prior tickets

- `add-dark-mode` — "Add dark mode support"
```

On a match during triage, surface it and ask whether the reason still holds. Confirmed → append the slug, move to `wontfix/`. Reconsidered → update or delete the record, triage normally. Bug rejections never go here.
