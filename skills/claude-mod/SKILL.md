---
name: claude-mod
description: Build, debug, test, and ship Claude Code mods (plugins whose JS/TS function hooks run inside Claude Code). Covers the 3-file layout, register(on), the $/e/next hook model, events (tool.call, tool.check, prompt.submit, turn.*, session.*, command.run, ui.render), the mods API ($.ui, $.command, $.tool, $.model, $.store, $.state, $.clock, $.fs, $.process, $.http), panes/bands/elements, claude plugin validate/test, and troubleshooting. Use when the user says "mod", "claude mod", "make a mod", "hooks module", "register.js", "ui.render", "pane", "AbovePrompt", "$.ui", "claude plugin validate", "claude plugin test", or wants a pane, band, spinner tweak, custom /command, or tool-call guard inside Claude Code.
metadata:
  tags: claude-code, mods, plugins, hooks, tui
---

# Claude Code mods

A mod is a plugin whose JS/TS code runs **inside** Claude Code (v2.1.287+). Claude Code fires an event, your hook runs first, and decides: observe, rewrite, or answer.

Pick a mod only when you need to draw UI, rewrite an event, add a no-turn `/command`, or share state between hooks. Block/log with a script → settings hook. Instructions → skill. External system → MCP.

The built-in `plugin-authoring` skill knows the exact API for the running build and handles the `~/.claude/dev-mods/<session>/` hot-reload flow. Load it alongside this one when writing a mod in-session. **The generated `.claude-plugin/types/claude-code/index.d.ts` beats this skill and the docs when they disagree.**

Full tables (events, methods, render sites, elements, limits, test stubs, errors): [references/reference.md](references/reference.md).

## Layout (3 files)

```text
my-mod/
├── .claude-plugin/plugin.json   # {"name","version","description","author":{"name"}}
└── hooks/
    ├── hooks.json               # {"modules": ["./register.js"]}  ← this key makes it a mod
    └── register.js              # export function register(on, options) { ... }
```

- Plugin `name` must not start with `claude-` (validate rejects Anthropic-looking names).
- No build step. `.js .mjs .cjs .ts .mts .cts .jsx .tsx`, ES modules only.
- `options` = the manifest's `userConfig` values with defaults.

## The hook model

```js
let calls = 0                                   // module vars are shared by all hooks; reset on reload

export function register(on) {
  on('session.start', async ($, e, next) => {   // once per load/reload, before first prompt
    await $.command.register({ name: 'tally', description: 'Show tool call count' })
    return next(e)
  })
  on('tool.call', async ($, e, next) => {       // OBSERVE: work, then pass on
    calls += 1
    $.ui.invalidate('ui.render')
    return next(e)
  })
  on('command.run', { command: 'tally' }, async () => {   // ANSWER: no next()
    return { text: `Claude has made ${calls} tool calls` }
  })
  on('ui.render', { component: 'Spinner' }, async ($, e, next) =>   // REWRITE: next(copy)
    next({ ...e, props: { ...e.props, suffix: ` · tool calls: ${calls}…` } }))
}
```

- `$` mods API, `e` frozen event (copy to change), `next(e)` rest of chain → Claude Code. `await next(e)` to act after.
- Matcher (2nd arg): value, array, or regex per field. `'*'` / `'classic.*'` wildcards.
- One un-matched `on()` per event, or load fails (`registered twice without a matcher`). Merge into one hook.
- `on(...).catch(handler)` makes a guard fail closed (`next.error.kind` = `throw|timeout`). Without it, a failing hook is skipped and the call proceeds.
- `turn.step` and `process.spawn` hooks are `async function*`; use `const r = yield* next(e)`.

## Static-analysis rules (validate fails otherwise)

- Write every call in full: `$.store.get(...)`. Never `const ui = $.ui`, destructure `$`, or computed index. Passing `$` to a **top-level** function is fine.
- Event names are string literals. No loops over names.
- Don't shadow `on` inside `register`.
- Imports: relative files in the plugin, plus bare `claude-code`. No `require`, no dynamic `import()`.
- No Node APIs, no `setTimeout`/`setInterval`. Use `$.clock.after/every`, `$.fs`, `$.process`, `$.http`.

## Common recipes

