#!/usr/bin/env node
// ship-it doc-ground — which docs cover the files this ticket touches?
//
// Scans a repo's knowledge bundle for markdown whose frontmatter `sources` name any of
// the scoped paths, and prints the SHIP-IT DOC GROUNDING frame for the agent to fill in
// and show the user.
//
//   node doc-ground.mjs [--slug S] [--title T] [--repo DIR] [--bundle DIR] -- <files...>
//   node doc-ground.mjs --json [--repo DIR] -- <files...>
//
// There is no drift engine and no staleness claim. A doc is verified by reading it
// against its sources, not by a timestamp. This tool routes; it does not judge.
//
// Exit 0 whenever it can print a frame (including zero matches). Exit 2 on usage error.

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const BUNDLES = ['docs', 'knowledge']
const ROUTERS = new Set(['AGENTS.md', 'CLAUDE.md', 'SKILL.md', 'CONTEXT.md', 'CONTEXT-MAP.md', 'index.md', 'README.md', 'log.md'])
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'coverage'])

function usage(code = 2) {
  console.error('usage: doc-ground.mjs [--slug S] [--title T] [--repo DIR] [--bundle DIR] [--json] -- <files...>')
  process.exit(code)
}

function parseArgs(argv) {
  const out = { slug: '<slug>', title: '<title>', repo: process.cwd(), bundles: [], json: false, files: [] }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--') { out.files.push(...argv.slice(i + 1)); break }
    else if (a === '--slug') out.slug = argv[++i]
    else if (a === '--title') out.title = argv[++i]
    else if (a === '--repo') out.repo = resolve(argv[++i])
    else if (a === '--bundle') out.bundles.push(argv[++i])
    else if (a === '--json') out.json = true
    else if (a === '-h' || a === '--help') usage(0)
    else if (a.startsWith('-')) usage(2)
    else out.files.push(a)
  }
  return out
}

function walk(dir, out = []) {
  let entries
  try { entries = readdirSync(dir, { withFileTypes: true }) } catch { return out }
  for (const e of entries) {
    if (e.name.startsWith('.') || SKIP_DIRS.has(e.name)) continue
    const p = join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else if (e.name.endsWith('.md') && !ROUTERS.has(e.name)) out.push(p)
  }
  return out
}

/**
 * Pull `type`, `title`, `description` and `sources` out of a doc's frontmatter.
 * Accepts both the plain list form and the older `- { resource: /path }` form, and
 * ignores everything else (stamps from older bundles are inert).
 */
