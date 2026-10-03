# convex-resend

An agent skill for sending email from a Convex app with the [`@convex-dev/resend`](https://www.npmjs.com/package/@convex-dev/resend) component, which queues, batches, retries and tracks emails sent through [Resend](https://resend.com).

## When to use it

- Adding transactional email (welcome, password reset, receipts) to a Convex app
- Wiring the Resend webhook so delivery, bounce and complaint status come back into Convex
- Debugging emails that throw in test mode, sit at `sent` forever, or get sent twice
- Sending attachments, which the batched path doesn't support

## What it covers

Setup and component options, `sendEmail` (HTML, text, templates, idempotency keys), test mode and Resend test addresses, `status` / `cancelEmail` / `get`, the webhook route and `RESEND_WEBHOOK_SECRET`, `onEmailEvent` handlers, cleanup crons, React Email in a Node action, `sendEmailManually` for attachments, and a troubleshooting table.

The content is written for this skill and checked against the component's published source. Upstream docs: https://github.com/get-convex/resend (Apache-2.0).

## Versions it targets

- `@convex-dev/resend` 0.2.8 (latest on npm as of 2026-10-03), which peers on `convex ^1.43.0` and `convex-helpers ^0.1.106`

## Install

```bash
npx skills add Sstobo/skills --skill convex-resend
```

## Example prompts

- "Send a welcome email when a user signs up, and record whether it bounced."
- "Our emails throw 'Test mode is enabled'. What's wrong?"
- "Email the invoice PDF as an attachment."

## Files

- [`SKILL.md`](SKILL.md): setup, sending, test mode, status, webhooks, event handlers, cleanup, React Email, manual sends, troubleshooting
