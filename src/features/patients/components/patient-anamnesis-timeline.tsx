"use client";

import { Bot, Calendar, ChevronLeft, ChevronRight, Stethoscope } from "lucide-react";
import { Button } from "~/components/ui/button";
import { readFormSnapshot } from "~/server/services/aiDiagnosis/form-snapshot";
import type { RouterOutputs } from "~/trpc/react";

type Timeline = RouterOutputs["patient"]["getTimeline"];

const statusLabel: Record<string, string> = {
  PENDING: "Na fila", PROCESSING: "Analisando", COMPLETED: "IA pronta", FAILED: "Falhou",
  STALE: "Desatualizada", LEGACY: "Legada", NOT_GENERATED: "Não gerada",
};

const elapsedLabel = (date: Date) => {
  const days = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000));
  if (days < 1) return "hoje";
  if (days < 30) return `há ${days} dia${days === 1 ? "" : "s"}`;
  const months = Math.floor(days / 30);
  if (months < 12) return `há ${months} ${months === 1 ? "mês" : "meses"}`;
  const years = Math.floor(days / 365);
  return `há ${years} ano${years === 1 ? "" : "s"}`;
};

export function PatientAnamnesisTimeline({ data, selectedId, onSelect, onPage }: { data: Timeline; selectedId: string | null; onSelect: (id: string) => void; onPage: (page: number) => void }) {
  return <section className="overflow-hidden rounded-2xl border bg-card">
    <div className="border-b p-4"><h2 className="flex items-center gap-2 text-sm font-semibold"><Stethoscope className="h-4 w-4 text-primary" />Anamneses ({data.total})</h2></div>
    <div className="divide-y">{data.items.map((item) => {
      const snapshot = readFormSnapshot(item.formSnapshot);
      return <button key={item.id} type="button" onClick={() => onSelect(item.id)} className={`w-full p-4 text-left transition ${selectedId === item.id ? "bg-primary/5 ring-1 ring-inset ring-primary/20" : "hover:bg-muted/30"}`}>
        <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="h-3 w-3" />{new Date(item.date).toLocaleDateString("pt-BR")} ({elapsedLabel(new Date(item.date))}) · {snapshot?.templateName ?? item.template?.name ?? "Formulário antigo"}</p><p className="mt-1 line-clamp-2 text-sm font-medium">{item.chiefComplaint}</p></div><span className="shrink-0 rounded-full bg-violet-500/10 px-2 py-1 text-[10px] text-violet-700 dark:text-violet-300"><Bot className="mr-1 inline h-3 w-3" />{statusLabel[item.analysisState] ?? item.analysisState}</span></div>
        <div className="mt-2 flex gap-1"><span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">NYHA {item.nyhaClass}</span>{[item.hasChestPain && "Dor torácica", item.hasEdema && "Edema", item.hasSyncope && "Síncope"].filter(Boolean).map((label) => <span key={String(label)} className="rounded bg-muted px-1.5 py-0.5 text-[10px]">{label}</span>)}</div>
      </button>;
    })}</div>
    {data.totalPages > 1 && <div className="flex items-center justify-between border-t p-3"><Button size="sm" variant="ghost" disabled={data.page === 1} onClick={() => onPage(data.page - 1)}><ChevronLeft className="h-4 w-4" /></Button><span className="text-xs text-muted-foreground">Página {data.page} de {data.totalPages}</span><Button size="sm" variant="ghost" disabled={data.page === data.totalPages} onClick={() => onPage(data.page + 1)}><ChevronRight className="h-4 w-4" /></Button></div>}
  </section>;
}
