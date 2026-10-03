---
name: convex-helpers
description: >-
  Reference for the convex-helpers npm package (utilities that sit alongside the
  official Convex packages). Use when writing custom query/mutation/action
  wrappers (auth, extra ctx, extra args), relationship lookups, row-level
  security, Zod-validated functions, triggers, CRUD scaffolding, validator
  utilities, manual pagination, merged or joined query streams, the React query
  cache, session IDs, useQueryWithStatus, Hono or CORS for HTTP actions, or the
  ts-api-spec/open-api-spec CLI. Also covers when to use a Convex component
  instead (rate limiting, retries, migrations).
---

# convex-helpers

Checked against `convex-helpers` **0.1.126** (npm, 2026-10-03). That release peers on `convex ^1.46.0`. Source of truth: the package README at https://github.com/get-convex/convex-helpers/tree/main/packages/convex-helpers and the `.ts` files shipped in the npm tarball. If this file and the installed code disagree, the code wins.

```bash
npm install convex-helpers
```

Every helper lives under a subpath. Importing the wrong subpath is the most common mistake, so the map comes first.

| Import path | What you get |
|---|---|
| `convex-helpers` | `asyncMap`, `pruneNull`, `nullThrows`, `pick`, `omit`, `withoutSystemFields` |
| `convex-helpers/server/customFunctions` | `customQuery`, `customMutation`, `customAction`, `customCtx`, `customCtxAndArgs`, `NoOp` |
| `convex-helpers/server/relationships` | `getOneFrom[OrThrow]`, `getManyFrom`, `getManyVia[OrThrow]`, `getAll[OrThrow]`, `getOrThrow` |
| `convex-helpers/server/rowLevelSecurity` | `wrapDatabaseReader`, `wrapDatabaseWriter`, `Rules`, `RLSConfig` |
| `convex-helpers/server/zod4` / `zod3` | `zCustomQuery`/`Mutation`/`Action`, `zid`, `zodToConvex`, `convexToZod`, ... |
| `convex-helpers/server/triggers` | `Triggers` |
| `convex-helpers/server/crud` | `crud` |
| `convex-helpers/validators` | `literals`, `nullable`, `partial`, `deprecated`, `brandedString`, `doc`, `typedV`, `systemFields`, `validate`, `parse` |
| `convex-helpers/server/filter` | `filter` |
| `convex-helpers/server/pagination` | `getPage`, `paginator` |
| `convex-helpers/server/stream` | `stream`, `mergedStream`, `MergedStream` |
| `convex-helpers/server/sessions` | `SessionIdArg`, `vSessionId`, `SessionId` |
| `convex-helpers/server/hono` | `HonoWithConvex`, `HttpRouterWithHono` |
| `convex-helpers/server/cors` | `corsRouter` |
| `convex-helpers/server/migrations` | `makeMigration`, `migrationsTable`, `startMigration`, ... |
| `convex-helpers/server/retries` | `makeActionRetrier` |
| `convex-helpers/server/rateLimit` | `defineRateLimits`, `rateLimit`, `rateLimitTables`, ... |
| `convex-helpers/react` | `makeUseQueryWithStatus`, `useQuery`, `usePaginatedQuery` |
| `convex-helpers/react/sessions` | `SessionProvider`, `useSessionQuery`, `useSessionMutation`, `useSessionAction`, `useSessionId` |
| `convex-helpers/react/cache` (Next.js: `/react/cache/provider` and `/react/cache/hooks`) | `ConvexQueryCacheProvider`, cached `useQuery`/`useQueries`/`usePaginatedQuery` |
| `convex-helpers/standardSchema` | `toStandardSchema` |

## Prefer a component for these three

The README itself points to components for:

- Rate limiting → `@convex-dev/rate-limiter`
- Action retries → `@convex-dev/action-retrier`
- Migrations → `@convex-dev/migrations` (no extra table in your schema)

The helpers versions still ship. Use them only if a project already does.

## Custom functions (the foundation)

Most other helpers (RLS, sessions, triggers, Zod) plug into these. `customQuery(query, customization)` returns a builder you use in place of `query`.

The customization's `input(ctx, args, extra)` runs before every handler and returns `{ ctx, args, onSuccess? }`:

- `ctx` fields are merged into the handler's `ctx` (add `user`, replace `db`).
- `args` are passed through to the handler. Anything declared in the customization's `args` is consumed and not passed on unless you return it.
- `onSuccess({ args, result })` runs after the handler returns.
- A third parameter takes extra, typed, per-function options.

