#!/usr/bin/env node
// ship-it verify — the loop's verifier and stop rule, as a check rather than a paragraph.
//
//   node verify.mjs done <tickets/.../slug.md>   may this ticket move to done/?   exit 1 = no
//   node verify.mjs lint [--repo DIR]            tracker lint over every state    exit 1 = violations
//   node verify.mjs preflight [--repo DIR]       lint + everything a human must decide before claiming
//
// Field data (942 done tickets, Sept 2026): 36% had no QA block, 6% blew the review cap, the prose
// lint was never run. Only `kind` is schema-checked: the loop branches on it; lane/category gate nothing
// and agents kept inventing values for them (ponytail: enforce what is read, not what is written). Every rule here already existed in LOOP.md/TRACKER.md; this only makes them
// refuse instead of advise. Prints one violation per line; silence is a pass.

import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, basename, resolve } from 'node:path'

const KINDS = new Set(['afk', 'hitl'])
const STATES = ['needs-triage', 'needs-info', 'ready', 'in-progress', 'in-review', 'done', 'regression', 'wontfix']
const REVIEW_CAP = 2 // reviewRounds may reach 2 (one followup); 3+ means the cap was ignored

function frontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/)
  const fm = {}
  if (!m) return fm
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([A-Za-z]+):\s*(.*)$/)
    if (kv) fm[kv[1]] = kv[2].trim().replace(/^"(.*)"$/, '$1')
  }
  return fm
}
const isNull = (v) => v === undefined || v === '' || v === 'null' || v === '[]'

function section(text, name) {
  const i = text.indexOf(`## ${name}`)
  if (i < 0) return ''
  const rest = text.slice(i + name.length + 3)
  const j = rest.search(/\n## /)
  return j < 0 ? rest : rest.slice(0, j)
}

function listState(repo, state) {
  const dir = join(repo, 'tickets', state)
  if (!existsSync(dir)) return []
  return readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => join(dir, f))
}

// --- done gate -------------------------------------------------------------------------------

export function checkDone(path, text = readFileSync(path, 'utf8')) {
  const v = []
  const fm = frontmatter(text)
  const state = basename(resolve(path, '..'))
  if (!['in-review', 'in-progress'].includes(state)) v.push(`not in in-review/ or in-progress/ (found in ${state}/)`)
  if (!KINDS.has(fm.kind)) v.push(`kind must be afk|hitl, got "${fm.kind ?? ''}"`)
  if (isNull(fm.resolution)) v.push('resolution is empty — done/ requires a one-line resolution')
  const rounds = Number(fm.reviewRounds)
  if (!isNull(fm.reviewRounds) && rounds > REVIEW_CAP) v.push(`reviewRounds ${rounds} exceeds cap ${REVIEW_CAP} — park to regression/, do not commit`)

  const qa = section(text, 'QA Reports')
  const verified = /###[^\n]*—\s*(verified|pass)/.test(qa)
  if (!verified) v.push('no QA block headed "— verified" or "— pass" — nothing on record says this was checked')
  if (state === 'in-review' && fm.kind !== 'hitl' && !/reviewed:\s*perfect/.test(qa)) v.push('non-hitl ticket in in-review/ has no "reviewed: perfect" — review did not return clean')
  if (state === 'in-progress' && !/fast-lane/.test(qa)) v.push('committing from in-progress/ is the fast lane only — QA block must say "fast-lane" and name the test')

  const ac = section(text, 'Acceptance criteria')
  if (!/- \[[ x]\]/.test(ac)) v.push('no acceptance criteria — nothing to verify against')
  else if (!/- \[x\]/.test(ac)) v.push('no acceptance criterion is checked')
  return v
}

// --- lint --------------------------------------------------------------------------------------

export function lint(repo) {
  const v = []
  for (const state of STATES) {
    for (const f of listState(repo, state)) {
      const fm = frontmatter(readFileSync(f, 'utf8'))
      const rel = `tickets/${state}/${basename(f)}`
      if (!KINDS.has(fm.kind)) v.push(`${rel}: kind "${fm.kind ?? ''}" not afk|hitl`)
      if (state === 'done' && isNull(fm.resolution)) v.push(`${rel}: done/ without resolution`)
      if (state === 'in-progress' && isNull(fm.claimedAt)) v.push(`${rel}: in-progress/ with unstamped claimedAt`)
      if (state === 'in-review' && fm.kind === 'afk' && isNull(fm.reviewRounds)) v.push(`${rel}: afk in in-review/ without reviewRounds`)
      if (state === 'in-review' && !isNull(fm.reviewRounds) && Number(fm.reviewRounds) > REVIEW_CAP) v.push(`${rel}: reviewRounds ${fm.reviewRounds} over cap — park to regression/`)
    }
  }
  return v
}

// --- preflight ---------------------------------------------------------------------------------

export function preflight(repo, now = Date.now()) {
  const out = lint(repo)
  const age = (iso) => isNull(iso) ? '?' : `${Math.round((now - Date.parse(iso)) / 3.6e6)}h`
  for (const f of listState(repo, 'in-progress')) {
    const fm = frontmatter(readFileSync(f, 'utf8'))
    out.push(`tickets/in-progress/${basename(f)}: claimed ${age(fm.claimedAt)} ago — prior work in tree? resume; none? ask before releasing`)
  }
  for (const f of listState(repo, 'in-review')) {
    const fm = frontmatter(readFileSync(f, 'utf8'))
    if (fm.kind === 'hitl') continue // waiting on a human by design
    out.push(`tickets/in-review/${basename(f)}: afk review never returned (updated ${age(fm.updatedAt)} ago) — re-review, accept, or release; never leave it`)
  }
  return out
}

// --- cli ---------------------------------------------------------------------------------------

if (process.argv[1] && resolve(process.argv[1]) === new URL(import.meta.url).pathname) {
  const [cmd, ...rest] = process.argv.slice(2)
  const ri = rest.indexOf('--repo')
  const repo = ri >= 0 ? resolve(rest[ri + 1]) : process.cwd()
  let v
  if (cmd === 'done' && rest[0]) v = checkDone(rest[0])
  else if (cmd === 'lint') v = lint(repo)
  else if (cmd === 'preflight') v = preflight(repo)
  else { console.error('usage: verify.mjs done <ticket.md> | lint [--repo DIR] | preflight [--repo DIR]'); process.exit(2) }
  for (const line of v) console.log(line)
  process.exit(v.length ? 1 : 0)
}
