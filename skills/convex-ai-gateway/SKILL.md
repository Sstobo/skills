---
name: convex-ai-gateway
description: Call AI models from Convex actions through the Convex AI Gateway, with no provider accounts or API keys. Covers @convex-dev/ai-sdk-provider (convexGateway) with the Vercel AI SDK, the OpenAI SDK pointed at the gateway, the Convex Agent and RAG components, embeddings for vector search, classifying or scoring data with Jev via the alpha Decisions endpoint, image and video generation, local dev, errors, and billing/spend limits. Use when adding AI chat, summaries, RAG, embeddings, classification, or media generation to a Convex app, when swapping models, or when debugging AiGatewayDisabled, AiGatewayUnavailable, getServiceToken, or gateway 4xx/5xx errors. Triggers on "AI Gateway", "convex gateway", convexGateway, @convex-dev/ai-sdk-provider, getServiceToken("ai-gateway"), ai-gateway.convex.dev.
---

# Convex AI Gateway

Convex holds the provider credentials. Your **action** gets a short-lived, deployment-scoped token and calls any of hundreds of models. Usage lands on the Convex invoice at OpenRouter's rates, attributed per project and per function.

Synced against docs.convex.dev/ai-gateway on 2026-10-03. The gateway is new and parts are alpha. **Code and live docs win over this file.** Every docs page has a raw markdown version: append `.md` (e.g. `https://docs.convex.dev/ai-gateway/setup.md`).

## Requirements

- Team on a **paid plan** (Starter counts).
- `convex` **1.45+** (**1.46+** for local dev).
- Calls run only inside **actions** (`action` / `internalAction`), never queries or mutations.
- Node actions (`"use node"`): set `"node": { "nodeVersion": "22" }` (or `"24"`) in `convex.json`. The default runtime needs nothing.
- AI SDK path: `@convex-dev/ai-sdk-provider` **0.2.1+**, `ai` **7.0.105+**.

## Pick an interface

| Need | Use |
|------|-----|
| Default. Text, streaming, structured output, tools | Vercel AI SDK + `convexGateway(model)` |
| Already on the OpenAI SDK | `new OpenAI({ baseURL, apiKey: () => getServiceToken("ai-gateway") })` |
| Threads, memory, tool loops | `@convex-dev/agent` with `languageModel: convexGateway(...)` |
| Anthropic-native features (Messages API) | `convexGateway.messages("anthropic/...")` |
| OpenAI Responses features | `convexGateway.responses("openai/...")`. Stateless: no `store: true`, no `previous_response_id` |
| Embeddings / RAG | `convexGateway.embeddingModel(...)` |
| Classify or score data (alpha) | `evaluate` + `convexGateway.evaluationModel("typesafe/jev-1.13")` |
| Images / video (alpha) | `references/http-and-media.md` |
| No SDK | raw `fetch`, see `references/http-and-media.md` |

## AI SDK (default)

```bash
npm install @convex-dev/ai-sdk-provider@^0.2.1 ai
```

```ts
// convex/summaries.ts
import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { generateText } from "ai";
import { convexGateway } from "@convex-dev/ai-sdk-provider";

export const summarize = internalAction({
  args: { text: v.string() },
  handler: async (_ctx, { text }) => {
    const { text: summary } = await generateText({
      model: convexGateway("openai/gpt-4o-mini"),
      system: "Summarize the supplied text in three concise bullet points.",
      prompt: text,
    });
    return summary;
  },
});
```

Streaming: `streamText({ model: convexGateway(...), prompt })` then `for await (const chunk of result.textStream)`. The docs confirm `generateText`, `streamText`, `embed`, `embedMany`. The launch post also names `generateObject`. It goes through Chat Completions and should work, but verify it in your app before you rely on it.

`convexGateway(model)` uses Chat Completions across every provider. Only switch to `.messages()` / `.responses()` when you need an endpoint-specific feature.

## OpenAI SDK

```bash
npm install openai
```

```ts
import OpenAI from "openai";
import { getServiceToken } from "convex/server";

// inside an action handler
const openai = new OpenAI({
  baseURL: "https://ai-gateway.convex.dev/v1",
  apiKey: () => getServiceToken("ai-gateway"), // function, not a string: runtime refreshes it
});
const completion = await openai.chat.completions.create({
  model: "anthropic/claude-sonnet-5",
  messages: [{ role: "user", content: prompt }],
});
```

## Agent and RAG components

```bash
npm install @convex-dev/agent @convex-dev/ai-sdk-provider
```

```ts
import { Agent } from "@convex-dev/agent";
import { convexGateway } from "@convex-dev/ai-sdk-provider";
import { components } from "./_generated/api";

const agent = new Agent(components.agent, {
  name: "Support agent",
  languageModel: convexGateway("openai/gpt-4o-mini"),
  instructions: "You answer questions about our product.",
});
```