```ts
// convex/lib/functions.ts
import { customQuery, customMutation, customCtx } from "convex-helpers/server/customFunctions";
import { query, mutation } from "../_generated/server";

export const authedQuery = customQuery(query, {
  args: {},
  input: async (ctx, _args, { role }: { role: "admin" | "user" }) => {
    const user = await getCurrentUser(ctx); // your own lookup
    if (!user) throw new Error("Not signed in");
    if (role === "admin" && user.role !== "admin") throw new Error("Admins only");
    return { ctx: { user }, args: {} };
  },
});

// customCtx is shorthand when you only add to ctx
export const timedMutation = customMutation(
  mutation,
  customCtx(async () => ({ startedAt: Date.now() })),
);

// usage
export const listUsers = authedQuery({
  role: "admin",
  args: {},
  handler: async (ctx) => ctx.db.query("users").collect(),
});
```

Use `NoOp` as the customization when you only want the builder shape, e.g. `zCustomQuery(query, NoOp)`.

## Relationships

Lookups go through an **index**, not a bare field: `getManyFrom(db, table, indexName, value, field?)`. The field defaults to the index name with any `by_` prefix removed (`"by_authorId"` → `authorId`). Pass `field` only when that guess is wrong.

```ts
import { getOneFromOrThrow, getManyFrom, getManyVia } from "convex-helpers/server/relationships";
import { asyncMap } from "convex-helpers";

const profile = await getOneFromOrThrow(ctx.db, "profiles", "userId", userId);   // 1:1, index "userId"
const posts = await getManyFrom(ctx.db, "posts", "by_authorId", userId);        // 1:many
const withTags = await asyncMap(posts, async (post) => ({
  ...post,
  // many:many through a join table: (joinTable, idFieldToFollow, index, value)
  tags: await getManyVia(ctx.db, "postTags", "tagId", "by_postId", post._id),
}));
```

`getAll(db, ids)` (or `getAll(db, table, ids)`) loads several ids. `*OrThrow` variants throw instead of returning `null`.

## Row-level security

Wrap `ctx.db` so every document read, insert and modify goes through a rule. Rules return `true` to allow. A rule can also throw.

```ts
import { customQuery, customMutation, customCtx } from "convex-helpers/server/customFunctions";
import { Rules, RLSConfig, wrapDatabaseReader, wrapDatabaseWriter } from "convex-helpers/server/rowLevelSecurity";
import { DataModel } from "./_generated/dataModel";
import { query, mutation, QueryCtx } from "./_generated/server";

async function rules(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  return {
    notes: {
      read: async (_ctx, note) => note.ownerId === identity?.subject,
      insert: async (_ctx, note) => note.ownerId === identity?.subject,
      modify: async (_ctx, note) => note.ownerId === identity?.subject,
    },
  } satisfies Rules<QueryCtx, DataModel>;
}

const config: RLSConfig = { defaultPolicy: "deny" }; // default is "allow" for tables with no rules

export const queryWithRLS = customQuery(query, customCtx(async (ctx) => ({
  db: wrapDatabaseReader(ctx, ctx.db, await rules(ctx), config),
})));
export const mutationWithRLS = customMutation(mutation, customCtx(async (ctx) => ({
  db: wrapDatabaseWriter(ctx, ctx.db, await rules(ctx), config),
})));
```

Watch the default: without `defaultPolicy: "deny"`, any table you forgot to list is fully open.

## Zod-validated functions

Import from the entry point that matches your Zod major version: `convex-helpers/server/zod4` for Zod 4, `convex-helpers/server/zod3` for Zod 3. The peer range is `zod ^3.25.0 || ^4.0.0`.

```ts
import * as z from "zod";
import { zCustomQuery, zid } from "convex-helpers/server/zod4";
import { NoOp } from "convex-helpers/server/customFunctions";
import { query } from "./_generated/server";

const zQuery = zCustomQuery(query, NoOp); // any customization works here, not only NoOp

export const search = zQuery({
  args: {
    userId: zid("users"),             // typed Convex Id
    email: z.email(),
    limit: z.number().int().min(1).max(100).default(20),
  },
  handler: async (ctx, args) => {
    // args are the Zod *output* types: limit is a number here, even if the client omitted it
  },
});
```

`zodToConvex` / `zodToConvexFields` turn a Zod schema into Convex validators (e.g. to reuse in `defineTable`). `convexToZod` goes the other way.

## Triggers

Run code inside the same transaction whenever a table is changed through `ctx.db.insert/patch/replace/delete`.

```ts
import { mutation as rawMutation, internalMutation as rawInternalMutation } from "./_generated/server";
import { DataModel } from "./_generated/dataModel";
import { Triggers } from "convex-helpers/server/triggers";
import { customCtx, customMutation } from "convex-helpers/server/customFunctions";

const triggers = new Triggers<DataModel>();

triggers.register("users", async (ctx, change) => {
  // change.operation: "insert" | "update" | "delete"; also change.id, change.oldDoc, change.newDoc
  if (change.operation === "delete") {
    const owned = await ctx.db.query("messages").withIndex("owner", (q) => q.eq("owner", change.id)).collect();
    for (const m of owned) await ctx.db.delete(m._id);
  }
});

export const mutation = customMutation(rawMutation, customCtx(triggers.wrapDB));
export const internalMutation = customMutation(rawInternalMutation, customCtx(triggers.wrapDB));
```

