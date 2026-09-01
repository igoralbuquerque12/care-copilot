"use client";

import { AlertTriangle, Bot, CheckCircle2, HelpCircle, ShieldCheck, Stethoscope } from "lucide-react";
import { anamnesisAnalysisResultSchema } from "~/schemas/ai-analysis";

const levelClass = {
  LOW: "bg-red-500/10 text-red-700 dark:text-red-300",
  MEDIUM: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  HIGH: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
};

export function AnalysisResultCard({ value }: { value: unknown }) {
  const parsed = anamnesisAnalysisResultSchema.safeParse(value);
  if (!parsed.success) {
    return <p className="text-sm text-muted-foreground">A análise foi concluída, mas está em um formato legado.</p>;
  }
  const result = parsed.data;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border bg-card p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-semibold"><Bot className="h-5 w-5 text-violet-500" />Análise Care AI</h2>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${levelClass[result.confidence.level]}`}>
            Confiança estimada pela IA: {result.confidence.score}%
          </span>
        </div>
        <p className="whitespace-pre-line text-sm leading-6">{result.summary}</p>
        <p className="mt-3 text-xs text-muted-foreground">{result.confidence.rationale}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border bg-card p-5">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold"><Stethoscope className="h-4 w-4 text-primary" />Diagnóstico sugerido</h3>
          <p className="text-sm">{result.aiDiagnosis.primary}</p>
          {result.aiDiagnosis.differentials.length > 0 && <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-muted-foreground">{result.aiDiagnosis.differentials.map((item) => <li key={item}>{item}</li>)}</ul>}
        </section>
        <section className="rounded-2xl border bg-card p-5">
          <h3 className="mb-2 text-sm font-semibold">Comparação longitudinal</h3>
          <p className="text-sm text-muted-foreground">{result.longitudinalComparison.overview}</p>
          {result.longitudinalComparison.changes.length > 0 && <div className="mt-3 space-y-2">{result.longitudinalComparison.changes.map((change, index) => <div key={`${change.field}-${index}`} className="rounded-xl bg-muted/40 p-3 text-xs"><p className="font-medium text-foreground">{change.field}</p><p className="mt-1 text-muted-foreground">{change.interpretation}</p>{change.previousDate && <p className="mt-1 text-[10px] text-muted-foreground">Comparado com {change.previousDate}: {change.previousValue ?? "sem valor"} → {change.currentValue}</p>}</div>)}</div>}
        </section>
      </div>

      {result.physicianReview.length > 0 && (
        <section className="rounded-2xl border bg-card p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><CheckCircle2 className="h-4 w-4 text-emerald-500" />Revisão do preenchimento médico</h3>
          <div className="space-y-3">{result.physicianReview.map((item, index) => (
            <div key={`${item.subject}-${index}`} className="rounded-xl bg-muted/40 p-3">
              <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-medium">{item.subject}</span><span className="rounded-full border px-2 py-0.5 text-[10px]">{item.assessment === "AGREEMENT" ? "Concordância" : item.assessment === "REVIEW" ? "Revisar" : "Dados insuficientes"}</span></div>
              <p className="mt-1 text-xs"><span className="font-medium">Registro médico:</span> {item.physicianEntry}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.rationale}</p>
            </div>
          ))}</div>
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><AlertTriangle className="h-4 w-4 text-red-500" />Alertas</h3>
          {result.riskAlerts.length ? <ul className="space-y-2 text-sm">{result.riskAlerts.map((item, index) => <li key={`${item.title}-${index}`}><span className="font-medium">{item.title}:</span> {item.rationale}</li>)}</ul> : <p className="text-sm text-muted-foreground">Nenhum alerta adicional identificado.</p>}
        </section>
        <section className="rounded-2xl border bg-card p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><HelpCircle className="h-4 w-4 text-blue-500" />O que poderia ter sido perguntado</h3>
          {result.missingQuestions.length ? <ul className="space-y-2 text-sm">{result.missingQuestions.map((item, index) => <li key={`${item.question}-${index}`}><span className="font-medium">{item.question}</span><p className="text-xs text-muted-foreground">{item.reason}</p></li>)}</ul> : <p className="text-sm text-muted-foreground">Nenhuma lacuna relevante apontada.</p>}
        </section>
      </div>

      {result.suggestedNextSteps.length > 0 && <section className="rounded-2xl border bg-card p-5"><h3 className="mb-3 text-sm font-semibold">Próximos passos sugeridos</h3><ol className="space-y-3">{result.suggestedNextSteps.map((item, index) => <li key={`${item.action}-${index}`} className="text-sm"><span className="font-medium">{index + 1}. {item.action}</span><p className="mt-0.5 text-xs text-muted-foreground">{item.rationale}</p></li>)}</ol></section>}

      {result.evidence.length > 0 && <section className="rounded-2xl border bg-card p-5"><h3 className="mb-3 text-sm font-semibold">Evidências usadas pela IA</h3><div className="grid gap-2 sm:grid-cols-2">{result.evidence.map((item, index) => <div key={`${item.date}-${item.field}-${index}`} className="rounded-xl bg-muted/40 p-3"><p className="text-xs font-medium">{item.date} · {item.field}</p><p className="mt-1 text-xs text-muted-foreground">{item.note}</p></div>)}</div></section>}

      <div className="rounded-xl border bg-muted/20 p-4 text-xs text-muted-foreground">
        <p className="flex items-center gap-2 font-medium text-foreground"><ShieldCheck className="h-4 w-4" />Limitações e cobertura</p>
        <p className="mt-1">{result.historyCoverage.representedAnamneses} de {result.historyCoverage.totalAnamneses} anamneses e {result.historyCoverage.representedFields} de {result.historyCoverage.totalFields} campos representados; {result.historyCoverage.truncatedFields} campo(s) compactado(s).</p>
        {result.confidence.supportingFactors.length > 0 && <p className="mt-1"><span className="font-medium text-foreground">Fatores favoráveis:</span> {result.confidence.supportingFactors.join(" • ")}</p>}
        {result.confidence.limitingFactors.length > 0 && <p className="mt-1">{result.confidence.limitingFactors.join(" • ")}</p>}
        <p className="mt-2">Esta análise é apoio à decisão e não substitui o julgamento clínico.</p>
      </div>
    </div>
  );
}
