"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Card, CardContent } from "~/components/ui/card";
import { api } from "~/trpc/react";

import { PatientGatekeeperStep } from "./patient-gatekeeper-step";
import { AudioAnamnesisForm } from "./audio-anamnesis-form";
import { RecorderControl } from "./recorder-control";
import { CreditsBadge } from "./credits-badge";
import { useAudioConsultation } from "../hooks/useAudioConsultation";

type Props = {
  consultationId?: string;
};

export function AudioAnamnesisPage({ consultationId }: Props) {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);

  const finalize = api.audioConsultation.finalize.useMutation();

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <Header />
          <PatientGatekeeperStep
            consultationId={consultationId}
            onReady={(id) => setSessionId(id)}
          />
        </div>
      </div>
    );
  }

  return (
    <SessionView
      sessionId={sessionId}
      onFinalize={async () => {
        try {
          const result = await finalize.mutateAsync({ sessionId });
          toast.success("Consulta finalizada");
          router.push(`/pacientes?highlight=${result.anamnesisId}`);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Erro ao finalizar";
          toast.error(message);
        }
      }}
      isFinalizing={finalize.isPending}
    />
  );
}

function Header() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">
          Consulta com captura de audio
        </h1>
        <p className="text-muted-foreground">
          A IA preenche a anamnese a partir da fala. Voce so precisa conduzir
          a consulta.
        </p>
      </div>
      <CreditsBadge />
    </div>
  );
}

function SessionView({
  sessionId,
  onFinalize,
  isFinalizing,
}: {
  sessionId: string;
  onFinalize: () => Promise<void>;
  isFinalizing: boolean;
}) {
  const consultation = useAudioConsultation({ sessionId });

  if (consultation.isLoading || !consultation.formState) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="mx-auto max-w-3xl">
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Carregando sessao...
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <Header />
        <RecorderControl
          visualState={consultation.visualState}
          onStart={consultation.start}
          onPause={consultation.pause}
          onStop={consultation.stop}
          onFinalize={onFinalize}
          isFinalizing={isFinalizing}
          canFinalize={
            consultation.session?.status !== "FINALIZED" &&
            consultation.visualState !== "uploading"
          }
        />
        {consultation.errorMessage && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {consultation.errorMessage}
          </div>
        )}
        <AudioAnamnesisForm formState={consultation.formState} readOnly />
      </div>
    </div>
  );
}
