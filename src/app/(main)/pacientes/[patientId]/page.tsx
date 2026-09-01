import { PatientProfilePage } from "~/features/patients/components/patient-profile-page";

export default async function Page({ params, searchParams }: { params: Promise<{ patientId: string }>; searchParams: Promise<{ anamnesis?: string }> }) {
  const [{ patientId }, query] = await Promise.all([params, searchParams]);
  return <PatientProfilePage patientId={patientId} initialAnamnesisId={query.anamnesis} />;
}
