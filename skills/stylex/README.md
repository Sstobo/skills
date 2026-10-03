# stylex

An agent skill for writing styles with [StyleX](https://stylexjs.com) (`@stylexjs/stylex`), Meta's build-time atomic CSS library, and for setting up or fixing its build.

## Use it when

- Writing or reviewing `stylex.create` / `stylex.props` code
- Defining tokens with `defineConsts` or `defineVars`, or themes with `createTheme`
- Adding pseudo-classes, media queries, keyframes, fallbacks or dynamic styles
- Setting up StyleX in Vite, Next.js, Webpack, Rspack, esbuild, Rollup or PostCSS, or debugging missing styles
- Configuring the StyleX ESLint plugin

## What it covers

- `SKILL.md`: authoring rules (how conditions nest inside properties, pseudo-elements at the top level, number units, merge order), tokens and themes, the rest of the API (`keyframes`, `firstThatWorks`, `when.*` with markers, `viewTransitionClass`, `positionTry`), the static types, and antipatterns
- `install.md`: packages, the CSS entry file each setup needs, config for `@stylexjs/unplugin` (Vite, Webpack, Rspack, esbuild, Rollup) and for Next.js (Babel + PostCSS plugins), the Babel options worth knowing, ESLint rules, troubleshooting, and the CLI

## Versions

Checked against `@stylexjs/stylex`, `@stylexjs/unplugin`, `@stylexjs/babel-plugin`, `@stylexjs/postcss-plugin`, `@stylexjs/eslint-plugin` and `@stylexjs/cli` 0.19.1, and the stylexjs.com docs on 3 October 2026. The older `@stylexjs/nextjs-plugin` and `@stylexjs/webpack-plugin` packages are deprecated on npm and are not used.

## Install

```bash
npx skills add Sstobo/skills --skill stylex
```

## Example prompts

- "Add a dark theme to our StyleX tokens."
- "StyleX styles show in dev but vanish in the production build. Find out why."

## Files

- [`SKILL.md`](SKILL.md): authoring guide and API summary the agent loads first.
- [`install.md`](install.md): install, bundler config, options, ESLint and troubleshooting. The agent reads it only when setting up or fixing the build.
