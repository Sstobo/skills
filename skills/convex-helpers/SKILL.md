---
name: convex-helpers
description: "This skill provides comprehensive guidance for using convex-helpers, a collection of utilities that complement official Convex packages. This skill should be used when implementing custom functions, relationship traversal, row-level security, Zod validation, triggers, CRUD utilities, pagination, query caching, streams, or HTTP endpoints with Convex. It covers patterns for authentication wrappers, session tracking, rate limiting, migrations, and validator utilities."
---

# convex-helpers

A collection of useful code to complement the official Convex packages.

## Custom Functions

Build customized versions of `query`, `mutation`, and `action` that define custom behavior:

- Run authentication logic before the request starts
- Look up commonly used data and add it to the `ctx` argument
- Replace a `ctx` or `argument` field with a different value
- Consume arguments from the client not passed to the action (e.g., API keys, session IDs)
- Execute finalization logic after function execution using the `onSuccess` callback

```ts
import { customQuery } from "convex-helpers/server/customFunctions";

const myQueryBuilder = customQuery(query, {
  args: { apiToken: v.id("api_tokens") },
  input: async (ctx, args) => {
    const apiUser = await getApiUser(args.apiToken);
    const db = wrapDatabaseReader({ apiUser }, ctx.db, rlsRules);
    return {
      ctx: { db, apiUser },
      args: {},
      onSuccess: ({ args, result }) => {
        console.log(apiUser.name, args, result);
      },
    };
  },
});

export const getSomeData = myQueryBuilder({
  args: { someArg: v.string() },
  handler: async (ctx, args) => {
    const { db, apiUser } = ctx;
    const { someArg } = args;
    // ...
  },
});
```

### Taking Extra Arguments

Specify the type of a third input arg for extra arguments:

```ts
const myQueryBuilder = customQuery(query, {
  args: {},
  input: async (ctx, args, { role }: { role: "admin" | "user" }) => {
    const user = await getUser(ctx);
    if (role === "admin" && user.role !== "admin") {
      throw new Error("You are not an admin");
    }
    return { ctx: { user }, args: {} };
  },
});

const myAdminQuery = myQueryBuilder({
  role: "admin",
  args: {},
  handler: async (ctx, args) => {
    // ...
  },
});
```

## Relationship Helpers

Traverse database relationships without boilerplate:

```ts
import {
  getOneFromOrThrow,
  getManyFrom,
  getManyViaOrThrow,
} from "convex-helpers/server/relationships.js";
import { asyncMap } from "convex-helpers";

const author = await getOneFromOrThrow(db, "authors", "userId", user._id);
const posts = await asyncMap(
  await getManyFrom(db, "posts", "authorId", author._id),
  async (post) => {
    const comments = await getManyFrom(db, "comments", "postId", post._id);
    // many-to-many via join table
    const categories = await getManyViaOrThrow(
      db,
      "postCategories",
      "categoryId",
      "postId",
      post._id,
    );
    return { ...post, comments, categories };
  },
);
```

## Row-Level Security

Add row-level checks for server-side functions:

```ts
import {
  customCtx,
  customMutation,
  customQuery,
} from "convex-helpers/server/customFunctions";
import {
  Rules,
  RLSConfig,
  wrapDatabaseReader,
  wrapDatabaseWriter,
} from "convex-helpers/server/rowLevelSecurity";
import { DataModel } from "./_generated/dataModel";
import { mutation, query, QueryCtx } from "./_generated/server";

async function rlsRules(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  return {
    users: {
      read: async (_, user) => {
        if (!identity && user.age < 18) return false;
        return true;
      },
      insert: async (_, user) => true,
      modify: async (_, user) => {
        if (!identity) throw new Error("Must be authenticated to modify a user");
        return user.tokenIdentifier === identity.tokenIdentifier;
      },
    },
  } satisfies Rules<QueryCtx, DataModel>;
}

const config: RLSConfig = { defaultPolicy: "deny" };

const queryWithRLS = customQuery(
  query,
  customCtx(async (ctx) => ({
    db: wrapDatabaseReader(ctx, ctx.db, await rlsRules(ctx), config),
  })),
);

const mutationWithRLS = customMutation(
  mutation,
  customCtx(async (ctx) => ({
    db: wrapDatabaseWriter(ctx, ctx.db, await rlsRules(ctx), config),
  })),
);
```

