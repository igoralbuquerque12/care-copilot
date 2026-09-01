"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { api } from "~/trpc/react";
import {
  buildEmptyConsolidatedFormState,
  type ConsolidatedFormState,
} from "~/schemas/audio-anamnesis-form";

import { PatientGatekeeperStep } from "./patient-gatekeeper-step";
import { AudioAnamnesisForm } from "./audio-anamnesis-form";
import { AudioManualDraftForm } from "./audio-manual-draft-form";
import { AudioReviewStep } from "./audio-review-step";
import { RecorderControl } from "./recorder-control";
import { CreditsBadge } from "./credits-badge";
import { useAudioConsultation } from "../hooks/useAudioConsultation";

type Props = {
  consultationId?: string;
};

type FormDisplayMode = "ai" | "manual";

type TemplateForDraft = {
  sections: Array<{
    fields: Array<{
      key: string;
      isSystemField: boolean;
    }>;
  }>;
};

const getCustomFieldDefaults = (template?: TemplateForDraft) =>
  Object.fromEntries(
    template?.sections
      .flatMap((section) => section.fields)
      .filter((field) => !field.isSystemField)
      .map((field) => [field.key, null]) ?? [],
  );

const buildManualDraftState = (
  source: ConsolidatedFormState,
  template?: TemplateForDraft,
) =>
  buildEmptyConsolidatedFormState({
    patient: source.patient,
    anamnesis: {
      consultationId: source.anamnesis.consultationId ?? null,
    },
    customFields: getCustomFieldDefaults(template),
    templateId: source.templateId ?? null,
  });

export function AudioAnamnesisPage({ consultationId }: Props) {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);

  const finalize = api.audioConsultation.finalize.useMutation();

  if (!sessionId) {
    return (
      <div className="bg-background min-h-screen p-4 md:p-8">
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
      onFinalize={async (formState) => {
        try {
          await finalize.mutateAsync({ sessionId, formState });
          toast.success("Consulta finalizada");
          router.push("/");
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
        <h1 className="text-foreground text-3xl font-semibold">
          Consulta com captura de áudio
        </h1>
        <p className="text-muted-foreground">
          A IA preenche a anamnese a partir da fala. Você só precisa conduzir a
          consulta.
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
  onFinalize: (formState: ConsolidatedFormState) => Promise<void>;
  isFinalizing: boolean;
}) {
  const [isReviewing, setIsReviewing] = useState(false);
  const [isOpeningReview, setIsOpeningReview] = useState(false);
  const [formMode, setFormMode] = useState<FormDisplayMode>("ai");
  const [manualDraft, setManualDraft] = useState<ConsolidatedFormState | null>(
    null,
  );
  const [manualNotes, setManualNotes] = useState("");
  const consultation = useAudioConsultation({ sessionId });
  const sessionTemplate = api.formTemplate.getById.useQuery(
    { id: consultation.formState?.templateId ?? "template-placeholder" },
    { enabled: !!consultation.formState?.templateId },
  );
  const defaultTemplate = api.formTemplate.getDefault.useQuery(undefined, {
    enabled: !!consultation.formState && !consultation.formState.templateId,
  });
  const reviewSummary = api.audioConsultation.getReviewSummary.useQuery(
    { sessionId },
    {
      enabled: isReviewing,
      refetchInterval: (query) => {
        if (!isReviewing) return false;
        if (consultation.visualState === "uploading") return 2000;

        const data = query.state.data;
        if (!data) return 2000;

        return data.pendingBatchCount > 0 || data.status === "PROCESSING"
          ? 2000
          : false;
      },
    },
  );
  const template = sessionTemplate.data ?? defaultTemplate.data;

  useEffect(() => {
    if (!consultation.formState) return;

    setManualDraft((current) => {
      const customDefaults = getCustomFieldDefaults(template);

      if (!current) {
        return buildManualDraftState(consultation.formState!, template);
      }

      return {
        ...current,
        patient: consultation.formState!.patient,
        templateId: consultation.formState!.templateId ?? current.templateId,
        customFields: {
          ...customDefaults,
          ...current.customFields,
        },
      };
    });
  }, [consultation.formState, template]);

  if (consultation.isLoading || !consultation.formState) {
    return (
      <div className="bg-background min-h-screen p-4 md:p-8">
        <div className="mx-auto max-w-3xl">
          <Card>
            <CardContent className="text-muted-foreground py-10 text-center text-sm">
              Carregando sessão...
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleOpenReview = async () => {
    setIsOpeningReview(true);
    setIsReviewing(true);
    try {
      await consultation.stop();
    } catch (error) {
      setIsReviewing(false);
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao preparar a revisão da consulta";
      toast.error(message);
    } finally {
      setIsOpeningReview(false);
    }
  };

  const isWaitingForBatches =
    isOpeningReview ||
    sessionTemplate.isLoading ||
    defaultTemplate.isLoading ||
    reviewSummary.isLoading ||
    consultation.visualState === "listening" ||
    consultation.visualState === "buffering" ||
    consultation.visualState === "uploading" ||
    consultation.session?.status === "PROCESSING" ||
    (reviewSummary.data?.pendingBatchCount ?? 0) > 0;

  return (
    <div className="bg-background min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <Header />
        {isReviewing ? (
          <AudioReviewStep
            formState={consultation.formState}
            template={template}
            summary={reviewSummary.data}
            manualDraft={manualDraft ?? undefined}
            manualNotes={manualNotes}
            isWaitingForBatches={isWaitingForBatches}
            isSubmitting={isFinalizing}
            onSubmit={onFinalize}
          />
        ) : (
          <>
            <RecorderControl
              visualState={consultation.visualState}
              onStart={consultation.start}
              onPause={consultation.pause}
              onStop={consultation.stop}
              onFinalize={handleOpenReview}
              isFinalizing={isOpeningReview}
              canFinalize={
                consultation.session?.status !== "FINALIZED" &&
                consultation.session?.status !== "ERROR" &&
                consultation.session?.status !== "INSUFFICIENT_CREDITS"
              }
            />
            <FormModeSwitch value={formMode} onChange={setFormMode} />
            {consultation.errorMessage && (
              <div className="border-destructive/40 bg-destructive/5 text-destructive rounded-lg border px-4 py-3 text-sm">
                {consultation.errorMessage}
              </div>
            )}
            {formMode === "ai" ? (
              <AudioAnamnesisForm
                formState={consultation.formState}
                template={template}
                readOnly
              />
            ) : manualDraft ? (
              <AudioManualDraftForm
                formState={manualDraft}
                onFormStateChange={setManualDraft}
                notes={manualNotes}
                onNotesChange={setManualNotes}
                template={template}
              />
            ) : (
              <Card>
                <CardContent className="text-muted-foreground py-10 text-center text-sm">
                  Preparando rascunho manual...
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function FormModeSwitch({
  value,
  onChange,
}: {
  value: FormDisplayMode;
  onChange: (value: FormDisplayMode) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Alternar formulário da consulta"
      className="bg-card flex w-full flex-col gap-2 rounded-xl border p-2 sm:w-fit sm:flex-row"
    >
      <Button
        type="button"
        variant={value === "ai" ? "default" : "ghost"}
        onClick={() => onChange("ai")}
      >
        Preenchimento da IA
      </Button>
      <Button
        type="button"
        variant={value === "manual" ? "default" : "ghost"}
        onClick={() => onChange("manual")}
      >
        Rascunho manual
      </Button>
    </div>
  );
}
