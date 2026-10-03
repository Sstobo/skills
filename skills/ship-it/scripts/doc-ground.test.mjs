#!/usr/bin/env node
// ponytail: three checks — the frame stays square, coverage resolves both source
// dialects, and a covered file is never also reported as a gap.
import assert from 'node:assert'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { frame, coverage, readDoc } from './doc-ground.mjs'

const repo = mkdtempSync(join(tmpdir(), 'docground-'))
mkdirSync(join(repo, 'docs/concepts'), { recursive: true })
mkdirSync(join(repo, 'src'), { recursive: true })
writeFileSync(join(repo, 'src/a.ts'), 'export const a = 1\n')
writeFileSync(join(repo, 'src/b.ts'), 'export const b = 2\n')

// new dialect: a plain list of repo-relative paths
writeFileSync(join(repo, 'docs/concepts/new.md'),
  `---\ntype: Gotcha\ntitle: New\ndescription: d\nsources:\n  - src/a.ts\n---\nbody\n`)
// old dialect: { resource: /abs } plus inert stamps from a pre-rewrite bundle
writeFileSync(join(repo, 'docs/concepts/old.md'),
  `---\ntype: Module\ntitle: Old\nsources:\n  - { resource: ../../src/b.ts }\ngenerated: { by: x, at: 2026-01-01T00:00:00Z }\n---\nbody\n`)
// a router must never be treated as a doc
writeFileSync(join(repo, 'docs/AGENTS.md'), `---\ntype: Module\nsources:\n  - src/a.ts\n---\n`)

assert.deepEqual(readDoc(join(repo, 'docs/concepts/new.md')).sources, ['src/a.ts'])

// a real bundle carries paths with spaces; splitting on whitespace truncates them
writeFileSync(join(repo, 'src/Two Words.pdf'), 'x')
writeFileSync(join(repo, 'docs/concepts/spaced.md'),
  `---\ntype: Reference\ntitle: Spaced\nsources:\n  - { resource: /src/Two Words.pdf }\n---\nbody\n`)
assert.deepEqual(readDoc(join(repo, 'docs/concepts/spaced.md')).sources, ['/src/Two Words.pdf'])
assert.equal(coverage(repo, ['docs'], ['src/Two Words.pdf']).length, 1, 'a source path with a space did not resolve')
assert.deepEqual(readDoc(join(repo, 'docs/concepts/old.md')).sources, ['../../src/b.ts'])

const hits = coverage(repo, ['docs'], ['src/a.ts', 'src/b.ts'])
assert.equal(hits.length, 2, `expected both dialects to resolve, got ${hits.map(h => h.path)}`)
assert.ok(!hits.some((h) => h.path.endsWith('AGENTS.md')), 'a router was treated as a doc')
const matched = hits.flatMap((h) => h.matched)
assert.deepEqual(matched.sort(), ['src/a.ts', 'src/b.ts'],
  'matched must hold resolved repo-relative paths, or covered files get reported as gaps')

for (const [label, hits_, gaps] of [['populated', hits, []], ['empty', [], ['src/z.ts']]]) {
  const out = frame({ slug: 's', title: 't', bundles: ['docs'], hits: hits_, gaps })
  const widths = new Set(out.split('\n').map((l) => [...l].length))
  assert.equal(widths.size, 1, `${label} frame is ragged: ${[...widths].join(', ')}`)
  assert.ok(out.includes('ELI14'), `${label} frame is missing the ELI14 block`)
  assert.ok(!/reply:? c\b/i.test(out), `${label} frame prints a bare "reply c" affordance`)
}
console.log('ok — dialects resolve, routers skipped, no phantom gaps, frame square')
