# The Core Lenses

The five lenses below are scour's **default, always-on** set — its structural-quality core. Seven **opt-in** packs (Correctness/bugs, Security, Performance, Dependencies, DX, Docs, Direction) live in [EXTENDED-LENSES.md](EXTENDED-LENSES.md); switch them on at intake when the audit calls for breadth beyond structure.

Each finder agent hunts with exactly one lens. A lens is a narrow question plus the criteria that turn an observation into a finding. Every finding must carry a `path:line` anchor and cite either a project doc or a principle below — generic advice with no anchor is not a finding. Assign one finder per lens; for a large area, split a lens across sub-areas (e.g. one Depth finder per top-level subdirectory).

The vocabulary (module, interface, seam, depth, leverage, locality, the deletion test) lives in [DEEPENING.md](DEEPENING.md). Read it before running the Depth or File-size lenses.

---

## 1. Depth & shallowness

**Narrow question:** Where is a module shallow — its interface nearly as complex as its implementation — and where would deepening concentrate complexity?

Hunt for:
- **Pass-throughs** that fail the deletion test: delete the module and complexity just moves to one caller rather than vanishing or concentrating.
- **Shallow wrappers** — a function/class whose interface restates its implementation (thin delegations, one-line forwarders, "manager" classes that only route).
- **Leaky seams** — modules that force callers to know their internals (ordering rules, half-initialised state, "call A before B") instead of hiding them.
- **Scattered concepts** — understanding one idea requires bouncing across many tiny modules with no locality. Candidate for merging into one deep module.
- **Pure functions extracted only for testability** while the real bugs live in how they are wired together — no locality, tests that prove nothing about the real path.

A finding states: which modules, why the interface is shallow (or the seam leaks), what deepened module would replace them, and the dependency category from [DEEPENING.md](DEEPENING.md) so the fix names the right testing strategy. Frame the benefit as **leverage** (callers) and **locality** (maintainers).

---

## 2. File size & cohesion (the 1,000-line interrogation)

**Narrow question:** Does every file over the threshold earn its length, or is it a god-file hiding several modules?

**Protocol — interrogate EVERY file over the threshold (default 1,000 lines). No exceptions, no sampling.** For each one, run the deletion/cohesion test and rule it into exactly one verdict:

- **Earns its length (keep).** The file is a single deep, cohesive module whose length is irreducible behaviour — a comprehensive state machine, a parser, a generated file, one concept that genuinely is this big. Splitting it would scatter the concept and hurt locality. Record *why* it earns its keep so the next scour does not re-flag it (this becomes an ADR candidate if the user confirms).
- **God-file (split).** The file mixes multiple unrelated responsibilities behind one filename. Name the natural seams along which it splits into deep modules. This is the common verdict for oversized files.
- **Grab-bag (extract).** A `utils`/`helpers`/`misc` dumping ground of unrelated functions. Propose homing each cluster with the module it actually serves.
- **Duplication-bloated (consolidate).** Length comes from copy-pasted blocks. Propose the deep module that absorbs the repetition.

"Without good reason" is the operative test: a file over the threshold is guilty until the **earns-its-length** case is positively made. Length alone is the trigger; cohesion decides the verdict. Report each over-threshold file with its line count, verdict, and — for split/extract/consolidate — the proposed seams.

Also flag files *approaching* the threshold (within ~15%) that are already low-cohesion, as early warnings, but only the over-threshold set is mandatory.

---

## 3. Convention & consistency

**Narrow question:** Where does the area drift from the project's own documented conventions and the best-practice docs supplied at intake?

This lens is **doc-driven** — it is only as good as the ammunition. Hunt for:
- Drift from the supplied best-practice docs, the nearest `CLAUDE.md`/`AGENTS.md` rules, and `CONTEXT.md` vocabulary.
- **Naming drift** — the same concept under different names, or the project's domain term ("Order") replaced by an ad-hoc one ("FooBarHandler").
- **Pattern drift** — one corner of the area solves a problem differently from the documented/dominant pattern elsewhere, with no recorded reason.
- **Stale-doc conflicts** — code and a doc disagree. Surface it as a question (which is right?), not a unilateral fix.

Every convention finding must quote the doc or rule it violates (with its location) and the violating `path:line`. A convention finding with no doc to cite is just opinion — drop it.

---

## 4. Testability & seams

**Narrow question:** What in the area cannot be tested through its current interface, and where is a seam missing?

Hunt for:
- **Untestable modules** — logic reachable only through I/O, globals, or hard-wired dependencies, with no seam to substitute them. Propose the port/adapter per the dependency category in [DEEPENING.md](DEEPENING.md).
- **Tests asserting past the interface** — tests that read internal state or private fields; they break on refactors and prove nothing about behaviour. Propose moving the assertion to the interface (the test surface).
- **Shallow-module test debt** — unit tests clinging to shallow modules that would become waste once a deepened module is tested through its interface. Pair these with the matching Depth finding: deepen, test at the new interface, delete the old tests.
- **Missing seams** — a real variation point (prod vs test, two backends) with no seam, forcing duplication or untestable branching. Remember: two adapters justify a seam; one does not.

---

## 5. Composition (React / UI)

**Narrow question:** Where do components resist composition — boolean-prop sprawl, monolithic state, render-prop tangles? (Drop this lens on pure-backend areas.)

Hunt for the smells below; full guidance and before/after shapes are in [COMPOSITION.md](COMPOSITION.md):
- **Boolean-prop proliferation** — components customised by stacking boolean flags (`isPrimary`, `hasIcon`, `compact`, `withBorder`) instead of composition. Propose compound components or explicit variant components.
- **God components** — one component owning many responsibilities and a wide prop surface; a structural cousin of the god-file. Propose splitting into composed parts with shared context.
- **Render-prop / `renderX` tangles** where `children` would read cleaner.
- **State that should be lifted** — sibling components that cannot share state because it is trapped in one of them; propose a provider that owns the state behind a generic interface.
- **Implementation-coupled consumers** — consumers that know *how* state is managed instead of depending on a decoupled provider interface.
- **(React 19) `forwardRef` and `useContext`** where `ref`-as-prop and `use()` are now the idiom.

Composition findings map directly onto the deepening vocabulary: a god component is a shallow module with a sprawling interface; a well-composed compound component is a deep module.
