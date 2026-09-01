"use client";

import Link from "next/link";
import {
  CalendarDays,
  HeartPulse,
  Mic,
  Stethoscope,
  Users,
} from "lucide-react";
import { Skeleton } from "~/components/ui/skeleton";
import { ConsultationChart } from "~/features/list-schedule-consultation/components/consultation-chart";
import { ConsultationHeader } from "~/features/list-schedule-consultation/components/consultation-header";
import { ConsultationPagination } from "~/features/list-schedule-consultation/components/consultation-pagination";
import { ConsultationTable } from "~/features/list-schedule-consultation/components/consultation-table";
import { useConsultations } from "~/features/list-schedule-consultation/hooks/use-consultations";
import type { ConsultationItem } from "~/features/list-schedule-consultation/types/consultation.types";
import { api } from "~/trpc/react";

const QUICK_ACCESS = [
  {
    title: "Anamnese manual",
    description: "Registre uma consulta pelo formulário clínico.",
    href: "/anamnesis",
    icon: Stethoscope,
  },
  {
    title: "Anamnese por voz",
    description: "Conduza a consulta com captura de áudio.",
    href: "/anamnesis/audio",
    icon: Mic,
  },
  {
    title: "Risco Cirúrgico",
    description: "Calcule e registre o escore de risco perioperatório.",
    href: "/risco-cirurgico",
    icon: HeartPulse,
  },
] as const;

const currentDate = new Date();
const today = [
  currentDate.getFullYear(),
  String(currentDate.getMonth() + 1).padStart(2, "0"),
  String(currentDate.getDate()).padStart(2, "0"),
].join("-");

export function ConsultationsPage() {
  const {
    selectedDate,
    handleDateChange,
    chartDays,
    setChartDays,
    page,
    pageSize,
    handlePageChange,
    listQuery,
    chartQuery,
    updateMutation,
    deleteMutation,
  } = useConsultations();

  const patients = api.patient.list.useQuery();
  const consultationsToday = api.scheduleConsultation.listByDate.useQuery({
    date: today,
    page: 1,
    pageSize: 1,
  });
  const paginatedData = listQuery.data;
  const items = (paginatedData?.items ?? []) as ConsultationItem[];
  const totalPages = paginatedData?.totalPages ?? 1;
  const total = paginatedData?.total ?? 0;

  return (
    <main className="w-full space-y-8 p-4 md:p-6 lg:p-8">
      <header>
        <h1 className="text-foreground text-2xl font-bold tracking-tight md:text-3xl">
          Visão geral
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Acompanhe sua agenda e acesse rapidamente os principais fluxos do
          atendimento.
        </p>
      </header>

      <section aria-label="Resumo do dia" className="grid gap-4 sm:grid-cols-2">
        <SummaryCard
          icon={CalendarDays}
          label="Consultas hoje"
          value={consultationsToday.data?.total ?? 0}
          isLoading={consultationsToday.isLoading}
        />
        <SummaryCard
          icon={Users}
          label="Total de pacientes"
          value={patients.data?.length ?? 0}
          isLoading={patients.isLoading}
        />
      </section>

      <section className="space-y-3" aria-labelledby="quick-access-title">
        <div>
          <h2 id="quick-access-title" className="text-foreground font-semibold">
            Acessos rápidos
          </h2>
          <p className="text-muted-foreground text-xs">
            Inicie um novo atendimento ou uma avaliação clínica.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {QUICK_ACCESS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group bg-card hover:border-primary/40 hover:bg-primary/[0.03] focus-visible:ring-ring flex min-w-0 items-center gap-4 rounded-xl border p-4 shadow-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <span className="bg-primary/10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105">
                <item.icon className="text-primary h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="text-foreground block font-semibold">
                  {item.title}
                </span>
                <span className="text-muted-foreground mt-0.5 block text-xs leading-relaxed">
                  {item.description}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-5" aria-labelledby="consultations-title">
        <ConsultationHeader
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
        />

        <ConsultationChart
          data={chartQuery.data ?? []}
          isLoading={chartQuery.isLoading}
          chartDays={chartDays}
          onChangeDays={setChartDays}
        />

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-foreground font-semibold">Consultas do dia</h2>
            {total > 0 && (
              <span className="text-muted-foreground text-xs">
                {total} {total === 1 ? "consulta" : "consultas"}
              </span>
            )}
          </div>

          <ConsultationTable
            items={items}
            isLoading={listQuery.isLoading}
            updateMutation={updateMutation}
            deleteMutation={deleteMutation}
          />

          <ConsultationPagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            onPageChange={handlePageChange}
          />
        </div>
      </section>
    </main>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  isLoading,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: number;
  isLoading: boolean;
}) {
  return (
    <div className="bg-card rounded-xl border p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-xl">
          <Icon className="text-primary h-5 w-5" />
        </span>
        <div>
          <p className="text-muted-foreground text-xs">{label}</p>
          {isLoading ? (
            <Skeleton className="mt-1 h-7 w-12" />
          ) : (
            <p className="text-foreground text-2xl font-bold">{value}</p>
          )}
        </div>
      </div>
    </div>
  );
}
