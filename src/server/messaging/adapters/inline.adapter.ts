import type { MessageQueue, PublishOptions, PublishResult } from "../types";

export const createInlineAdapter = (): MessageQueue => ({
  async publish(options: PublishOptions): Promise<PublishResult> {
    console.log(`[messaging:inline] dispatching POST ${options.url}`);

    setImmediate(() => {
      fetch(options.url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(options.body),
      })
        .then((response) => {
          const tag = response.ok ? "ok" : "error";
          console.log(
            `[messaging:inline] ${options.url} -> ${response.status} (${tag})`,
          );
        })
        .catch((error) => {
          console.error(
            `[messaging:inline] ${options.url} fetch failed:`,
            error,
          );
        });
    });

    return { mode: "inline" };
  },

  async verifySignature(): Promise<boolean> {
    return true;
  },
});
