# Skills

Agent skills for Claude Code and other agents that read `SKILL.md` files (Cursor, Codex, Copilot, Windsurf, Gemini CLI and others supported by the [`skills` CLI](https://github.com/vercel-labs/skills)).

A skill is a folder with a `SKILL.md`: a short description the agent reads up front, plus instructions and reference files it loads only when the task matches. Each folder here also has a `README.md` for humans.

## Install

All skills:

```bash
npx skills add Sstobo/skills
```

One skill:

```bash
npx skills add Sstobo/skills --skill ship-it
```

See what's available without installing:

```bash
npx skills add Sstobo/skills --list
```

Add `-g` to install for your user instead of the current project, and `-a claude-code` (or another agent name) to target one agent.

## Skills

### Build and review workflow

| Skill | What it does | Needs |
|---|---|---|
| [ship-it](skills/ship-it) | Idea or PRD → tickets with acceptance criteria → implement, verify and review loop that lands one commit per ticket. Tickets are markdown files in a `tickets/` folder. | git, Node 18+; subagents recommended |
| [scour](skills/scour) | Read-only audit of one area of a codebase by up to five agents armed with your convention docs. Findings are adversarially verified, then written as ship-it tickets. | parallel subagents |
| [okf](skills/okf) | A knowledge layer of small markdown docs, each declaring the code files it's about, plus a repair pass for docs that drifted. | none |
| [avatar](skills/avatar) | Researchers then challengers build a verified picture of one feature, system, bug or decision, delivered as an HTML page. | subagents recommended |
| [inquisitor](skills/inquisitor) | Interrogates a plan or decision from the outside and returns an evidence-backed verdict ranked by damage. | none |
| [check](skills/check) | A fresh subagent reviews the work done in this session and reports real problems only. | a subagent tool |
| [honest](skills/honest) | A straight appraisal of the current work, including whether to start over. | none |
| [p](skills/p) | Commits everything in the working tree as one commit and pushes. Built for solo trunk-based work; screens out secrets and junk first. | git |

### Convex and TanStack Start

| Skill | What it does |
|---|---|
| [convex-tanstack](skills/convex-tanstack) | Wiring Convex into TanStack Start with `@convex-dev/react-query`: loaders, SSR, mutations |
| [convex-tanstack-new-route](skills/convex-tanstack-new-route) | What to get right when adding one Convex-backed route |
| [better-auth-convex](skills/better-auth-convex) | Better Auth on Convex + TanStack Start: setup, repair and gotchas |
| [convex-ai-gateway](skills/convex-ai-gateway) | Calling AI models from Convex actions through the Convex AI Gateway, no provider keys |
| [convex-helpers](skills/convex-helpers) | The `convex-helpers` library: custom functions, relationships, RLS, migrations, Zod and more |
| [convex-resend](skills/convex-resend) | Email with the `@convex-dev/resend` component: sending, status, webhooks, test mode |
| [convex-testing](skills/convex-testing) | Testing Convex functions with `convex-test` and Vitest |

### Frontend

| Skill | What it does |
|---|---|
| [base-ui](skills/base-ui) | Building accessible React UI with `@base-ui/react` |
| [stylex](skills/stylex) | Writing StyleX styles and setting up its build |

### Claude Code

| Skill | What it does |
|---|---|
| [claude-mod](skills/claude-mod) | Building, testing and debugging Claude Code mods (in-process plugin hooks that can draw panes and rewrite events) |

## Agent compatibility

Every skill is plain markdown and loads anywhere `SKILL.md` is read. Some name Claude Code tools (subagents, `AskUserQuestion`) and say so where they do. `ship-it` and `avatar` describe a fallback for agents without subagents; `check` and `scour` need one. `claude-mod` is only useful in Claude Code.

## Versions

The library skills were checked against current docs and npm on 2026-10-03. Each skill's README lists the package versions it targets. Libraries move; when a skill and the official docs disagree, trust the docs.

## Credits

`convex-helpers` and `convex-resend` are original write-ups of the Apache-2.0 [convex-helpers](https://github.com/get-convex/convex-helpers) and [@convex-dev/resend](https://github.com/get-convex/resend) projects, which remain the source of truth.

## License

MIT
