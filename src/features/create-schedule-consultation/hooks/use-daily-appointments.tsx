"use client";

import { api } from "~/trpc/react";

export function useDailyAppointments(date: string | undefined) {
    const query = api.scheduleConsultation.listByDate.useQuery(
        { date: date ?? "" },
        {
            enabled: !!date && /^\d{4}-\d{2}-\d{2}$/.test(date),
            staleTime: 30_000,
        },
    );

    return {
        appointments: query.data ?? [],
        isLoading: query.isLoading,
        refetch: query.refetch,
    };
}
