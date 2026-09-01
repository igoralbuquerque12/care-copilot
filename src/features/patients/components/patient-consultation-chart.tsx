"use client";

import { Activity } from "lucide-react";
import { useMemo, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { readFormSnapshot } from "~/server/services/aiDiagnosis/form-snapshot";
import type { RouterOutputs } from "~/trpc/react";

type TrendData = RouterOutputs["patient"]["getTrends"];
type Metric = { id: string; key: string; label: string; type: "NUMBER" | "BOOLEAN" | "NYHA" | "PRESSURE"; custom?: boolean };

const fixedMetrics: Metric[] = [
  { id: "pressure", key: "pressure", label: "Pressão arterial", type: "PRESSURE" },
  { id: "heartRate", key: "heartRate", label: "Frequência cardíaca", type: "NUMBER" },
  { id: "weight", key: "weight", label: "Peso", type: "NUMBER" },
  { id: "oxygenSaturation", key: "oxygenSaturation", label: "Saturação de oxigênio", type: "NUMBER" },
  { id: "nyhaClass", key: "nyhaClass", label: "Classe NYHA", type: "NYHA" },
];

export function PatientConsultationChart({ anamneses }: { anamneses: TrendData }) {
  const metrics = useMemo(() => {
    const custom = new Map<string, Metric>();
    for (const anamnesis of anamneses) {
      const snapshot = readFormSnapshot(anamnesis.formSnapshot);
      for (const field of snapshot?.sections.flatMap((section) => section.fields) ?? []) {
        if (!field.isSystemField && (field.fieldType === "NUMBER" || field.fieldType === "BOOLEAN")) {
          const id = `${field.fieldType}:${field.key}`;
          custom.set(id, { id, key: field.key, label: field.label, type: field.fieldType, custom: true });
        }
      }
    }
    return [...fixedMetrics, ...custom.values()];
  }, [anamneses]);
  const [selected, setSelected] = useState("pressure");
  const metric = metrics.find((item) => item.id === selected) ?? metrics[0]!;
  const data = anamneses.map((anamnesis) => {
    const custom = anamnesis.customResponses && typeof anamnesis.customResponses === "object" && !Array.isArray(anamnesis.customResponses) ? anamnesis.customResponses as Record<string, unknown> : {};
    const base: Record<string, string | number | null> = {
      date: new Date(anamnesis.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "2-digit" }),
    };
    if (metric.custom) {
      const raw = custom[metric.key];
      base.value = metric.type === "BOOLEAN" ? raw === true ? 1 : raw === false ? 0 : null : typeof raw === "number" ? raw : null;
    } else if (metric.type === "PRESSURE") {
      base.systolic = anamnesis.physicalExam?.bpSystolic ?? null;
      base.diastolic = anamnesis.physicalExam?.bpDiastolic ?? null;
    } else if (metric.type === "NYHA") {
      base.value = ({ I: 1, II: 2, III: 3, IV: 4 } as Record<string, number>)[anamnesis.nyhaClass] ?? null;
    } else {
      base.value = anamnesis.physicalExam?.[metric.key as "heartRate" | "weight" | "oxygenSaturation"] ?? null;
    }
    return base;
  });

  return <section className="rounded-2xl border bg-card p-4 md:p-5">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="flex items-center gap-2 text-sm font-semibold"><Activity className="h-4 w-4 text-primary" />Tendências clínicas</h2><p className="text-xs text-muted-foreground">Lacunas indicam campos não preenchidos naquela consulta.</p></div><Select value={selected} onValueChange={setSelected}><SelectTrigger className="w-full sm:w-64"><SelectValue /></SelectTrigger><SelectContent>{metrics.map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}</SelectContent></Select></div>
    {anamneses.length ? <div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={data}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis domain={metric.type === "BOOLEAN" ? [0, 1] : metric.type === "NYHA" ? [1, 4] : ["auto", "auto"]} ticks={metric.type === "BOOLEAN" ? [0, 1] : metric.type === "NYHA" ? [1, 2, 3, 4] : undefined} tick={{ fontSize: 11 }} /><Tooltip /><Legend />{metric.type === "PRESSURE" ? <><Line type="monotone" dataKey="systolic" name="Sistólica" stroke="#ef4444" strokeWidth={2} /><Line type="monotone" dataKey="diastolic" name="Diastólica" stroke="#3b82f6" strokeWidth={2} /></> : <Line type={metric.type === "BOOLEAN" || metric.type === "NYHA" ? "stepAfter" : "monotone"} dataKey="value" name={metric.label} stroke="#8b5cf6" strokeWidth={2} />}</LineChart></ResponsiveContainer></div> : <p className="py-10 text-center text-sm text-muted-foreground">Ainda não há dados para exibir.</p>}
  </section>;
}
