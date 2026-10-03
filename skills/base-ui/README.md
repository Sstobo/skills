# base-ui

An agent skill for building React UI with [Base UI](https://base-ui.com) (`@base-ui/react`), the unstyled, accessible component library.

The skill is short on purpose. Its main rule is to fetch the component's markdown doc (`https://base-ui.com/react/components/<name>.md`) before writing any markup, because part names and props change between minor versions. On top of that it gives the agent the patterns that hold across every component.

## Use it when

- Installing Base UI or adding a component (Dialog, Popover, Select, Combobox, Menu, Tabs, Toast, Field/Form, Tooltip, Accordion and the rest)
- Styling components through their data attributes, with CSS or Tailwind
- Adding enter and exit animations
- Composing Base UI parts with your own components through the `render` prop
- Wiring forms and validation with `Field` and `Form`
- Debugging a popup that renders in the wrong place, sits under other content, or ignores state styles

## What it covers

- Where to find each doc page, and the full list of handbook, utility and component slugs
- Namespaced parts (`Dialog.Root / Trigger / Portal / Backdrop / Popup`) and when a `Positioner` is needed
- Styling off data attributes (`data-open`, `data-closed`, `data-starting-style`, `data-ending-style` and others)
- The `render` prop in place of `asChild`, and `useRender` for your own components
- Install, the package rename from `@base-ui-components/react`, the `isolation: isolate` root for portaled popups, `DirectionProvider` and `CSPProvider`

## Versions

Checked against `@base-ui/react` 1.8.0 (released 4 September 2026) and the base-ui.com docs on 3 October 2026. The old `@base-ui-components/react` package is deprecated on npm.

## Install

```bash
npx skills add Sstobo/skills --skill base-ui
```

## Example prompts

- "Add a Base UI Select for the country field and style it with Tailwind."
- "My Base UI Popover opens behind the header. Fix it."

## Files

- [`SKILL.md`](SKILL.md): the instructions the agent loads: fetch-the-doc rule, doc index, cross-component patterns, install notes.
