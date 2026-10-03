# convex-helpers

An agent skill for the [`convex-helpers`](https://www.npmjs.com/package/convex-helpers) npm package, the utility library maintained by the Convex team that sits next to the official `convex` package.

## When to use it

- Writing custom `query` / `mutation` / `action` builders that add auth, a user, or a wrapped `db` to `ctx`
- Looking up related documents (one-to-one, one-to-many, many-to-many through a join table)
- Adding row-level security, Zod-validated arguments, or triggers
- Paginating in ways `.paginate()` can't: several paginations per query, unions of indexes, joins, or filters
- Adding CORS or Hono to HTTP actions, or caching query subscriptions in React

## What it covers

An import-path map, then: custom functions, relationships, row-level security, Zod (v3 and v4 entry points), triggers, CRUD scaffolding, validator utilities, `filter`, `getPage` / `paginator`, query streams, the React query cache, `useQueryWithStatus`, sessions, CORS, Hono, the `ts-api-spec` and `open-api-spec` CLI commands, and Standard Schema. It also says which helpers have been superseded by Convex components (rate limiter, action retrier, migrations).

The content is written for this skill. Examples and API details were checked against the source shipped in the npm package. Upstream docs: https://github.com/get-convex/convex-helpers/tree/main/packages/convex-helpers (Apache-2.0).

## Versions it targets

- `convex-helpers` 0.1.126 (latest on npm as of 2026-10-03), which peers on `convex ^1.46.0`
- Zod `^3.25.0 || ^4.0.0` for the Zod helpers

## Install

```bash
npx skills add Sstobo/skills --skill convex-helpers
```

## Example prompts

- "Make an `authedMutation` builder that loads the current user into ctx."
- "Paginate messages from all the channels a user belongs to, newest first."
- "Add a trigger that keeps a post count on each user."

## Files

- [`SKILL.md`](SKILL.md): the whole reference, organized by helper, with the import map at the top
