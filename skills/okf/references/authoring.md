# Authoring a doc

Two questions: what kind of thing is this, and what is allowed inside it. The second one is
where code wikis live or die.

## The rule

**A doc may only hold what the code cannot state.**

Every code wiki dies the same death: it becomes a paraphrase of the code, and a paraphrase
is wrong the moment the code moves. The defence is a subtraction rule applied at authoring
time and again every time the doc is touched.

| A doc **may** hold | A doc **may never** hold |
| --- | --- |
| **Why** — the decision, the alternative rejected, the cost paid | A restated function signature or type |
| **Relationships** — what composes this, what breaks if it changes | A directory listing (the filesystem is the listing) |
| **Invariants spanning files** — no single file can assert them | A narrated function body |
| **Ground truth** — the external number this must tie to, and how to check | A number that changes — cite the query, not the result |
| **History** — what was already tried, and why it failed | Anything answered by opening one file and reading twenty lines |

### The deletion test

Delete the sentence. Would an agent holding only the code do worse? **No → it stays
deleted.** Apply it per line, not per document. This is the only thing keeping a bundle
from doubling in size every quarter while getting less useful.

The test is also the answer to a recurring complaint from agents using a bundle — "not
sure this beats just reading the code." It cannot and must not: the bundle holds only
what reading cannot give, and routes the read. So treat that complaint as a **paraphrase
detector**, not a framing problem: when a bundle feels redundant with the code, find the
docs that restate the code and delete them.

Applying it *per document* — deciding what belongs in a doc and then writing that
doc freely — is not the test, and it fails the same way every time. Measure the
outcome: **report total bundle word count before and after any large pass.** A first run
on a documented repo that comes in +50% has almost certainly written well rather than
subtracted, and the excess is the padding that makes the next reader skim.

**The subtract pass is part of authoring, not review.** After writing, run the deletion
test over your own output *before* committing — expect to cut a meaningful fraction.
Fresh prose always reads as necessary to its author; the test, not the feeling, decides.

### Correction notes are dated history, never present tense

A correction written in the present tense — "`x.ts:12` says X, which is wrong" — becomes
false the moment someone fixes `x.ts`. Nothing catches it, and it reads as authoritative because it is specific. On a real run,
two of a bundle's three hard false claims were this failure, both written the same day as
the fix they described.

| Never | Always |
| --- | --- |
| "`x.ts:12` **says** X — that's wrong" | "`resolveRoll` in `x.ts` **said** X until 2026-07-30; corrected in place" |
| "both docs **still claim** Y" | "both docs claimed Y until \<date\>" |
| a line number in another *doc* (de-dup moves it) | cite the code, or name the doc without a line |
| a line number in code (`x.ts:12`) | the symbol (`resolveRoll` in `x.ts`); lines drift silently, names survive |
| the correction parked in `CONTEXT.md` or a router | the correction in the covering doc; the glossary entry rewritten to the current meaning only |

Close every correction with where truth lives: *"`crons.ts` is the authority — re-derive
from it rather than from any comment, including this one."*

### Two temptations that always survive the test wrongly

Old docs are full of both, so an annotation pass inherits them by default:

- **Rosters and capability tables.** A list of the tools, the routes, the exports, the
  commands. `ls` and the type system already answer these, they go stale silently, and
  the doc that carries one becomes the fifth copy rather than the single source.
  Write the *contract* the roster obeys, not the roster.
- **Restated signatures and step lists.** If the doc's table is the code's control
  flow with prettier column headings, the code is the better document. Link to it.

### Inherited claims are unverified claims

The rule against inventing a symbol is well known and mostly obeyed. The failure that
actually lands is quieter: **copying a claim out of the document you are replacing.**

An annotation pass's entire input is old docs, and those docs are wrong in ways nobody
noticed. A sentence that arrives via an existing guide has exactly the same
status as a sentence you made up — unverified — and it is *more* dangerous, because it
reads as sourced.

Every claim in a new doc traces to a command you ran **this session**. Not to a guide,
not to an ADR, not to your own earlier summary of either.

Two more channels carry unverified claims in, and both wear better disguises than an old
doc does:

- **The brief you were handed.** Whatever the requester wrote under "context you need" is a
  claim, not a premise — including when the requester was you, an hour ago. A brief that
  states where a symbol lives, which commit changed what, or what a store id maps to has
  pre-loaded the answer; write the doc from the code and let the brief be wrong. One
  session seeded four such facts into agent briefs, and though all four survived checking,
  a fifth phrase in the same brief was the author's loose paraphrase and would have entered
  a doc as if it were the code's own word.
- **A subagent's report.** Delegated work is unverified work. Findings arrive
  pre-formatted, confident, and with the counts already totalled, which is exactly what
  makes them easy to paste. Re-derive the load-bearing ones before they reach a doc, and
  re-derive hardest whatever echoes your own brief back at you.

The test for all three channels is the same: name the command that would fail if the claim
were false. If you cannot, you are transcribing, not verifying.

### The corollary

Because docs hold only what code can't state, a doc that is *hard to write* is
usually pointing at real knowledge, and a doc that writes itself is usually paraphrase.
When a doc comes out easy, re-read it against the table above before committing it.

## Types

