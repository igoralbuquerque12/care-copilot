"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { Activity, TrendingUp, Heart } from "lucide-react";

type AnamnesisForChart = {
  date: Date;
  nyhaClass: string;
  physicalExam?: {
    bpSystolic?: number | null;
    bpDiastolic?: number | null;
    heartRate?: number | null;
    weight?: number | null;
  } | null;
  hasPalpitations: boolean;
  hasSyncope: boolean;
  hasEdema: boolean;
  hasChestPain: boolean;
};

type Props = {
  anamneses: AnamnesisForChart[];
};

const nyhaToNumber: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4 };

export function PatientConsultationChart({ anamneses }: Props) {
  if (anamneses.length === 0) {
    return null;
  }

  // Reverse to get chronological order (oldest first)
  const sorted = [...anamneses].reverse();

  const vitalData = sorted
    .filter((a) => a.physicalExam)
    .map((a) => ({
      date: new Date(a.date).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      }),
      sistólica: a.physicalExam?.bpSystolic ?? null,
      diastólica: a.physicalExam?.bpDiastolic ?? null,
      fc: a.physicalExam?.heartRate ?? null,
    }));

  const nyhaData = sorted.map((a) => ({
    date: new Date(a.date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    }),
    nyha: nyhaToNumber[a.nyhaClass] ?? 1,
  }));

  const symptomData = sorted.map((a) => ({
    date: new Date(a.date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    }),
    palpitações: a.hasPalpitations ? 1 : 0,
    síncope: a.hasSyncope ? 1 : 0,
    edema: a.hasEdema ? 1 : 0,
    "dor torácica": a.hasChestPain ? 1 : 0,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Vital Signs Chart */}
      {vitalData.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="h-4 w-4 text-red-500" />
            <h3 className="text-sm font-semibold text-foreground">Pressão Arterial & FC</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={vitalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Line type="monotone" dataKey="sistólica" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="diastólica" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="fc" stroke="#a855f7" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* NYHA Progression */}
      {nyhaData.length > 1 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-foreground">Progressão Classe NYHA</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={nyhaData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis
                domain={[0, 4]}
                ticks={[1, 2, 3, 4]}
                tickFormatter={(v: number) => `NYHA ${["", "I", "II", "III", "IV"][v] ?? v}`}
                tick={{ fontSize: 10 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip
                formatter={(value: number | undefined) => [`Classe ${["", "I", "II", "III", "IV"][value ?? 0] ?? value}`, "NYHA"]}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
              />
              <Area
                type="stepAfter"
                dataKey="nyha"
                stroke="#f59e0b"
                fill="#f59e0b"
                fillOpacity={0.15}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Symptoms Over Time */}
      {symptomData.length > 1 && (
        <div className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-emerald-500" />
            <h3 className="text-sm font-semibold text-foreground">Sintomas por Consulta</h3>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={symptomData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis domain={[0, 1]} ticks={[0, 1]} tickFormatter={(v: number) => v === 1 ? "Sim" : "Não"} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                formatter={(value: number | undefined) => [value === 1 ? "Presente" : "Ausente"]}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Bar dataKey="palpitações" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="síncope" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="edema" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="dor torácica" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
