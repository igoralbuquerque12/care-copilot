"use client";

import { AlertTriangle, Bot, Loader2, RefreshCw, Settings } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { AnalysisResultCard } from "~/features/ai-analysis/components/analysis-result-card";
import { api } from "~/trpc/react";

export function PatientAiDiagnosis({ anamnesisId }: { anamnesisId: string }) {
  const query = api.aiDiagnosis.getByAnamnesis.useQuery(
    { anamnesisId },
    { refetchInterval: (q) => ["PENDING", "PROCESSING"].includes(q.state.data?.state ?? "") ? 2_000 : false },
  );
  const retry = api.aiDiagnosis.retry.useMutation({
    onSuccess: () => void query.refetch(),
    onError: (error) => toast.error(error.message),
  });
  if (query.isLoading) return <div className="flex items-center gap-2 rounded-xl border p-5 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Carregando análise...</div>;
  const data = query.data;
  if (!data) return null;
  if (data.state === "COMPLETED") return <AnalysisResultCard value={data.analysis?.result} />;
  if (data.state === "PENDING" || data.state === "PROCESSING") return <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-6 text-center"><Loader2 className="mx-auto h-7 w-7 animate-spin text-violet-500" /><p className="mt-2 font-medium">A IA está analisando esta anamnese</p><p className="text-sm text-muted-foreground">O resultado aparecerá automaticamente.</p></div>;
  if (data.state === "NOT_CONFIGURED") return <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5"><p className="flex items-center gap-2 font-medium"><Settings className="h-4 w-4" />IA não configurada</p><p className="mt-1 text-sm text-muted-foreground">Configure uma chave e um modelo antes de gerar.</p><Button asChild className="mt-4" size="sm"><Link href="/configuracoes/ia">Abrir configurações</Link></Button></div>;
  const failed = data.state === "FAILED";
  return <div className={`rounded-2xl border p-5 ${failed ? "border-red-500/30 bg-red-500/5" : "bg-card"}`}><p className="flex items-center gap-2 font-medium">{failed ? <AlertTriangle className="h-4 w-4 text-red-500" /> : <Bot className="h-4 w-4 text-violet-500" />}{failed ? "A análise falhou" : data.state === "STALE" ? "Análise desatualizada" : data.state === "LEGACY" ? "Análise legada" : "Análise ainda não gerada"}</p><p className="mt-1 text-sm text-muted-foreground">{failed ? data.analysis?.errorMessage : "Gere uma análise no formato clínico atual quando desejar."}</p><Button className="mt-4" size="sm" onClick={() => retry.mutate({ anamnesisId })} disabled={retry.isPending}><RefreshCw className="mr-2 h-4 w-4" />{retry.isPending ? "Iniciando..." : "Gerar análise atualizada"}</Button></div>;
}