## Zod Validation

Use Zod for argument validation (import from `convex-helpers/server/zod4` for Zod 4):

```ts
import * as z from "zod";
import { zCustomQuery, zid } from "convex-helpers/server/zod4";
import { NoOp } from "convex-helpers/server/customFunctions";

const zodQuery = zCustomQuery(query, NoOp);

export const myComplexQuery = zodQuery({
  args: {
    userId: zid("users"),
    email: z.email(),
    num: z.number().min(0),
    nullableBigint: z.nullable(z.bigint()),
    boolWithDefault: z.boolean().default(true),
    array: z.array(z.string()),
    optionalObject: z.object({ a: z.string(), b: z.number() }).optional(),
    union: z.union([z.string(), z.number()]),
    discriminatedUnion: z.discriminatedUnion("kind", [
      z.object({ kind: z.literal("a"), a: z.string() }),
      z.object({ kind: z.literal("b"), b: z.number() }),
    ]),
  },
  handler: async (ctx, args) => {
    // args validated and typed by Zod
  },
});
```

## Session Tracking

Track users via client-side sessionID storage:

**Client setup:**
```tsx
import { SessionProvider } from "convex-helpers/react/sessions";

<ConvexProvider client={convex}>
  <SessionProvider>
    <App />
  </SessionProvider>
</ConvexProvider>;
```

**Client usage:**
```ts
import { useSessionQuery } from "convex-helpers/react/sessions";

const results = useSessionQuery(api.myModule.mySessionQuery, { arg1: 1 });
```

**Server setup:**
```ts
import { customQuery } from "convex-helpers/server/customFunctions";
import { SessionIdArg } from "convex-helpers/server/sessions";

export const queryWithSession = customQuery(query, {
  args: SessionIdArg,
  input: async (ctx, { sessionId }) => {
    const anonymousUser = await getAnonUser(ctx, sessionId);
    return { ctx: { ...ctx, anonymousUser }, args: {} };
  },
});
```

## Richer useQuery

Get status information from queries:

```ts
import { makeUseQueryWithStatus } from "convex-helpers/react";
import { useQueries } from "convex/react";

export const useQueryWithStatus = makeUseQueryWithStatus(useQueries);

const { status, data, error, isSuccess, isPending, isError } =
  useQueryWithStatus(api.foo.bar, { myArg: 123 });
```

## Validator Utilities

Useful validator helpers:

```ts
import { literals, deprecated, brandedString, nullable } from "convex-helpers/validators";
import { doc, typedV, partial } from "convex-helpers/validators";
import { omit, pick } from "convex-helpers";

// Branded string for type safety
export const emailValidator = brandedString("email");
export type Email = Infer<typeof emailValidator>;

// Schema usage
export default defineSchema({
  accounts: defineTable({
    balance: nullable(v.bigint()),
    status: literals("active", "inactive"),
    email: emailValidator,
    oldField: deprecated,
  }).index("status", ["status"]),
});

// Typed validator with schema awareness
const vv = typedV(schema);

export const replaceUser = internalMutation({
  args: {
    id: vv.id("accounts"),
    replace: vv.object({
      ...schema.tables.accounts.validator.fields,
      ...partial(systemFields("accounts")),
    }),
  },
  returns: doc(schema, "accounts"),
  handler: async (ctx, args) => {
    await ctx.db.replace(args.id, args.replace);
    return await ctx.db.get(args.id);
  },
});

// Pick/omit fields
const balanceAndEmail = pick(vv.doc("accounts").fields, ["balance", "email"]);
const accountWithoutBalance = omit(vv.doc("accounts").fields, ["balance"]);

// Validate data
import { validate } from "convex-helpers/validators";
validate(balanceAndEmail, value);
validate(balanceAndEmail, value, { throw: true });
validate(vv.id("accounts"), accountId, { db: ctx.db }); // validates table
```

## Filter

Apply arbitrary TypeScript filters to database queries:

