# HTTP API, images and videos

Source: `https://docs.convex.dev/ai-gateway/api.md` and `/images-and-videos.md`. Images, videos and decisions are **alpha**: shapes may change, so re-check the live page before building on them.

## Raw fetch

Base URL `https://ai-gateway.convex.dev`. Header `Authorization: Bearer <token>`. JSON bodies, 16 MiB max.

```ts
import { action } from "./_generated/server";
import { v } from "convex/values";
import { getServiceToken } from "convex/server";

export const chat = action({
  args: { prompt: v.string() },
  handler: async (_ctx, { prompt }) => {
    const token = await getServiceToken("ai-gateway");
    const res = await fetch("https://ai-gateway.convex.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    return await res.json();
  },
});
```

## Endpoints

| Endpoint | Body shape | Notes |
|----------|-----------|-------|
| `GET /v1/models` | none | `owned_by` = provider prefix. Jev not listed |
| `POST /v1/chat/completions` | OpenAI Chat | `stream: true` → SSE. Other OpenAI fields (`tools`, `response_format`, …) forwarded |
| `POST /v1/embeddings` | OpenAI Embeddings | `input` up to 512 items |
| `POST /v1/messages` | Anthropic Messages | `model`, `messages`, `max_tokens` required. Errors use Anthropic's error shape |
| `POST /v1/responses` | OpenAI Responses | Stateless. `store: true` and `previous_response_id` rejected. `metadata` preserved |
| `POST /alpha/decisions` | Jev | `model`, `state`, `questions`. No streaming |
| `POST /v1/images/generations` | `model`, `prompt`, `size`, `n` | Returns URLs or `b64_json`. No streaming |
| `POST /v1/videos/generations` | `model`, `prompt`, + options | Sync, one video, 10 min timeout, 64 MiB |
| `POST /v1/videos` | same + `webhook_url` | Async, returns 202 `{ id, operation, webhook_secret }` |
| `POST /v1/videos/status` | `{ operation }` | `pending` / `completed` / `error` |
| `POST /v1/videos/download` | `{ operation }` | 409 if not ready. Refetches every call |

Convex replaces response IDs with its own and strips provider-identifying fields.

**Rejected routing fields.** Chat/embeddings/images: `provider`, `route`, `models`, `transforms`, `plugins`, `preset`. Messages adds `fallbacks`, `session_id`, `speed` (no `transforms`/`preset`). Responses adds `session_id`. Decisions also rejects `fallbacks`, `speed`, `trace`, `session_id`, `user`, `stream`.

## Jev over HTTP

Question types over HTTP are `choice` (criteria map → `choice`), `score` (ordered criteria array → `score`), `noul` (yes/no → `noul`, 0 to 1). The AI SDK calls `noul` `boolean`. `choice`/`score` answers may include `confidence` and `probabilities`. `usage.cost` is in USD.

```json
{
  "model": "typesafe/jev-1.13",
  "state": { "ticket": "All users are unable to sign in. There is no workaround." },
  "questions": {
    "priority": {
      "type": "choice",
      "instructions": "Choose the support ticket's priority.",
      "criteria": {
        "urgent": "An outage is blocking users.",
        "normal": "A bug affects users but has a workaround."
      }
    }
  }
}
```

## Images (alpha)

```ts
import { generateImage } from "ai";
import { convexGateway } from "@convex-dev/ai-sdk-provider";

const { images } = await generateImage({
  model: convexGateway.imageModel("openai/gpt-image-1"),
  prompt: "A mountain lake at sunrise",
});
```

Save results to Convex file storage (`ctx.storage.store(new Blob([bytes]))`).

## Videos, sync (alpha)

```ts
import { experimental_generateVideo as generateVideo } from "ai";
import { convexGateway } from "@convex-dev/ai-sdk-provider";

const { video, providerMetadata } = await generateVideo({
  model: convexGateway.videoModel("google/veo-3.1"),
  prompt: "A camera pan across a mountain lake",
  duration: 8,
  aspectRatio: "16:9",
  resolution: "1280x720",
});
const bytes = video.uint8Array; // store in file storage
const cost = providerMetadata?.convexGateway?.cost;
```

- Waits and downloads. Limits are 10 minutes and 64 MiB. Node actions also time out at 10 minutes, so use async for anything slow.
- `n > 1` becomes separate requests (separate charges).
- **Cancelling or timing out does not cancel generation or its cost.**
- An image in the prompt becomes the first frame. `frameImages`, `inputReferences`, `generateAudio` are supported. `fps` is not.
- `providerOptions.convexGateway`: `resolution`, `generate_audio`, `frame_images`, `input_references`. Standard SDK options win. Supported values follow OpenRouter's model docs.

## Videos, async (alpha)

Flow: **insert job row → action submits → save handles → callback and/or poll → download → file storage.**

1. Insert a job doc first. Pass its ID as `requestId`.
2. Submit from an action:

```ts
import { experimental_startVideo as startVideo } from "ai";
import { convexGateway } from "@convex-dev/ai-sdk-provider";

const modelId = "google/veo-3.1";
const started = await startVideo({
  model: convexGateway.videoModel(modelId),
  prompt: "A camera pan across a mountain lake",
  duration: 8,
  webhookUrl: `${process.env.CONVEX_SITE_URL}/video-complete?requestId=${requestId}`,
  maxRetries: 0, // a lost response can still mean a paid job was accepted
});
// save on the job BEFORE the action returns:
// modelId, started.operation,
// started.providerMetadata?.convexGateway?.inferenceId,
// started.providerMetadata?.convexGateway?.webhookSecret  (private)
```

3. Callback in an HTTP action (`convex/http.ts`):

```ts
import { verifyVideoWebhook } from "@convex-dev/ai-sdk-provider";

const event = await verifyVideoWebhook({
  body: await request.text(), // raw body
  signature: request.headers.get("x-convex-video-signature"),
  secret: savedJob.webhookSecret,
});
if (event.id !== savedJob.inferenceId) {
  return new Response("Wrong job", { status: 400 });
}
// mutation: dedupe on (event.id, event.status); on "completed" schedule a download action
return new Response(null, { status: 204 });
```

   Return non-2xx if the secret isn't saved yet. Terminal statuses: `completed`, `failed`, `cancelled`, `expired`. Callbacks can repeat and are best effort.

4. Poll and download in an action:

```ts
const model = convexGateway.videoModel(savedJob.modelId);
const status = await model.getStatus({ operation: savedJob.operation });
if (status.status === "completed") {
  const result = await model.download({ operation: savedJob.operation });
  const video = result.videos[0];
  const cost = result.providerMetadata?.convexGateway?.cost;
}
```

**Gotchas**
- Webhook URL must be the deployment's own HTTPS `<deployment>.convex.site` origin. No redirects. If `CONVEX_SITE_URL` is a custom domain, use the default `convex.site` origin instead.
- Local dev: omit `webhookUrl` (localhost is rejected) and poll.
- Operations expire after **7 days**, and the provider may keep the video for less time. Download promptly.
- Add a cron that checks unfinished jobs, as a fallback for missed callbacks.
- "Asynchronous video generation is not configured" → contact Convex support.
