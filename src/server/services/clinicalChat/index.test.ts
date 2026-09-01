import type { PrismaClient } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  resolveCredential: vi.fn(),
  uploadAttachments: vi.fn(),
  deleteAttachments: vi.fn(),
  createSignedUrl: vi.fn(),
}));

vi.mock("./availability", () => ({
  getClinicalChatAvailability: vi.fn(),
  resolveClinicalChatCredential: mocks.resolveCredential,
}));

vi.mock("./storage", () => ({
  createSignedClinicalAttachmentUrl: mocks.createSignedUrl,
  uploadClinicalAttachments: mocks.uploadAttachments,
  deleteClinicalAttachments: mocks.deleteAttachments,
}));

import {
  getClinicalChatAttachmentUrl,
  prepareClinicalChatTurn,
} from ".";

const patient = { id: "patient", anamneses: [] };
const chat = {
  id: "chat",
  profileId: "profile",
  patientId: "patient",
  isGenerating: false,
  generationStartedAt: null,
  nextSequence: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("clinical chat turn preparation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resolveCredential.mockResolvedValue("openai-key");
    mocks.uploadAttachments.mockResolvedValue([]);
    mocks.deleteAttachments.mockResolvedValue(undefined);
    mocks.createSignedUrl.mockResolvedValue("https://signed.example/exam");
  });

  it("rejects a concurrent generation through the atomic chat lock", async () => {
    const db = {
      patient: { findFirst: vi.fn().mockResolvedValue(patient) },
      clinicalChat: {
        findUnique: vi.fn().mockResolvedValue(chat),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    } as unknown as PrismaClient;

    await expect(
      prepareClinicalChatTurn(
        db,
        "profile",
        { patientId: "patient", message: "Nova pergunta" },
        [],
      ),
    ).rejects.toMatchObject({
      code: "CONFLICT",
      message: "Ja existe uma resposta sendo gerada para este paciente.",
    });
  });

  it("persists every assistant placeholder with the fixed chat model", async () => {
    const messageCreate = vi
      .fn<
        (input: { data: Record<string, unknown> }) => Promise<{ id: string }>
      >()
      .mockResolvedValueOnce({ id: "user-message" })
      .mockResolvedValueOnce({ id: "assistant-message" });
    const transactionClient = {
      clinicalChat: {
        findUniqueOrThrow: vi.fn().mockResolvedValue({ nextSequence: 7 }),
        update: vi.fn().mockResolvedValue(chat),
      },
      clinicalChatMessage: { create: messageCreate },
    };
    const db = {
      patient: { findFirst: vi.fn().mockResolvedValue(patient) },
      clinicalChat: {
        findUnique: vi.fn().mockResolvedValue(chat),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      clinicalChatAttachment: {
        aggregate: vi.fn().mockResolvedValue({ _sum: { sizeBytes: 0 } }),
      },
      $transaction: vi
        .fn()
        .mockImplementation(
          (callback: (tx: typeof transactionClient) => unknown) =>
            callback(transactionClient),
        ),
    } as unknown as PrismaClient;

    const turn = await prepareClinicalChatTurn(
      db,
      "profile",
      { patientId: "patient", message: "Nova pergunta" },
      [],
    );

    expect(messageCreate.mock.calls[1]?.[0].data).toMatchObject({
      role: "ASSISTANT",
      status: "STREAMING",
      model: "gpt-5.6-terra",
      sequence: 8,
    });
    expect(turn).toMatchObject({
      assistantMessageId: "assistant-message",
      apiKey: "openai-key",
    });
  });

  it("rejects the cumulative attachment limit before uploading", async () => {
    const updateMany = vi
      .fn()
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 1 });
    const db = {
      patient: { findFirst: vi.fn().mockResolvedValue(patient) },
      clinicalChat: {
        findUnique: vi.fn().mockResolvedValue(chat),
        updateMany,
      },
      clinicalChatAttachment: {
        aggregate: vi
          .fn()
          .mockResolvedValue({ _sum: { sizeBytes: 49_500_000 } }),
      },
    } as unknown as PrismaClient;
    const file = {
      file: new Blob([new Uint8Array(1_000_001)]),
      originalName: "exame.pdf",
      mimeType: "application/pdf" as const,
      sizeBytes: 1_000_001,
      extension: "pdf",
    };

    await expect(
      prepareClinicalChatTurn(
        db,
        "profile",
        { patientId: "patient", message: "Veja o exame" },
        [file],
      ),
    ).rejects.toMatchObject({ code: "PAYLOAD_TOO_LARGE" });
    expect(mocks.uploadAttachments).not.toHaveBeenCalled();
    expect(updateMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: { isGenerating: false, generationStartedAt: null },
      }),
    );
  });

  it("scopes signed attachment URLs to both physician and patient", async () => {
    const findFirst = vi.fn().mockResolvedValue({
      storagePath: "profile/patient/chat/exam.pdf",
      originalName: "exam.pdf",
    });
    const db = {
      clinicalChatAttachment: { findFirst },
    } as unknown as PrismaClient;

    await expect(
      getClinicalChatAttachmentUrl(
        db,
        "profile",
        "patient",
        "attachment",
      ),
    ).resolves.toEqual({
      url: "https://signed.example/exam",
      originalName: "exam.pdf",
    });
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "attachment",
          message: { chat: { profileId: "profile", patientId: "patient" } },
        },
      }),
    );
  });
});
