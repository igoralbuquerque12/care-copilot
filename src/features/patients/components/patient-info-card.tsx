import { CalendarDays, User } from "lucide-react";
import type { RouterOutputs } from "~/trpc/react";

type PatientOverview = NonNullable<RouterOutputs["patient"]["getOverview"]>;

export function PatientInfoCard({ patient }: { patient: PatientOverview }) {
  const age = Math.max(0, Math.floor(
    (Date.now() - new Date(patient.birthDate).getTime()) / 31_557_600_000,
  ));
  const risks = [
    patient.clinicalProfile?.hasHypertension && "Hipertensão",
    patient.clinicalProfile?.hasDiabetes && "Diabetes",
    patient.clinicalProfile?.hasDyslipidemia && "Dislipidemia",
    patient.clinicalProfile?.hasPriorInfarction && "Infarto prévio",
    patient.clinicalProfile?.smokingStatus && "Tabagismo",
  ].filter(Boolean) as string[];

  return <section className="overflow-hidden rounded-2xl border bg-card">
    <div className="bg-gradient-to-r from-primary/10 to-transparent p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10"><User className="h-7 w-7 text-primary" /></span>
          <div>
            <h1 className="text-2xl font-bold">{patient.name}</h1>
            <p className="text-sm text-muted-foreground">{age} anos · {patient.gender}{patient.cpf ? ` · CPF ${patient.cpf}` : ""}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {risks.length ? risks.map((risk) => <span key={risk} className="rounded-full bg-red-500/10 px-2 py-1 text-[10px] text-red-700 dark:text-red-300">{risk}</span>) : <span className="text-xs text-muted-foreground">Sem fatores de risco registrados</span>}
              {patient.clinicalProfile?.allergies && <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[10px]">Alergias: {patient.clinicalProfile.allergies}</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="rounded-xl border bg-background/70 px-4 py-2 text-center"><p className="text-lg font-bold">{patient._count.anamneses}</p><p className="text-[10px] text-muted-foreground">Anamneses</p></div>
          <div className="rounded-xl border bg-background/70 px-4 py-2 text-center"><p className="text-lg font-bold">{patient._count.consultations}</p><p className="text-[10px] text-muted-foreground">Consultas</p></div>
        </div>
      </div>
    </div>
    {patient.anamneses[0] && <div className="flex items-center gap-3 border-t p-4 text-sm"><CalendarDays className="h-4 w-4 text-primary" /><div><p className="text-xs text-muted-foreground">Consulta mais recente · {new Date(patient.anamneses[0].date).toLocaleDateString("pt-BR")}</p><p className="font-medium">{patient.anamneses[0].chiefComplaint}</p></div></div>}
  </section>;
}