**Guard a tool call**
```js
on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
  if (/git push .*--force/.test(e.command)) return { deny: 'No force pushes. Push a new branch.' }
  return next(e)
})
```
`deny` text is what Claude reads, so write it as an instruction. Hold for the user with `await $.ui.ask(question, ['Run it','Refuse'])` in a try/catch defaulting to refuse (it rejects on dismiss and in `claude -p`). Approve/refuse based on live state with `tool.check` (`next(e)` → `allow|ask|deny`; return `{ decision, reason }`).

**Add context to prompts**: `prompt.submit` → `next({ ...e, context: [...(e.context ?? []), 'Current branch: x'] })`. `{ drop: reason }` stops it.

**Open a pane**: register a command, then `await $.ui.open({ id, title, focus: true, closeOnEscape: true }); return {}`. Draw it:
```js
on('ui.render', { component: 'Pane' }, async ($, e, next) => {
  if (e.requestId !== 'my-pane') return next(e)
  const { Box, Text, Button } = $.ui.resolve(e)
  return Box({ flexDirection: 'column', children: [
    Text({ children: ['Count: ' + count] }),
    Button({ key: 'more', label: 'Add one', hotkey: 'a', onPress: () => { count++; $.ui.invalidate('ui.render') } }),
  ]})
})
```
Band above the prompt: `{ component: 'AbovePrompt' }`, return a tree or `next(e)` for nothing. `focus`/`closeOnEscape`/`holdToasts`/`autoFocus` accept only `true`: omit, never pass `false`.

**Background**: start `$.clock.every(ms, fn)` in `session.start`; show with `$.ui.status` (line under prompt), `$.ui.toast`, `$.ui.log` (dim transcript line Claude doesn't read). Start a turn with `$.prompt.submit({ text })` (don't await it mid-turn).

**Side model call**: `$.model.complete({ model: 'haiku', system, prompt, maxTokens })`; check `r.isAnswered` before `r.text`.

**Tool for Claude**: `$.tool.register({ name: 'ticket', description, inputSchema })` in `session.start`; handle with `tool.call` matched on `mcp__<plugin>__ticket`, return `{ result }`.

## State: pick by lifetime

| Where | Lasts until | Notes |
|---|---|---|
| module `let` | next reload (every save in dev) | needs `$.ui.invalidate('ui.render')` |
| `$.state` (`atom/read/update` from `claude-code`) | session end, `/clear`, `/resume`, `/branch` | auto-redraws readers; declare in `types/index.d.ts` `PluginState` + manifest `"types"`; can't write inside `ui.render` |
| `$.store` | deleted, or cleanupPeriodDays idle | JSON, 4 MiB, shared by all sessions on the machine. Not atomic: re-`get` right before `set` |

After `/clear`/`/resume`/`/branch`, `session.start` does **not** re-fire. Reload `$.store` into `$.state` from `on('classic.SessionStart', { source: ['clear','resume','fork'] }, ...)` too.

## Dev loop

1. `claude plugin validate ./my-mod` → check the `hooks:` and `calls:` lines list what you meant.
2. `claude --plugin-dir ./my-mod` → hot-reloads on save (transcript line per reload; broken save keeps last good version).
3. Quick non-interactive check: `claude -p "/cmd" --plugin-dir ./my-mod`.
4. `claude plugin test` in the mod dir → runs `*.test.ts`. See reference for the test kit.
5. Iterate on the dir, not an installed copy (installed plugins are cached by version).

Keep a session-written mod: copy it out of `~/.claude/dev-mods/<session>/` before cleanup, then `--plugin-dir` it or publish to a marketplace. Note the tested Claude Code version in the README.

## Where it draws

Hooks run everywhere the plugin loads. Drawing shows only in the terminal CLI and the Desktop Code tab (not VS Code chat panel, `-p`, SDK, cloud, WSL). Branch on `e.surface` (`terminal|desktop`). `Raster`/`Image` terminal-only, `Svg` desktop-only. An invalid tree makes Claude Code draw its own version silently; the reason is in the transcript (`--plugin-dir`) or debug log.

## When it does nothing

`claude plugin validate` first, then `claude --debug-file ./mod.log --plugin-dir ./my-mod` and `grep my-mod mod.log`. Look for `not loaded:`, `hook skipped:`, `refused:`. Full symptom table in the reference.
