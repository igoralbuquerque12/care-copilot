"use client";

import { api } from "~/trpc/react";

export function useDailyAppointments(date: string | undefined) {
    const query = api.scheduleConsultation.listByDate.useQuery(
        { date: date ?? "", page: 1, pageSize: 100 },
        {
            enabled: !!date && /^\d{4}-\d{2}-\d{2}$/.test(date),
            staleTime: 30_000,
        },
    );

    return {
        appointments: query.data?.items ?? [],
        isLoading: query.isLoading,
        refetch: query.refetch,
    };
}
