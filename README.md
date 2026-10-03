# Skills

Agent skills for Claude Code, Cursor, Codex and other agents that read `SKILL.md`.

## Install

```bash
npx skills add Sstobo/skills
```

One skill:

```bash
npx skills add Sstobo/skills --skill ship-it
```

## Skills

### Workflow
| Skill | What it does |
|---|---|
| [ship-it](skills/ship-it) | Idea → PRD → tickets → implement/verify/review loop with a file-based tracker |
| [scour](skills/scour) | Read-only codebase audit that emits verified handoff tickets |
| [okf](skills/okf) | Small markdown knowledge docs tied to the code files they describe |
| [avatar](skills/avatar) | Verified full picture of a feature, system, or decision |
| [inquisitor](skills/inquisitor) | Stress-test a plan or idea, ranked by damage |
| [check](skills/check) | Fresh-subagent review of the work just done |
| [honest](skills/honest) | Straight appraisal: keep going or start over |
| [p](skills/p) | Commit everything and push to main |

### Convex + TanStack Start
| Skill | What it does |
|---|---|
| [convex-tanstack](skills/convex-tanstack) | Wiring Convex into TanStack Start |
| [convex-tanstack-new-route](skills/convex-tanstack-new-route) | What to know before adding a Convex-backed route |
| [better-auth-convex](skills/better-auth-convex) | Better Auth on Convex + TanStack Start: setup and repair |
| [convex-ai-gateway](skills/convex-ai-gateway) | AI models from Convex actions via the Convex AI Gateway |
| [convex-helpers](skills/convex-helpers) | The convex-helpers utility library |
| [convex-resend](skills/convex-resend) | Email with the Resend Convex component |
| [convex-testing](skills/convex-testing) | Testing Convex functions with convex-test and Vitest |

### Frontend
| Skill | What it does |
|---|---|
| [base-ui](skills/base-ui) | Building with @base-ui/react |
| [stylex](skills/stylex) | Authoring styles with StyleX |

### Claude Code
| Skill | What it does |
|---|---|
| [claude-mod](skills/claude-mod) | Build, test, and debug Claude Code mods |

## License

MIT