Workflows that call `agent.generateText` use the same model. For the RAG component, pass `convexGateway.embeddingModel(...)` as its embedding model.

## Embeddings

```ts
import { embed, embedMany } from "ai";
import { convexGateway } from "@convex-dev/ai-sdk-provider";

const model = convexGateway.embeddingModel("openai/text-embedding-3-small");
const { embedding } = await embed({ model, value: "How do I invite a teammate?" });
const { embeddings } = await embedMany({ model, values: chunks });
```

The gateway caps a batch at 512 inputs. `embedMany` splits larger batches for you; raw `/v1/embeddings` calls must split them yourself. Store vectors in a table with a `vectorIndex` whose `dimensions` match the model (1536 for `text-embedding-3-small`), then query with `ctx.vectorSearch` inside an action.

## Decisions with Jev (alpha)

```ts
import { experimental_evaluate as evaluate } from "ai";
import { convexGateway } from "@convex-dev/ai-sdk-provider";

const decision = await evaluate({
  model: convexGateway.evaluationModel("typesafe/jev-1.13"),
  state: { ticket: "Customer cannot sign in" },
  questions: {
    priority: {
      type: "choice",
      instructions: "Choose the response priority",
      criteria: { urgent: "Respond now", normal: "Respond today" },
    },
  },
});
decision.answers.priority.choice;
```

Question types: `choice`, `score`, `boolean` (returns `probability` 0 to 1). Keep one decision per question and combine the answers in code. Jev models are not listed by `/v1/models`.

## Model IDs

- Form is `provider/model`. Anthropic uses **dots**: `anthropic/claude-sonnet-4.5`, `anthropic/claude-haiku-4.5`. The Anthropic API's hyphenated IDs (`claude-sonnet-4-5`) will fail.
- `:batch` and `:free` suffixed variants exist.
- The list changes constantly. Don't hardcode from memory. Check `https://docs.convex.dev/ai-gateway/models.md` or call `GET /v1/models`.
- That docs page lists chat models only. The embedding, image and video slugs used here (`openai/text-embedding-3-small`, `openai/gpt-image-1`, `google/veo-3.1`) come from the setup and media pages. For anything else, check `GET /v1/models` or OpenRouter's catalog.
- Swapping or A/B testing a model means changing the slug. Nothing else changes.

## Local development

```bash
npx convex login
npx convex deployment select local
npx convex dev
```

Needs `convex` 1.46+, an up-to-date local backend (accept the upgrade prompt), and a deployment linked to a project whose team has gateway access. Restart `npx convex dev` if it was already running when you logged in. Anonymous local deployments can't use it. Inference runs in the cloud and bills the linked team.

## Rules

- **Never** return the token to a client, put it in env vars, or cache it yourself. The runtime caches and refreshes it. Call `getServiceToken("ai-gateway")` each time you need it.
- Frontend never calls the gateway. The client calls a mutation or action, which then calls the model. Use `internalAction` plus a public wrapper that does auth checks when user-triggered, so anonymous users can't spend your money.
- Long completions can hit the **action timeout** (10 min in Node, 30 min in the Convex runtime). That surfaces as an action error, not a gateway error.
- Routing fields are rejected (`provider`, `route`, `models`, `transforms`, `plugins`, `preset`, and endpoint-specific extras). Convex picks the upstream.
- Self-hosted Convex can't use the gateway. Store a provider key as an env var and call the provider SDK directly.

## Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `AiGatewayDisabled` (at token mint) | Free plan or gateway disabled for team | Upgrade, or email support@convex.dev |
| `AiGatewayUnavailable` | Anonymous/outdated local deployment, or self-hosted | Log in, update CLI, restart `npx convex dev`, accept backend upgrade. Self-hosted: use your own key |
| 401 `invalid_api_key` | Missing/bad bearer token | Pass `getServiceToken` result; on OpenAI SDK pass the function |
| 400 `unsupported_parameter` | Sent a routing field | Remove it |
| 400 `too_many_inputs` | >512 embedding inputs | Use `embedMany` or split |
| 413 `request_too_large` | Body >16 MiB | Shrink input |
| 502/503 `upstream_error` | Provider temporarily down | Retry with backoff (`Retry-After` is forwarded) |

Provider validation errors (unknown model, bad args) keep the provider's status code.

## Cost and spend control

- Dashboard: team **Usage** page → AI Gateway section (daily spend per project/model). The function breakdown's **AI** tab shows spend per function.
- **Deployment limit**: deployment Settings → Usage Limits → metric "AI Gateway", daily/monthly dollar disable threshold (prod/preview also get warnings). Hitting it disables **the whole deployment**, not just AI calls.
- **Team limit**: Team Settings → Billing, warning and disable thresholds. Gateway spend counts with all other Convex usage. The disable threshold **disables the team's projects**. Choose it with the whole app in mind.
- Limits are checked when a token is minted. Requests already in flight can finish past the limit.
- Set a limit **before** exposing an AI feature to users.
