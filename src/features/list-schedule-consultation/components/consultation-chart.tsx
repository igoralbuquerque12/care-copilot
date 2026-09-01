"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Skeleton } from "~/components/ui/skeleton";
import { Button } from "~/components/ui/button";
import type { ChartEntry } from "~/features/list-schedule-consultation/types/consultation.types";

type ConsultationChartProps = {
  data: ChartEntry[];
  isLoading: boolean;
  chartDays: 7 | 30;
  onChangeDays: (days: 7 | 30) => void;
};

function formatDate(dateStr: string) {
  return new Date(`${dateStr}T12:00:00Z`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  });
}

export function ConsultationChart({
  data,
  isLoading,
  chartDays,
  onChangeDays,
}: ConsultationChartProps) {
  const chartData = data.map((entry) => ({
    date: formatDate(entry.date),
    Consultas: entry.count,
  }));

  return (
    <div className="bg-card rounded-xl border p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-foreground font-semibold">Agendamentos</h2>
          <p className="text-muted-foreground text-xs">
            Próximos {chartDays} dias
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={chartDays === 7 ? "default" : "outline"}
            onClick={() => onChangeDays(7)}
          >
            7 dias
          </Button>
          <Button
            size="sm"
            variant={chartDays === 30 ? "default" : "outline"}
            onClick={() => onChangeDays(30)}
          >
            30 dias
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-48 w-full rounded-lg" />
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} barSize={chartDays === 30 ? 8 : 20}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="var(--border)"
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "var(--foreground)" }}
              tickLine={false}
              axisLine={false}
              interval={chartDays === 30 ? 4 : 0}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "var(--foreground)" }}
              width={24}
            />
            <Tooltip
              cursor={{ fill: "var(--muted)", opacity: 0.4 }}
              contentStyle={{
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
                background: "var(--card)",
                color: "var(--foreground)",
                fontSize: "12px",
              }}
              itemStyle={{ color: "var(--foreground)" }}
            />
            <Bar
              dataKey="Consultas"
              radius={[4, 4, 0, 0]}
              fill="var(--primary)"
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
