# convex-ai-gateway

An agent skill for calling AI models from Convex actions through the Convex AI Gateway. Convex holds the provider credentials, so the app needs no OpenAI, Anthropic or other provider keys. Spend is billed on the Convex invoice.

## When to use it

- Adding chat, summaries, structured output, RAG, embeddings or classification to a Convex app
- Generating images or video from an action (alpha)
- Switching models, or deciding between the AI SDK, OpenAI SDK, Agent component or raw `fetch`
- Debugging `AiGatewayDisabled`, `AiGatewayUnavailable`, 401/400/413/502 gateway errors
- Setting spend limits before shipping an AI feature

## What it covers

- `@convex-dev/ai-sdk-provider` (`convexGateway`) with the Vercel AI SDK: text, streaming, `.messages()` / `.responses()`, embeddings
- The OpenAI SDK pointed at `https://ai-gateway.convex.dev/v1` with `getServiceToken("ai-gateway")`
- `@convex-dev/agent` and the RAG component
- Jev "Decisions" (alpha) for classifying or scoring data with `evaluate`
- Model ID format, local development, token handling rules, the error table, billing and usage limits
- Raw HTTP endpoints, image generation, and sync/async video with webhook verification (reference file)

## Versions it targets

Checked against docs.convex.dev/ai-gateway on 2026-10-03:

- `convex` 1.45+ (1.46+ for local deployments). Latest on npm: 1.46.0
- `@convex-dev/ai-sdk-provider` 0.2.1+ (latest: 0.2.1)
- `ai` 7.0.105+ (latest: 7.0.127)
- Requires a Convex team on a paid plan. Not available on self-hosted Convex.

The gateway is new and parts of it are alpha. The skill tells the agent to defer to the live docs (`https://docs.convex.dev/ai-gateway/*.md`) when they disagree.

## Install

```bash
npx skills add Sstobo/skills --skill convex-ai-gateway
```

## Example prompts

- "Add an action that summarizes a support ticket with the Convex AI Gateway."
- "Our embeddings action fails with too_many_inputs. Fix it."
- "Set this app up so it can't spend more than $50 a day on AI."

## Files

- [`SKILL.md`](SKILL.md): requirements, choosing an interface, AI SDK / OpenAI SDK / Agent examples, embeddings, Jev decisions, model IDs, local dev, rules, errors, billing
- [`references/http-and-media.md`](references/http-and-media.md): raw `fetch`, the full endpoint table, rejected routing fields, Jev over HTTP, image and video generation (sync and async with webhooks)
