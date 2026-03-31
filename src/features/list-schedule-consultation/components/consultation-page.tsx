"use client";

import { useConsultations } from "~/features/list-schedule-consultation/hooks/use-consultations";
import { ConsultationHeader } from "~/features/list-schedule-consultation/components/consultation-header";
import { ConsultationChart } from "~/features/list-schedule-consultation/components/consultation-chart";
import { ConsultationTable } from "~/features/list-schedule-consultation/components/consultation-table";
import { ConsultationPagination } from "~/features/list-schedule-consultation/components/consultation-pagination";
import type { ConsultationItem } from "~/features/list-schedule-consultation/types/consultation.types";

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

  const paginatedData = listQuery.data;
  const items = (paginatedData?.items ?? []) as ConsultationItem[];
  const totalPages = paginatedData?.totalPages ?? 1;
  const total = paginatedData?.total ?? 0;
  const chartData = chartQuery.data ?? [];

  return (
    <div className="space-y-6 p-6">
      <ConsultationHeader
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
      />

      <ConsultationChart
        data={chartData}
        isLoading={chartQuery.isLoading}
        chartDays={chartDays}
        onChangeDays={setChartDays}
      />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-foreground font-semibold">
            Consultations of the day
          </h2>
          {total > 0 && (
            <span className="text-muted-foreground text-xs">
              {total} consultation{total !== 1 ? "s" : ""}
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
    </div>
  );
}