What to know:

- Triggers only fire for mutations built from the wrapped builders. Raw `mutation`, dashboard edits and `npx convex import` skip them. Ban the raw import with an ESLint `no-restricted-imports` rule.
- Writes inside a trigger fire further triggers (processed as a queue). Guard against loops, or write through `ctx.innerDb` to skip triggers.
- A trigger that throws makes the originating `ctx.db.*` call throw, and the mutation aborts unless you catch it. All triggers still run. The first error is rethrown and the others are logged.
- Parallel writes via `Promise.all` are serialized.
- Components such as `@convex-dev/aggregate` expose a `.trigger()` you can `register`.

## CRUD scaffolding

```ts
import { crud } from "convex-helpers/server/crud";
import schema from "./schema";

export const { create, read, update, destroy, paginate } = crud(schema, "users");
```

These are **internal** functions by default. Pass your own `query`/`mutation` builders as the 3rd/4th args to change that. Only do so behind RLS. `update` takes `{ id, patch }`.

## Validators

```ts
import { literals, nullable, deprecated, brandedString, typedV, doc, validate } from "convex-helpers/validators";
import { pick } from "convex-helpers";
import { Infer } from "convex/values";

export const vEmail = brandedString("email");
export type Email = Infer<typeof vEmail>;     // a string type that plain strings don't satisfy

defineTable({
  status: literals("active", "inactive"),     // union of literals
  balance: nullable(v.number()),              // value or null
  legacy: deprecated,                         // accepts anything at runtime, typed as null: marks a field for removal
});

const vv = typedV(schema);                     // v plus vv.id("table") and vv.doc("table") typed to your schema
const accountDoc = doc(schema, "accounts");    // full doc incl. _id/_creationTime, e.g. for `returns`
const justEmail = pick(vv.doc("accounts").fields, ["email"]);

validate(justEmail, value);                         // boolean
validate(justEmail, value, { throw: true });        // throws ValidationError
validate(vv.id("accounts"), id, { db: ctx.db });    // also checks the id belongs to the table
```

Without `{ db }`, `validate` on an id validator only checks that the value is a string. `partial`, `systemFields` and `omit` round this out.

## Filtering with arbitrary TypeScript

```ts
import { filter } from "convex-helpers/server/filter";

const active = await filter(
  ctx.db.query("users").withIndex("by_team", (q) => q.eq("teamId", teamId)),
  async (u) => u.lastSeen > cutoff && (await isPaid(ctx, u)),
).take(20);
```

This still scans documents, so narrow with an index first. Used with `.paginate()` it filters after the page is read, so pages can come back short or empty.

## Manual pagination

Built-in `.paginate()` allows one call per query. These lift that limit.

- **`paginator(ctx.db, schema)`**: same chain as `ctx.db.query(...)` (`withIndex`, `order`, `paginate`), callable many times per query. It supports `withIndex` but **not** `.filter`. It doesn't pin the end cursor, so in reactive UIs pages can gap or overlap. Use `usePaginatedQuery` from `convex-helpers/react` on the client for gapless pages.
- **`getPage(ctx, { table, index?, schema?, startIndexKey?, startInclusive?, endIndexKey?, endInclusive?, order?, targetMaxRows?, absoluteMaxRows? })`**: returns `{ page, indexKeys, hasMore }`. Pass the last `indexKeys` entry as the next `startIndexKey`. When you name an `index`, also pass `schema` so it can find the index fields.

## Query streams (union, filter, join, then paginate)

A stream is an ordered async iterable built with the same syntax as `ctx.db.query`. You can combine streams and still end with `.first()`, `.take(n)`, `.collect()` or `.paginate()`.

```ts
import { stream, mergedStream } from "convex-helpers/server/stream";
import schema from "./schema";

// UNION: messages from several authors, interleaved by the index order
const perAuthor = authorIds.map((a) =>
  stream(ctx.db, schema).query("messages").withIndex("by_author", (q) => q.eq("author", a)),
);
const merged = mergedStream(perAuthor, ["author", "_creationTime"]);

// WHERE with any async predicate, applied before page sizing
const verified = merged.filterWith(async (m) => (await ctx.db.get(m.author))?.verified === true);

return await verified.paginate({ ...paginationOpts, maximumRowsRead: 500 });
```

