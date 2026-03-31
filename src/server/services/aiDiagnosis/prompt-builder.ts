// src/server/services/aiDiagnosis/prompt-builder.ts

import type { PatientHistoryForAI } from "./types";
import { AI_DIAGNOSIS_RESPONSE_SCHEMA } from "./constants";

export function buildDiagnosisPrompt(data: PatientHistoryForAI): string {
  const age = Math.floor(
    (Date.now() - new Date(data.patient.birthDate).getTime()) /
      (365.25 * 24 * 60 * 60 * 1000)
  );

  const clinicalStr = data.clinicalProfile
    ? `
Perfil Clínico:
- Hipertensão: ${data.clinicalProfile.hasHypertension ? "Sim" : "Não"}
- Diabetes: ${data.clinicalProfile.hasDiabetes ? "Sim" : "Não"}${data.clinicalProfile.diabetesDuration ? ` (${data.clinicalProfile.diabetesDuration} anos)` : ""}
- Dislipidemia: ${data.clinicalProfile.hasDyslipidemia ? "Sim" : "Não"}
- Infarto prévio: ${data.clinicalProfile.hasPriorInfarction ? "Sim" : "Não"}
- Cirurgias prévias: ${data.clinicalProfile.priorSurgeries ?? "Nenhuma"}
- Alergias: ${data.clinicalProfile.allergies ?? "Nenhuma"}
- Histórico familiar DAC precoce: ${data.clinicalProfile.familyHistoryCoronaryEarly ? "Sim" : "Não"}
- Histórico familiar morte súbita: ${data.clinicalProfile.familyHistorySuddenDeath ? "Sim" : "Não"}
- Outros históricos familiares: ${data.clinicalProfile.familyHistoryOthers ?? "Nenhum"}
- Tabagismo: ${data.clinicalProfile.smokingStatus ? "Sim" : "Não"}${data.clinicalProfile.smokingPacksYear ? ` (${data.clinicalProfile.smokingPacksYear} maços/ano)` : ""}
- Consumo de álcool: ${data.clinicalProfile.alcoholConsumption ?? "Não informado"}
- Nível de exercício: ${data.clinicalProfile.exerciseLevel}
`
    : "Perfil clínico não disponível.";

  const anamnesisStr = data.anamneses
    .map(
      (a, i) => `
--- Consulta ${i + 1} (${new Date(a.date).toLocaleDateString("pt-BR")}) ---
Queixa principal: ${a.chiefComplaint}
História da doença atual: ${a.currentIllnessHistory}
${a.treatmentResponse ? `Resposta ao tratamento: ${a.treatmentResponse}` : ""}
${a.symptomEvolution ? `Evolução dos sintomas: ${a.symptomEvolution}` : ""}
${a.newEvents ? `Novos eventos: ${a.newEvents}` : ""}
Classe NYHA: ${a.nyhaClass}
Sintomas: Palpitações: ${a.hasPalpitations ? "Sim" : "Não"} | Síncope: ${a.hasSyncope ? "Sim" : "Não"} | Edema: ${a.hasEdema ? "Sim" : "Não"} | Dor torácica: ${a.hasChestPain ? "Sim" : "Não"}
${a.diagnosticHypothesis ? `Hipótese diagnóstica do médico: ${a.diagnosticHypothesis}` : ""}
${a.conduct ? `Conduta: ${a.conduct}` : ""}
${a.physicalExam ? `Exame Físico: Peso: ${a.physicalExam.weight ?? "-"}kg | Altura: ${a.physicalExam.height ?? "-"}cm | PA: ${a.physicalExam.bpSystolic ?? "-"}/${a.physicalExam.bpDiastolic ?? "-"}mmHg | FC: ${a.physicalExam.heartRate ?? "-"}bpm | SpO2: ${a.physicalExam.oxygenSaturation ?? "-"}% | Ausculta cardíaca: ${a.physicalExam.heartAuscultation ?? "-"} | Ausculta pulmonar: ${a.physicalExam.lungAuscultation ?? "-"} | Pulsos periféricos: ${a.physicalExam.peripheralPulses ?? "-"} | Grau edema: ${a.physicalExam.edemaGrade ?? "-"}` : ""}
${a.medications.length > 0 ? `Medicamentos: ${a.medications.map((m) => `${m.name} ${m.dosage} (${m.frequency})`).join(", ")}` : ""}
`
    )
    .join("\n");

  return `Você é um assistente de IA especializado em cardiologia clínica. Seu papel é apoiar o médico fornecendo uma análise complementar baseada no histórico completo do paciente. Você NÃO substitui o médico — apenas oferece uma segunda perspectiva para consideração.

DADOS DO PACIENTE:
Nome: ${data.patient.name}
Idade: ${age} anos
Sexo: ${data.patient.gender}

${clinicalStr}

HISTÓRICO DE CONSULTAS (${data.anamneses.length} consulta(s), da mais antiga para a mais recente):
${anamnesisStr}

Com base em todo o histórico acima, gere uma análise clínica estruturada. Foque especialmente em:
1. Padrões que podem não ser óbvios em uma consulta isolada (ex: piora progressiva da classe NYHA, variações de PA)
2. Correlações entre sintomas, medicamentos e evolução
3. Fatores de risco acumulados
4. Alertas que merecem atenção imediata
5. Sugestões de exames ou ajustes terapêuticos

Responda EXCLUSIVAMENTE em JSON válido (sem markdown, sem backticks), com esta estrutura:
${AI_DIAGNOSIS_RESPONSE_SCHEMA}`;
}
