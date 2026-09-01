import { describe, expect, it } from "vitest";
import {
  ANALYSIS_PROMPT_VARIABLES,
  DEFAULT_ANALYSIS_PROMPT_TEMPLATE,
  DEFAULT_CLINICAL_CHAT_PROMPT_TEMPLATE,
  renderPromptTemplate,
  validatePromptTemplate,
} from "./ai-prompt-templates";

describe("AI prompt templates", () => {
  it("ships valid defaults with visible dynamic variables", () => {
    expect(() =>
      validatePromptTemplate(
        DEFAULT_ANALYSIS_PROMPT_TEMPLATE,
        ANALYSIS_PROMPT_VARIABLES,
      ),
    ).not.toThrow();
    expect(DEFAULT_ANALYSIS_PROMPT_TEMPLATE).toContain("${contexto_clinico}");
    expect(DEFAULT_CLINICAL_CHAT_PROMPT_TEMPLATE).toContain(
      "${contexto_clinico}",
    );
  });

  it("replaces repeated variables without interpreting data as a template", () => {
    const rendered = renderPromptTemplate(
      "A=${paciente}\nB=${paciente}",
      ANALYSIS_PROMPT_VARIABLES,
      { paciente: { note: "${formato_saida}" } },
    );

    expect(rendered).toContain('"note": "${formato_saida}"');
    expect(rendered.match(/"note"/g)).toHaveLength(2);
  });

  it("rejects unknown and malformed variables", () => {
    expect(() =>
      validatePromptTemplate("${campo_inexistente}", ANALYSIS_PROMPT_VARIABLES),
    ).toThrow("Variaveis desconhecidas");
    expect(() =>
      validatePromptTemplate("${contexto_clinico", ANALYSIS_PROMPT_VARIABLES),
    ).toThrow("sem fechamento");
  });
});
