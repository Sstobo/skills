# p

Commits everything in the working tree as one commit and pushes it. Everything means everything: other agents' changes, deletions and untracked files all go in, not just the current session's work. Calling it is the authorization to commit and push. It is built for one developer working directly on `main` with no branches or pull requests; if you are not on your trunk branch it stops and asks.

## Use it when

- You want everything committed and pushed in one go, with an honest message
- You work solo, trunk-based, and do not need a review step

Do not use it on a shared branch or where pushes need review.

## How it works

1. Checks the branch, lists every changed and untracked file (with `--untracked-files=all`, so files inside new folders are visible) and the diff stat.
2. Leaves out anything that should never be committed and names it in the report: `.env*` files other than `.env.example`, keys, tokens, credentials, `.DS_Store`, logs, build output, `node_modules`, large binaries. It suggests `.gitignore` entries but does not edit `.gitignore`.
3. `git add -A`, unstages the excluded paths, and confirms they are not staged.
4. Reads the staged diff to write the message. A file found to contain a credential value is unstaged too.
5. Commits and runs `git push`. If the push is rejected it runs `git pull --rebase --autostash` and pushes again; on a rebase conflict it stops and shows the conflicting files.

It never reverts, hard-resets, checks out, restores or amends. The report is one or two lines: commit subject, what was left out and why, and whether the push landed.

The secret check is the agent reading file names and the diff. It is not a scanner, so for anything sensitive keep a proper `.gitignore` and, if you want a hard guarantee, a pre-commit secret scanner.

## What it needs

- Git, with a remote and an upstream set for the current branch.

## Install

```bash
npx skills add Sstobo/skills --skill p
```

## Example prompts

- "/p"
- "Sweep it all up and push"

## Files

- [`SKILL.md`](SKILL.md): the steps, exclusions and rules
