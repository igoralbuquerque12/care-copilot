"use client";

import { Stethoscope, Calendar, ExternalLink } from "lucide-react";
import type { AnamnesisDetail } from "./anamnesis-detail-dialog";

type Props = {
  anamneses: AnamnesisDetail[];
  onOpenDetail: (id: string) => void;
};

const nyhaColors: Record<string, string> = {
  I: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  II: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  III: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  IV: "bg-red-500/10 text-red-700 dark:text-red-400",
};

export function PatientAnamnesisTimeline({ anamneses, onOpenDetail }: Props) {
  if (anamneses.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <Stethoscope className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
        <p className="text-sm text-muted-foreground">Nenhuma anamnese registrada.</p>
      </div>
    );
  }

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
          const date = new Date(anamnesis.date);
          const symptoms = [
            anamnesis.hasPalpitations && "Palpitações",
            anamnesis.hasSyncope && "Síncope",
            anamnesis.hasEdema && "Edema",
            anamnesis.hasChestPain && "Dor torácica",
          ].filter(Boolean) as string[];

          return (
            <div key={anamnesis.id} className="relative">
              <div className="absolute left-8 top-0 bottom-0 w-px bg-border" />
              {index === 0 ? (
                <div className="absolute left-[27px] top-5 h-3 w-3 rounded-full bg-primary ring-4 ring-card z-10" />
              ) : (
                <div className="absolute left-[29px] top-5 h-2 w-2 rounded-full bg-muted-foreground/30 ring-4 ring-card z-10" />
              )}

              <button
                onClick={() => onOpenDetail(anamnesis.id)}
                className="w-full text-left pl-16 pr-6 py-4 hover:bg-muted/30 transition-colors group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground">
                        {date.toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${nyhaColors[anamnesis.nyhaClass] ?? ""}`}>
                        NYHA {anamnesis.nyhaClass}
                      </span>
                      {anamnesis.medications.length > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          · {anamnesis.medications.length} med.
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-foreground line-clamp-1">
                      {anamnesis.chiefComplaint}
                    </p>
                    {symptoms.length > 0 && (
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {symptoms.map((s) => (
                          <span
                            key={s}
                            className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground mt-1 shrink-0 transition-colors" />
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
