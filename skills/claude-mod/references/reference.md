# Mods reference (as of Claude Code v2.1.287)

Source of truth for your build: `<mod>/.claude-plugin/types/claude-code/index.d.ts` (written on each load from `--plugin-dir`). Online copy: github.com/anthropics/claude-code/blob/main/mods/types/claude-code.d.ts. Docs: code.claude.com/docs/en/plugins/mods/overview.

Sample mods: github.com/anthropics/claude-code-playground/tree/main/claude-code/mods (token-weather, blast-radius, replay-theater). Built-in mod source: github.com/anthropics/claude-code/tree/main/mods (diff, agents-md, sec-default, telemetry).

## Hook arguments

| Arg | Meaning |
|---|---|
| `$` | mods API |
| `e` | event input, deeply frozen |
| `next(e)` | rest of chain, resolves to result |
| `next.signal` | AbortSignal, aborts when event abandoned (user interrupt) |
| `next.origin` | `{ plugin, tier }` of the firer; Claude Code is `{ plugin:'engine', tier:'core' }` |
| `next.budget` | `{ ms, remainingMs }` |
| `next.to(e, tier)` | skip to `append|builtin|core`; only prepend/append mods |
| `next.error`, `next.called` | in `.catch` only |

## Events

Shorthand: `next(e)` pass through, `next({...e, x})` rewrite, object = answer.

**Tools**
| Event | Fires | Return |
|---|---|---|
| `tool.call` | tool about to run (incl. subagents, MCP). Args are fields of `e` (`e.command`, `e.file_path`) | `next(e)`, `{deny}`, `{result}`. After-next result may have `deny` or `isError` |
| `tool.check` | permission decision, after rules + PreToolUse. `e.input` holds args | `{ decision: 'allow'|'ask'|'deny', reason }` |
| `tool.describe` | tool description first sent | `{ description, isDeferred? }` |

**Prompts / what Claude reads**
| Event | Return |
|---|---|
| `prompt.submit` | `next({...e, text})`, `next({...e, context:[...]})`, `{drop}` |
| `prompt.fill`, `prompt.suggest` | `next(e)` with changed text |
| `prompt.edit` | `next(e)` |
| `prompt.compose` | `{ sections: [{id,text,scope}] }` |
| `prompt.section` (`e.name`) | `{text}` or `{text:null}` |
| `prompt.context` (first message) | `{blocks}` |
| `prompt.attachment` (reminders; `e.type`, `e.detail`) | `{text}` / `{text:null}` |
| `skill.prompt` | `{text}` |
| `attribution.text` | `{text}` |

Changing these per-request busts the prompt cache.

**Commands / config**: `command.run` → `{text}` / `{}` / `next(e)` (`e.args` = text after name). `command.describe` → `{description, argumentHint, isHidden}`. `config.set` → `next({...e,value})` / `{deny}`. `config.describe` → `{label, description, isHidden}`.

**Turns**
| Event | Notes |
|---|---|
| `turn.start` | `e.turnId` |
| `turn.step` | one model request; generator. `next({...e, model})`, `next({...e, effort})`. `result.usage` = `input_tokens, output_tokens, cache_read_input_tokens, cache_creation_input_tokens, model`. `e.agentId` set for subagents |
| `turn.complete` | `e.answer, e.durationMs, e.usage, e.isAborted, e.agentId`. Return `{text}` for a line under the answer |

**Session**
| Event | Notes |
|---|---|
| `session.start` | per load/reload. Not after `/clear` `/resume` `/branch` |
| `session.end` | `e.reason`: `clear|resume|logout|prompt_input_exit|other` (`/branch` = resume). All hooks share 1.5s |
| `session.compact` | `{skip}` |
| `session.receive` | `e.text`, `e.origin.kind` (`peer`, `peer-send-message`, `task-notification`, `scheduled-trigger`). `{consumed}` hides from Claude. Sender name is untrusted |
| `session.send` | `e.to`, `e.text`, `e.origin.kind` (`model|plugin`). `{isDelivered:false, reason}` |
| `session.append` | each stored row; `next({...e, message})` |
| `session.attach` / `detach` / `measure` | observe |

**Subagents**: `agent.offer` → `{isOffered:false}`. `agent.spawn` → `{model}` / `{deny}`.

