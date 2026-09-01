"use client";

import { AlertTriangle, Bot, Check, ChevronRight, Loader2, MessageCircle, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { api } from "~/trpc/react";
import { AnalysisResultCard } from "./analysis-result-card";

export function AnalysisProgressPage({ anamnesisId }: { anamnesisId: string }) {
  const router = useRouter();
  const query = api.aiDiagnosis.getByAnamnesis.useQuery(
    { anamnesisId },
    { refetchInterval: (q) => ["PENDING", "PROCESSING"].includes(q.state.data?.state ?? "") ? 2_000 : false },
  );
  const retry = api.aiDiagnosis.retry.useMutation({
    onSuccess: () => void query.refetch(),
    onError: (error) => toast.error(error.message),
  });
  const data = query.data;
  const processing = data?.state === "PENDING" || data?.state === "PROCESSING";
  const completed = data?.state === "COMPLETED";

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <div>
        <p className="text-sm text-muted-foreground">Anamnese salva com segurança</p>
        <h1 className="text-2xl font-bold">Análise clínica por IA</h1>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Bot className="h-5 w-5 text-violet-500" />Acompanhamento</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-4">
            {["Anamnese salva", "Preparando histórico", "Analisando", "Finalizada"].map((label, index) => {
              const activeIndex = completed ? 3 : data?.state === "PROCESSING" ? 2 : 1;
              const done = index <= activeIndex;
              return <div key={label} className={`rounded-xl border p-3 text-sm ${done ? "border-primary/30 bg-primary/5" : "text-muted-foreground"}`}><span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs">{done ? <Check className="h-3 w-3" /> : index + 1}</span>{label}</div>;
            })}
          </div>
          {processing && <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Você pode aguardar ou continuar para o perfil do paciente.</p>}
        </CardContent>
      </Card>

      {completed && <AnalysisResultCard value={data.analysis?.result} />}

      {data?.state === "FAILED" && <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5"><p className="flex items-center gap-2 font-medium"><AlertTriangle className="h-5 w-5 text-red-500" />Não foi possível concluir a análise</p><p className="mt-1 text-sm text-muted-foreground">{data.analysis?.errorMessage}</p><Button className="mt-4" onClick={() => retry.mutate({ anamnesisId })} disabled={retry.isPending}>Tentar novamente</Button></div>}

      {data?.state === "NOT_CONFIGURED" && <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5"><p className="font-medium">Configure sua IA para gerar a análise</p><p className="mt-1 text-sm text-muted-foreground">A anamnese já está salva. Cadastre uma chave e escolha um modelo para analisar depois.</p><Button asChild className="mt-4"><Link href="/configuracoes/ia"><Settings className="mr-2 h-4 w-4" />Abrir configurações</Link></Button></div>}

      {["NOT_GENERATED", "STALE", "LEGACY"].includes(data?.state ?? "") && <div className="rounded-2xl border bg-card p-5"><p className="font-medium">{data?.state === "STALE" ? "A análise está desatualizada" : data?.state === "LEGACY" ? "Esta é uma análise legada" : "Análise ainda não gerada"}</p><Button className="mt-4" onClick={() => retry.mutate({ anamnesisId })} disabled={retry.isPending}>{retry.isPending ? "Iniciando..." : "Gerar análise atualizada"}</Button></div>}

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={() => data && router.push(`/pacientes/${data.patientId}?anamnesis=${anamnesisId}`)} disabled={!data}>
          {processing ? "Pular e ir para o paciente" : "Ver perfil do paciente"}<ChevronRight className="ml-2 h-4 w-4" />
        </Button>
        {data && <Button asChild><Link href={`/pacientes/${data.patientId}?anamnesis=${anamnesisId}&view=chat`}><MessageCircle className="mr-2 h-4 w-4" />Conversar sobre este caso</Link></Button>}
      </div>
    </main>
  );
}

