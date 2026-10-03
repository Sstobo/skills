# Interface Design (Design It Twice)

When a Tier 3 finding is approved and the correct interface shape is not already obvious, run this sub-agent pattern **at spec time**, before writing the ticket. Based on Ousterhout's *A Philosophy of Software Design* — the first interface that comes to mind is rarely the best one. Competing alternatives expose trade-offs that a single proposal hides. The winning interface is the expensive thinking the handoff captures: it goes into the ticket's `## Implementation notes`, so a cheaper executor implements the agreed shape rather than re-deriving it.

Uses the vocabulary in [DEEPENING.md](DEEPENING.md): **module**, **interface**, **seam**, **adapter**, **leverage**, **locality**, **dependency category**.

---

## Step 1 — Frame the problem space

Before spawning sub-agents, write a short user-facing brief:

- The constraints any new interface must satisfy (invariants, ordering rules, error modes, performance characteristics, required config).
- The dependency category of the split (in-process / local-substitutable / remote-owned / true-external — from `DEEPENING.md`). This determines whether the seam needs an adapter and what the test strategy is.
- A rough illustrative sketch — types, method names, a call-site example — to make the constraints concrete. This is not a proposal; it anchors the sub-agents.

Show this to the user, then proceed to Step 2 immediately. The user reads while the sub-agents work.

---

## Step 2 — Spawn competing interface proposals

Spawn 3 sub-agents (max 5) in parallel using the Agent tool. Each produces a **radically different** interface for the deepened module — not variations on the same shape.

Give each agent a self-contained brief: the file paths involved, the coupling details, the dependency category, and what sits behind the seam. Include the `DEEPENING.md` vocabulary so each agent names things consistently.

Assign each agent a distinct design constraint:

- **Agent 1: Minimize.** Aim for 1–3 entry points. Maximize leverage per entry point — callers should be able to accomplish the most common operations with the fewest facts they must know.
- **Agent 2: Maximize flexibility.** Support the widest range of use cases and allow extension without modifying the module.
- **Agent 3: Optimize for the common caller.** Make the default case trivial; advanced cases are allowed to be more complex.
- **Agent 4 (if the seam crosses a dependency boundary): Ports and adapters.** Design around an injectable interface — a port the production adapter and the test adapter both satisfy. The seam is the contract; the adapters are replaceable.

Each agent returns:

1. The interface: types, methods/functions, params — plus invariants, ordering constraints, error modes.
2. A usage example: how the most common caller uses it.
3. What the implementation hides: what complexity the new module absorbs.
4. Dependency strategy: if the seam crosses a dependency, how the adapter is injected and what the test adapter looks like.
5. Trade-offs: where leverage is high, where it is thin, what the design sacrifices.

---

## Step 3 — Compare and recommend

Present designs one at a time so the user can absorb each, then compare them in prose. Contrast by:

- **Depth** (leverage at the interface — how much callers can do per fact they must know).
- **Locality** (where change concentrates — which design puts related knowledge in one place).
- **Seam placement** (is the interface at the right level of abstraction, or does it expose internals?).

Give your own recommendation: which design is strongest and why. If elements from different designs would combine well, propose a hybrid explicitly. Be opinionated — the user wants a strong read, not a menu.

After agreement on a design, write the chosen interface — types, entry points, invariants, error modes, the dependency strategy, and the test-replacement note — into the ticket's `## Implementation notes` per `references/REPORT.md`. Scour does not implement it; the ticket carries it to ship-it's executor.
