---
name: base-ui
description: Building UI with the @base-ui/react component library (Base UI). Use when installing Base UI, adding or styling any Base UI component (Dialog, Popover, Select, Combobox, Menu, Tabs, Toast, Field/Form, Tooltip, Accordion, etc.), animating or composing them, wiring forms and validation, or debugging portal/anchor/state-attribute issues. Triggers on "base ui", "base-ui", "@base-ui/react", "baseui".
---

# Base UI

Unstyled, composable, accessible React primitives. Styling agnostic.

## Rule one: fetch the doc before writing the component

The library moves fast (v1.8 as of Sep 2026) and the API is part-name driven.
Every page has a markdown twin — append `.md`:

`https://base-ui.com/react/components/<name>.md`

Fetch that page and follow its part list and prop table. Do not write Base UI
markup from memory — part names and props change between minors.

Handbook (same `.md` trick):
`overview/quick-start`, `handbook/styling`, `handbook/animation`,
`handbook/composition`, `handbook/customization`, `handbook/forms`,
`handbook/typescript`, `utils/use-render`, `utils/merge-props`,
`utils/direction-provider`, `utils/csp-provider`.

Components: accordion, alert-dialog, autocomplete, avatar, button, checkbox,
checkbox-group, collapsible, combobox, context-menu, dialog, drawer, field,
fieldset, form, input, menu, menubar, meter, navigation-menu, number-field,
otp-field, popover, preview-card, progress, radio-group, scroll-area, select,
separator, slider, switch, tabs, toast, toggle, toggle-group, toolbar, tooltip.

## What holds across all of them

- **Namespaced parts.** `import { Dialog } from '@base-ui/react/dialog'` then
  `Dialog.Root / Trigger / Portal / Backdrop / Popup`. Popups need Portal +
  Positioner where the doc shows them; skipping Positioner is the usual
  "why is it in the wrong place" bug.
- **Style off data attributes**, not props: `[data-open]`, `[data-closed]`,
  `[data-disabled]`, `[data-checked]`, `[data-side]`, `[data-starting-style]`,
  `[data-ending-style]`. Same in Tailwind: `data-[open]:opacity-100`.
- **Exit animations** need `[data-ending-style]` — the component keeps the
  element mounted for you. Don't reach for a mount/unmount library.
- **`render` prop, not `asChild`**: `<Dialog.Trigger render={<MyButton />} />`.
  Your own component takes a render prop via `useRender`.
- **Forms**: `Field.Root` + `Field.Label/Control/Error` gives labelling and
  validation wiring; `Form` consolidates server errors. Use it before
  hand-rolling label/aria plumbing.
- **Tailwind examples in the docs are v4.** If `package.json` is on v3,
  convert the unsupported syntax.

## Install

```bash
npm i @base-ui/react
```

The package was renamed from `@base-ui-components/react`; use `@base-ui/react`
in every import. No provider is required. The quick start recommends wrapping
the app in `<div className="root">` with `.root { isolation: isolate; }` so
portaled popups always sit above page content. `DirectionProvider` for RTL,
`CSPProvider` if you run a strict CSP.