export function readDoc(path) {
  let text
  try { text = readFileSync(path, 'utf8') } catch { return null }
  const m = text.match(/^---\n([\s\S]*?)\n---/)
  if (!m) return null
  const fm = m[1]
  const field = (k) => fm.match(new RegExp(`^${k}: *(.+)$`, 'm'))?.[1].trim().replace(/^["']|["']$/g, '')
  const block = fm.match(/^sources:\s*\n((?:[ \t]+[-#].*\n?)*)/m)?.[1] ?? ''
  // Stop at a comma, a closing brace or end of line — never at a space. Real bundles
  // carry paths like `/docs/fixtures/Comp Sales Report.pdf`, and splitting on whitespace
  // silently truncates them to a path that cannot resolve.
  const sources = [...block.matchAll(/resource: *([^,}\n]+)|^[ \t]*-[ \t]+([^\s{][^\n]*)/gm)]
    .map((x) => (x[1] ?? x[2] ?? '').trim().replace(/^["']|["']$/g, '').trim())
    .filter(Boolean)
  return { path, type: field('type') ?? '(untyped)', title: field('title') ?? '', description: field('description') ?? '', sources }
}

/** A doc covers a scoped file when any of its sources resolves to that file. */
export function coverage(repo, bundleDirs, files) {
  const wanted = new Set(files.map((f) => relative(repo, resolve(repo, f))))
  const hits = []
  for (const b of bundleDirs) {
    for (const docPath of walk(join(repo, b))) {
      const doc = readDoc(docPath)
      if (!doc) continue
      const matched = []
      for (const src of doc.sources) {
        // a source is repo-relative, doc-relative, or absolute-from-root; try each
        for (const cand of [
          relative(repo, resolve(repo, src.replace(/^\//, ''))),
          relative(repo, resolve(dirname(docPath), src)),
        ]) {
          if (wanted.has(cand) && !matched.includes(cand)) matched.push(cand)
        }
      }
      if (matched.length) hits.push({ ...doc, path: relative(repo, docPath), matched })
    }
  }
  // most-specific first: a doc naming fewer files is a tighter match
  return hits.sort((a, b) => a.sources.length - b.sources.length || a.path.localeCompare(b.path))
}

/** Docs the scoped files have no coverage from at all — worth knowing before you edit. */
function uncovered(repo, files, hits) {
  const covered = new Set(hits.flatMap((h) => h.matched))
  return files.map((f) => relative(repo, resolve(repo, f))).filter((f) => !covered.has(f))
}

function wrapLines(s, width) {
  s = String(s)
  if (s.length <= width) return [s]
  const out = []
  let rest = s
  while (rest.length > width) {
    let breakAt = rest.lastIndexOf(' ', width)
    if (breakAt < width * 0.5) breakAt = width
    out.push(rest.slice(0, breakAt).trimEnd())
    rest = rest.slice(breakAt).trimStart()
  }
  if (rest) out.push(rest)
  return out
}

export function frame({ slug, title, bundles, hits, gaps }) {
  const W = 68
  const inner = W - 2
  const rows = []
  const push = (s) => rows.push(...wrapLines(s, inner).map((p) => `║  ${p}${' '.repeat(inner - p.length)}║`))
  const rule = () => rows.push(`╠${'═'.repeat(W)}╣`)

  rows.push(`╔${'═'.repeat(W)}╗`)
  push('SHIP-IT DOC GROUNDING')
  push(`ticket: ${slug}`)
  push(`title:  ${title}`)
  push(`bundle: ${bundles.length ? bundles.join(' ') : '(none found)'}`)
  rule()
  push('READ BEFORE EDITING')
  if (hits.length) {
    for (const h of hits) push(`- ${h.path}  [${h.type}]`)
  } else {
    push('- (no doc covers these files — read the code, and consider')
    push('   whether this ticket should leave one behind)')
  }
  if (gaps.length && hits.length) {
    rule()
    push('NOT COVERED BY ANY DOC')
    for (const g of gaps) push(`- ${g}`)
  }
  rule()
  push('PROPOSED CODE CHANGES')
  push('- <path>: <one-line intent>   ← agent fills')
  rule()
  push('DOCS TO UPDATE (at the run-level stop)')
  push('- <doc>: <what this change makes wrong, or "none expected">')
  rule()
  push('OUT OF SCOPE (will NOT touch)')
  push('- <path or concern>')
  rule()
  push('ELI14')
  push('- <2-3 plain sentences: what changes, why, what could break.')
  push('  no paths, no symbol names, no jargon>   ← agent fills')
  rows.push(`╚${'═'.repeat(W)}╝`)
  return rows.join('\n')
}

function main() {
  const opts = parseArgs(process.argv.slice(2))
  if (opts.files.length === 0) usage(2)
  const bundles = (opts.bundles.length ? opts.bundles : BUNDLES).filter((b) => {
    try { return statSync(join(opts.repo, b)).isDirectory() } catch { return false }
  })
  const hits = coverage(opts.repo, bundles, opts.files)
  const gaps = uncovered(opts.repo, opts.files, hits)
  if (opts.json) {
    console.log(JSON.stringify({ bundles, docs: hits, uncovered: gaps }, null, 2))
    return
  }
  console.log(frame({ slug: opts.slug, title: opts.title, bundles, hits, gaps }))
  console.log('---')
  console.log(JSON.stringify({ docs: hits.map((h) => ({ path: h.path, type: h.type, matched: h.matched })), uncovered: gaps }, null, 2))
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
