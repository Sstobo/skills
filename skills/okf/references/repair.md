# Repair pass

Run this inside the repo, by the agent already working there. One area or the whole bundle. It finds fiction, duplication and unrouted docs; it proposes deletions and moves, and applies them only after one approval. Nothing here is automated beyond the commands shown.

Bundle root is wherever `sources:` frontmatter lives — usually `docs/`. Run the commands from the repo root; they assume `docs/`, so substitute your bundle root if it differs. Entry files are `AGENTS.md`, `CLAUDE.md`, `README.md`, `CONTEXT.md`, `docs/index.md`.

## 1. Fiction — a doc that names something that does not exist

```bash
# every declared source in frontmatter, checked against the tree.
# Prints what it checked: a run that verifies nothing must not look like a pass.
python3 - <<'EOF'
import pathlib, re
docs = entries = 0; miss = []
for d in sorted(pathlib.Path("docs").rglob("*.md")):
    t = d.read_text(errors="ignore")
    if not t.startswith("---"): continue
    lines = t.split("---", 2)[1].splitlines()
    try: i = next(k for k, l in enumerate(lines) if l.rstrip() == "sources:")
    except StopIteration: continue
    docs += 1
    for l in lines[i+1:]:
        if not l.strip(): continue
        if not l.startswith((" ", "\t", "-")): break      # next top-level key
        s = l.strip()
        if not s.startswith("- "): continue
        entries += 1
        v = s[2:].strip()
        m = re.search(r'resource:\s*"([^"]+)"', v) or re.search(r'resource:\s*([^,}]+)', v)
        path = (m.group(1) if m else v).strip().strip('"').rstrip("}").strip()
        if path and not pathlib.Path(path.lstrip("/")).exists(): miss.append((str(d), path))
for d, p in miss: print("MISSING", d, p)
print(f"docs with sources={docs}  entries checked={entries}  missing={len(miss)}")
EOF
# references to tooling that was removed
grep -rnE --include='*.md' 'okf\.mjs|okf (check|drift|index|noise|status|restamp)|generated:|verified:' . --exclude-dir=node_modules --exclude-dir=tickets
```

- A doc whose source is missing: retarget the source if the file moved, otherwise retire the doc. Missing sources outrank everything else in this pass.
- **Read the counts line before believing the result.** Two ways this check lies: a naive regex over the frontmatter splits on braces and quotes and reports dozens of phantom missing paths (one run produced 89, of which 3 were real), and a parser that silently matches nothing reports a clean zero. `entries checked` near zero, or wildly below the number of docs, means the parser is broken, not that the bundle is healthy.
- A file whose only content is a dead command (`log.md` with a "settled command" is the known case): delete it and every inbound link to it.
- `generated:` / `verified:` stamps and the `{ resource: }` form: strip only in docs you are already editing.

## 2. Router audit — entry files carrying facts

Read each entry file in full. For each line holding a symbol, a path, a URL, an env var, a number or a rule:

```bash
grep -rl --include='*.md' -- '<the claim>' docs/
```

| Result | Action |
| --- | --- |
| Already in a doc | Trim the entry file to a digest line plus the link. A table copied verbatim is the common case. |
| Nowhere, and it is a why / invariant / landmine | Write the doc, then trim. |
| Nowhere, and it is a listing (env vars, scripts, directories) | Point at the file that is the listing (`.env.example`, `package.json`, the directory) and delete the copy. |
| A rule with no doc and no guard | Either a `Convention` doc that says "unenforced" in its body, or drop it from the digest. Never leave it as a bare bullet. |

Verify every path and command the entry file cites still exists before you keep it.

`CONTEXT.md` gets one extra check: any entry longer than about three sentences, or holding a
dated correction ("until 2026-…"), is a doc in disguise. Cut the entry to the current
meaning and move the rest into the covering doc (write it if none exists). Also replace
`file.ts:NN` cites in every entry file with the symbol name.

## 3. Duplication, catch-alls and rotten anchors

Three checks, each a single command. Skipping them is how a repair pass ends up cosmetic:
the first run of this pass on one repo did steps 1, 2 and 4 and left a 4.3k-word glossary,
a 4.6k-word paraphrase doc and 66 stale line cites in place, because nothing here asked.

**3a. The same fact in three places.** Pick the five or six highest-consequence claims in the
bundle (money paths, tenancy rules, the single-flight lock) and grep each:

