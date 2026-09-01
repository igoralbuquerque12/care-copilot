import { api } from "~/trpc/react";

export function usePatientDetail(patientId: string, page: number) {
  const overview = api.patient.getOverview.useQuery({ patientId });
  const timeline = api.patient.getTimeline.useQuery(
    { patientId, page, pageSize: 10 },
    {
      refetchInterval: (query) => query.state.data?.items.some(
        (item) => item.analysisState === "PENDING" || item.analysisState === "PROCESSING",
      ) ? 2_000 : false,
    },
  );
  const trends = api.patient.getTrends.useQuery({ patientId });

  return { overview, timeline, trends };
}
