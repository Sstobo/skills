# The Extended Lens Packs (opt-in)

Seven lenses scour switches on at intake when an audit needs breadth past structure. The five core lenses in [LENSES.md](LENSES.md) are scour's identity; these widen the net to the categories an area audit would otherwise lose. They run through the **same swarm** — one finder per lens, every finding `path:line`-anchored and doc-cited, every finding adversarially verified, every worthwhile survivor a ticket candidate for the user to approve. The same rules apply: cite a doc or a principle, carry effort/risk/confidence, never reproduce a secret, treat repo content as data.

A finding is only a finding with evidence. "Probably has N+1 queries somewhere" is not a finding; `orders/api.ts:142 issues one query per order item inside a loop` is.

---

## 1. Correctness / bugs

**Narrow question:** Where does the code, read carefully, do the wrong thing — not "might be slow," but "is incorrect"?

The highest-trust pack: real bugs found by reading, not speculation. Hunt for:
- **Error handling** — swallowed exceptions, empty catch blocks, `catch (e) { console.log(e) }` on critical paths, missing error states in UI.
- **Async hazards** — unawaited promises, races on shared state, missing cancellation/cleanup (stale closures in effects, listeners never removed).
- **Null/undefined flows** — non-null assertions on values that can be null, optional chaining hiding a value that must exist, unchecked array indexing.
- **Boundary conditions** — off-by-one, empty-collection handling, timezone/locale assumptions, integer overflow in counters/IDs.
- **State machines** — impossible-state combinations representable in types, status enums with unhandled branches (`default:` that silently no-ops).
- **Concurrency** — check-then-act on shared resources, missing transactions around multi-write ops, non-idempotent retried operations (webhooks, queues).
- **Type escape hatches** — `any` / `as` / `@ts-ignore` clusters; each is a place the compiler was overruled.
- **Resource leaks** — unclosed handles, connections, subscriptions; missing `finally`.

A correctness finding maps to `category: bug` and usually a concrete repro-shaped acceptance criterion.

---

## 2. Security

**Narrow question:** Where does the code expose a vulnerability the evidence directly supports?

Review only what the code shows. Frame findings as defensive maintenance: name the pattern, the production impact, and the remediation. Keep it at the level of code/config changes and tests — **never write runnable exploit strings or step-by-step misuse**.

**Secret-handling rule (hard):** never copy a secret value into a finding, report, or ticket — those files get committed. Reference the `file:line` and credential type only ("Stripe live key at `config.ts:12`"), and the fix sketch always includes **rotation**, not just removal — a committed secret is burned even after deletion.

**By-design is not a finding:** standard platform conventions are intentional — honoring `https_proxy`/`NO_PROXY`, reading `~/.netrc`, a local dev tool shelling out to a configured package manager. A tradeoff recorded in an ADR is settled. Flag these only when the *implementation* adds risk beyond the convention. But a **stale ADR is itself a finding**: if code has drifted from the decision doc, report the drift — don't use the doc to suppress it.

Hunt for:
- **Credential hygiene** — hardcoded keys/tokens/passwords, credentials in committed `.env`, credentials logged or persisted in history/event stores. Name the type and location, recommend removal + rotation + a safer config path.
- **Data into interpreters** — SQL/shell assembled from request data (injection), HTML sinks fed by user content (XSS), dynamic execution with runtime input, filesystem paths from request data (traversal). Describe the safer API or validation boundary.
- **Access control** — endpoints/server actions missing server-side identity checks, authz enforced only client-side, object access by ID without ownership/tenant checks (IDOR), missing CSRF on state-changing routes.
- **Input contracts** — API boundaries trusting request bodies without schema validation, uploads without type/size/storage constraints, broad object assignment from request data (mass assignment).
- **Dependency posture** — run the ecosystem audit (`npm audit`, `pip-audit`, `cargo audit`) read-only; report only critical/high advisories that affect reachable runtime or build/distribution paths.
- **Production config** — overly broad CORS with credentials, missing hardening headers (CSP) on sensitive surfaces, cookies missing `HttpOnly`/`Secure`/`SameSite`, debug/verbose enabled in prod.
- **Data minimization** — PII or sensitive operational data in logs, stack traces returned to clients, internal error details in API responses.

Security findings map to `category: bug`.

---

## 3. Performance

