---
name: convex-resend
description: >-
  Send transactional email from a Convex app with the @convex-dev/resend
  component. Covers install and convex.config.ts, RESEND_API_KEY, sendEmail
  from mutations or actions, testMode and Resend test addresses, templates,
  React Email, idempotency keys, status/cancel, the webhook route and
  RESEND_WEBHOOK_SECRET, onEmailEvent handlers, data cleanup crons, and
  sendEmailManually for attachments. Use when adding email to a Convex app or
  debugging emails that never send, stay queued, or never report delivery.
---

# Resend with Convex (`@convex-dev/resend`)

Checked against `@convex-dev/resend` **0.2.8** (npm, 2026-10-03; peers `convex ^1.43.0` and `convex-helpers ^0.1.106`). Source of truth: https://github.com/get-convex/resend (README and `src/client/index.ts`). If this file and the installed package disagree, the package wins.

What the component does for you: it queues sends in your database, batches them to Resend's `/emails/batch` endpoint, retries with backoff through a workpool, sends Resend idempotency keys so a retried batch isn't delivered twice, and stays under Resend's rate limit. You call one method from a mutation or action and it returns immediately.

## Setup

```bash
npm install @convex-dev/resend
npx convex env set RESEND_API_KEY re_...
```

```ts
// convex/convex.config.ts
import { defineApp } from "convex/server";
import resend from "@convex-dev/resend/convex.config.js";

const app = defineApp();
app.use(resend);
export default app;
```

```ts
// convex/email.ts
import { components } from "./_generated/api";
import { Resend } from "@convex-dev/resend";

export const resend: Resend = new Resend(components.resend, {
  testMode: false, // see "Test mode" below. Leave it out while developing.
});
```

Options (all optional):

| Option | Default | Notes |
|---|---|---|
| `apiKey` | `process.env.RESEND_API_KEY` | `sendEmail` throws "API key is not set" if both are empty |
| `webhookSecret` | `process.env.RESEND_WEBHOOK_SECRET` | Needed only for the webhook route |
| `testMode` | **`true`** | Only Resend test addresses are accepted |
| `onEmailEvent` | none | Mutation reference called on each webhook event |
| `initialBackoffMs` | `30000` | First retry delay for failed API calls |
| `retryAttempts` | `5` | |

## Sending

`sendEmail` works with a mutation or action `ctx` (not a query). It enqueues the email and returns an `EmailId`. Delivery happens in the background, so sending from a mutation is fine and is atomic with your other writes.

```ts
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { resend } from "./email";

export const sendWelcome = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) return;
    const emailId = await resend.sendEmail(ctx, {
      from: "Acme <hello@mail.acme.com>",   // must be on a domain you verified in Resend
      to: user.email,                       // string or string[]
      subject: "Welcome to Acme",
      html: `<p>Hi ${user.name}</p>`,       // and/or text
      idempotencyKey: `welcome:${userId}`,  // optional, see below
    });
    await ctx.db.patch(userId, { welcomeEmailId: emailId });
  },
});
```

Other fields: `cc`, `bcc` (string or array), `replyTo` (array), `headers` (array of `{ name, value }`). An older positional form `sendEmail(ctx, from, to, subject, html?, text?, replyTo?, headers?)` also exists.

Content rules, enforced when you enqueue:

- You need `html` or `text`, or a `template`. Supplying neither throws.
- `template` and `html`/`text` together throws.
- `subject` is required unless you use a template.

**Templates** from the Resend dashboard:

```ts
await resend.sendEmail(ctx, {
  from: "Acme <hello@mail.acme.com>",
  to: user.email,
  template: { id: "welcome-v2", variables: { name: user.name, plan: "pro" } }, // values: string | number
});
```

**Idempotency at enqueue.** The component's built-in keys only stop a batch being delivered twice. They don't stop your code enqueueing the same email twice, for example when an action retries. Pass `idempotencyKey` and a second `sendEmail` with the same key returns the first `EmailId` without sending. Concurrent calls are safe because the check runs in the same mutation.

## Test mode

`testMode` defaults to `true`. In test mode every `to`, `cc` and `bcc` must be a Resend test inbox:

- `delivered@resend.dev`, `bounced@resend.dev`, `complained@resend.dev`
- each with an optional `+label` where the label is `[a-zA-Z0-9_-]*` (e.g. `delivered+signup-42@resend.dev`)

Anything else throws `Test mode is enabled, but email address is not a valid resend test address`. Set `testMode: false` to send to real people. A common pattern is to make it environment-driven, e.g. `testMode: process.env.EMAIL_TEST_MODE !== "false"`, and set that env var only on prod.

## Status, cancel, lookup

```ts
const s = await resend.status(ctx, emailId); // query, mutation or action ctx; null if unknown
// s.status: "waiting" | "queued" | "cancelled" | "sent" | "delivered" | "delivery_delayed" | "bounced" | "failed"
// flags: s.bounced, s.failed, s.complained, s.deliveryDelayed, s.opened, s.clicked; s.errorMessage

await resend.cancelEmail(ctx, emailId); // mutation or action ctx
const full = await resend.get(ctx, emailId); // from/to/subject/html/text/template/resendId/timestamps...
```

- Status stops at `"sent"` unless the webhook is set up. Delivery, bounce, complaint, open and click data all arrive through it.
- Cancelling only works while the email is still `waiting` or `queued`. Once it has gone to Resend it can't be recalled. Cancelling doesn't fire `onEmailEvent`.
- Store the `EmailId` on your own document if you need to look it up later or match it in an event handler.

## Webhook (delivery events)

1. Route Resend's webhook to the component:

