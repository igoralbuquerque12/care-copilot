import { describe, expect, it } from "vitest";
import { buildDiagnosisPrompt } from "./prompt-builder";

describe("buildDiagnosisPrompt", () => {
  it("represents every anamnesis, emphasizes the current one and excludes AI output", () => {
    const prompt = buildDiagnosisPrompt({
      patient: { ageAtCurrentAnamnesis: 54, gender: "Feminino" },
      clinicalProfile: { hasHypertension: true },
      current: {
        id: "current",
        date: new Date("2026-08-20T12:00:00Z"),
        templateName: "Cardiologia 2026",
        fields: { Diagnostico: "Hipertensao", Conduta: "Ajuste de dose" },
      },
      previous: [
        { id: "old-1", date: new Date("2025-02-10T12:00:00Z"), templateName: "Cardiologia 2025", fields: { Queixa: "Dispneia" } },
        { id: "old-2", date: new Date("2026-01-10T12:00:00Z"), templateName: "Retorno", fields: { Queixa: "Melhora" } },
      ],
    }, "Priorize interacoes medicamentosas.");

    expect(prompt.systemPrompt).toContain('"currentAnamnesis"');
    expect(prompt.systemPrompt).toContain("2025-02-10");
    expect(prompt.systemPrompt).toContain("2026-01-10");
    expect(prompt.systemPrompt).toContain("elapsedBeforeCurrent");
    expect(prompt.systemPrompt).toContain("Priorize interacoes medicamentosas");
    expect(prompt.systemPrompt).not.toContain("cpf");
    expect(prompt.coverage).toEqual({
      totalAnamneses: 3,
      representedAnamneses: 3,
      totalFields: 4,
      representedFields: 4,
      truncatedFields: 0,
    });
  });

  it("compacts long historical fields without dropping the record", () => {
    const prompt = buildDiagnosisPrompt({
      patient: { ageAtCurrentAnamnesis: 40, gender: "Masculino" },
      clinicalProfile: null,
      current: { id: "now", date: new Date("2026-08-20"), templateName: "Atual", fields: { Queixa: "Dor" } },
      previous: [{ id: "old", date: new Date("2020-01-01"), templateName: "Antigo", fields: { Texto: "x".repeat(2_000) } }],
    });
    expect(prompt.systemPrompt).toContain("2020-01-01");
    expect(prompt.systemPrompt).toContain("[campo truncado]");
    expect(prompt.coverage.truncatedFields).toBe(1);
  });

  it("renders a fully custom analysis template", () => {
    const prompt = buildDiagnosisPrompt(
      {
        patient: { ageAtCurrentAnamnesis: 40, gender: "Masculino" },
        clinicalProfile: null,
        current: {
          id: "now",
          date: new Date("2026-08-20"),
          templateName: "Atual",
          fields: { Queixa: "Dor" },
        },
        previous: [],
      },
      "Texto adicional",
      "ATUAL=${anamnese_atual}\nEXTRA=${instrucoes_adicionais}",
    );

    expect(prompt.systemPrompt).toContain("Dor");
    expect(prompt.systemPrompt).toContain("Texto adicional");
    expect(prompt.systemPrompt).not.toContain("${anamnese_atual}");
    expect(prompt.systemPrompt).not.toContain("Formato de saida");
  });
});
