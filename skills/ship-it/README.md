# ship-it

An end-to-end build pipeline in a file-based tracker: idea → PRD → QA-ready tickets → triage → an implement/verify/review loop that lands atomic, verified commits on trunk. Grilling and code review are built in.

## Use it when

- Starting a feature
- Turning an idea or PRD into tickets
- Working through a ticket queue
- Triaging or repairing the tracker

## Install

```bash
npx skills add Sstobo/skills --skill ship-it
```

## Files

- [`SKILL.md`](SKILL.md)
- [`references/GRILL.md`](references/GRILL.md)
- [`references/LOOP.md`](references/LOOP.md)
- [`references/TRACKER.md`](references/TRACKER.md)
- [`references/TRIAGE.md`](references/TRIAGE.md)
- [`scripts/doc-ground.mjs`](scripts/doc-ground.mjs)
- [`scripts/doc-ground.test.mjs`](scripts/doc-ground.test.mjs)
- [`scripts/verify.mjs`](scripts/verify.mjs)
- [`scripts/verify.test.mjs`](scripts/verify.test.mjs)