```ts
// convex/http.ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { resend } from "./email";

const http = httpRouter();
http.route({
  path: "/resend-webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => resend.handleResendEventWebhook(ctx, req)),
});
export default http;
```

2. In the Resend dashboard, add a webhook pointing at `https://<your-deployment>.convex.site/resend-webhook` (the `.site` URL, not `.cloud`) and enable the `email.*` events. Other event types are ignored.
3. Copy the signing secret: `npx convex env set RESEND_WEBHOOK_SECRET whsec_...`. Do this on each deployment (dev and prod) that has its own webhook.

The handler verifies the Svix signature and throws "Webhook secret is not set" if the secret is missing. Handled event types are `email.sent`, `email.delivered`, `email.delivery_delayed`, `email.bounced`, `email.complained`, `email.failed`, `email.opened` and `email.clicked`. Opens and clicks only arrive if tracking is enabled on your Resend domain.

## Reacting to events

```ts
import { components, internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import { Resend, vOnEmailEventArgs } from "@convex-dev/resend";

export const resend: Resend = new Resend(components.resend, {
  onEmailEvent: internal.email.onEmailEvent,
});

export const onEmailEvent = internalMutation({
  args: vOnEmailEventArgs, // { id: EmailId, event: EmailEvent }
  handler: async (ctx, { id, event }) => {
    if (event.type === "email.bounced" || event.type === "email.complained") {
      // e.g. find the user whose welcomeEmailId === id and flag the address
    }
  },
});
```

Also exported: `vEmailId`, `vEmailEvent`, `vStatus`, and the types `EmailId`, `EmailEvent`, `Status`.

## Cleanup

The component keeps every email and its content in its own tables until you remove them. Two component mutations do the cleanup:

- `cleanupOldEmails({ olderThan? })` removes finalized emails (delivered, bounced, cancelled and so on). Default age is 7 days.
- `cleanupAbandonedEmails({ olderThan? })` removes emails that never finalized. Default age is 30 days. If these build up, look for a bug.

```ts
// convex/crons.ts
import { cronJobs } from "convex/server";
import { components, internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";

const DAY = 24 * 60 * 60 * 1000;
export const cleanupResend = internalMutation({
  args: {},
  handler: async (ctx) => {
    await ctx.scheduler.runAfter(0, components.resend.lib.cleanupOldEmails, { olderThan: 7 * DAY });
    await ctx.scheduler.runAfter(0, components.resend.lib.cleanupAbandonedEmails, { olderThan: 30 * DAY });
  },
});

const crons = cronJobs();
crons.interval("cleanup resend component", { hours: 1 }, internal.crons.cleanupResend);
export default crons;
```

To inspect what's stored, open the Convex dashboard → Data, switch the component picker from `app` to `resend`, and look at the `emails` and `deliveryEvents` tables.

## React Email

Render JSX to HTML, then pass it as `html`. `@react-email/render` needs Node, so the file must start with `"use node"` and the function must be an action. A Node file can only export actions, so put any mutations elsewhere.

```bash
npm install @react-email/components @react-email/render react react-dom
```

```tsx
// convex/emailRender.tsx
"use node";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { render } from "@react-email/render";
import { Html, Button } from "@react-email/components";
import { resend } from "./email";

export const sendReset = internalAction({
  args: { to: v.string(), url: v.string() },
  handler: async (ctx, { to, url }) => {
    const html = await render(<Html><Button href={url}>Reset password</Button></Html>);
    await resend.sendEmail(ctx, { from: "Acme <hello@mail.acme.com>", to, subject: "Reset your password", html });
  },
});
```

The `Resend` instance can live in a non-Node file (as in `convex/email.ts` above) and be imported here.

## Attachments and other unbatchable features: `sendEmailManually`

`sendEmail` can only use what Resend's batch endpoint supports, and that excludes attachments. For those, send through the `resend` SDK yourself. The component still records the email so status and webhooks work:

```ts
import { internalAction } from "./_generated/server";
import { Resend as ResendSdk } from "resend";
import { resend } from "./email";

const sdk = new ResendSdk(process.env.RESEND_API_KEY);

export const sendInvoice = internalAction({
  args: {},
  handler: async (ctx) => {
    const from = "Acme <billing@mail.acme.com>";
    const to = ["customer@example.com"];
    const subject = "Your invoice";
    await resend.sendEmailManually(ctx, { from, to, subject }, async (emailId) => {
      const { data, error } = await sdk.emails.send({
        from, to, subject,
        html: "<p>Attached.</p>",
        attachments: [{ filename: "invoice.pdf", content: pdfBase64 }],
        headers: { "Idempotency-Key": emailId },
      });
      if (error) throw new Error(error.message);
      return data!.id; // the callback must return Resend's email id
    });
  },
});
```

`sendEmailManually` creates the record, runs your callback and marks the email `sent`. If the callback throws, it marks the email `failed` and rethrows. It bypasses the queue, so there is no retry and `testMode` isn't checked.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| "Test mode is enabled, but email address is not a valid resend test address" | `testMode` still defaults to `true` |
| "API key is not set" | `RESEND_API_KEY` missing on this deployment (`npx convex env list`) |
| Emails stay `sent` forever | Webhook not set up, wrong URL (`.cloud` instead of `.site`), or `email.*` events not enabled |
| Webhook returns 500 / "Webhook secret is not set" | `RESEND_WEBHOOK_SECRET` missing, or it's the secret from a different webhook |
| Status `failed` with a 4xx `errorMessage` | Resend rejected the request (unverified `from` domain, bad address). Permanent errors aren't retried |
| Duplicate emails | Your code enqueued twice. Add `idempotencyKey` |
| Component tables growing without limit | No cleanup cron |
