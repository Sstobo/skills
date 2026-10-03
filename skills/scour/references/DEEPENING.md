# Deepening Vocabulary

The shared language for every finding scour makes about structure. Use these terms exactly — do not drift into "component," "service," "API," or "boundary." Consistent language is what makes a finding rigorous instead of a vibe. (Distilled from Ousterhout's *A Philosophy of Software Design* and Michael Feathers' "seam" — scour carries its own copy so it is standalone.)

## Terms

- **Module** — anything with an interface and an implementation. Scale-agnostic: a function, a class, a package, a tier-spanning slice. _Avoid_: unit, component, service.
- **Interface** — everything a caller must know to use the module correctly: the type signature *plus* invariants, ordering constraints, error modes, required config, and performance characteristics. _Avoid_: API, signature (too narrow).
- **Implementation** — the code inside the module.
- **Depth** — leverage at the interface: how much behaviour a caller can exercise per unit of interface they must learn. **Deep** = a lot of behaviour behind a small interface. **Shallow** = the interface is nearly as complex as the implementation.
- **Seam** (Feathers) — a place where behaviour can be altered without editing in that place; the *location* where a module's interface lives. _Avoid_: boundary (overloaded with DDD's bounded context).
- **Adapter** — a concrete thing that satisfies an interface at a seam. Describes *role*, not substance.
- **Leverage** — what callers get from depth: more capability per unit of interface learned; one implementation paying back across N call sites and M tests.
- **Locality** — what maintainers get from depth: change, bugs, knowledge, and verification concentrate in one place. Fix once, fixed everywhere.

## Principles the lenses apply

- **The deletion test.** Imagine deleting the module. If complexity vanishes, it was a pass-through hiding nothing. If complexity reappears across N callers, it was earning its keep. A "concentrates complexity" answer is the signal that a module is worth keeping or deepening; a "just moves it" answer flags a shallow module.
- **Depth is a property of the interface, not the implementation.** A deep module can be internally composed of small, swappable parts (internal seams used by its own tests) — those parts just are not part of its external interface. Do not expose internal seams through the interface because tests happen to use them.
- **The interface is the test surface.** Callers and tests cross the same seam. If a test has to reach *past* the interface to assert on internal state, the module is probably the wrong shape.
- **One adapter = a hypothetical seam. Two adapters = a real one.** Do not introduce a port/seam unless something actually varies across it (typically production + test). A single-adapter seam is just indirection.

## Dependency categories (for proposing how to deepen across a seam)

When a finding proposes merging or deepening modules, classify the dependency so the proposal names the right testing strategy:

1. **In-process** — pure computation, in-memory state, no I/O. Always deepenable; merge and test through the new interface directly. No adapter.
2. **Local-substitutable** — has a local test stand-in (PGLite for Postgres, in-memory FS). Deepenable; test with the stand-in. Seam is internal.
3. **Remote but owned** — your own services across a network. Define a port at the seam; inject an HTTP/gRPC adapter for prod and an in-memory adapter for tests.
4. **True external** — third-party services you do not control (Stripe, Twilio). Inject as a port; tests use a mock adapter.

## Rejected framings (do not use)

- **Depth as ratio of implementation-lines to interface-lines** — rewards padding the implementation. Use depth-as-leverage.
- **"Interface" as just the TypeScript `interface` keyword or a class's public methods** — too narrow; interface includes every fact a caller must know.
- **"Boundary"** — say **seam** or **interface**.
