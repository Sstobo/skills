// node --test skills/ship-it/scripts/verify.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { checkDone, lint, preflight } from './verify.mjs'

const ticket = (o = {}, body = '') => `---
slug: x
kind: ${o.kind ?? 'afk'}
lane: ${o.lane ?? 'agent'}
resolution: ${o.resolution ?? 'did the thing'}
reviewRounds: ${o.reviewRounds ?? 1}
claimedAt: ${o.claimedAt ?? '2026-09-01T00:00:00Z'}
updatedAt: 2026-09-01T00:00:00Z
---
## Acceptance criteria

- [x] works

## QA Reports

${body}
## History
`
const goodQA = '### 2026-09-01T00:00:00Z — verified\nRan: pnpm test — green.\n\n### 2026-09-01T00:01:00Z — pass\nreviewed: perfect\n'

function tracker(files) {
  const repo = mkdtempSync(join(tmpdir(), 'ship-it-'))
  for (const [rel, text] of Object.entries(files)) {
    mkdirSync(join(repo, 'tickets', rel.split('/')[0]), { recursive: true })
    writeFileSync(join(repo, 'tickets', rel), text)
  }
  return repo
}

test('clean reviewed ticket passes the done gate', () => {
  const repo = tracker({ 'in-review/x.md': ticket({}, goodQA) })
  assert.deepEqual(checkDone(join(repo, 'tickets/in-review/x.md')), [])
})

test('done gate refuses: no QA block, null resolution, cap blown, off-schema kind', () => {
  const repo = tracker({ 'in-review/x.md': ticket({ resolution: 'null', reviewRounds: 3, kind: 'agent' }, '') })
  const v = checkDone(join(repo, 'tickets/in-review/x.md'))
  assert.equal(v.length, 5, v.join('\n')) // kind, resolution, cap, no QA block, no reviewed: perfect
})

test('empty acceptance criteria is refused', () => {
  const repo = tracker({ 'in-review/x.md': ticket({}, goodQA).replace('- [x] works\n', '') })
  assert.deepEqual(checkDone(join(repo, 'tickets/in-review/x.md')), ['no acceptance criteria — nothing to verify against'])
})

test('fast lane from in-progress needs the fast-lane note', () => {
  const repo = tracker({
    'in-progress/x.md': ticket({ reviewRounds: 'null' }, '### t — verified\npnpm typecheck green; vitest x.test.ts\n'),
    'in-progress/y.md': ticket({ reviewRounds: 'null' }, '### t — verified\nfast-lane: review skipped — mechanical, test-gated; vitest y.test.ts\n'),
  })
  assert.equal(checkDone(join(repo, 'tickets/in-progress/x.md')).length, 1)
  assert.deepEqual(checkDone(join(repo, 'tickets/in-progress/y.md')), [])
})

test('lint and preflight surface what a human must decide', () => {
  const repo = tracker({
    'done/a.md': ticket({ resolution: 'null' }),
    'in-progress/b.md': ticket({ claimedAt: 'null' }),
    'in-review/c.md': ticket({ kind: 'hitl', reviewRounds: 'null' }),
    'in-review/d.md': ticket({ reviewRounds: 'null' }),
    'ready/e.md': ticket({ kind: 'agent' }),
  })
  const l = lint(repo)
  assert.equal(l.length, 4, l.join('\n')) // a resolution, b claimedAt, d reviewRounds, e kind
  const p = preflight(repo)
  assert.equal(p.length, 6, p.join('\n')) // lint 4 + b stale claim + d dead afk review (c is hitl: silent)
})
