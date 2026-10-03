---
name: p
description: Sweep up everything in the working tree, commit it as one clean commit, and push it (built for solo work directly on main). Use when the user says "/p", "p", "sweep it all up", "commit everything and push", or "commit all and push".
---

# P

Sweep it all up. Everything in the tree, one commit, pushed. This is not
limited to your own work: other agents' changes, deletions and untracked
files all go in. Invoking `/p` IS the authorization to commit and
push everything.

This skill is built for one solo developer working directly on one main
trunk. No PR, no branch, no review step. `git push` pushes the current branch
to its upstream, so it only lands on main if you are on main.

1. `git branch --show-current`, `git status --short --untracked-files=all`
   and `git diff --stat HEAD` to see what is there. Plain `git status` shows
   a new directory as one line and hides the files inside it, including any
   `.env` in there. If the branch is not the trunk, stop and ask before going on.
2. Look before sweeping. Leave out, and name in the report, anything that
   should never be committed:
   - secrets: `.env*` (except `.env.example`), keys, tokens, credentials
   - junk: `.DS_Store`, logs, build output, `node_modules`, large binaries
   If one belongs in `.gitignore`, say so. Do not edit `.gitignore` unasked.
3. `git add -A`, then `git reset -- <path>` for anything excluded in step 2.
   Check `git diff --cached --name-only` to confirm none of them are staged.
4. Read `git diff --cached` enough to write an honest message. If it shows a
   credential value inside a file (an API key, a password, a private key),
   unstage that file too and name it in the report. Message: a short
   subject naming the main themes, and a body with one line per area touched
   when there is more than one. Match the repo's existing log style.
5. `git commit`, then `git push`. If the push is rejected,
   `git pull --rebase --autostash` and push again. On a rebase conflict,
   stop and show the conflicting files. Do not guess a resolution.

Do not freak out:

- Nothing to commit? Push whatever is unpushed and say so in one line.
- Never revert, reset --hard, checkout, restore, or amend to "clean up".
  `/p` commits what is there. It does not judge it.

Report in one or two lines: the commit subject, what was left out and why,
and whether the push landed.
