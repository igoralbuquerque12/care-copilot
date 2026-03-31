import { Client } from "@upstash/qstash";
import { env } from "~/env";

const createQStashClient = () => {
  if (!env.QSTASH_TOKEN) {
    return null;
  }
  return new Client({ token: env.QSTASH_TOKEN });
};

const globalForQStash = globalThis as unknown as {
  qstash: ReturnType<typeof createQStashClient> | undefined;
};

export const qstash = globalForQStash.qstash ?? createQStashClient();

if (env.NODE_ENV !== "production") globalForQStash.qstash = qstash;
