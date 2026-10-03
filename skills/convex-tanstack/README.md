# convex-tanstack

An agent skill with the minimum set of practices for using Convex in a TanStack Start app through `@convex-dev/react-query`: router and `QueryClient` wiring, reading data with `useSuspenseQuery` / `useQuery`, loaders, mutations, and rules for the Convex functions the app calls. Based on the Convex docs pages for [TanStack Start](https://docs.convex.dev/client/tanstack/tanstack-start) and [TanStack Query](https://docs.convex.dev/client/tanstack/tanstack-query).

## When to use it

- Starting a Convex + TanStack Start project
- Deciding between `useSuspenseQuery` and `useQuery`, or how to load Convex data in a route loader
- Reviewing how an existing app fetches and writes Convex data

Related skills in this repo: `better-auth-convex` (auth), `convex-tanstack-new-route` (adding a single route), `convex-testing` (tests), `convex-helpers` (helper libraries).

## Versions it targets

Checked against npm on 2026-10-03:

| Package | Version | Notes |
|---|---|---|
| `@convex-dev/react-query` | 0.1.0 | peer `convex ^1.29.3`, `@tanstack/react-query ^5.0.0` |
| `@tanstack/react-query` | 5.x | the loader examples use `queryClient.query`, which needs 5.102.0 or later |
| `@tanstack/react-start` | 1.168.60 | |
| `@tanstack/react-router-ssr-query` | 1.167.3 | |

## Install

```bash
npx skills add Sstobo/skills --skill convex-tanstack
```

## Example prompts

- "Wire Convex into this TanStack Start app."
- "This page flashes a loading state on first load. Make it server-render the Convex data."

## Files

| File | What it holds |
|---|---|
| [`SKILL.md`](SKILL.md) | Wiring, reading, loaders, writing, Convex function rules and gotchas |
