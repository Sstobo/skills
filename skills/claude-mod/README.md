# claude-mod

An agent skill for building Claude Code mods: plugins whose JavaScript or TypeScript hooks run inside Claude Code and can draw panes, rewrite events, add commands and guard tool calls. It is a condensed version of the [mods docs](https://code.claude.com/docs/en/plugins/mods/overview).

When you write a mod inside a Claude Code session, Claude Code's built-in `plugin-authoring` skill also applies; this skill tells the agent to load it alongside. The type declarations Claude Code writes into a mod's `.claude-plugin/types/` folder are the final word for your build when they disagree with this skill.

## Use it when

- You want a pane, a band above the prompt, or a change to the spinner or another part of Claude Code's interface
- You want a `/command` that runs your code with no Claude turn
- You want to guard, rewrite or answer tool calls or prompts
- A mod does nothing, fails `claude plugin validate`, or a test fails

## What it covers

- The 3-file layout, `register(on, options)`, and the `$` / `e` / `next` hook model (observe, rewrite, answer)
- The static-analysis rules `claude plugin validate` enforces, and the plugin-name rule
- Recipes: tool-call guard, prompt context, pane, background timer, side model call, tool for Claude
- State by lifetime: module variables, `$.state`, `$.store`
- The dev loop: validate, `--plugin-dir` hot reload, `claude plugin test`
- Reference tables: events, chain order, every mods API namespace, render sites, elements, keyboard, limits, settings, commands, the test kit and its stubs, and a troubleshooting table of messages and causes

## Versions

Written for Claude Code v2.1.287 or later, the first version with mods on by default. Checked against the mods docs on code.claude.com on 3 October 2026, and against Claude Code 2.1.288: the layout and the `/tally` example pass `claude plugin validate`, and the test-kit example passes `claude plugin test`.

## Install

```bash
npx skills add Sstobo/skills --skill claude-mod
```

## Example prompts

- "Make a mod that shows the current git branch above the prompt."
- "My mod's /standup command says no command.run hook answered it. Why?"

## Files

- [`SKILL.md`](SKILL.md): when to pick a mod, layout, hook model, validate rules, recipes, state, dev loop, where mods draw, first debugging steps.
- [`references/reference.md`](references/reference.md): full tables for events, API methods, render sites, elements, limits, settings, commands, the test kit and troubleshooting.
