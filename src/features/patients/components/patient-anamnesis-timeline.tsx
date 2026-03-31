"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Stethoscope,
  Calendar,
  Pill,
  AlertCircle,
} from "lucide-react";

type AnamnesisItem = {
  id: string;
  date: Date;
  chiefComplaint: string;
  currentIllnessHistory: string;
  treatmentResponse?: string | null;
  symptomEvolution?: string | null;
  newEvents?: string | null;
  nyhaClass: string;
  hasPalpitations: boolean;
  hasSyncope: boolean;
  hasEdema: boolean;
  hasChestPain: boolean;
  diagnosticHypothesis?: string | null;
  conduct?: string | null;
  physicalExam?: {
    weight?: number | null;
    height?: number | null;
    bpSystolic?: number | null;
    bpDiastolic?: number | null;
    heartRate?: number | null;
    oxygenSaturation?: number | null;
    heartAuscultation?: string | null;
    lungAuscultation?: string | null;
    peripheralPulses?: string | null;
    edemaGrade?: string | null;
  } | null;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
  }>;
};

type Props = {
  anamneses: AnamnesisItem[];
};

export function PatientAnamnesisTimeline({ anamneses }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (anamneses.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <Stethoscope className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
        <p className="text-sm text-muted-foreground">Nenhuma anamnese registrada.</p>
      </div>
    );
  }

  const toggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const nyhaColors: Record<string, string> = {
    I: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    II: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    III: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
    IV: "bg-red-500/10 text-red-700 dark:text-red-400",
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-border">
        <Stethoscope className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">
          Histórico de Anamneses ({anamneses.length})
        </h3>
      </div>

      <div className="divide-y divide-border">
        {anamneses.map((anamnesis, index) => {
          const isExpanded = expandedId === anamnesis.id;
          const date = new Date(anamnesis.date);
          const symptoms = [
            anamnesis.hasPalpitations && "Palpitações",
            anamnesis.hasSyncope && "Síncope",
            anamnesis.hasEdema && "Edema",
            anamnesis.hasChestPain && "Dor torácica",
          ].filter(Boolean);

          return (
            <div key={anamnesis.id} className="relative">
              {/* Timeline connector */}
              <div className="absolute left-8 top-0 bottom-0 w-px bg-border" />
              {index === 0 && (
                <div className="absolute left-[27px] top-5 h-3 w-3 rounded-full bg-primary ring-4 ring-card z-10" />
              )}
              {index > 0 && (
                <div className="absolute left-[29px] top-5 h-2 w-2 rounded-full bg-muted-foreground/30 ring-4 ring-card z-10" />
              )}

              {/* Content */}
              <button
                onClick={() => toggle(anamnesis.id)}
                className="w-full text-left pl-16 pr-6 py-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {date.toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${nyhaColors[anamnesis.nyhaClass] ?? ""}`}
                      >
                        NYHA {anamnesis.nyhaClass}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground line-clamp-1">
                      {anamnesis.chiefComplaint}
                    </p>
                    {symptoms.length > 0 && (
                      <div className="flex gap-1 mt-1.5">
                        {symptoms.map((s) => (
                          <span
                            key={s as string}
                            className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground mt-1" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground mt-1" />
                  )}
                </div>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="pl-16 pr-6 pb-5 space-y-4 bg-muted/10">
                  {/* Illness History */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      História da Doença Atual
                    </h4>
                    <p className="text-sm text-foreground whitespace-pre-line">
                      {anamnesis.currentIllnessHistory}
                    </p>
                  </div>

                  {anamnesis.treatmentResponse && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        Resposta ao Tratamento
                      </h4>
                      <p className="text-sm text-foreground">{anamnesis.treatmentResponse}</p>
                    </div>
                  )}

                  {anamnesis.symptomEvolution && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        Evolução dos Sintomas
                      </h4>
                      <p className="text-sm text-foreground">{anamnesis.symptomEvolution}</p>
                    </div>
                  )}

                  {/* Physical Exam */}
                  {anamnesis.physicalExam && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Exame Físico
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {anamnesis.physicalExam.bpSystolic != null && (
                          <div className="rounded-lg bg-muted/50 p-2 text-center">
                            <p className="text-xs text-muted-foreground">PA</p>
                            <p className="text-sm font-semibold text-foreground">
                              {anamnesis.physicalExam.bpSystolic}/{anamnesis.physicalExam.bpDiastolic}
                            </p>
                          </div>
                        )}
                        {anamnesis.physicalExam.heartRate != null && (
                          <div className="rounded-lg bg-muted/50 p-2 text-center">
                            <p className="text-xs text-muted-foreground">FC</p>
                            <p className="text-sm font-semibold text-foreground">
                              {anamnesis.physicalExam.heartRate} bpm
                            </p>
                          </div>
                        )}
                        {anamnesis.physicalExam.oxygenSaturation != null && (
                          <div className="rounded-lg bg-muted/50 p-2 text-center">
                            <p className="text-xs text-muted-foreground">SpO2</p>
                            <p className="text-sm font-semibold text-foreground">
                              {anamnesis.physicalExam.oxygenSaturation}%
                            </p>
                          </div>
                        )}
                        {anamnesis.physicalExam.weight != null && (
                          <div className="rounded-lg bg-muted/50 p-2 text-center">
                            <p className="text-xs text-muted-foreground">Peso</p>
                            <p className="text-sm font-semibold text-foreground">
                              {anamnesis.physicalExam.weight} kg
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Medications */}
                  {anamnesis.medications.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Pill className="h-3 w-3" />
                        Medicamentos
                      </h4>
                      <div className="space-y-1">
                        {anamnesis.medications.map((med, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                            <span className="text-foreground font-medium">{med.name}</span>
                            <span className="text-muted-foreground">{med.dosage}</span>
                            <span className="text-muted-foreground/70">({med.frequency})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Diagnosis & Conduct */}
                  {(anamnesis.diagnosticHypothesis || anamnesis.conduct) && (
                    <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                      {anamnesis.diagnosticHypothesis && (
                        <div>
                          <h4 className="text-xs font-semibold text-primary mb-0.5 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Hipótese Diagnóstica
                          </h4>
                          <p className="text-sm text-foreground">{anamnesis.diagnosticHypothesis}</p>
                        </div>
                      )}
                      {anamnesis.conduct && (
                        <div>
                          <h4 className="text-xs font-semibold text-primary mb-0.5">Conduta</h4>
                          <p className="text-sm text-foreground">{anamnesis.conduct}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
