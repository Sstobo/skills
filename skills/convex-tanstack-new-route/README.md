# convex-tanstack-new-route

An agent skill with the short list of things that matter when adding one route that reads or writes Convex data in a TanStack Start app. It assumes `@convex-dev/react-query` is already wired into the router (see the `convex-tanstack` skill for that).

## When to use it

- Before creating any route that reads or writes Convex data

## What it covers

- A loader + component pair that server-renders a Convex query and stays subscribed
- When to block the loader and when to let the page render first
- Mutations and actions through `useConvexMutation` / `useConvexAction`
- `"skip"` for queries whose arguments may be missing
- TanStack Router rules that cause bugs: route paths, `beforeLoad` vs `loader`, `loaderDeps`, error and pending components

## Versions it targets

Checked against npm on 2026-10-03: `@convex-dev/react-query` 0.1.0, `@tanstack/react-query` 5.104.1 (the loader example uses `queryClient.query`, which needs 5.102.0 or later), `@tanstack/react-router` 1.170.41.

## Install

```bash
npx skills add Sstobo/skills --skill convex-tanstack-new-route
```

## Example prompt

- "Add a /projects/$projectId route that shows the project and lets me rename it."

## Files

| File | What it holds |
|---|---|
| [`SKILL.md`](SKILL.md) | The route checklist with code samples |