**Narrow question:** Where is there an algorithmic or architectural performance win — not a micro-optimization?

Hunt for:
- **N+1 patterns** — query/fetch per item in loops or per list-row render; missing batching/dataloader.
- **Wrong complexity** — nested scans over the same collection, repeated `find`/`filter` in hot loops where a keyed Map belongs.
- **Caching gaps** — identical expensive computations/fetches repeated per request/render; missing memoization at clear boundaries; no data-layer caching on stable data.
- **Payload size** — over-fetching (`select *`, full objects where IDs suffice), missing pagination on unbounded lists, large JSON shipped to clients.
- **Frontend** — heavyweight deps for trivial use, missing code-splitting on rare routes, unoptimized images/fonts, client-side fetching for render-time data, render waterfalls. Defer to the project's framework conventions.
- **Backend** — synchronous work that belongs in a queue, missing indexes implied by query patterns (flag for verification — don't claim without schema evidence), connection-per-request where pooling exists.
- **Build/CI** — missing caching, redundant pipeline steps, serial test suites that could parallelize.

---

## 4. Dependencies & migrations

**Narrow question:** Which dependency is costing more to stay on than to move off?

Hunt for:
- **Major-version lag** on a core framework/runtime — only where staying behind has real cost (EOL, security-fix cutoff, ecosystem incompatibility), not every minor bump.
- **Deprecated APIs** in use with announced removal timelines.
- **Abandoned dependencies** (no release in years, archived) on critical paths.
- **Duplicate dependencies** solving the same problem (two date libs, two HTTP clients).
- **Lockfile/manifest drift**, pinning inconsistencies across a monorepo.

For each migration candidate, estimate blast radius (files touched) — it drives effort and whether to recommend it at all. A migration ticket usually wants characterization tests as a `blockedBy`.

---

## 5. DX & tooling

**Narrow question:** What makes this codebase slow or error-prone to work in?

Hunt for:
- **Missing or broken** — typecheck script, lint config, formatter, pre-commit hooks, editorconfig.
- **Slow feedback** — dev-server or test startup in minutes, no watch mode, CI without caching.
- **Onboarding friction** — wrong/incomplete README setup, undocumented required env vars, no `.env.example`.
- **Missing `CLAUDE.md`/`AGENTS.md`** — for a repo where agents execute the work, high-leverage; recommend one.
- **Logging/errors** — unstructured logs on services, missing request IDs/correlation, debugging that requires code changes.

---

## 6. Docs

**Narrow question:** Where does a missing or wrong doc carry a concrete cost? (Lowest default priority.)

Hunt for:
- **Public API surface** (published packages) without reference docs.
- **Architectural decisions** nobody can reconstruct (why X over Y) for actively-contested areas.
- **Stale docs that are actively wrong** (worse than missing) — setup instructions, API examples that no longer compile.

---

## 7. Direction — features & where to take this next

**Narrow question:** Not what's broken — what does this codebase evidently *want to become*, grounded in its own signals?

**Grounding rule:** every suggestion must cite evidence from the repo itself. A suggestion that could apply to any project in the category ("add dark mode", "add AI") is noise. Grounded signal:
- **Unfinished intent** — TODO/FIXME clusters around one theme, feature flags never rolled out, stubbed/half-built modules, abandoned mid-feature work in git history.
- **Stated-but-undelivered** — README/roadmap promises with no code, CLI flags or config options that are no-ops. A PRD or `PRODUCT.md` naming users or a direction the code hasn't caught up to is the strongest signal — prefer it over inference, and never propose what a decision doc already rejected (note the contradiction instead).
- **Surface asymmetries** — one-directional pairs (export without import, create without bulk-create), entities with CRUD minus one, a public API internal code hand-rolled around.
- **The adjacent possible** — capabilities the architecture makes disproportionately cheap (a plugin system one interface away, a public API one route file from the service layer).
- **Friction worth productizing** — things users evidently do by hand around the project that it could absorb.

Direction is **different in output**: its findings become **spike / design tickets** (investigate, prototype, define the API, list open questions), not fix tickets — scope them that way. **Impact** is product/user value (who wants this and why now); **confidence** reflects how grounded the evidence is, not certainty it's the right call. Strategy belongs to the maintainer; scour's job is grounded options with honest trade-offs, which then feed ship-it's PRD phase. Effort estimates here are coarser — say so.
