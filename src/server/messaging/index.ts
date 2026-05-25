import { Client, Receiver } from "@upstash/qstash";
import { env } from "~/env";
import { createInlineAdapter } from "./adapters/inline.adapter";
import { createQStashAdapter } from "./adapters/qstash.adapter";
import type { MessageQueue } from "./types";

const shouldUseInline = () =>
  env.ENVIRONMENT === "development" || env.ENVIRONMENT === "staging";

const createMessageQueue = (): MessageQueue => {
  if (shouldUseInline()) {
    return createInlineAdapter();
  }

  if (!env.QSTASH_TOKEN) {
    console.error(
      "[messaging] QSTASH_TOKEN not set in production — falling back to inline delivery. This may cause request timeouts.",
    );
    return createInlineAdapter();
  }

  const client = new Client({
    token: String(env.QSTASH_TOKEN),
    ...(env.QSTASH_URL ? { baseUrl: String(env.QSTASH_URL) } : {}),
  });

  const receiver =
    env.QSTASH_CURRENT_SIGNING_KEY && env.QSTASH_NEXT_SIGNING_KEY
      ? new Receiver({
          currentSigningKey: env.QSTASH_CURRENT_SIGNING_KEY,
          nextSigningKey: env.QSTASH_NEXT_SIGNING_KEY,
        })
      : null;

  return createQStashAdapter(client, receiver);
};

const globalForMessaging = globalThis as unknown as {
  messageQueue: MessageQueue | undefined;
};

export const messageQueue: MessageQueue =
  globalForMessaging.messageQueue ?? createMessageQueue();

if (env.NODE_ENV !== "production") {
  globalForMessaging.messageQueue = messageQueue;
}

export type { MessageQueue, PublishOptions, PublishResult, PublishMode } from "./types";
