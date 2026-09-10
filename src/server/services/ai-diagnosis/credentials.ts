import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { env } from "../../../env";

const ALGORITHM = "aes-256-gcm";
const KEY_VERSION = 1;

const getEncryptionKey = () => {
  const encoded = env.AI_CREDENTIALS_ENCRYPTION_KEY;
  if (!encoded) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Criptografia de credenciais de IA nao configurada no servidor.",
    });
  }

  const key = Buffer.from(encoded, "base64");
  if (key.length !== 32) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Chave de criptografia de credenciais invalida.",
    });
  }
  return key;
};

export const encryptApiKey = (plainText: string) => {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);

  return {
    encryptedApiKey: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
    keyVersion: KEY_VERSION,
    lastFour: plainText.slice(-4),
  };
};

export const decryptApiKey = (value: {
  encryptedApiKey: string;
  iv: string;
  authTag: string;
  keyVersion: number;
}) => {
  if (value.keyVersion !== KEY_VERSION) {
    throw new Error("Versao de criptografia de credencial nao suportada");
  }

  const decipher = createDecipheriv(
    ALGORITHM,
    getEncryptionKey(),
    Buffer.from(value.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(value.authTag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(value.encryptedApiKey, "base64")),
    decipher.final(),
  ]).toString("utf8");
};
