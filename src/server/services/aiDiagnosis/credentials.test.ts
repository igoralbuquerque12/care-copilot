import { beforeAll, describe, expect, it } from "vitest";

describe("AI credential encryption", () => {
  beforeAll(() => {
    process.env.SKIP_ENV_VALIDATION = "1";
    process.env.AI_CREDENTIALS_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
  });

  it("round-trips a credential without storing plaintext", async () => {
    const { decryptApiKey, encryptApiKey } = await import("./credentials");
    const secret = "sk-private-medical-key-1234";
    const encrypted = encryptApiKey(secret);
    expect(encrypted.encryptedApiKey).not.toContain(secret);
    expect(encrypted.lastFour).toBe("1234");
    expect(decryptApiKey(encrypted)).toBe(secret);
  });

  it("rejects tampered ciphertext", async () => {
    const { decryptApiKey, encryptApiKey } = await import("./credentials");
    const encrypted = encryptApiKey("sk-private-key-5678");
    expect(() => decryptApiKey({ ...encrypted, authTag: Buffer.alloc(16).toString("base64") })).toThrow();
  });
});
