---
name: convex-tanstack-new-route
description: What is critical to know when adding a route that reads or writes Convex data in a TanStack Start app. Read before creating any such route.
---

# Adding a route on TanStack Start + Convex

Assumes `@convex-dev/react-query` is wired into the router: a `ConvexQueryClient`
connected to the `QueryClient`, both available as `context.queryClient` and
`context.convexQueryClient` in every route.

## Reading data

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { api } from '../../convex/_generated/api' // adjust to your layout

export const Route = createFileRoute('/things')({
  loader: ({ context }) =>
    context.queryClient.query({ ...convexQuery(api.things.list, {}), staleTime: 'static' }),
  component: Things,
})

function Things() {
  const { data } = useSuspenseQuery(convexQuery(api.things.list, {}))
  return <ul>{data.map((t) => <li key={t._id}>{t.name}</li>)}</ul>
}
```

- `convexQuery(fn, args)` is the query key and query function in one. Use the
  identical call in the loader and the component, or the cache misses.
- Returning (or awaiting) `queryClient.query({ ...convexQuery(...), staleTime: 'static' })`
  blocks the loader until data exists, so SSR renders it and there is no
  loading flash. `void queryClient.query(convexQuery(...)).catch(noop)` starts
  the fetch and lets the page render; pair it with `useQuery` and handle
  `isPending`. `queryClient.query` needs `@tanstack/react-query` 5.102.0+; on
  older versions use `ensureQueryData` / `prefetchQuery`, which still work
  but are deprecated from 5.102.0.
- After hydration the browser client resumes the subscription from where SSR
  left off. From then on Convex pushes every change.
- Convex data is never stale: `staleTime` is already `Infinity`. Do not
  refetch by hand, and do not copy `data` into local state.
- Subscriptions stay open for `gcTime` (default 5 minutes) after the last
  component unmounts, so navigating back is instant. Lower `gcTime` on a
  query if that idle activity is unwanted.
- Query depends on a value that may be missing? Keep the hook call
  unconditional and pass `"skip"` as the args:
  `useQuery(convexQuery(api.things.get, id ? { id } : 'skip'))`. `convexQuery`
  turns `"skip"` into `enabled: false`.

## Writing data

```tsx
import { useMutation } from '@tanstack/react-query'
import { useConvexMutation } from '@convex-dev/react-query'

const create = useMutation({ mutationFn: useConvexMutation(api.things.create) })
create.mutate({ name })
```

Call it from an event handler. Every open query on the affected data updates
on its own when the mutation commits. Actions use `useConvexAction` the same way.
Plain `convex/react` hooks still work alongside these when a feature needs them.

## Router rules that bite

- The `createFileRoute` path must match the file location. A file under a
  layout route inherits that layout's `beforeLoad`.
- `beforeLoad` runs first and is for redirects and adding context. `loader` is
  for data. Do not fetch in `beforeLoad`.
- Loader reads search params? `validateSearch` plus `loaderDeps`, returning
  only the fields the loader uses. Returning the whole search object reloads
  on every unrelated change.
- `useSuspenseQuery` throws to the nearest `errorComponent`. `router.invalidate()`
  re-runs loaders and resets it.
- A `pendingComponent` shows after `pendingMs` (default 1 second) while a
  loader runs on client-side navigation.

## Convex side

Nothing route-specific. A `query` or `mutation` in `convex/*.ts` with `args`
and `returns` validators, reached through `api`. If the project has
`convex/_generated/ai/guidelines.md` (written by `npx convex ai-files install`),
follow it for schema, indexes and auth inside handlers.
