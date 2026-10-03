# Report & Ticketize

The format for the Act 3 batch report and the discipline for turning approved findings into handoff tickets. Scour writes no code — every fix leaves as a ticket another agent builds.

## Batch report format

One report, all confirmed findings, severity-ordered (highest first). Lead with a one-line tally so the user can triage at a glance. **Persist it** to `tickets/research/scour-<area-slug>-<date>.md` when a tracker exists (get the date with `date -u +%Y-%m-%d`); it is the run's record and the parent every ticket links back to.

```md
---
topic: scour-billing-2026-06-19
area: src/features/billing/
lenses: [depth, filesize, convention, testability, composition]
filesOverThreshold: 3
createdAt: 2026-06-19T12:00:00Z
---

# Scour report — <area>

Scoured <N> files with <lenses>. <X> findings confirmed, <Y> lower-confidence,
<Z> files over <threshold> lines interrogated. Not audited: <what was scoped out>.

## Findings

### 1. <short title>  ·  <Lens>  ·  <severity>  ·  effort <S|M|L> · risk <LOW|MED|HIGH> · confidence <high|med|low>
- **Files:** path/to/a.ts:120-210, path/to/b.ts:..
- **Problem:** <in CONTEXT.md domain vocabulary + DEEPENING.md architecture vocabulary —
  what is shallow / oversized / drifting / untestable / unsafe / slow, and the doc or principle it violates>
- **Change:** <plain-English description of the deepened module / split / consolidation / fix>
- **Benefit:** <leverage for callers, locality for maintainers, and how tests improve>
- **Flag (if any):** contradicts ADR-0007 — worth reopening because <reason>

### 2. ...

## Lower confidence
<findings the verifier downgraded but did not refute — same shape, grouped separately>

## Files over threshold
<every interrogated file, its line count, and its verdict
 (earns-its-length / god-file / grab-bag / duplication-bloated). The
 earns-its-length entries are not findings — they are recorded so the next
 scour does not re-flag them, and are ADR candidates.>

## True but not worth doing
<findings the skeptics confirmed but the pragmatist verdicted not-worth-it —
 one line each with the pragmatist's reason. Recorded so the next scour does
 not re-find them; never ticketed. Marginal findings appear in ## Findings
 with a `marginal` tag instead.>

## Outside eyes
<thorough audits only: the cold reader's independent top issues, the overlap
 with the swarm's findings, and any coverage gaps it exposed. Zero overlap is
 reported as a warning about the whole batch.>

## Considered and rejected
<findings refuted in verification, or rejected by the user with a load-bearing
 reason — one line each, so the next scour does not re-surface them.>
```

Ordering: lead with the findings that buy the most leverage/locality (usually god-file splits and shallow-module deepenings), then convention and composition, then any extended-lens findings (bugs/security/perf), then the lower-confidence set. Within a tier, order by **leverage = impact ÷ effort, discounted by confidence and fix-risk**; a HIGH-confidence security finding floats above an equivalent-leverage non-security one. Do not pad the report to look thorough — a clean area gets a short report saying so.

## Ticketize discipline

**Report first, then ticketize — and only on per-finding approval.** Never bulk-emit. The user picks which findings become work. Each approved finding becomes one ship-it-format ticket in `tickets/needs-triage/`. Scour **proposes** into intake; ship-it's triage **disposes** (final kind/lane/priority/acceptance criteria). Scour only ever creates files in `needs-triage/` and `research/` — it never moves or claims a ticket.

If no tracker exists and the user declined setup, skip ticket emission — the batch report is the deliverable, and the findings live in it as a list.

### The finding → ticket mapping

Write a standard ticket per `../ship-it/references/TRACKER.md` § Ticket File, into `tickets/needs-triage/`. Check `ls tickets/*/<slug>.md` first so the slug is unique. Scour adds:

