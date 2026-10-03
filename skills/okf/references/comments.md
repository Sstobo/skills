# Comments — code or doc?

Some comments belong in the code. The agents read the code. The question is never whether
a comment is good, it is **blast radius**: how far does this knowledge reach?

## The locality test

| If the comment… | Verdict | What happens |
| --- | --- | --- |
| explains *this line or this file only* — a local workaround, a type hack, a non-obvious branch | **Stays** | Untouched. A doc may cite it by the symbol it sits in (`` `fn` in `path.ts` ``). |
| warns a **caller** about something they would otherwise get wrong | **Stays** | Untouched. The warning must sit where the mistake happens. |
| names other modules, lists composers or consumers, asserts a cross-file invariant | **Moves** | Becomes or joins a Module / Flow doc. Code keeps one line: `// see: /path/to/doc.md`. |
| states a business rule, a decision, or a why | **Moves** | Becomes a Term / Decision / Convention doc, linked from the code. |
| records history ("removed 2026-07-07", "collapsed 2026-06-09") | **Moves** | Git has the diff; the doc keeps the *reason*. |
| is a catalog — every scout, every rule, every column, every consumer | **Moves** | Catalogs rot fastest and make the highest-value docs. |

**When the test is ambiguous, the verdict is Stays.** A comment left in place costs a
little duplication. A comment removed into a doc nobody finds costs the knowledge.

### Why catalogs are the prize

A roster inside a file header — "composed by A, B, C" — is invisible from A, B and C. The
person who adds a fourth composer is editing one of those files and will never see the
header claiming there are three. Moved into a doc that declares all of them as `sources`,
the list is findable from any of them with one grep.

That is the whole reason to move a comment: it goes from reachable-from-one-file to
reachable-from-every-file it describes. Nothing about the move makes it self-checking, so
if it does not buy that reachability, leave it where it is.

## Protocol

1. **Never sweep.** Run on files the user names, or files the current task already touches.
   A whole-repo comment pass is unreviewable, and in a shared tree it collides with every
   other agent's in-flight edits.
2. **Batch by file, not by comment.** One prompt per file: here are the N blocks, here is
   the verdict on each, override any. Interrupting per comment is unusable.
3. **Propose, don't decide.** Show the default verdict and the reasoning. The user owns the
   call — this is their codebase's reading experience.
4. **Concept first, code second, two commits.** Write and commit the doc. *Then* edit
   the source file. A run that dies halfway must leave more knowledge, never less.
5. **Leave a pointer, not a hole.** Where the removed comment was load-bearing at that
   spot, the code keeps a single `// see: <doc path>` line. Where it was incidental,
   remove it cleanly.

## What the code keeps regardless

Never strip these in the name of tidiness:

- Warnings that prevent a caller from introducing a bug.
- Explanations of a deliberate deviation from an obvious approach.
- `TODO` / `FIXME` / `HACK` and similar markers, and their reasoning.
- Anything a reader needs *at that line* to avoid making the change wrong.
- License, attribution, and generated-file headers.

## Finding candidates

Comment density is a proxy, not a verdict. A file with a 30-line header explaining a
genuinely subtle algorithm is healthy; a file with a 30-line header listing other files is
carrying cross-file knowledge in the wrong place.

```
grep -cE '^\s*(//|/\*|\*)' <file>          # line-leading comment lines
```

Sort descending, start at the top, and read before judging. The densest file in a repo is
often the most important one, not the worst.

## Verification

Comment edits are source edits. After each batch, run the project's own checks — typecheck,
lint, tests. A removed line inside a template literal or a JSX expression is a real
breakage, not a doc change.