- `.map(fn)` transforms items and keeps the order. `.flatMap(fn, indexFields)` expands each item into a sub-stream (a JOIN).
- `mergedStream(streams, fields)` needs every input stream ordered by those fields.
- `filterWith` with a selective predicate can read a lot. Cap it with `maximumRowsRead`.
- Same reactive-pagination caveat as `paginator`: use the `convex-helpers/react` `usePaginatedQuery` (or `customPagination: true` on the cached version).

## React

**Query cache.** It keeps subscriptions alive after components unmount, so navigating back is instant. This costs more bandwidth, not less.

```tsx
import { ConvexQueryCacheProvider, useQuery } from "convex-helpers/react/cache";

<ConvexProvider client={convex}>
  <ConvexQueryCacheProvider expiration={300_000} maxIdleEntries={250}>
    <App />
  </ConvexQueryCacheProvider>
</ConvexProvider>;

const todos = useQuery(api.todos.list); // drop-in for convex/react useQuery
```

`expiration` defaults to 5 minutes and `maxIdleEntries` defaults to 250. For Next.js, import the provider from `convex-helpers/react/cache/provider` and the hooks from `convex-helpers/react/cache/hooks`.

**Status-returning useQuery.** Create it once and reuse it:

```ts
import { makeUseQueryWithStatus } from "convex-helpers/react";
import { useQueries } from "convex/react";
export const useQueryWithStatus = makeUseQueryWithStatus(useQueries);
// { status: "pending" | "success" | "error", data, error, isPending, isSuccess, isError }
```

It returns the server error instead of throwing it.

**Sessions** (track anonymous users without cookies). Wrap the app in `<SessionProvider>` inside `<ConvexProvider>`. Call `useSessionQuery` / `useSessionMutation` / `useSessionAction`, which add `sessionId` to args. On the server, build the wrappers with `customQuery(query, { args: SessionIdArg, input: async (ctx, { sessionId }) => ({ ctx: { ... }, args: {} }) })`.

## HTTP actions

**CORS.** `corsRouter` wraps an `httpRouter`, registers the OPTIONS preflight and adds the headers.

```ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { corsRouter } from "convex-helpers/server/cors";

const http = httpRouter();
const cors = corsRouter(http, {
  allowedOrigins: ["https://app.example.com"], // default ["*"]; can be an async (req) => string[]
  allowCredentials: true,                      // default false
  enforceAllowOrigins: true,                   // 403 for other origins; default false
});
cors.route({ path: "/api/items", method: "GET", handler: httpAction(async () => Response.json([])) });
export default http;
```

Other options: `allowedMethods`, `allowedHeaders` (default `["Content-Type"]`), `exposedHeaders`, `browserCacheMaxAge` (default 86400), `debug`. Any of them can be overridden per route.

**Hono.** Put this in `convex/http.ts`. Needs `hono` installed.

```ts
import { Hono } from "hono";
import { HonoWithConvex, HttpRouterWithHono } from "convex-helpers/server/hono";
import { ActionCtx } from "./_generated/server";

const app: HonoWithConvex<ActionCtx> = new Hono();
app.get("/hello/:name", (c) => c.json({ hi: c.req.param("name") })); // c.env is the Convex ActionCtx
export default new HttpRouterWithHono(app);
```

## Legacy helpers (if a project already uses them)

```ts
// migrations: build the wrapper first. There is no bare `migration` export.
import { makeMigration } from "convex-helpers/server/migrations";
import { internalMutation } from "./_generated/server";
const migration = makeMigration(internalMutation, { migrationTable: "migrations" }); // option optional
export const backfill = migration({
  table: "users",
  migrateOne: async (ctx, doc) => { if (doc.plan === undefined) await ctx.db.patch(doc._id, { plan: "free" }); },
});
// if you pass migrationTable, add `migrations: migrationsTable` to your schema

// retries: pass the path of the exported `retry` action
import { makeActionRetrier } from "convex-helpers/server/retries";
export const { runWithRetries, retry } = makeActionRetrier("utils:retry");
```

Rate limiting: `defineRateLimits({...})` in `convex-helpers/server/rateLimit` (needs `rateLimitTables` in your schema). New code should use `@convex-dev/rate-limiter`.

## CLI

Run from the project with the Convex functions. Both commands read from the dev deployment by default. Add `--prod` for production.

```bash
npx convex-helpers ts-api-spec     # writes convexApi<timestamp>.ts: typed `api` for use in another repo (includes internal functions; prune them)
npx convex-helpers open-api-spec   # writes convex-spec-<timestamp>.yaml: OpenAPI for non-JS clients or tools like Retool
```

## Standard Schema

```ts
import { toStandardSchema } from "convex-helpers/standardSchema";
const nameSchema = toStandardSchema(v.object({ name: v.string() }));
nameSchema["~standard"].validate({ name: "Ada" });
```

Use it to pass Convex validators to libraries that accept Standard Schema, such as form libraries.