```ts
import { filter } from "convex-helpers/server/filter";

export const evens = query({
  args: {},
  handler: async (ctx) => {
    return await filter(
      ctx.db.query("counter_table"),
      (c) => c.counter % 2 === 0,
    ).collect();
  },
});
```

## Manual Pagination

### getPage Helper

```ts
import { getPage } from "convex-helpers/server/pagination";

// First page
const { page, indexKeys, hasMore } = await getPage(ctx, {
  table: "messages",
});

// Next page
const { page: page2 } = await getPage(ctx, {
  table: "messages",
  startIndexKey: indexKeys[indexKeys.length - 1],
});

// Custom page size and index
const { page } = await getPage(ctx, {
  table: "users",
  index: "by_name",
  schema,
  targetMaxRows: 1000,
});

// Fixed range
const { page } = await getPage(ctx, {
  table: "messages",
  startIndexKey,
  endIndexKey,
});
```

### paginator Helper

Drop-in replacement for `.paginate()` that can be called multiple times per query:

```ts
import { paginator } from "convex-helpers/server/pagination";
import schema from "./schema";

export const list = query({
  args: { opts: paginationOptsValidator },
  handler: async (ctx, { opts }) => {
    return await paginator(ctx.db, schema).query("messages").paginate(opts);
  },
});

// With index and order
export const list = query({
  args: { opts: paginationOptsValidator, author: v.id("users") },
  handler: async (ctx, { opts, author }) => {
    return await paginator(ctx.db, schema)
      .query("messages")
      .withIndex("by_author", (q) => q.eq("author", author))
      .order("desc")
      .paginate(opts);
  },
});
```

## Composable QueryStreams

Combine queries with UNION ALL, WHERE, and JOIN operations:

```ts
import { stream, mergedStream, MergedStream } from "convex-helpers/server/stream";

// Merge multiple streams
const authorStreams = authors.map((author) =>
  stream(ctx.db, schema)
    .query("messages")
    .withIndex("by_author", (q) => q.eq("author", author)),
);
const allAuthorsStream = mergedStream(authorStreams, ["author", "_creationTime"]);
return await allAuthorsStream.paginate(paginationOpts);

// Filter with predicate
const filtered = stream(ctx.db, schema)
  .query("messages")
  .order("desc")
  .filterWith(async (message) => {
    const author = await ctx.db.get(message.author);
    return author !== null && author.verified;
  });
return await filtered.paginate({ ...paginationOpts, maximumRowsRead: 100 });

// Join tables with flatMap
const messages = channels.flatMap(async (channel) =>
  stream(ctx.db, schema)
    .query("messages")
    .withIndex("channelId", q => q.eq("channelId", channel._id))
    .map(async (message) => ({ ...channel, ...message })),
  ["channelId", "_creationTime"]
);
```

## Query Caching

Persist subscriptions for faster reloading:

```tsx
import { ConvexQueryCacheProvider } from "convex-helpers/react/cache";
// For Next.js: import from "convex-helpers/react/cache/provider";

<ConvexClientProvider>
  <ConvexQueryCacheProvider
    expiration={300000}    // 5 minutes default
    maxIdleEntries={250}   // default
    debug={false}          // default
  >
    {children}
  </ConvexQueryCacheProvider>
</ConvexClientProvider>
```

```ts
import { useQuery } from "convex-helpers/react/cache";
// For Next.js: import from "convex-helpers/react/cache/hooks";

const users = useQuery(api.todos.getAll);
```

## Triggers

Run functions whenever data changes via `ctx.db.insert`, `ctx.db.patch`, `ctx.db.replace`, or `ctx.db.delete`:

