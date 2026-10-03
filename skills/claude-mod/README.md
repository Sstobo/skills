# claude-mod

Build, test, debug and ship Claude Code mods: plugins whose JavaScript/TypeScript hooks run inside Claude Code. Covers the 3-file layout, the `$`/`e`/`next` hook model, every event and API method, panes and bands, state, the `claude plugin validate` / `claude plugin test` loop, and a troubleshooting table.

## Use it when

- You want a pane, a band above the prompt, or a spinner tweak
- You want a `/command` that runs code with no Claude turn
- You want to guard or rewrite tool calls or prompts

## Install

```bash
npx skills add Sstobo/skills --skill claude-mod
```

## Files

- [`SKILL.md`](SKILL.md)
- [`references/reference.md`](references/reference.md)
