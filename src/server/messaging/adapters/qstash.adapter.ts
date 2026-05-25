import type { Client, Receiver } from "@upstash/qstash";
import type { MessageQueue, PublishOptions, PublishResult } from "../types";

export const createQStashAdapter = (
  client: Client,
  receiver: Receiver | null,
): MessageQueue => ({
  async publish(options: PublishOptions): Promise<PublishResult> {
    await client.publishJSON({
      url: options.url,
      body: options.body,
      retries: options.retries,
      deduplicationId: options.deduplicationId,
    });
    return { mode: "queue" };
  },

  async verifySignature(request: Request, body: string): Promise<boolean> {
    if (!receiver) return true;
    const signature = request.headers.get("upstash-signature");
    if (!signature) return false;
    return receiver.verify({ signature, body });
  },
});
