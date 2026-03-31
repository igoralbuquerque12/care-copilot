import { AnamnesisWizard } from "~/features/anamnesis/components/anamnesis-wizard"

type Props = {
  searchParams: Promise<{ consultationId?: string }>
}

export default async function AnamnesisPage({ searchParams }: Props) {
  const params = await searchParams
  return <AnamnesisWizard consultationId={params.consultationId} />
}
