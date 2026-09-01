"use client";

import { useWatch, type Control } from "react-hook-form";
import { HeartPulse, Activity, AlertTriangle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Checkbox } from "~/components/ui/checkbox";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "~/components/ui/form";
import { cn } from "~/lib/utils";
import type { CreateSurgicalRiskInput } from "~/schemas/surgical-risk";

type LeePredictor = {
  field: keyof Pick<
    CreateSurgicalRiskInput,
    | "isHighRiskSurgery"
    | "hasIschemicHeartDisease"
    | "hasCongestiveHeartFailure"
    | "hasCerebrovascularDisease"
    | "isInsulinDependent"
    | "hasElevatedCreatinine"
  >;
  label: string;
  description: string;
};

const LEE_PREDICTORS: LeePredictor[] = [
  {
    field: "isHighRiskSurgery",
    label: "Cirurgia de Alto Risco",
    description:
      "Cirurgia intraperitoneal, intratorácica ou vascular suprainguinal",
  },
  {
    field: "hasIschemicHeartDisease",
    label: "Doença Isquêmica Cardíaca",
    description:
      "Infarto prévio, angina, uso de nitratos, onda Q no ECG ou isquemia documentada",
  },
  {
    field: "hasCongestiveHeartFailure",
    label: "Insuficiência Cardíaca Congestiva",
    description:
      "Dispneia paroxística noturna, edema pulmonar, estertores bilaterais ou ICC",
  },
  {
    field: "hasCerebrovascularDisease",
    label: "Doença Cerebrovascular",
    description: "AVC ou AIT prévio",
  },
  {
    field: "isInsulinDependent",
    label: "Diabetes Insulino-dependente",
    description: "Diabetes mellitus em uso de insulina",
  },
  {
    field: "hasElevatedCreatinine",
    label: "Creatinina Elevada",
    description: "Creatinina sérica pré-operatória > 2,0 mg/dL",
  },
];

type RiskConfig = {
  label: string;
  riskRange: string;
  colorClass: string;
  badgeVariant: "default" | "secondary" | "destructive" | "outline";
  alertClass: string;
  icon: typeof CheckCircle;
};

const RISK_CONFIG: Record<string, RiskConfig> = {
  I: {
    label: "Classe I — Risco Muito Baixo",
    riskRange: "~0,4% de MACE",
    colorClass: "text-green-700 dark:text-green-400",
    badgeVariant: "default",
    alertClass:
      "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950",
    icon: CheckCircle,
  },
  II: {
    label: "Classe II — Risco Baixo",
    riskRange: "~0,9% de MACE",
    colorClass: "text-yellow-700 dark:text-yellow-400",
    badgeVariant: "secondary",
    alertClass:
      "border-yellow-300 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950",
    icon: Activity,
  },
  III: {
    label: "Classe III — Risco Intermediário",
    riskRange: "~6,6% de MACE",
    colorClass: "text-orange-700 dark:text-orange-400",
    badgeVariant: "secondary",
    alertClass:
      "border-orange-300 bg-orange-50 dark:border-orange-800 dark:bg-orange-950",
    icon: AlertTriangle,
  },
  IV: {
    label: "Classe IV — Risco Alto",
    riskRange: "~11% de MACE",
    colorClass: "text-red-700 dark:text-red-400",
    badgeVariant: "destructive",
    alertClass:
      "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950",
    icon: HeartPulse,
  },
};

function computeRiskClass(score: number): string {
  if (score === 0) return "I";
  if (score === 1) return "II";
  if (score === 2) return "III";
  return "IV";
}

type SurgicalRiskCalculatorProps = {
  control: Control<CreateSurgicalRiskInput>;
};

export function SurgicalRiskCalculator({ control }: SurgicalRiskCalculatorProps) {
  const watched = useWatch({ control });

  const score = LEE_PREDICTORS.reduce(
    (acc, p) => acc + (watched[p.field] ? 1 : 0),
    0,
  );
  const riskClass = computeRiskClass(score);
  const config = RISK_CONFIG[riskClass]!;
  const RiskIcon = config.icon;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {LEE_PREDICTORS.map((predictor) => (
          <FormField
            key={predictor.field}
            control={control}
            name={predictor.field}
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 hover:bg-muted/40 transition-colors">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-0.5 leading-none">
                  <FormLabel className="cursor-pointer font-medium">
                    {predictor.label}
                  </FormLabel>
                  <p className="text-xs text-muted-foreground">
                    {predictor.description}
                  </p>
                </div>
              </FormItem>
            )}
          />
        ))}
      </div>

      {/* Score reativo */}
      <Alert className={cn("mt-4 transition-all", config.alertClass)}>
        <RiskIcon className={cn("h-4 w-4", config.colorClass)} />
        <AlertTitle className={cn("flex items-center gap-2", config.colorClass)}>
          {config.label}
          <Badge variant={config.badgeVariant} className="ml-auto text-xs">
            {score} / 6 pontos
          </Badge>
        </AlertTitle>
        <AlertDescription className={cn("text-sm", config.colorClass)}>
          Risco estimado de evento cardíaco adverso grave (MACE):{" "}
          <strong>{config.riskRange}</strong>
        </AlertDescription>
      </Alert>
    </div>
  );
}
