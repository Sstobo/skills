# StyleX install and build config

```bash
npm install @stylexjs/stylex                       # runtime, always
npm install -D @stylexjs/unplugin                  # Vite/Rollup/Webpack/esbuild/Rspack
npm install -D @stylexjs/babel-plugin @stylexjs/postcss-plugin   # Next.js
```

Every bundler needs a CSS entrypoint containing `@stylex;`, imported from the
app root. The plugin appends the aggregated CSS to that file.

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

Babel plugin: `dev` (readable class names), `runtimeInjection` (leave false),
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
`sort-keys` (warn), `enforce-extension` (`.stylex.js` theme files).

## Troubleshooting

- **No styles at all** — is the `@stylex;` CSS file imported? Do your files
  match `include`? Does the plugin run before other transforms?
- **Precedence vs existing CSS** — `useCSSLayers: false` if StyleX must win
  over legacy stylesheets; `true` otherwise.
- **Styles disappearing in prod** — `treeshakeCompensation: true`.
- **Slow builds** — tighten `include`/`exclude`.

CLI for non-bundler use: `npx stylex --input ./src --output ./dist`
(`@stylexjs/cli`).
