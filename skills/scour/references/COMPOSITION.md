# Composition Smells (React / UI)

What the Composition lens hunts for, with the corrective shape for each. Distilled from Vercel's React composition patterns. The principle underneath all of them: **lift state, compose internals, make state dependency-injectable** — which is the deepening vocabulary applied to UI (a well-composed compound component is a *deep module*; a god component is a *shallow module with a sprawling interface*).

If the project ships a composition-patterns rule set (a sibling skill, or rule files in the repo), the finder should pull it in as additional ammunition. This file is the standalone core.

---

## Smell 1 — Boolean-prop proliferation (CRITICAL)

Components customised by stacking boolean flags (`isThread`, `isEditing`, `isDMThread`, `showAttachments`, `compact`, `withBorder`). Each boolean doubles the possible states and breeds conditional logic the reader cannot follow.

```tsx
// Smell: exponential states behind one prop surface
<Composer isThread isEditing={false} channelId="abc" showAttachments showFormatting={false} />
```

**Fix → explicit variants** (Smell 4) or **compound components** (Smell 2). Each call site says what it renders:

```tsx
<ThreadComposer channelId="abc" />
<EditMessageComposer messageId="xyz" />
```

---

## Smell 2 — God component / monolithic with render props (HIGH)

One component owning many responsibilities, configured through `showX` flags and `renderX` callbacks. The structural cousin of the god-file.

**Fix → compound components with shared context.** Subcomponents read shared state from context, not props; consumers compose only the pieces they need:

```tsx
<Composer.Provider channelId="abc">
  <Composer.Header />
  <Composer.Input />
  <Composer.Footer>
    <Composer.Formatting />
    <Composer.Actions />
  </Composer.Footer>
</Composer.Provider>
```

---

## Smell 3 — `renderX` tangles where `children` would read cleaner (MEDIUM)

`renderHeader` / `renderFooter` / `renderActions` props force the reader to learn callback signatures. **Fix → pass `children`.** Children compose naturally and read top-to-bottom.

---

## Smell 4 — Boolean modes instead of explicit variants (MEDIUM)

A single component with `mode`/boolean switches hiding what it actually renders. **Fix → explicit variant components**, each composing the pieces it needs from the same compound primitives. Self-documenting, no hidden conditionals.

---

## Smell 5 — State trapped inside a component (HIGH)

Sibling components (a dialog's preview, a footer's submit button) cannot reach state because it lives inside one component's `useState`, forcing prop drilling or awkward refs.

**Fix → lift state into a provider.** The provider owns the state; any descendant — UI or not — reads it from context.

---

## Smell 6 — UI coupled to a state implementation (HIGH / MEDIUM)

Consumers call a specific hook (`useChannelComposerState`, `useGlobalChannelState`) and so know *how* state is managed — they break when the implementation changes.

**Fix → a generic context interface for dependency injection.** Define a contract in three parts — `state`, `actions`, `meta` — that any provider can implement. The provider is the *only* place that knows whether state comes from `useState`, Zustand, or server sync. UI components depend on the interface, not the implementation. This is ports-and-adapters for the UI: one interface, swappable providers (a real one in the app, a trivial one in tests/Storybook).

```tsx
interface ComposerState { input: string; attachments: Attachment[]; isSubmitting: boolean }
interface ComposerActions { update(fn: (s: ComposerState) => ComposerState): void; submit(): void }
// UI consumes { state, actions, meta }; ChannelProvider / DMProvider / TestProvider each implement it.
```

---

## Smell 7 — Legacy React idioms (MEDIUM, React 19+ only)

Skip on React 18 or earlier. On React 19:
- `forwardRef` → `ref` is a regular prop. `function Input({ ref, ...props })`.
- `useContext(Ctx)` → `use(Ctx)`.

---

## How composition findings join the report

Every composition finding is framed in the deepening vocabulary so it sits alongside the structural findings: name the **shallow** component and its sprawling **interface**, the **deep** compound component or provider that replaces it, the **seam** the generic context interface creates, and the **leverage** (one set of primitives, many variants) and **locality** (state and its rules in one provider) the change buys.
