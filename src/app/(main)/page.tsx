"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Users, CalendarPlus, ClipboardPlus } from "lucide-react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { ConsultationChart } from "~/features/list-schedule-consultation/components/consultation-chart";

function getTodayStr() {
  return new Date().toISOString().split("T")[0]!;
}

export default function DashboardPage() {
  const router = useRouter();
  const today = getTodayStr();
  const [chartDays, setChartDays] = useState<7 | 30>(7);

  const consultationsToday = api.scheduleConsultation.listByDate.useQuery({ date: today, page: 1, pageSize: 100 });
  const patients = api.patient.list.useQuery();
  const chartQuery = api.scheduleConsultation.chartData.useQuery({ days: chartDays });

  const todayCount = consultationsToday.data?.total ?? 0;
  const patientCount = patients.data?.length ?? 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Bem-vindo de volta. Aqui está o resumo do seu dia.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Consultas Hoje</p>
              {consultationsToday.isLoading ? (
                <Skeleton className="mt-1 h-7 w-12" />
              ) : (
                <p className="text-2xl font-bold text-foreground">{todayCount}</p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total de Pacientes</p>
              {patients.isLoading ? (
                <Skeleton className="mt-1 h-7 w-12" />
              ) : (
                <p className="text-2xl font-bold text-foreground">{patientCount}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => router.push("/consultas")} className="gap-2">
          <CalendarPlus className="h-4 w-4" />
          Agendar Consulta
        </Button>
        <Button variant="outline" onClick={() => router.push("/pacientes")} className="gap-2">
          <ClipboardPlus className="h-4 w-4" />
          Nova Anamnese
        </Button>
      </div>

      {/* Chart */}
      <ConsultationChart
        data={chartQuery.data ?? []}
        isLoading={chartQuery.isLoading}
        chartDays={chartDays}
        onChangeDays={setChartDays}
      />
    </div>
  );
}