OKF fixes no taxonomy. This is the one to propose for a codebase — confirm it with the user
per repo, and extend it rather than forcing a bad fit. Each type earns its slot by *routing
differently*: different sources, different verification.

| `type` | Holds | `sources` are |
| --- | --- | --- |
| **Module** | What a deep module hides; its interface contract and invariants | the files it spans |
| **Flow** | An end-to-end path across files — a request, a chat turn, a nightly job | every file on the path |
| **Decision** | Why, what was rejected, what it costs | the ADR/commit + the code it governs |
| **Convention** | A rule the codebase enforces, **and its enforcement point** | the guard, test, or lint rule |
| **Term** | One domain word, precisely | the code that computes or embodies it |
| **Attested Computation** | The sanctioned way to produce a number + how to prove it ran | the query/reader + the policy doc |
| **Gotcha** | A landmine that has already bitten someone | the incident + the code involved |
| **Audit** | A dated evidence record — measurements, timings, verdicts *as of a day* | the ticket/commit that produced it |
| **Playbook** | Steps for a recurring operational job | the scripts and commands it invokes |
| **Reference** | Mirrored external material, verbatim | the original |

The **`sources` are** column is illustrative, and when it conflicts with the rule below —
list the invalidators, not the span — **the rule wins.** A Flow crossing forty files
rarely has forty genuine invalidators; a doc that obeys the invalidator rule while
"failing" its type's row is correct. And a cross-cutting inventory — every query, every
route, every scout — is an **index, not a doc**: let the filesystem and the type
system answer it. If real judgement attaches to each entry, the
judgement is the doc, and its `sources` are the files that would invalidate the
judgement, not the forty files the inventory happens to mention.

**Flow and Gotcha are usually the two that don't exist yet**, and are where most of the
value is. A Gotcha is knowledge that cost someone a day to learn and currently survives
only in a comment, a memory, or a person's head. A Flow answers "what happens when…",
which today requires reading nine files in the right order.

**Convention without an enforcement point is a wish.** If no guard, test, or lint rule
backs the rule, say so explicitly in the doc — that gap is itself worth recording.

**Audit is for the record a Gotcha is not.** A Gotcha is a live landmine; an Audit is the
dated evidence pass that found it — 150 rows of timings stamped "as of 2026-07-07". Typing
an audit log as Gotcha or Module invites a re-verify nobody will do. The audit's *live* conclusions get extracted into real
docs; the record itself is an Audit and stops pretending to be current.

**Reference is the type for verbatim material**, and verbatim material must not be
rewritten. If adding frontmatter would alter a transcript, a vendor spec, or a quoted
source, do not add it: declare the file an out-of-bundle attachment and describe it from a
sibling doc instead.

**Neither Audit nor Reference is a dumping ground.** A dated internal record is an Audit;
verbatim external material is a Reference; a live doc that keeps turning out wrong is too
coarse, so split it rather than retyping it into a category that excuses it.

## Choosing `sources`

This is the field the whole skill exists for. Get it right and everything downstream is
mechanical.

- **List the files a change to which would make this doc wrong.** Not every file
  mentioned — the ones that invalidate it.
- **Name files, never directories.** A directory source answers no question: it cannot
  tell you which file to open, and it makes the doc look checked when nothing was checked.
  Strictly worse than no source at all.
- **Never let a doc declare itself.** It says nothing, and agents write these
  constantly — an ADR listing its own path is the classic case.
- **Include the decision record**, if one governs the doc. An ADR is a source *of the
  doc it governs* — which is not the same as an ADR listing itself.
- **Verify every path exists before writing it.** A fabricated path in a committed doc is
  exactly the failure this skill exists to prevent, and nothing downstream will catch it.
- **The invalidator pass, before committing:** for each source, name the sentence it
  would falsify. If you cannot name one, drop the source. This is what stops
  source-padding — the thorough-looking list of every file the doc merely mentions,
  which no automated check can catch, because every path in it exists.
- **A file declared by many docs is an authoring smell.** Give the hot file one
  Module that owns it; other docs link that Module instead of declaring the file.
- **There is no cap on source count.** Aim narrow, but *never drop a genuine invalidator to
  hit a number*. An invented constraint costs exactly what an invented path costs — it just
  fails silently instead of loudly. If eight files can each falsify the doc, list eight.
- **A doc with no `sources` cannot be routed to.** Sometimes correct (a pure
  Reference, an external policy); otherwise a defect — nobody will find it from the code.

## Granularity

One doc per thing that can independently become wrong.

The practical test is what happens when you verify it: if fixing a doc means touching
three unrelated claims with three different lifetimes, it is too coarse — split it. If a
doc is never wrong and never read, it is paraphrase or dead; delete it.

Let a real verification pass decide this. Do not pre-split a large document on a hunch.

## Writing the body

Structural markdown over prose: headings, tables, fenced code. An agent retrieves from
structure better than from paragraphs, and so does a human skimming at 2am.

Cite code by symbol and file — `` `resolveRoll` in `x.ts` `` — not `x.ts:120`; line numbers
drift on every edit above them (see the table above). Cite other
docs with bundle-relative markdown links. Attribute external claims with an inline link
to the original.

Keep numbers out unless they are calibration anchors that must not move. When a number is
load-bearing, write down **how to re-derive it**, so the next reader can check rather than
trust.
