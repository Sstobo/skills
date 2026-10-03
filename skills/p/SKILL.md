---
name: p
description: Sweep up everything in the working tree, commit it as one clean commit, and push to main. Use when the user says "/p", "p", "sweep it all up", "commit everything and push", or "commit all and push".
---

# P

Sweep it all up. Everything in the tree, one commit, pushed. Unlike `/push`,
this is not limited to your own work: other agents' changes, deletions and
untracked files all go in. Invoking `/p` IS the authorization to commit and
push everything.

One solo developer, one main trunk. No PR, no branch, no review step.

1. `git status` and `git diff --stat HEAD` to see what is there.
2. Look before sweeping. Leave out, and name in the report, anything that
   should never be committed:
   - secrets: `.env*` (except `.env.example`), keys, tokens, credentials
   - junk: `.DS_Store`, logs, build output, `node_modules`, large binaries
   If one belongs in `.gitignore`, say so. Do not edit `.gitignore` unasked.
3. `git add -A`, then `git reset -- <path>` for anything excluded in step 2.
4. Read `git diff --cached` enough to write an honest message: a short
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
