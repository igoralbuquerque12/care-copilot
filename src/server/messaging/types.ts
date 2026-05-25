export type PublishMode = "queue" | "inline";

export interface PublishOptions {
  url: string;
  body: unknown;
  retries?: number;
  deduplicationId?: string;
}

export interface PublishResult {
  mode: PublishMode;
}

export interface MessageQueue {
  publish(options: PublishOptions): Promise<PublishResult>;
  verifySignature(request: Request, body: string): Promise<boolean>;
}
