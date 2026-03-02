"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api } from "~/trpc/react";

const TODAY = new Date().toISOString().split("T")[0]!;

export function useConsultations() {
    const [selectedDate, setSelectedDate] = useState<string>(TODAY);
    const [chartDays, setChartDays] = useState<7 | 30>(7);
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const listQuery = api.scheduleConsultation.listPaginated.useQuery(
        { date: selectedDate, page, pageSize },
        { staleTime: 30_000 },
    );

    const chartQuery = api.scheduleConsultation.chartData.useQuery(
        { days: chartDays },
        { staleTime: 60_000 },
    );

    const utils = api.useUtils();

    const invalidate = () => {
        void utils.scheduleConsultation.listPaginated.invalidate();
        void utils.scheduleConsultation.chartData.invalidate();
    };

    const updateMutation = api.scheduleConsultation.update.useMutation({
        onSuccess: () => {
            toast.success("Consultation updated successfully!");
            invalidate();
        },
        onError: (error) => {
            toast.error(error.message ?? "Error updating consultation.");
        },
    });

    const deleteMutation = api.scheduleConsultation.delete.useMutation({
        onSuccess: () => {
            toast.success("Consultation deleted successfully!");
            invalidate();
        },
        onError: (error) => {
            toast.error(error.message ?? "Error deleting consultation.");
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