```ts
import { mutation as rawMutation } from "./_generated/server";
import { DataModel } from "./_generated/dataModel";
import { Triggers } from "convex-helpers/server/triggers";
import { customCtx, customMutation } from "convex-helpers/server/customFunctions";

const triggers = new Triggers<DataModel>();

// Computed field
triggers.register("users", async (ctx, change) => {
  if (change.newDoc) {
    const fullName = `${change.newDoc.firstName} ${change.newDoc.lastName}`;
    if (change.newDoc.fullName !== fullName) {
      await ctx.db.patch(change.id, { fullName });
    }
  }
});

// Denormalized count
triggers.register("users", async (ctx, change) => {
  const countDoc = (await ctx.db.query("userCount").unique())!;
  if (change.operation === "insert") {
    await ctx.db.patch(countDoc._id, { count: countDoc.count + 1 });
  } else if (change.operation === "delete") {
    await ctx.db.patch(countDoc._id, { count: countDoc.count - 1 });
  }
});

// Cascading deletes
triggers.register("users", async (ctx, change) => {
  await asyncMap(
    await getManyFrom(ctx.db, "messages", "owner", change.id),
    (message) => ctx.db.delete(message._id),
  );
});

// Export wrapped mutation
export const mutation = customMutation(rawMutation, customCtx(triggers.wrapDB));
```

**Trigger semantics:**
- Runs atomically with the data change in the same transaction
- Use `ctx.innerDb` for writes without triggering more triggers
- Errors thrown from `ctx.db.insert/patch/replace/delete` that caused the trigger
- Triggers only run through wrapped mutations (use eslint rules to enforce)

## CRUD Utilities

Generate basic CRUD API for tables (recommended for prototyping or with RLS):

```ts
import { crud } from "convex-helpers/server/crud";
import schema from "./schema.js";

export const { create, read, update, destroy } = crud(schema, "users");

// Usage in action:
const user = await ctx.runQuery(internal.users.read, { id: userId });
await ctx.runMutation(internal.users.update, {
  id: userId,
  patch: { status: "inactive" },
});
```

## Hono Integration

Use Hono for HTTP endpoints:

```ts
import { Hono } from "hono";
import { HonoWithConvex, HttpRouterWithHono } from "convex-helpers/server/hono";
import { ActionCtx } from "./_generated/server";

const app: HonoWithConvex<ActionCtx> = new Hono();

app.get("/", async (c) => {
  return c.json("Hello world!");
});

export default new HttpRouterWithHono(app);
```

## CORS Support

Add CORS to httpAction routes:

```ts
import { corsRouter } from "convex-helpers/server/cors";
import { httpRouter } from "convex/server";

const http = httpRouter();
const cors = corsRouter(http, {
  allowedOrigins: ["http://localhost:8080"], // or function
  allowedMethods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
  exposedHeaders: ["Custom-Header"],
  allowCredentials: true,
  browserCacheMaxAge: 60,
  enforceAllowOrigins: true,
  debug: true,
});

cors.route({
  path: "/foo",
  method: "GET",
  handler: httpAction(async () => new Response("ok")),
});

export default http;
```

## Action Retries

Retry idempotent actions (prefer `@convex-dev/action-retrier` component):

```ts
import { makeActionRetrier } from "convex-helpers/server/retries";

export const { runWithRetries, retry } = makeActionRetrier("utils:retry");

export const myMutation = mutation({
  args: {...},
  handler: async (ctx, args) => {
    await runWithRetries(ctx, internal.myModule.myAction, { arg1: 123 });
  }
});
```

## Stateful Migrations

Run migrations with state persistence (prefer `@convex-dev/migrations` component):

```ts
import { migration } from "convex-helpers/server/migrations";

export const myMigration = migration({
  table: "users",
  migrateOne: async (ctx, doc) => {
    await ctx.db.patch(doc._id, { newField: "value" });
  },
});
```

## Rate Limiting

Configure rate limits (prefer `@convex-dev/rate-limiter` component):

See `convex-helpers/server/rateLimit.ts` for implementation details.

## CLI Utilities

### TypeScript API Generation

Generate typed API objects for external repositories:

```bash
npx convex-helpers ts-api-spec        # dev deployment
npx convex-helpers ts-api-spec --prod # production
```

### OpenAPI Spec Generation

Generate OpenAPI spec for non-JS clients:

```bash
npx convex-helpers open-api-spec        # dev deployment
npx convex-helpers open-api-spec --prod # production
```

## Standard Schema

Convert Convex validators to Standard Schema:

```ts
import { toStandardSchema } from "convex-helpers/standardSchema";

const standardValidator = toStandardSchema(
  v.object({
    name: v.string(),
    age: v.number(),
  }),
);

standardValidator["~standard"].validate({ name: "John", age: 30 });
```
