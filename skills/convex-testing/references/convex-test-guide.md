# convex-test Reference Guide

## Installation

```bash
npm install --save-dev convex-test vitest @edge-runtime/vm
```

## Package.json Scripts

```json
"scripts": {
  "test": "vitest",
  "test:once": "vitest run",
  "test:debug": "vitest --inspect-brk --no-file-parallelism",
  "test:coverage": "vitest run --coverage --coverage.reporter=text"
}
```

## Vitest Configuration

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "edge-runtime",
  },
});
```

## Core API

### Initialize

```ts
import { convexTest } from "convex-test";
import schema from "./schema";

const t = convexTest(schema);
// or without schema:
const t = convexTest();
```

When a project uses a schema, always pass it to `convexTest()` — required for schema validation and correct typing of `t.run`.

### Call Functions

```ts
import { api, internal } from "./_generated/api";

const x = await t.query(api.myFunctions.myQuery, { a: 1, b: 2 });
const y = await t.query(internal.myFunctions.internalQuery, { a: 1 });
const z = await t.mutation(api.myFunctions.mutateSomething, { a: 1 });
const w = await t.action(api.myFunctions.doSomething, { a: 1 });
```

### Modify Data Directly (t.run)

```ts
const firstTask = await t.run(async (ctx) => {
  await ctx.db.insert("tasks", { text: "Eat breakfast" });
  return await ctx.db.query("tasks").first();
});
```

### Inline Queries, Mutations, Actions

Test helper functions that take `QueryCtx`, `MutationCtx`, or `ActionCtx` as an argument:

```ts
const threadId = await t.mutation(async (ctx) => {
  const threadId = await ctx.db.insert("threads", {});
  await insertThreadMessage(ctx, threadId, "Hello");
  return threadId;
});

await t.action(async (ctx) => {
  const messages = await searchForMessages(ctx, threadId);
  await promptLLM(ctx, threadId, messages);
});
```

### HTTP Actions

```ts
const response = await t.fetch("/some/path", { method: "POST" });
expect(response.status).toBe(200);
```

### Authentication (withIdentity)

```ts
const asSarah = t.withIdentity({ name: "Sarah" });
await asSarah.mutation(api.tasks.create, { text: "Add tests" });
const tasks = await asSarah.query(api.tasks.list);

const asLee = t.withIdentity({ name: "Lee" });
const leesTasks = await asLee.query(api.tasks.list);
```

If `issuer`, `subject`, and `tokenIdentifier` are not provided, they are generated automatically.

### Scheduled Functions

```ts
import { vi } from "vitest";

vi.useFakeTimers();

const scheduledId = await t.mutation(api.scheduler.schedule, { delayMs: 10000 });

vi.advanceTimersByTime(11000);
// or: vi.runAllTimers();

await t.finishInProgressScheduledFunctions();

const status = await t.run(async (ctx) => {
  return await ctx.db.system.get("_scheduled_functions", scheduledId);
});
expect(status).toMatchObject({ state: { kind: "success" } });

vi.useRealTimers();
```

For chained scheduled functions (mutation -> action -> action):

```ts
vi.useFakeTimers();
await t.mutation(api.scheduler.chainedSchedule);
await t.finishAllScheduledFunctions(vi.runAllTimers);
vi.useRealTimers();
```

### Asserting Errors

```ts
await expect(async () => {
  await t.mutation(api.messages.send, { body: "", author: "James" });
}).rejects.toThrowError("Empty message body is not allowed");
```

### Mocking Fetch

```ts
vi.stubGlobal(
  "fetch",
  vi.fn(async () => ({ text: async () => "mocked response" }) as Response),
);

const reply = await t.action(api.messages.sendAIMessage, { prompt: "hello" });

vi.unstubAllGlobals();
```

Mocking the global `fetch` does not affect `t.fetch`.

### Overriding Globals Inside a Function

`convex-test` scopes global overrides made inside a handler to that one invocation, but only when you assign to the global:

```ts
const result = await t.run(async () => {
  const replacement: Math = Object.create(globalThis.Math);
  replacement.random = () => 0.5;
  globalThis.Math = replacement;   // scoped to this call
  return Math.random();
});
```

Mutating the shared object (`Math.random = ...`), `Object.defineProperty` (which `vi.stubGlobal` uses), or `delete globalThis.x` change the global for the whole test process and disable the restrictions `convex-test` applies inside queries and mutations. Nested `ctx.runQuery`/`runMutation`/`runAction` calls do not inherit the override.

### Modules Glob

`convex-test` loads your functions with its own `import.meta.glob` over the default `convex/` folder. If your functions live elsewhere (custom folder in `convex.json`, monorepo), pass a glob matching every file that contains Convex functions, relative to the file that calls `import.meta.glob`. The official examples pass one in every test; that is harmless with the default layout.

```ts
const modules = import.meta.glob("./**/*.ts");
const t = convexTest(schema, modules);
```

The docs suggest keeping it in one place:

```ts
// convex/test.setup.ts
/// <reference types="vite/client" />
export const modules = import.meta.glob("./**/!(*.*.*)*.*s");
```

## Limitations

- Error message content may differ from real backend
- Size and time limits are not enforced
- Document/storage ID format may differ
- Runtime built-ins may differ (edge-runtime vs Convex runtime)
- Text search: simplified — returns docs containing prefix-matching words, no relevance sorting
- Vector search: correct cosine similarity sorting but no efficient index
- No cron job support — trigger functions manually
- Always manually test new code to verify compatibility with the Convex runtime
