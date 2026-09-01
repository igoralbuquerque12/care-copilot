import { FileCheck, HeartPulse, Activity, AlertTriangle, CheckCircle, Shield } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { cn } from "~/lib/utils";

type SurgicalRiskAssessment = {
  id: string;
  surgeryName: string;
  leeScore: number;
  riskClass: string;
  isHighRiskSurgery: boolean;
  hasIschemicHeartDisease: boolean;
  hasCongestiveHeartFailure: boolean;
  hasCerebrovascularDisease: boolean;
  isInsulinDependent: boolean;
  hasElevatedCreatinine: boolean;
  asaClass: string | null;
  mets: number | null;
  recommendation: string | null;
  isCleared: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type SurgicalRiskReportProps = {
  assessment: SurgicalRiskAssessment;
  onEdit?: () => void;
};

const RISK_DISPLAY: Record<
  string,
  { label: string; color: string; icon: typeof CheckCircle; badgeClass: string }
> = {
  I: {
    label: "Classe I — Risco Muito Baixo (~0,4%)",
    color: "text-green-700 dark:text-green-400",
    icon: CheckCircle,
    badgeClass: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
  II: {
    label: "Classe II — Risco Baixo (~0,9%)",
    color: "text-yellow-700 dark:text-yellow-400",
    icon: Activity,
    badgeClass: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  },
  III: {
    label: "Classe III — Risco Intermediário (~6,6%)",
    color: "text-orange-700 dark:text-orange-400",
    icon: AlertTriangle,
    badgeClass: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  },
  IV: {
    label: "Classe IV — Risco Alto (~11%)",
    color: "text-red-700 dark:text-red-400",
    icon: HeartPulse,
    badgeClass: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  },
};

const PREDICTOR_LABELS: Record<string, string> = {
  isHighRiskSurgery: "Cirurgia de alto risco",
  hasIschemicHeartDisease: "Doença isquêmica cardíaca",
  hasCongestiveHeartFailure: "Insuficiência cardíaca congestiva",
  hasCerebrovascularDisease: "Doença cerebrovascular",
  isInsulinDependent: "Diabetes insulino-dependente",
  hasElevatedCreatinine: "Creatinina elevada (> 2,0 mg/dL)",
};

export function SurgicalRiskReport({ assessment, onEdit }: SurgicalRiskReportProps) {
  const riskDisplay = RISK_DISPLAY[assessment.riskClass] ?? RISK_DISPLAY.I!;
  const RiskIcon = riskDisplay.icon;

  const predictors = [
    { key: "isHighRiskSurgery", value: assessment.isHighRiskSurgery },
    { key: "hasIschemicHeartDisease", value: assessment.hasIschemicHeartDisease },
    { key: "hasCongestiveHeartFailure", value: assessment.hasCongestiveHeartFailure },
    { key: "hasCerebrovascularDisease", value: assessment.hasCerebrovascularDisease },
    { key: "isInsulinDependent", value: assessment.isInsulinDependent },
    { key: "hasElevatedCreatinine", value: assessment.hasElevatedCreatinine },
  ];

  const presentPredictors = predictors.filter((p) => p.value);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileCheck className="h-5 w-5 text-muted-foreground" />
            Laudo de Risco Cirúrgico
          </CardTitle>
          {onEdit && (
            <button
              onClick={onEdit}
              className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
            >
              Editar
            </button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Cirurgia: <strong>{assessment.surgeryName}</strong>
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Resultado principal */}
        <div
          className={cn(
            "rounded-lg border p-4 flex items-center gap-3",
            assessment.riskClass === "I" && "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950",
            assessment.riskClass === "II" && "border-yellow-300 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950",
            assessment.riskClass === "III" && "border-orange-300 bg-orange-50 dark:border-orange-800 dark:bg-orange-950",
            assessment.riskClass === "IV" && "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950",
          )}
        >
          <RiskIcon className={cn("h-6 w-6 shrink-0", riskDisplay.color)} />
          <div className="flex-1 min-w-0">
            <p className={cn("font-semibold text-sm", riskDisplay.color)}>
              {riskDisplay.label}
            </p>
            <p className={cn("text-xs mt-0.5", riskDisplay.color)}>
              Score de Lee: {assessment.leeScore} de 6 pontos
            </p>
          </div>
          <Badge className={riskDisplay.badgeClass}>RCRI {assessment.riskClass}</Badge>
        </div>

        {/* Preditores presentes */}
        {presentPredictors.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Fatores de Risco Identificados
            </p>
            <ul className="space-y-1">
              {presentPredictors.map((p) => (
                <li key={p.key} className="flex items-center gap-2 text-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-foreground/50 shrink-0" />
                  {PREDICTOR_LABELS[p.key]}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Dados complementares */}
        {(assessment.asaClass ?? assessment.mets) && (
          <>
            <Separator />
            <div className="grid grid-cols-2 gap-3 text-sm">
              {assessment.asaClass && (
                <div>
                  <p className="text-xs text-muted-foreground">Classificação ASA</p>
                  <p className="font-medium">ASA {assessment.asaClass}</p>
                </div>
              )}
              {assessment.mets && (
                <div>
                  <p className="text-xs text-muted-foreground">Capacidade Funcional</p>
                  <p className="font-medium">{assessment.mets} METs</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Parecer */}
        {assessment.recommendation && (
          <>
            <Separator />
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Parecer Médico
              </p>
              <p className="text-sm whitespace-pre-wrap">{assessment.recommendation}</p>
            </div>
          </>
        )}

        {/* Liberação */}
        <Separator />
        <div className="flex items-center gap-2">
          <Shield
            className={cn(
              "h-4 w-4",
              assessment.isCleared ? "text-green-600" : "text-red-600",
            )}
          />
          <span className="text-sm font-medium">
            {assessment.isCleared
              ? "Paciente liberado para o procedimento cirúrgico"
              : "Paciente NÃO liberado para o procedimento cirúrgico"}
          </span>
        </div>

        {/* Rodapé */}
        <p className="text-xs text-muted-foreground text-right">
          Avaliado em{" "}
          {new Intl.DateTimeFormat("pt-BR", {
            dateStyle: "short",
            timeStyle: "short",
          }).format(new Date(assessment.createdAt))}
        </p>
      </CardContent>
    </Card>
  );
}
