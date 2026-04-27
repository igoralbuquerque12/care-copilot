import {
  consolidatedFormStateSchemaDescription,
  llmExtractionResponseSchema,
  type ConsolidatedFormState,
  type LlmExtractionResponse,
} from "~/schemas/audio-anamnesis-form";
import { aiClientAudio } from "~/server/ai";

const SYSTEM_PROMPT = `Voce e um parser clinico especializado em atualizar formularios de anamnese.
Sua funcao e analisar uma nova transcricao de audio medico e atualizar um JSON existente.

Regras obrigatorias:
1. Retorne somente JSON valido.
2. Nao invente informacoes ausentes.
3. A transcricao pode conter frases repetidas no inicio por causa de overlap entre lotes.
4. Atualize o JSON de forma idempotente.
5. Nao duplique sintomas, eventos ou medicacoes.
6. So substitua um valor anterior quando a nova transcricao contradizer claramente o valor antigo ou trouxer uma versao mais precisa.
7. Quando a nova fala apenas complementar o valor anterior, una os textos com coerencia sem repetir conteudo.
8. Respeite estritamente os tipos e enums do schema fornecido.
9. Se estiver em duvida, preserve o valor anterior.`;

type MergeContext = {
  sessionId: string;
  patientId: string;
  consultationId: string | null;
  batchIndex: number;
};

export type MergeResult = {
  response: LlmExtractionResponse;
  promptText: string;
  rawOutputText: string;
};

const buildUserPrompt = (
  ctx: MergeContext,
  currentFormState: ConsolidatedFormState,
  transcript: string,
) => {
  return `Contexto da sessao:
- sessionId: ${ctx.sessionId}
- patientId: ${ctx.patientId}
- consultationId: ${ctx.consultationId ?? "null"}
- batchIndex: ${ctx.batchIndex}

Observacao importante:
O inicio desta transcricao pode repetir os ultimos segundos do lote anterior. Considere essas frases como overlap e nao como informacao nova por padrao.

${consolidatedFormStateSchemaDescription}

Formulario atual (JSON):
${JSON.stringify(currentFormState)}

Nova transcricao:
"""${transcript}"""

Retorne um objeto JSON com exatamente as chaves:
1. "nextFormState" - o JSON consolidado atualizado, mantendo o mesmo schema do formulario atual.
2. "fieldOperations" - mapa de "secao.campo" => { "action": "replace"|"append"|"merge"|"noop", "reason": string }.`;
};

export const mergeBatch = async (params: {
  ctx: MergeContext;
  currentFormState: ConsolidatedFormState;
  transcript: string;
}): Promise<MergeResult> => {
  const userPrompt = buildUserPrompt(
    params.ctx,
    params.currentFormState,
    params.transcript,
  );
  const fullPrompt = `${SYSTEM_PROMPT}\n\n${userPrompt}`;

  const raw = await aiClientAudio.generate({
    prompt: fullPrompt,
    responseFormat: "json",
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.text);
  } catch (error) {
    throw new Error(
      `LLM retornou JSON invalido: ${(error as Error).message}. Texto: ${raw.text.slice(0, 200)}...`,
    );
  }

  const validated = llmExtractionResponseSchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error(
      `Saida do LLM nao corresponde ao schema esperado: ${validated.error.message}`,
    );
  }

  return {
    response: validated.data,
    promptText: fullPrompt,
    rawOutputText: raw.text,
  };
};
