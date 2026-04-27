import { qstash } from "~/server/qstash/client";
import { env } from "~/env";
import type { QstashAudioJob } from "~/schemas/audio-session";

export const enqueueAudioProcessing = async (job: QstashAudioJob) => {
  const url = `${env.APP_URL}/api/audio/process`;
  const deduplicationId = `${job.sessionId}:${job.batchIndex}`;

  if (qstash) {
    await qstash.publishJSON({
      url,
      body: job,
      retries: 3,
      deduplicationId,
    });
    return { mode: "qstash" as const };
  }

  await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(job),
  });
  return { mode: "inline" as const };
};
