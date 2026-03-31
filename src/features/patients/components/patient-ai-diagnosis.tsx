"use client";

import {
  Bot,
  X,
  Shield,
  AlertTriangle,
  Lightbulb,
  Target,
  GitBranch,
  TrendingUp,
  Calendar,
  RotateCcw,
} from "lucide-react";

type AiDiagnosisData = {
  id: string;
  summary: string;
  mainDiagnosisHypothesis: string;
  differentialDiagnoses: string;
  identifiedPatterns: string;
  riskAlerts: string;
  recommendedActions: string;
  confidenceLevel: string;
  isValid: boolean;
  createdAt: Date;
  anamnesis: {
    date: Date;
    chiefComplaint: string;
  };
} | null | undefined;

type Props = {
  diagnosis: AiDiagnosisData;
  isLoading: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onMarkInvalid: (id: string) => void;
  isMarkingInvalid: boolean;
};

const confidenceConfig: Record<string, { color: string; bg: string; label: string }> = {
  ALTA: { color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", label: "Alta Confiança" },
  MEDIA: { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", label: "Confiança Média" },
  BAIXA: { color: "text-red-600 dark:text-red-400", bg: "bg-red-500/10", label: "Baixa Confiança" },
};

export function PatientAiDiagnosis({ diagnosis, isLoading, isError, onRetry, onMarkInvalid, isMarkingInvalid }: Props) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Carregando análise de IA...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-dashed border-destructive/40 bg-card/50 p-6 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-destructive/60 mb-2" />
        <p className="text-sm text-muted-foreground">
          Não foi possível carregar a análise de IA.
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Tentar novamente
          </button>
        )}
      </div>
    );
  }

  if (!diagnosis) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center">
        <Bot className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
        <p className="text-sm text-muted-foreground">
          Nenhuma análise de IA disponível para este paciente.
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          A análise será gerada automaticamente após a próxima anamnese.
        </p>
      </div>
    );
  }

  const conf = confidenceConfig[diagnosis.confidenceLevel] ?? confidenceConfig.MEDIA!;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-gradient-to-r from-violet-500/5 via-transparent to-transparent">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10">
            <Bot className="h-5 w-5 text-violet-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              Análise Care AI
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${conf.bg} ${conf.color}`}>
                <Shield className="h-3 w-3 mr-1" />
                {conf.label}
              </span>
            </h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Baseado na anamnese de{" "}
              {new Date(diagnosis.anamnesis.date).toLocaleDateString("pt-BR")}
              {" — "}
              {diagnosis.anamnesis.chiefComplaint}
            </p>
          </div>
        </div>

        {/* Feedback buttons */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground mr-1">Clique aqui caso ache essa informação incorreta</span>
          <button
            onClick={() => onMarkInvalid(diagnosis.id)}
            disabled={isMarkingInvalid}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors disabled:opacity-50 dark:text-red-400"
            title="Não, marcar como inválido"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="p-6 space-y-5">
        {/* Summary */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
            Resumo Geral
          </h4>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
            {diagnosis.summary}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Main Hypothesis */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5" />
              Hipótese Principal
            </h4>
            <p className="text-sm text-foreground">{diagnosis.mainDiagnosisHypothesis}</p>
          </div>

          {/* Differential Diagnoses */}
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <GitBranch className="h-3.5 w-3.5 text-blue-500" />
              Diagnósticos Diferenciais
            </h4>
            <p className="text-sm text-foreground">{diagnosis.differentialDiagnoses}</p>
          </div>
        </div>

        {/* Patterns */}
        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-violet-500" />
            Padrões Identificados
          </h4>
          <p className="text-sm text-foreground whitespace-pre-line">{diagnosis.identifiedPatterns}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Risk Alerts */}
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
            <h4 className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              Alertas de Risco
            </h4>
            <p className="text-sm text-foreground">{diagnosis.riskAlerts}</p>
          </div>

          {/* Recommended Actions */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <h4 className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Lightbulb className="h-3.5 w-3.5" />
              Ações Recomendadas
            </h4>
            <p className="text-sm text-foreground">{diagnosis.recommendedActions}</p>
          </div>
        </div>
      </div>

      {/* Footer disclaimer */}
      <div className="px-6 py-3 border-t border-border bg-muted/10">
        <p className="text-[10px] text-muted-foreground/60 text-center">
          ⚠️ Esta análise é gerada por IA e serve apenas como suporte. Não substitui o julgamento clínico do médico.
        </p>
      </div>
    </div>
  );
}
