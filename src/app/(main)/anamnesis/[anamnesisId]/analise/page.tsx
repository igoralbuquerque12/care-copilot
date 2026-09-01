import { AnalysisProgressPage } from "~/features/ai-analysis/components/analysis-progress-page";

export default async function Page({ params }: { params: Promise<{ anamnesisId: string }> }) {
  const { anamnesisId } = await params;
  return <AnalysisProgressPage anamnesisId={anamnesisId} />;
}
