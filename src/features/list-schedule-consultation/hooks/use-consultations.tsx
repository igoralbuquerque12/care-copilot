"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api } from "~/trpc/react";

const currentDate = new Date();
const TODAY = [
  currentDate.getFullYear(),
  String(currentDate.getMonth() + 1).padStart(2, "0"),
  String(currentDate.getDate()).padStart(2, "0"),
].join("-");

export function useConsultations() {
  const [selectedDate, setSelectedDate] = useState<string>(TODAY);
  const [chartDays, setChartDays] = useState<7 | 30>(7);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const listQuery = api.scheduleConsultation.listByDate.useQuery(
    { date: selectedDate, page, pageSize },
    { staleTime: 30_000 },
  );

  const chartQuery = api.scheduleConsultation.chartData.useQuery(
    { days: chartDays },
    { staleTime: 60_000 },
  );

  const utils = api.useUtils();

  const invalidate = () => {
    void utils.scheduleConsultation.listByDate.invalidate();
    void utils.scheduleConsultation.chartData.invalidate();
  };

  const updateMutation = api.scheduleConsultation.update.useMutation({
    onSuccess: () => {
      toast.success("Consulta atualizada com sucesso!");
      invalidate();
    },
    onError: (error) => {
      toast.error(error.message ?? "Erro ao atualizar a consulta.");
    },
  });

  const deleteMutation = api.scheduleConsultation.delete.useMutation({
    onSuccess: () => {
      toast.success("Consulta excluída com sucesso!");
      invalidate();
    },
    onError: (error) => {
      toast.error(error.message ?? "Erro ao excluir a consulta.");
    },
  });

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return {
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
  };
}
