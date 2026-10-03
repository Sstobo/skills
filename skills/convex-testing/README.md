# convex-testing

An agent skill for writing and setting up automated tests for Convex queries, mutations, actions and HTTP actions with [`convex-test`](https://www.npmjs.com/package/convex-test) and Vitest. `convex-test` is a mock Convex backend that runs in JavaScript, so tests are fast but do not reproduce every behaviour of the real backend; the reference lists the differences. Based on the Convex docs page [docs.convex.dev/testing/convex-test](https://docs.convex.dev/testing/convex-test).

## When to use it

- Setting up testing in a Convex project for the first time
- Adding tests for a Convex function, including authenticated functions, scheduled functions and HTTP actions

## Versions it targets

Checked against npm on 2026-10-03: `convex-test` 0.0.60 (peer `convex ^1.43.0`). The install command pulls the latest `vitest` (5.0.3 at that date) and `@edge-runtime/vm` (5.0.0). Vitest 5 still accepts `@edge-runtime/vm` as an optional peer for the `edge-runtime` environment; `convex-test`'s own test suite runs on Vitest 1.6.1, and this skill has not been run against Vitest 5.

## Install

```bash
npx skills add Sstobo/skills --skill convex-testing
```

## Example prompts

- "Set up convex-test in this project."
- "Write tests for `convex/tasks.ts`, including the unauthenticated case."

## Files

| File | What it holds |
|---|---|
| [`SKILL.md`](SKILL.md) | Setup steps, test file layout, key patterns and best practices |
| [`references/convex-test-guide.md`](references/convex-test-guide.md) | Install command, scripts, Vitest config, full `convex-test` API with examples, and limitations |
