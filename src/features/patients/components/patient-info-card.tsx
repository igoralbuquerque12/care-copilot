"use client";

import {
  User,
  Heart,
  Droplets,
  AlertTriangle,
  Cigarette,
  Dumbbell,
  Calendar,
  Dna,
} from "lucide-react";

type PatientInfoCardProps = {
  patient: {
    name: string;
    cpf?: string | null;
    gender: string;
    birthDate: Date;
    clinicalProfile?: {
      hasHypertension: boolean;
      hasDiabetes: boolean;
      diabetesDuration?: number | null;
      hasDyslipidemia: boolean;
      hasPriorInfarction: boolean;
      priorSurgeries?: string | null;
      allergies?: string | null;
      familyHistoryCoronaryEarly: boolean;
      familyHistorySuddenDeath: boolean;
      familyHistoryOthers?: string | null;
      smokingStatus: boolean;
      smokingPacksYear?: number | null;
      alcoholConsumption?: string | null;
      exerciseLevel: string;
    } | null;
    anamneses: unknown[];
    consultations: unknown[];
  };
};

export function PatientInfoCard({ patient }: PatientInfoCardProps) {
  const age = Math.floor(
    (Date.now() - new Date(patient.birthDate).getTime()) /
      (365.25 * 24 * 60 * 60 * 1000)
  );

  const cp = patient.clinicalProfile;

  const riskFactors = [];
  if (cp?.hasHypertension) riskFactors.push("Hipertensão");
  if (cp?.hasDiabetes) riskFactors.push(`Diabetes${cp.diabetesDuration ? ` (${cp.diabetesDuration}a)` : ""}`);
  if (cp?.hasDyslipidemia) riskFactors.push("Dislipidemia");
  if (cp?.hasPriorInfarction) riskFactors.push("Infarto prévio");
  if (cp?.smokingStatus) riskFactors.push("Tabagista");

  const exerciseLevelMap: Record<string, string> = {
    SEDENTARIO: "Sedentário",
    IRREGULAR: "Irregular",
    ATIVO: "Ativo",
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 py-5">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 ring-2 ring-primary/20">
            <User className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground">{patient.name}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span>{age} anos</span>
              <span>•</span>
              <span>{patient.gender}</span>
              {patient.cpf && (
                <>
                  <span>•</span>
                  <span>CPF: {patient.cpf}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex flex-col items-center rounded-xl bg-card border border-border px-4 py-2">
              <span className="text-lg font-bold text-primary">{patient.consultations.length}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Consultas</span>
            </div>
            <div className="flex flex-col items-center rounded-xl bg-card border border-border px-4 py-2">
              <span className="text-lg font-bold text-primary">{patient.anamneses.length}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Anamneses</span>
            </div>
          </div>
        </div>
      </div>

      {/* Clinical profile grid */}
      {cp && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
          {/* Risk Factors */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Heart className="h-4 w-4 text-red-500" />
              Fatores de Risco
            </div>
            {riskFactors.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {riskFactors.map((factor) => (
                  <span
                    key={factor}
                    className="inline-flex items-center rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:text-red-400"
                  >
                    {factor}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Nenhum fator de risco registrado</p>
            )}
            {cp.allergies && (
              <div className="mt-2">
                <span className="text-xs text-muted-foreground">Alergias: </span>
                <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">{cp.allergies}</span>
              </div>
            )}
          </div>

          {/* Family History */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Dna className="h-4 w-4 text-purple-500" />
              Histórico Familiar
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${cp.familyHistoryCoronaryEarly ? "bg-red-500" : "bg-emerald-500"}`} />
                <span className="text-muted-foreground">
                  DAC precoce: {cp.familyHistoryCoronaryEarly ? "Sim" : "Não"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${cp.familyHistorySuddenDeath ? "bg-red-500" : "bg-emerald-500"}`} />
                <span className="text-muted-foreground">
                  Morte súbita: {cp.familyHistorySuddenDeath ? "Sim" : "Não"}
                </span>
              </div>
              {cp.familyHistoryOthers && (
                <p className="text-muted-foreground mt-1">
                  Outros: {cp.familyHistoryOthers}
                </p>
              )}
            </div>
          </div>

          {/* Lifestyle */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Dumbbell className="h-4 w-4 text-blue-500" />
              Estilo de Vida
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <Dumbbell className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Exercício: {exerciseLevelMap[cp.exerciseLevel] ?? cp.exerciseLevel}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Cigarette className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Tabagismo: {cp.smokingStatus ? `Sim${cp.smokingPacksYear ? ` (${cp.smokingPacksYear} maços/ano)` : ""}` : "Não"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Droplets className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Álcool: {cp.alcoholConsumption ?? "Não informado"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No clinical profile */}
      {!cp && (
        <div className="flex items-center gap-2 px-6 py-4 text-sm text-muted-foreground">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Perfil clínico não cadastrado para este paciente.
        </div>
      )}
    </div>
  );
}