```bash
grep -rl --include='*.md' -- '<claim>' . --exclude-dir=node_modules --exclude-dir=tickets
```

A claim in an entry file, `CONTEXT.md` *and* a doc has three places to drift. Keep it in the
doc; the other two get a one-line digest and a link.

**3b. The catch-all.** Grep a dozen unrelated symbols and note which doc matches nearly all
of them:

```bash
for s in <symbol1> <symbol2> …; do grep -rl --include='*.md' -- "$s" docs; done | sort | uniq -c | sort -rn | head
```

The doc at the top of that list (`architecture.md`, `overview.md`) is a paraphrase
catch-all. Run a full **verify** on it: open every source, delete what restates code, keep
routing and cross-file invariants, date every correction. Expect to cut half or more; one
run cut 60% and found twelve wrong claims in the process.

**3c. Line anchors.**

```bash
grep -rnoE --include='*.md' '`[][A-Za-z0-9_./-]+\.(ts|tsx|json|py|go|rs):[0-9]+' docs CONTEXT.md AGENTS.md
```

Every hit outside a dated-history sentence becomes the symbol name at that location
(`resolveRoll` in `x.ts`), verified by opening the file. Read the line before replacing it:
on one run ten of 66 anchors pointed at the wrong code, and one described a guard deleted a
week earlier. Those are contradictions to fix and date, not just numbers to drop.

Parallelise 3b and 3c as two agents; they touch disjoint files if the catch-all is excluded
from the sweep.

## 4. Unrouted docs — markdown in the bundle with no `sources`

```bash
grep -rL --include='*.md' '^sources:' docs | grep -v 'index.md$'
```

Per-folder `index.md` files are routers, not docs; leave them.

For each: it is a Reference (verbatim, leave it, describe it from a sibling doc), a dated record (`Audit`, add frontmatter with the commit or ticket as its source), a real doc missing its frontmatter (add the four fields, invalidators only), or not knowledge at all (propose moving it out of the bundle). Do not type a doc to make it look covered; a directory or a guessed path as a source is worse than none.

## 5. Verify what you touched, then reconfirm it

Every doc you edited or wrote in steps 1–4: open its sources and read the doc against them. Fix what is wrong, delete what is paraphrase, date any correction. This is the step that finds real errors; do not skip it because the frontmatter now looks right.

Then go back over your own output, because a repair pass generates claims as fast as it retires them. Three habits catch most of what it gets wrong:

- **Re-derive the numbers.** Every count in your report — anchors replaced, contradictions found, words before and after — is a claim. Derive each from the repo (`git show`, a fresh grep), not from your own running tally or a subagent's summary. In one pass the self-reported anchor count was short by 19 and the contradiction count long by one, because both were sums of what agents said rather than of what the tree showed.
- **Re-check anything a subagent told you**, hardest of all where it echoes context you put in the brief. A delegated finding is a claim, and a brief that hands over "context you need" as settled fact laundries your assumptions into the bundle.
- **Prove your own greps.** A "lives nowhere" result is the premise of every deletion in this pass, and it is the easiest thing to get wrong: case, wording, a symbol vs a phrase. Confirm absence a second way before you cut anything.

A pass that has not been re-derived is a draft, and should be reported as one.

## 6. Report, approve, commit

Before changing anything that deletes or moves a file, show one list:

```
DELETE  docs/log.md                 dead okf.mjs command; inbound: CLAUDE.md:44
TRIM    AGENTS.md §Production        verbatim copy of docs/production-surface.md
WRITE   docs/conventions/routes-thin.md   rule in CLAUDE.md §5, no doc, no guard
MOVE    docs/notes/brainstorm.md → notes/   no sources, not knowledge
words   entry files 873 → ~420, bundle 6 210 → 6 180
```

Trims and frontmatter additions are revertible and need no approval. Deletes and moves wait for a yes. Then one commit for the whole pass, message naming the area — **staging explicit paths**, never `git add -A` and never a bare `git commit --amend`, both of which sweep whatever else is in the tree or the index into your commit.

Say which of your own claims you re-derived and which you are still taking on trust. A repair report that reads as uniformly confident is the one to disbelieve.

## What this pass does not do

Sweep comments out of source files ([comments.md](comments.md)), restructure the bundle's folders, or add machinery. If the pass keeps finding the same fiction, that is a field report for the skill, not a reason to script the check.
