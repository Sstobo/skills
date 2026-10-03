# StyleX install and build config

```bash
npm install @stylexjs/stylex                       # runtime, always
npm install -D @stylexjs/unplugin                  # Vite/Rollup/Webpack/esbuild/Rspack
npm install -D @stylexjs/babel-plugin @stylexjs/postcss-plugin   # Next.js
```

Every bundler needs one CSS file imported from the app root (root layout or
JS entry). The unplugin appends the aggregated StyleX CSS to the CSS asset the
bundler emits (or writes `stylex.css` if there is none). With the PostCSS
plugin (Next.js, plain PostCSS) that file must contain `@stylex;` exactly once;
the plugin replaces the directive with the generated CSS.

## Vite

```ts
// vite.config.ts
import stylex from '@stylexjs/unplugin';
export default defineConfig({
  plugins: [stylex.vite({ useCSSLayers: true }), react()],
});
```

StyleX must come before `@vitejs/plugin-react` or Fast Refresh breaks.

## Webpack / Rspack / esbuild / Rollup

Same shape, different method: `stylex.webpack({...})`, `stylex.rspack({...})`,
`stylex.esbuild({...})`, `stylex.rollup({...})` — each takes
`{ useCSSLayers: true }` and goes in that bundler's `plugins` array.
In CommonJS configs use `require('@stylexjs/unplugin').default`. Webpack and
Rspack also need a CSS extractor (`MiniCssExtractPlugin` /
`rspack.CssExtractRspackPlugin`) so there is a stylesheet to append to;
esbuild needs `metafile: true`.

## Next.js

```js
// babel.config.js
const path = require('path');
const dev = process.env.NODE_ENV !== 'production';
module.exports = {
  presets: ['next/babel'],
  plugins: [['@stylexjs/babel-plugin', {
    dev,
    runtimeInjection: false,
    enableInlinedConditionalMerge: true,
    treeshakeCompensation: true,
    aliases: { '@/*': [path.join(__dirname, '*')] },
    unstable_moduleResolution: { type: 'commonJS' },
  }]],
};
```

```js
// postcss.config.js
const babelConfig = require('./babel.config');
module.exports = {
  plugins: {
    '@stylexjs/postcss-plugin': {
      include: ['src/**/*.{js,jsx,ts,tsx}', 'app/**/*.{js,jsx,ts,tsx}',
                'pages/**/*.{js,jsx,ts,tsx}', 'components/**/*.{js,jsx,ts,tsx}'],
      babelConfig: {
        babelrc: false,
        parserOpts: { plugins: ['typescript', 'jsx'] },
        plugins: babelConfig.plugins,
      },
      useCSSLayers: true,
    },
    autoprefixer: {},
  },
};
```

Then `@stylex;` in `app/globals.css`.

## Options worth knowing

Babel plugin: `dev` (runtime injection + Dev Tools metadata), `debug`
(readable style keys and `data-style-src`), `runtimeInjection` (leave false),
`treeshakeCompensation` (true if styles vanish), `aliases` (mirror your bundler),
`unstable_moduleResolution` (needed for theming APIs), `classNamePrefix`,
`importSources`, `styleResolution` ('property-specificity' default, or
'application-order').

Plugin/PostCSS: `useCSSLayers`, `include`, `exclude`.

## ESLint

```bash
npm install -D @stylexjs/eslint-plugin
```

Rules: `valid-styles` (error), `no-unused` (error), `valid-shorthands` (warn),
`sort-keys` (warn), `enforce-extension` (`.stylex.js` theme files),
`no-conflicting-props` (`className`/`style` next to `stylex.props()`),
`no-legacy-contextual-styles`.

## Troubleshooting

- **No styles at all** — is the `@stylex;` CSS file imported? Do your files
  match `include`? Does the plugin run before other transforms?
- **Precedence vs existing CSS** — `useCSSLayers: false` if StyleX must win
  over legacy stylesheets; `true` otherwise.
- **Styles disappearing in prod** — `treeshakeCompensation: true`.
- **Slow builds** — tighten `include`/`exclude`.

CLI for non-bundler use: `npx stylex --input ./src --output ./dist`
(`@stylexjs/cli`).
