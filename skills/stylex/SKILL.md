---
name: stylex
description: Authoring styles with StyleX (@stylexjs/stylex), Meta's build-time atomic CSS library. Use when writing or reviewing StyleX styles, defining design tokens or themes, handling pseudo-classes, media queries, keyframes or dynamic styles, or setting up/debugging the StyleX build (Vite, Next.js, Webpack, Rspack, esbuild, Rollup, PostCSS, ESLint). Triggers on "stylex", "@stylexjs", "stylex.create", ".stylex.ts".
---

# StyleX

Build-time atomic CSS. Styles compile away; nothing is computed at runtime.
Install and bundler config lives in [install.md](install.md) — read it only
when setting up or fixing the build.

## Authoring

```tsx
import * as stylex from '@stylexjs/stylex';

const styles = stylex.create({
  container: { display: 'flex', alignItems: 'center', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: 'navy' },
});

<div {...stylex.props(styles.container)} />
```

- Longhand properties and single-value shorthands only. Numbers are px for
  lengths, ms for animation/transition durations and delays; unitless properties
  (`lineHeight`, `opacity`, `zIndex`, `fontWeight`) stay unitless.
- `null` unsets a property.
- Merge by order, last wins: `stylex.props(styles.base, isActive && styles.active, style)`.
- Component styles first, prop styles last, so the caller can override.

## Conditions nest inside the property, never at the top level

```tsx
const styles = stylex.create({
  button: {
    backgroundColor: { default: 'lightblue', ':hover': 'blue', ':disabled': 'gray' },
    padding: { default: 8, '@media (min-width: 768px)': 16 },
  },
  input: { '::placeholder': { color: 'gray' } }, // pseudo-ELEMENTS are top-level
});
```

`default` is required; use `null` when nothing should apply by default.
Same nesting for `@supports` and `@container`.

## Tokens

- `stylex.defineConsts()` — static values (breakpoints, z-indices). Prefer this.
- `stylex.defineVars()` — only when the value must be themed or overridden at runtime.
- Both live in `.stylex.ts` files: named exports only, nothing else exported.
- `stylex.createTheme(vars, overrides)` produces a theme you spread on a
  container; every descendant picks it up. Themes can live anywhere.

## The rest of the API

`stylex.keyframes()` for animations · dynamic styles as arrow functions
(`bar: (w: number) => ({ width: w })`) · `stylex.firstThatWorks()` for
fallback values · `stylex.when.ancestor/descendant/anySibling/siblingBefore/
siblingAfter()` with `defaultMarker()`/`defineMarker()` for relational
selectors · `stylex.viewTransitionClass()` · `stylex.positionTry()` for anchor
positioning.

Types: `StyleXStyles`, `StyleXStylesWithout<{...}>`, `VarGroup<typeof tokens>`.
Prefer these over `StaticStyles`.

## Antipatterns

- No `className` or `style` prop on an element that gets a `stylex.props()` spread.
- No importing plain JS constants into `stylex.create()` — use `.stylex.ts` tokens.
- No conditions at the top level of a namespace (see above).
- Avoid `:first-child`/`:nth-child` and `::before`/`::after` — do it in JS or
  with a real element. Smaller CSS, better a11y.

Docs: https://stylexjs.com/docs/api
