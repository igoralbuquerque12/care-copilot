import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  validateAttachments: vi.fn(),
  prepareTurn: vi.fn(),
  buildParams: vi.fn(),
  completeTurn: vi.fn(),
  failTurn: vi.fn(),
  createResponse: vi.fn(),
}));

vi.mock("openai", () => ({
  default: class MockOpenAI {
    responses = { create: mocks.createResponse };
  },
}));

vi.mock("~/schemas/clinical-chat", () => ({
  clinicalChatTurnSchema: {
    safeParse: (value: unknown) => ({ success: true, data: value }),
  },
}));
vi.mock("~/server/auth/supabase.server", () => ({ getUser: mocks.getUser }));
vi.mock("~/server/db", () => ({ db: { marker: "db" } }));
vi.mock("~/server/services/clinicalChat", () => ({
  prepareClinicalChatTurn: mocks.prepareTurn,
  completeClinicalChatTurn: mocks.completeTurn,
  failClinicalChatTurn: mocks.failTurn,
}));
vi.mock("~/server/services/clinicalChat/context", () => ({
  buildClinicalChatResponseParams: mocks.buildParams,
}));
vi.mock("~/server/services/clinicalChat/storage", () => ({
  validateClinicalAttachments: mocks.validateAttachments,
}));

import { POST } from "./route";

const turn = {
  chatId: "chat",
  patientId: "cm123456789",
  anamnesisId: undefined,
  userMessageId: "user-message",
  assistantMessageId: "assistant-message",
  apiKey: "openai-key",
};

const makeRequest = () => {
  const body = new FormData();
  body.set("patientId", turn.patientId);
  body.set("message", "Explique os achados");
  return new Request("http://localhost/api/clinical-chat", {
    method: "POST",
    body,
  });
};

const streamOf = (...events: unknown[]) => ({
  async *[Symbol.asyncIterator]() {
    for (const event of events) yield event;
  },
});

describe("POST /api/clinical-chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({ id: "profile" });
    mocks.validateAttachments.mockResolvedValue([]);
    mocks.prepareTurn.mockResolvedValue(turn);
    mocks.buildParams.mockResolvedValue({ model: "gpt-5.6-terra" });
    mocks.completeTurn.mockResolvedValue(undefined);
    mocks.failTurn.mockResolvedValue({
      code: "OPENAI_ERROR",
      message: "Nao foi possivel concluir a resposta clinica. Tente novamente.",
    });
  });

  it("streams meta, deltas and done, then persists content and token usage", async () => {
    mocks.createResponse.mockResolvedValue(
      streamOf(
        { type: "response.output_text.delta", delta: "Resposta " },
        { type: "response.output_text.delta", delta: "clinica" },
        {
          type: "response.completed",
          response: { usage: { input_tokens: 123, output_tokens: 45 } },
        },
      ),
    );

    const response = await POST(makeRequest());
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/event-stream");
    expect(body).toContain("event: meta");
    expect(body).toContain('event: delta\ndata: {"delta":"Resposta "}');
    expect(body).toContain("event: done");
    expect(mocks.completeTurn).toHaveBeenCalledWith(
      expect.anything(),
      turn,
      "Resposta clinica",
      { inputTokens: 123, outputTokens: 45 },
    );
    expect(mocks.failTurn).not.toHaveBeenCalled();
  });

  it("preserves partial content and emits an error when generation fails", async () => {
    mocks.createResponse.mockResolvedValue({
      async *[Symbol.asyncIterator]() {
        yield { type: "response.output_text.delta", delta: "Parcial" };
        throw new Error("connection lost");
      },
    });

    const response = await POST(makeRequest());
    const body = await response.text();

    expect(body).toContain('event: delta\ndata: {"delta":"Parcial"}');
    expect(body).toContain("event: error");
    expect(mocks.failTurn).toHaveBeenCalledWith(
      expect.anything(),
      turn,
      "Parcial",
      expect.any(Error),
    );
    expect(mocks.completeTurn).not.toHaveBeenCalled();
  });
});
