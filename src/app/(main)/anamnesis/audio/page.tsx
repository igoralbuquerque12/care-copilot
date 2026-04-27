import { AudioAnamnesisPage } from "~/features/audio-anamnesis/components/audio-anamnesis-page";

type Props = {
  searchParams: Promise<{ consultationId?: string }>;
};

export default async function AudioAnamnesisRoute({ searchParams }: Props) {
  const params = await searchParams;
  return <AudioAnamnesisPage consultationId={params.consultationId} />;
}