**Interface**: `ui.render`, `ui.resolve`, `ui.press`, `ui.input`, `ui.select` (fire before the control's callback; other mods can intercept), `ui.focus`, `ui.scroll`, `ui.close` (`e.id`, `e.origin.kind` `plugin|person|unload`), `ui.message` (from a `Client` element).

**Other mods**: `plugin.register` (`e.uses` = what validate prints) → `{refuse}`. `engine.create` → modified mods API.

**Telemetry**: `telemetry.log`, `telemetry.mark`. User mods must use filter `{ to: 'collector' }`. `*` doesn't match them.

**Settings hook events**: `classic.<Event>` (e.g. `classic.Stop`, `classic.SessionStart` with `e.source`), `e` = stdin JSON incl. `transcript_path`.

**Mods API calls as events**: every method, e.g. `fs.read`, `model.complete`, `ui.open`. Earlier mods can `{deny}` / `{value}` later mods' calls.

## Chain order

1. `sec-default@builtin` (where it loads), managed `prependPlugins`, other org mods not in `appendPlugins`
2. user-installed mods (a mod runs before its `dependencies`)
3. managed `appendPlugins`
4. other built-in mods

Within a module: registration order. Managed `PreToolUse` hooks run before any `tool.call` hook (block is final). Other `PreToolUse` hooks run after the last mod's `next` (answering without `next` skips them). `tool.check` runs after all of that.

## Mods API

| NS | Methods |
|---|---|
| `$.plugin` | `name`, `root` |
| `$.ui` | `resolve, invalidate, open, close, panes, focus, scroll, toast, status, log, notice, ask, copy, blit` |
| `$.command` | `register({name, description, argumentHint, immediate}), run, list` |
| `$.tool` | `register({name, description, inputSchema}), call, check, list` |
| `$.agent` | `register, spawn, list` |
| `$.model` | `complete({model, system, prompt, maxTokens, timeoutMs, effort})`, `fork({prompt})` (over current convo, cache-friendly), `classify` |
| `$.prompt` | `submit({text, asUser?}), read, fill, suggest, compose` |
| `$.turn` | `abort` |
| `$.session` | `messages()` (`{role,text,toolUses}`, newest 4096), `cwd, root, model, turns, id, repo, surfaces, version, compact, send({to,text}), append, authorize`, `usage()` → `{startedAt, context:{tokens,window,percent}, rateLimits:[{kind,percentUsed,resetsAt}], cost}` |
| `$.config` | `list, set` |
| `$.settings` | `read` |
| `$.env` | `get, set` (literal names) |
| `$.fs` | `read, write (not atomic), list (one level, {name,kind,size,isLink}), exists, stat, ancestors`. Relative to session cwd |
| `$.store` | `get, set, delete, keys` |
| `$.state` | `get, set`; helpers `atom, read, update, derive, memberOf` from `claude-code` |
| `$.clock` | `now, sleep, after(ms,fn), every(ms,fn)` → `.cancel()`; stop on reload |
| `$.http` | `fetch(url, init)` → `{status, ok, headers, text}` |
| `$.process` | `run(argv)` → `{exitCode, stdout, stderr}` (no shell, rejects on start fail/timeout), `spawn` (streams) |
| `$.mcp` | `call`, `connect(server)` (own manifest's servers) |
| `$.audio` | `play, speak` |
| `$.telemetry` | `log, mark` |

`$.ui.open` fields: `id, title, focus, closeOnEscape, holdToasts, rows, columns`. Resolves `{isPlaced, reason}`. Self-opened panes (timer, turn.start) need 144 cols (110 after user opened once). User-triggered opens place at any width.

`$.ui.log(text, { to: 'debug' })` writes to the debug log instead of the transcript.

`$.command.register` throws on a built-in name; register last in `session.start` or try/catch.

## $.state setup

```ts
// types/index.d.ts  (manifest: "types": "./types/index.d.ts")
declare module 'claude-code' {
  interface PluginState { 'my-mod': { count: number } }
}
```
```js
import { atom, read, update } from 'claude-code'
const count = atom({ plugin: 'my-mod', key: 'count' }, 0)   // literals only
const n = await read($, count)                               // in ui.render (subscribes)
onPress: () => update($, count, v => v + 1)                  // in callbacks / other hooks
```

## Render sites (`e.component`)

| Site | `e.props` | `e.requestId` | Surface |
|---|---|---|---|
| `Pane` | `title, isFocused, bodyColumns, placement ('dock'|'inline'), scroll{offset,bodyRows}, view` | pane id | T, D |
| `AbovePrompt` | `hasSurvey, isWorking, maxRows, bodyColumns, scroll, view` | one | T, D |
| `UserMessage` | `text, origin, isExpanded, task/from` | msg id | T, D |
| `AssistantMessage` | reply text | msg id | T, D |
| `ToolUse`, `ToolResult`, `ToolGroup` | tool name/input/result | call id | T, D |
| `CommandOutput` | `command, text` | msg id | T, D |
| `AskUserQuestion` | question/options. Tree must include the `next` ref exactly once, yours above it | call id | T, D |
| `ToolProgress` | `kind` | call id | T |
| `Spinner` | `word, message, suffix, mode` | agent id | T, D |
| `TurnDuration` | `word, durationMs` | msg id | T |
| `InfoNotice` | `text, command` | msg id | T |
| `SessionMode` | `modes` | one | T, D |
| `PromptHint` | `isDraft, isWorking, hint` | one | T, D |

Permission prompt is not a site and can't be changed. At Claude-drawn sites `next(e)` returns `{ type:'engine', ref }`; place it in a `Box` to wrap. `e.viewport` = `{columns, rows, isFullscreen}` (whole window, may be absent). Width: draw to `e.props.bodyColumns`.

## Elements (`$.ui.resolve(e)`)

| Element | Props | T | D |
|---|---|---|---|
| `Box` | `key`, flex, `gap/columnGap`, `padding(X)`, `margin`, `width`, `height`, `borderStyle`, `backgroundColor`, `position`, `hover` | ✓ | ✓ |
| `Text` | `color, backgroundColor, bold, italic, underline, strikethrough, dimColor, inverse, wrap ('wrap'|'truncate'|'truncate-start|middle|end')`, children | ✓ | ✓ |
| `Button` | `key, label, onPress, hotkey (1 digit/lowercase), plain, dimColor, autoFocus, action (keybinding name)` | ✓ | ✓ |
| `Link` | `href, label` | ✓ | ✓ |
| `Code` | `source, language` or `path`, `startLine`, `format:'diff'` (≤10k chars) | ✓ | ✓ |
| `Markdown` | `text` (not children, ≤10k), `key` (needed with `onLinkPress`), `dimColor`, `pressableLinks` | ✓ | ✓ |
| `Input` | `key, label, placeholder, value, submitLabel, onSubmit, onInput, autoFocus` | ✓ | ✓ |
| `Select` | `key, label, options [{value,label}] (≥1, unique), value, onSelect, autoFocus` | ✓ | ✓ |
| `Svg` | `source` (≤131,072 chars), `alt, width, height` | | ✓ |
| `Client` | `module, key`; second file, no mods API, posts `ui.message` | ✓ | ✓ |
| `Raster` | `key, columns ≤512, rows ≤256, cells` (base64 Uint32 triples: codepoint, fg RGB, bg RGB; `0x01000000` = default). Animate with `$.ui.blit({requestId,key,columns,rows,cells})` | ✓ | |
| `Image` | PNG/RGBA ≤2 MiB or path | ✓ | |

Raster packer:
```js
const DEFAULT = 0x01000000
const cellsOf = rows => new Uint8Array(Uint32Array.from(
  rows.flat().flatMap(([ch, c]) => [ch.codePointAt(0), c, DEFAULT])).buffer).toBase64()
```

Unknown element/prop/child → tree rejected, Claude Code draws its own. Children in `children` arrays; strings allowed. JSX works in `.tsx/.jsx`.

## Keyboard

Keys only reach your controls while the pane/band has focus (except a digit hotkey on a band button typed into an empty prompt). Focus via `focus:true` from a command/press (granted only if prompt empty), Ctrl+X Tab, or click.

Tab next control · Up/Down move or scroll · Enter press/submit/pick · hotkey presses (all printable keys go to a focused Input) · PgUp/PgDn/Home/End scroll · Ctrl+X arrow resize · Ctrl+X X close · Esc back to prompt (closes with `closeOnEscape`). Tab/arrows can't be rebound, so games use wasd. Bracketed buttons don't show the hotkey in the terminal: name it in the label or use `plain`. Duplicate hotkeys: later wins.

## Limits

| | |
|---|---|
| hook own exec time (excl. `next` and API calls except `$.clock.sleep`) | 10s (then skipped; a held tool call would run) |
| `.catch` handler | 1s |
| all `session.end` hooks | 1.5s |
| `$.process.run` | 30s default, 10 min max |
| `$.model.complete maxTokens` | 1024 default, ≤64k |
| `$.fs.read/write` | 4 MiB |
| Text string child | 10k chars |
| `$.store` | 4 MiB total |
| redraws | 10/s (30/s terminal for visible pane, expanded band, prompt hint), coalesced |
| toast | 4s unless `{timeoutMs}` |
| names (command/tool/agent/pane) | `[A-Za-z0-9_-]`, ≤64 |
| `claude plugin test` per test | 5s unless `timeoutMs` |

## Settings / env

| Name | Effect |
|---|---|
| `CLAUDE_CODE_PLUGIN_DIRS` | like `--plugin-dir`, `:`-separated abs paths |
| `CLAUDE_CODE_PLUGIN_DIR_WATCH=1` | hot reload in long-running non-interactive sessions |
| `prependPlugins` / `appendPlugins` | managed (or user if no managed + no Team/Enterprise) ordering |
| `allowManagedModsOnly` | sec-default option: only org + built-in mods |
| `allowModsToOverrideDenyRules` | sec-default option |
| `allowManagedHooksOnly` | blocks non-org hooks and mods |
| `disableAllHooks` | stops user mods (in managed: all installed) |
| `disableSideloadFlags` | rejects `--plugin-dir`/`--plugin-url` |
| `pluginConfigs` | `userConfig` values keyed `name@marketplace` or `name@inline` |
| `--safe-mode`, `--bare` | no installed mods |

Remove legacy `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS` (ignored).

## Commands

- `/plugin` → `N mods active · names` line; Installed tab lists built-ins.
- `claude plugin validate <dir> [--strict] [--json]` → `hooks:`, `calls:`, `env reads/writes:`, `state reads/writes:`.
- `claude plugin test [dir]` → runs `*.test.ts(x)`, exit 1 on failure. Run outside a mod dir to check if mods can load.
- `claude --plugin-dir <dir>` (repeatable), `/reload-plugins`.
- Install: `/plugin install name@marketplace` or `claude plugin install name@marketplace`.

## Test kit (`claude-code/testing`)

```ts
import { expect, mock, test, tier } from 'claude-code/testing'

test('/tally counts', async ($, on) => {
  on('tool.call', () => ({ result: 'ok' }))          // stubs BEFORE first $ call
  await $.tool.call({ tool: 'Bash', command: 'ls' })
  const a = await $.command.run({ command: 'tally', args: '' })
  expect(a.text).toBe('Claude has made 1 tool calls')
})
```

- Test `$` acts as Claude Code: each method fires that event through your hooks. `on` registers stubs.
- Every file needs ≥1 `test()`. Module freshly loaded per test; `session.start` not fired, do it yourself with `$.session.start({ surface:'terminal', isInteractive:true, cwd:'/work' })` + stubs for `session.start` and `command.register`.
- API-call stubs return `{ value }` or `{ deny }`. Event stubs return the event's result shape.
- Errors: `returned neither { value } nor { deny }` (bare value), `no implementation for X` (missing stub). Skipped hooks show under `the engine reported:` only if a check fails.
- Hook returning `next(e)` in `ui.render` needs `on('ui.render', () => ({ type:'Text', props:{}, children:['x'] }))`.
- Mocks: `mock.clock(on, {now})` → `advance(ms)`, `set`, `now()`, `settle()`, `sleep` (in stubs). `mock.store(on, {k:v})`, `mock.env(on, {K:'v'})`.
- Auto-answered: `$.ui.invalidate`, `$.state`.
- Matchers: `toBe, toEqual, toMatch, toMatchObject, toContain, toBeDefined, toBeUndefined, toThrow`, `.not`.

Common stubs:
| Call | Stub |
|---|---|
| `command.register`, `tool.register`, `ui.toast/log/status/close`, `store.set` | `() => ({ value: undefined })` |
| `store.get` | `($, e) => ({ value: saved.get(e.key) })` |
| `fs.read` | `($, e) => ({ value: e.path.endsWith('x.md') ? '...' : '' })` (abs paths) |
| `ui.open` | `() => ({ value: { isPlaced: true } })` |
| `ui.ask` | a `tool.call` stub: `($, e) => ({ result: { answers: { [e.questions[0].question]: 'Run it' } } })` |
| `model.complete` | `() => ({ value: { isAnswered: true, text, usage: {input_tokens:0,output_tokens:0,cache_read_input_tokens:0,cache_creation_input_tokens:0} } })` |
| `process.run` | `($, e) => ({ value: { exitCode: 0, stdout, stderr: '' } })` (`e.argv`, `e.init`) |
| `session.start` | `() => ({ cwd: '/work' })` |
| `turn.start` | `($, e) => ({ turnId: e.turnId })` |
| `turn.complete` | `() => ({ text: '' })` |
| `prompt.submit` | `($, e) => ({ text: e.text })` |
| `prompt.fill` | `() => ({ isFilled: true })` |
| `prompt.read` | `() => ({ value: { text, cursor: 0 } })` |
| `session.messages` | `() => ({ value: [...] })` |
| `session.send` | `() => ({ isDelivered: true })` (`e.to` is a string) |
| `session.receive` | `($, e) => ({ text: e.text })` |
| `classic.SessionStart` | `() => ({})`; fire with `$.classic.SessionStart({ source: 'clear' })` |
| anything that should fail | `() => ({ deny: 'reason' })` |

`turn.step` stub is `async function*` yielding `{kind:'text', index, text}` and returning `{turnId, index, answer, toolUses:[], stopReason:'end_turn', usage:null}`; drain with `stream.next()` until `done`.

Drawing tests:
```ts
const ui = await $.ui.mount({ plugin:'my-mod', component:'Pane', requestId:'my-pane', surface:'terminal',
  viewport:{columns:100,rows:30},
  props:{ title:'x', isFocused:true, bodyColumns:60, placement:'inline', scroll:{offset:0,bodyRows:10}, view:{} } })
await ui.press({ key: 'more' })
await ui.input({ key: 'note', text: 'hi' })          // kind:'change' to not submit
await ui.select({ key: 'size', value: 'lg' })
expect(await ui.find({ type: 'Text', text: /^Count: \d+$/ })).toBeDefined()
await ui.unmount()
```
Loop `surface` over `['terminal','desktop']` to cover both. Checks tree validity, not paint.

Policy mods: `tier('prepend')` at file top; `test(name, { plugins: [{ name, register(on){...}, tier? }] }, fn)`. A refusal throws on the first `$` call: `runner: refused by my-guard: reason`.

## Troubleshooting

| Symptom / message | Cause → fix |
|---|---|
| validate shows no `hooks:` line | `hooks.json` missing `modules` |
| `"tool.calls" is not an event` | typo |
| `$.ui is used as a value` | aliased `$` namespace |
| `the event name passed to on() is not a string literal` | variable/loop |
| `"on" is declared again (shadowed)` | rename |
| `/plugin` doesn't list mod | didn't load; debug log `hooks module <name> not loaded: <reason>` |
| `disableAllHooks in managed settings` / `only managed plugins...` / `(--bare)` / `another plugin of that name loads first` / `turned off ... in this process` | policy, flag, name clash, or remote kill switch |
| `allowManagedModsOnly` | org allows only its mods |
| `hooks module did not load:` | top-level threw; fix reason |
| `options do not fit plugin.json userConfig` | fix `pluginConfigs` value |
| nothing loads in new dir | accept trust prompt |
| `hook skipped: threw|timeout|bad shape` | fix; debug log has every occurrence |
| `registered /x but no command.run hook answered it` | missing/mismatched matcher, hook returned `next`, or skipped (e.g. `focus:false`) |
| `was unloaded: it crashed the hooks worker` | blocking loop; fix |
| `mods ... off for this session: it crashed 3 times` | `/reload-plugins` |
| `a hook changed this call's input after the model wrote it` | auto mode; hook mutates input every time |
| `tried to lift a deny rule` | mod approved a denied call; stays denied |
| pane empty / default content | invalid tree; `ui.render (Pane) refused:` reason |
| `$.ui.open` but no pane | narrow terminal + self-opened; check `isPlaced` |
| hotkeys dead | no focus |
| works in terminal not Desktop | site/element not on that surface |
| edits ignored | editing installed copy; use `--plugin-dir` |
| value resets | module var on reload, or `$.state` after `/clear` (reload via `classic.SessionStart`) |

Debug: `claude --debug-file ./mod.log --plugin-dir ./my-mod` then `tail -f mod.log | grep my-mod`. Loaded line: `hooks module my-mod@inline loaded (...); events: ...`.

## Trust

Mods run unsandboxed with your permissions: files, env secrets, network, processes, every prompt and tool call, can approve calls and spend usage. Can't restyle the permission prompt. Review third-party mods with `claude plugin validate` (`hooks:`/`calls:`) before installing.