- **Frontmatter:** `source: scour`, `lens` (the lens it was found under), `effort` (S|M|L, incl. tests), `risk` (LOW|MED|HIGH, what the fix could break), `confidence` (high|med|low), `parentAudit` (the report slug in `tickets/research/`). `category` best-effort: correctness/security → `bug`, else `enhancement`. `kind` must be exactly `afk` or `hitl` or ship-it's lint flags it.
- **`## Parent`:** `research/<report-slug>.md`.
- **`## What to build`:** the change in domain and deepening vocabulary (shallow module, god-file, drift, missing seam → the deep module, split, or fix), with the why inline so a zero-context executor gets the intent.
- **`## Evidence`** (after What to build): the confirmed current-state anchors, `path:line — what's there`. Never a secret value; file:line, credential type, and a rotation recommendation.
- **`## Implementation notes`** (Tier 3 only): the chosen interface, dependency category, and test-replacement note.
- **History:** `created → needs-triage  [scour]`.

`kind` and `priority` are best guesses; triage confirms them.

Acceptance criteria are **drafted, not final** — scour knows the done-state better than triage will (it found the problem and, for deepenings, designed the interface), so it writes the first cut; triage sharpens and signs off. Keep them concrete and independently testable; lean on the done-criteria/STOP-condition mindset (machine-checkable commands over prose like "works correctly").

### Spec-depth tiers — how much goes into the ticket

The grilling that scour used to do *before applying* now decides *how much spec* the ticket carries. Depth scales with change complexity.

#### Tier 1 — Cosmetic (thin ticket)

Renames, `children`-over-render-props swaps, React 19 idiom updates (`forwardRef` → ref-as-prop, `useContext` → `use()`). No design conversation. The ticket is title + the one specific substitution + evidence + a trivial acceptance criterion. No `## Implementation notes`.

#### Tier 2 — Convention / composition (standard ticket)

Convention-drift corrections, composition-smell fixes (boolean-prop → explicit variants, renderX → children, trapped state → lifted provider). One-question confirm with the user: is there a load-bearing reason this pattern was chosen? If yes, record an ADR candidate instead of ticketing. Otherwise write a standard ticket: problem, change, drafted acceptance criteria, evidence.

#### Tier 3 — Deepening or split (rich ticket + Interface Design)

For any finding that proposes deepening a module, splitting a god-file, extracting a seam, or introducing a port/adapter, do the design work **at spec time** and bake it into the ticket — this is the expensive thinking the handoff model wants captured before a cheaper executor starts.

1. **Frame the constraints.** What must any new interface satisfy — invariants, ordering, error modes, performance? Which dependency category is the split crossing (in-process / local-substitutable / remote-owned / true-external from `DEEPENING.md`)?
2. **Inventory the survivors.** Which existing tests reach the right seam and survive? Which are shallow-module tests that become waste once the new interface exists and should be deleted? This becomes the test-replacement note.
3. **Run Interface Design.** Unless the shape is already obvious, spawn the design-it-twice sub-agent pass from `references/INTERFACE-DESIGN.md`: 3 agents (max 5) propose radically different interfaces; compare and recommend. The chosen interface goes into the ticket's `## Implementation notes`, and the drafted acceptance criteria assert behaviour through it.

The ticket now contains the agreed interface, the dependency strategy, and the test plan — ship-it's executor implements the shape, it does not re-derive it.

## Inline doc upkeep

- **New concept in a deepened module?** If its name is not in `CONTEXT.md`, add the term right there — `CONTEXT.md` is a glossary only; no implementation detail.
- **Finding rejected for a load-bearing reason?** Offer an ADR only when all three hold: hard to reverse, surprising without context, the result of a real trade-off. Frame it as "want me to record this so the next scour doesn't re-suggest it?" Skip ephemeral reasons ("not now") and self-evident ones. Never edit existing ADRs.
- **A file confirmed as earns-its-length?** That justification is a prime ADR candidate — it stops every future scour from re-interrogating the same large file.

## Close out

Summarize what became a ticket (with slugs), what was reported but not ticketed, where the batch report lives, and any inline doc/ADR changes. Recommend the user run `ship-it` to triage and build the new queue. Scour writes only ticket and report files — it never commits.
