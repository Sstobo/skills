---
name: convex-tanstack
description: Minimum best practices for wiring Convex into TanStack Start via @convex-dev/react-query. Use when setting up the router/QueryClient, loading Convex data in routes and loaders, choosing useSuspenseQuery vs useQuery, running mutations, SSR/consistency questions, or writing Convex functions that a TanStack app calls. Auth lives in better-auth-convex, route boilerplate in convex-tanstack-new-route, tests in convex-testing, helper libs in convex-helpers.
---

# Convex + TanStack Start: the integration seam

Source of truth: https://docs.convex.dev/client/tanstack/tanstack-start and https://docs.convex.dev/client/tanstack/tanstack-query. Fetch them when anything here looks wrong for the installed versions.

## 1. Wiring (once per project)

```bash
npm install convex @convex-dev/react-query @tanstack/react-query @tanstack/react-router-ssr-query
```

`.env.local` → `VITE_CONVEX_URL=https://<deployment>.convex.cloud` (written by `npx convex dev`).

`src/router.tsx`:

```tsx
import { createRouter } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { ConvexProvider } from "convex/react";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const convexQueryClient = new ConvexQueryClient(import.meta.env.VITE_CONVEX_URL!);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
      },
    },
  });
  convexQueryClient.connect(queryClient);

  const router = createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: "intent",
    scrollRestoration: true,
    Wrap: ({ children }) => (
      <ConvexProvider client={convexQueryClient.convexClient}>{children}</ConvexProvider>
    ),
  });
  setupRouterSsrQueryIntegration({ router, queryClient });
  return router;
}
```

`src/routes/__root.tsx` (double underscore) declares the context: `createRootRouteWithContext<{ queryClient: QueryClient }>()`.

With auth, `ConvexProvider` is replaced by the Better Auth provider. See `better-auth-convex`.

## 2. Reading data

Convex queries are subscriptions. React Query is only the cache and the SSR bridge.

```tsx
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { api } from "../../convex/_generated/api";

// Page data: SSR'd, no loading branch, updates live.
const { data } = useSuspenseQuery(convexQuery(api.tasks.list, {}));

// Optional / secondary data: not SSR'd, handle isPending.
const { data, isPending } = useQuery(convexQuery(api.tasks.list, {}));

// Conditional: never call a hook conditionally, pass "skip" instead.
useQuery(convexQuery(api.users.get, userId ? { userId } : "skip"));
```

Rules:
- `useSuspenseQuery` for anything the page needs to render. It runs during the SSR pass.
- `useQuery` for data that can arrive late without a layout jump.
- Do not set `staleTime`, `refetch*`, `retry`, or call `invalidateQueries`. Convex data is never stale and updates arrive over the WebSocket. Those options are ignored.
- `gcTime` is the only knob that matters: it is how long a subscription stays open after the last component unmounts (default 5 min). Lower it per query if you see subscriptions lingering.
- Spread `convexQuery(...)` to add React Query options: `{ ...convexQuery(api.x.y, args), gcTime: 10_000 }`.
- Pagination: use `usePaginatedQuery` from `convex/react` directly. It is not wrapped by react-query.

## 3. Loaders

Loaders run on the server for the first page load and on the client for later navigations. They exist to start fetching before render, not to replace hooks. The component still calls `useSuspenseQuery` with the same `convexQuery` so it stays subscribed.

```tsx
export const Route = createFileRoute("/tasks")({
  loader: async ({ context }) => {
    // Block render until data is ready (best for the primary query).
    await context.queryClient.ensureQueryData(convexQuery(api.tasks.list, {}));
    // Warm the cache without blocking (secondary data). No await.
    context.queryClient.prefetchQuery(convexQuery(api.tasks.stats, {}));
  },
  component: Tasks,
});
```

For queries that depend on search params, declare `loaderDeps: ({ search }) => ({ page: search.page })` so the loader reruns when they change.

Consistency: within one SSR pass Convex evaluates all queries at the same timestamp, so a page never mixes two database states.

## 4. Writing data

```tsx
import { useMutation } from "@tanstack/react-query";
import { useConvexMutation, useConvexAction } from "@convex-dev/react-query";

const { mutate, isPending } = useMutation({ mutationFn: useConvexMutation(api.tasks.create) });
const { mutate: run } = useMutation({ mutationFn: useConvexAction(api.ai.summarize) });
```

No invalidation after a mutation. Every subscribed query updates on its own.

For one-off reads with no subscription (a server function, an action), use `convexQueryClient.convexClient.query(api.x.y, args)` on the client or `ConvexHttpClient` from `convex/browser` on the server.

## 5. Convex functions the app calls

Every public function:

```ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { ownerId: v.id("users") },
  returns: v.array(v.object({ _id: v.id("tasks"), text: v.string() })),
  handler: async (ctx, { ownerId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    return ctx.db.query("tasks").withIndex("by_owner", (q) => q.eq("ownerId", ownerId)).collect();
  },
});
```

- Validate `args` and `returns` on every public function. Anyone can call them.
- Check auth and ownership inside the handler, not on the client.
- `withIndex`, never `.filter`, on the database query. Add the index in `schema.ts`.
- `.collect()` only when the result set is small and bounded. Otherwise paginate or `.take(n)`.
- Business logic in plain helper functions; `query`/`mutation` wrappers stay thin.
- Anything scheduled or called from an action uses `internal.*`, never `api.*`.
- Actions: no `ctx.db`. Prefer one `runMutation` that does all writes; each `runQuery`/`runMutation` is its own transaction.
- Await every promise. Turn on `@typescript-eslint/no-floating-promises`.

## 6. Gotchas

- `createServerFn().inputValidator(fn).handler(...)`, not `.validator()`.
- A query that fires before auth is set will error, not wait. Gate it with `"skip"` or the auth boundary from `better-auth-convex`.
- Hot reload can leak subscriptions in dev. Harmless; it goes away on a full reload.
- `@convex-dev/react-query` peers on `convex ^1.29` and `@tanstack/react-query ^5`. Check `package.json` before assuming an API exists.
