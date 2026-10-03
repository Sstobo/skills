---
name: convex-testing
description: "Guide for writing and setting up automated tests for Convex backend functions using the convex-test library and Vitest. This skill should be used when writing tests for Convex queries, mutations, actions, or HTTP endpoints, setting up a Convex testing environment, or when the user asks to test Convex functions. Triggers on: 'write tests', 'add tests', 'set up testing', 'convex-test', 'test this function', 'test coverage'."
---

# Convex Testing

Test Convex backend functions using `convex-test` with Vitest. This provides a mock Convex backend in JavaScript for fast, automated testing of function logic.

## Setup

When setting up testing for a Convex project for the first time:

1. Install dependencies: `npm install --save-dev convex-test vitest @edge-runtime/vm`
2. Add test scripts to `package.json`
3. Create `vitest.config.ts` with `environment: "edge-runtime"`
4. Add test files in the `convex/` directory with `.test.ts` extension

Read `references/convex-test-guide.md` for exact configuration and script contents.

## Writing Tests

### Test File Structure

Place test files alongside the functions they test inside the `convex/` directory. Name them `<module>.test.ts`.

```ts
import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

describe("module.functionName", () => {
  it("describes expected behavior", async () => {
    const t = convexTest(schema);
    // exercise functions and assert results
  });
});
```

### Key Patterns

- **Always pass `schema`** to `convexTest()` when the project has one — required for validation and typing
- **Use `t.query`, `t.mutation`, `t.action`** to call public and internal functions via `api` / `internal`
- **Use `t.run`** to seed data or inspect database state directly without a declared function
- **Use `t.withIdentity`** to test authenticated functions — pass `{ name: "..." }` at minimum
- **Use `t.fetch`** to test HTTP actions
- **Use inline functions** with `t.mutation(async (ctx) => { ... })` to test helper functions that accept `MutationCtx`/`QueryCtx`/`ActionCtx`
- **Pass `modules` glob** when using `t.run`, `t.fetch`, or scheduled functions:
  ```ts
  const modules = import.meta.glob("./**/*.ts");
  const t = convexTest(schema, modules);
  ```

### Testing Scheduled Functions

Use Vitest fake timers:

1. `vi.useFakeTimers()` before the test logic
2. Advance time with `vi.advanceTimersByTime()` or `vi.runAllTimers()`
3. `await t.finishInProgressScheduledFunctions()` to wait for completion
4. For chained schedules: `await t.finishAllScheduledFunctions(vi.runAllTimers)`
5. `vi.useRealTimers()` at the end

### Testing Errors

```ts
await expect(async () => {
  await t.mutation(api.messages.send, { body: "" });
}).rejects.toThrowError("Expected error message");
```

### Mocking External APIs

Use `vi.stubGlobal("fetch", ...)` to mock fetch calls in actions, then `vi.unstubAllGlobals()` to clean up.

## Best Practices

- Use `toMatchObject()` for assertions — avoids brittle tests that break on new fields
- Group related tests with `describe` blocks named after the module and function
- Seed test data with `t.run` or by calling mutations, not by importing database internals
- Test both success and error paths
- Test authenticated and unauthenticated access when functions check identity
- Keep tests focused — one behavior per test case

## Reference

For complete API details, configuration examples, and edge cases, read `references/convex-test-guide.md`.
