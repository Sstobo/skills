# honest

A short prompt that makes the agent step back and give a straight appraisal of the current work, plan or idea, including whether to keep going or start over. It treats sunk cost as zero, challenges the working assumptions, and has to land on a verdict rather than hedge. It gives the appraisal and does not change anything unless you ask.

## Use it when

- You want an unvarnished opinion of what you are building
- You suspect the approach has piled up patches and might be better restarted
- "Is this any good?" or "What do you actually think?"

## How it works

The answer follows a fixed shape:

1. The verdict in one line: keep it, change it, or scrap it.
2. Up to three reasons, each tied to something actually in the work.
3. The assumption most likely to be wrong.
4. If the verdict is scrap it, what a fresh start looks like in two lines.

## What it needs

Nothing beyond the conversation. No subagents, tools or files.

## Install

```bash
npx skills add Sstobo/skills --skill honest
```

## Example prompts

- "/honest"
- "Be honest, should I keep going with this approach or start over?"

## Files

- [`SKILL.md`](SKILL.md): the prompt and the answer shape
