"use client";

import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Coins,
  Loader2,
  Mic2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { DynamicFieldRenderer } from "~/features/anamnesis/components/dynamic-field-renderer";
import { PHYSICAL_EXAM_FIELD_KEYS } from "~/features/anamnesis/constants/system-fields";
import type { ConsolidatedFormState } from "~/schemas/audio-anamnesis-form";
import type { FormFieldType } from "~/schemas/form-template";

type Template = {
  sections: Array<{
    id: string;
    name: string;
    fields: Array<{
      id: string;
      key: string;
      label: string;
      description?: string | null;
      fieldType: FormFieldType;
      isRequired: boolean;
      isVisible: boolean;
      config?: unknown;
      isSystemField: boolean;
      systemKey?: string | null;
    }>;
  }>;
};

type ReviewSummary = {
  pendingBatchCount: number;
  durationSeconds: number;
  transcriptionSeconds: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  creditsConsumed: number;
};

type MissingField = {
  key: string;
  label: string;
  sectionName: string;
  targetId: string;
};

type ReviewMedication =
  ConsolidatedFormState["anamnesis"]["medications"][number];

type Props = {
  formState: ConsolidatedFormState;
  manualDraft?: ConsolidatedFormState;
  manualNotes?: string;
  template?: Template;
  summary?: ReviewSummary;
  isWaitingForBatches: boolean;
  isSubmitting: boolean;
  onSubmit: (formState: ConsolidatedFormState) => Promise<void>;
};

const yesNo = (value: boolean | null | undefined) =>
  value === true ? "Sim" : value === false ? "Nao" : "-";

const formatDate = (value: Date | string | null | undefined) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("pt-BR");
};

const formatDuration = (seconds: number | undefined) => {
  const safeSeconds = Math.max(0, Math.floor(seconds ?? 0));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const rest = safeSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}min`;
  if (minutes > 0) return `${minutes}min ${rest}s`;
  return `${rest}s`;
};

const formatNumber = (value: number | undefined) =>
  new Intl.NumberFormat("pt-BR").format(value ?? 0);

const getFieldDomId = (key: string) => `audio-review-field-${key}`;

const getSystemValue = (
  anamnesis: ConsolidatedFormState["anamnesis"],
  key: string,
) => {
  if (PHYSICAL_EXAM_FIELD_KEYS.has(key)) {
    return anamnesis.physicalExam[
      key as keyof ConsolidatedFormState["anamnesis"]["physicalExam"]
    ];
  }

  return anamnesis[key as keyof ConsolidatedFormState["anamnesis"]];
};

const isEmptyRequiredValue = (value: unknown) => {
  if (value === null || value === undefined) return true;
  if (value instanceof Date) return Number.isNaN(value.getTime());
  if (typeof value === "string") return value.trim().length === 0;
  if (typeof value === "number") return Number.isNaN(value);
  if (Array.isArray(value)) {
    return value.length === 0 || value.every(isEmptyRequiredValue);
  }
  if (typeof value === "object") {
    return Object.values(value).every(isEmptyRequiredValue);
  }
  return false;
};

const areValuesEqual = (a: unknown, b: unknown) => {
  const normalize = (value: unknown): string =>
    value instanceof Date ? value.toISOString() : (JSON.stringify(value) ?? "");

  return normalize(a) === normalize(b);
};

const formatHumanValue = (value: unknown) => {
  if (value instanceof Date) return formatDate(value);
  if (typeof value === "string") return value;
  if (typeof value === "number") return formatNumber(value);
  if (typeof value === "boolean") return yesNo(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return "";
    return value
      .map((item) => {
        if (
          item &&
          typeof item === "object" &&
          "name" in item &&
          "dosage" in item &&
          "frequency" in item
        ) {
          const medication = item as {
            name?: string;
            dosage?: string;
            frequency?: string;
          };
          return [medication.name, medication.dosage, medication.frequency]
            .filter(Boolean)
            .join(" - ");
        }

        return typeof item === "string" ? item : JSON.stringify(item);
      })
      .join("\n");
  }
  if (value && typeof value === "object") return JSON.stringify(value, null, 2);
  return "";
};

const getManualValue = (
  manualDraft: ConsolidatedFormState | undefined,
  field: Template["sections"][number]["fields"][number],
) => {
  if (!manualDraft) return undefined;

  const key = field.systemKey ?? field.key;
  return field.isSystemField
    ? getSystemValue(manualDraft.anamnesis, key)
    : manualDraft.customFields[field.key];
};

const setFieldValue = (
  state: ConsolidatedFormState,
  field: Template["sections"][number]["fields"][number],
  value: unknown,
): ConsolidatedFormState => {
  const key = field.systemKey ?? field.key;

  if (!field.isSystemField) {
    return {
      ...state,
      customFields: {
        ...state.customFields,
        [field.key]: value,
      },
    };
  }

  if (PHYSICAL_EXAM_FIELD_KEYS.has(key)) {
    return {
      ...state,
      anamnesis: {
        ...state.anamnesis,
        physicalExam: {
          ...state.anamnesis.physicalExam,
          [key as keyof ConsolidatedFormState["anamnesis"]["physicalExam"]]:
            value ?? null,
        },
      },
    };
  }

  return {
    ...state,
    anamnesis: {
      ...state.anamnesis,
      [key as keyof ConsolidatedFormState["anamnesis"]]: value,
    },
  };
};

const applyManualValuesForEmptyAiFields = (
  aiState: ConsolidatedFormState,
  manualDraft: ConsolidatedFormState | undefined,
  template?: Template,
) => {
  if (!manualDraft || !template) return aiState;

  return template.sections.reduce((state, section) => {
    return section.fields.reduce((nextState, field) => {
      if (!field.isVisible) return nextState;

      const key = field.systemKey ?? field.key;
      const aiValue = field.isSystemField
        ? getSystemValue(aiState.anamnesis, key)
        : aiState.customFields[field.key];
      const manualValue = getManualValue(manualDraft, field);

      if (isEmptyRequiredValue(aiValue) && !isEmptyRequiredValue(manualValue)) {
        return setFieldValue(nextState, field, manualValue);
      }

      return nextState;
    }, state);
  }, aiState);
};

const fallbackRequiredFields = [
  {
    id: "chiefComplaint",
    key: "chiefComplaint",
    label: "Queixa Principal",
    sectionName: "Anamnese",
    isSystemField: true,
    systemKey: "chiefComplaint",
  },
  {
    id: "currentIllnessHistory",
    key: "currentIllnessHistory",
    label: "Historia da Doenca Atual",
    sectionName: "Anamnese",
    isSystemField: true,
    systemKey: "currentIllnessHistory",
  },
];

export function AudioReviewStep({
  formState,
  manualDraft,
  manualNotes = "",
  template,
  summary,
  isWaitingForBatches,
  isSubmitting,
  onSubmit,
}: Props) {
  const [reviewState, setReviewState] = useState<ConsolidatedFormState>(() =>
    applyManualValuesForEmptyAiFields(formState, manualDraft, template),
  );
  const [missingFields, setMissingFields] = useState<MissingField[]>([]);
  const alertRef = useRef<HTMLDivElement | null>(null);
  const initializedReviewRef = useRef(!isWaitingForBatches);

  useEffect(() => {
    if (isWaitingForBatches) {
      setReviewState(formState);
      setMissingFields([]);
      initializedReviewRef.current = false;
      return;
    }

    if (!initializedReviewRef.current) {
      setReviewState(
        applyManualValuesForEmptyAiFields(formState, manualDraft, template),
      );
      initializedReviewRef.current = true;
    }
  }, [formState, isWaitingForBatches, manualDraft, template]);

  const missingKeys = useMemo(
    () => new Set(missingFields.map((field) => field.key)),
    [missingFields],
  );

  const setSystemValue = (key: string, value: unknown) => {
    setReviewState((current) => {
      if (PHYSICAL_EXAM_FIELD_KEYS.has(key)) {
        return {
          ...current,
          anamnesis: {
            ...current.anamnesis,
            physicalExam: {
              ...current.anamnesis.physicalExam,
              [key as keyof ConsolidatedFormState["anamnesis"]["physicalExam"]]:
                value ?? null,
            },
          },
        };
      }

      return {
        ...current,
        anamnesis: {
          ...current.anamnesis,
          [key as keyof ConsolidatedFormState["anamnesis"]]: value,
        },
      };
    });
  };

  const setCustomValue = (key: string, value: unknown) => {
    setReviewState((current) => ({
      ...current,
      customFields: {
        ...current.customFields,
        [key]: value,
      },
    }));
  };

  const addMedication = () => {
    setReviewState((current) => ({
      ...current,
      anamnesis: {
        ...current.anamnesis,
        medications: [
          ...current.anamnesis.medications,
          { name: "", dosage: "", frequency: "" },
        ],
      },
    }));
  };

  const updateMedication = (index: number, field: string, value: string) => {
    setReviewState((current) => ({
      ...current,
      anamnesis: {
        ...current.anamnesis,
        medications: current.anamnesis.medications.map(
          (medication, itemIndex) =>
            itemIndex === index
              ? { ...medication, [field as keyof ReviewMedication]: value }
              : medication,
        ),
      },
    }));
  };

  const removeMedication = (index: number) => {
    setReviewState((current) => ({
      ...current,
      anamnesis: {
        ...current.anamnesis,
        medications: current.anamnesis.medications.filter(
          (_, itemIndex) => itemIndex !== index,
        ),
      },
    }));
  };

  const validateRequiredFields = () => {
    const requiredFields: MissingField[] = [];

    if (template) {
      for (const section of template.sections) {
        for (const field of section.fields) {
          if (!field.isVisible || !field.isRequired) continue;

          const key = field.systemKey ?? field.key;
          const value = field.isSystemField
            ? getSystemValue(reviewState.anamnesis, key)
            : reviewState.customFields[field.key];

          if (isEmptyRequiredValue(value)) {
            requiredFields.push({
              key: field.key,
              label: field.label,
              sectionName: section.name,
              targetId: getFieldDomId(field.key),
            });
          }
        }
      }
    } else {
      for (const field of fallbackRequiredFields) {
        const value = getSystemValue(reviewState.anamnesis, field.systemKey);
        if (isEmptyRequiredValue(value)) {
          requiredFields.push({
            key: field.key,
            label: field.label,
            sectionName: field.sectionName,
            targetId: getFieldDomId(field.key),
          });
        }
      }
    }

    setMissingFields(requiredFields);
    return requiredFields;
  };

  const handleSubmit = async () => {
    const missing = validateRequiredFields();
    if (missing.length > 0) {
      toast.error("Revise os campos obrigatorios antes de enviar.");
      window.setTimeout(() => alertRef.current?.focus(), 0);
      return;
    }

    await onSubmit(reviewState);
  };

  const focusField = (targetId: string) => {
    const target = document.getElementById(targetId);
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
    target?.focus({ preventScroll: true });
  };

  if (isWaitingForBatches) {
    return (
      <Card>
        <CardContent
          role="status"
          aria-live="polite"
          className="flex flex-col items-center gap-4 py-12 text-center"
        >
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">
              Processando os ultimos lotes de audio
            </h2>
            <p className="text-muted-foreground max-w-xl text-sm">
              A revisao sera liberada assim que a IA terminar de sincronizar a
              transcricao da consulta.
            </p>
          </div>
          {summary?.pendingBatchCount ? (
            <p className="text-foreground text-sm font-medium">
              {summary.pendingBatchCount} lote(s) ainda em processamento
            </p>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <ManualNotesReviewCard notes={manualNotes} />

      <Card>
        <CardHeader>
          <CardTitle>Revisao da anamnese gerada por IA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Confira as informacoes abaixo, ajuste o que for necessario e envie
            para salvar a anamnese no prontuario.
          </p>
          <MetricsGrid summary={summary} />
        </CardContent>
      </Card>

      {missingFields.length > 0 && (
        <div
          ref={alertRef}
          role="alert"
          aria-live="assertive"
          tabIndex={-1}
          className="border-destructive/50 bg-destructive/5 ring-destructive/30 rounded-lg border p-4 outline-none focus-visible:ring-2"
        >
          <div className="mb-3 flex items-start gap-3">
            <AlertCircle className="text-destructive mt-0.5 h-5 w-5" />
            <div>
              <h2 className="text-destructive font-semibold">
                Campos obrigatorios pendentes
              </h2>
              <p className="text-destructive/90 text-sm">
                Selecione um item da lista para ir direto ao campo que precisa
                de revisao.
              </p>
            </div>
          </div>
          <ul className="space-y-2">
            {missingFields.map((field) => (
              <li key={field.key}>
                <button
                  type="button"
                  onClick={() => focusField(field.targetId)}
                  className="hover:text-destructive text-left text-sm font-medium underline underline-offset-4"
                >
                  {field.sectionName} - {field.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <PatientReviewCard formState={reviewState} />

      {template ? (
        template.sections.map((section) => (
          <Card key={section.id}>
            <CardHeader>
              <CardTitle>{section.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {section.fields
                .filter((field) => field.isVisible)
                .map((field) => {
                  const key = field.systemKey ?? field.key;
                  const value = field.isSystemField
                    ? getSystemValue(reviewState.anamnesis, key)
                    : reviewState.customFields[field.key];
                  const aiValue = field.isSystemField
                    ? getSystemValue(formState.anamnesis, key)
                    : formState.customFields[field.key];
                  const manualValue = getManualValue(manualDraft, field);
                  const hasManualReplacement =
                    !isEmptyRequiredValue(aiValue) &&
                    !isEmptyRequiredValue(manualValue) &&
                    !areValuesEqual(value, manualValue);
                  const isMissing = missingKeys.has(field.key);

                  return (
                    <div
                      key={field.id}
                      id={getFieldDomId(field.key)}
                      tabIndex={-1}
                      className={
                        isMissing
                          ? "border-destructive/60 bg-destructive/5 ring-destructive/30 rounded-lg border p-3 outline-none focus-visible:ring-2"
                          : "outline-none"
                      }
                    >
                      <DynamicFieldRenderer
                        field={field}
                        value={value}
                        onChange={(nextValue) =>
                          field.isSystemField
                            ? setSystemValue(key, nextValue)
                            : setCustomValue(field.key, nextValue)
                        }
                        medications={reviewState.anamnesis.medications}
                        addMedication={addMedication}
                        updateMedication={updateMedication}
                        removeMedication={removeMedication}
                      />
                      {hasManualReplacement && (
                        <ManualReplacementOffer
                          value={manualValue}
                          onApply={() =>
                            setReviewState((current) =>
                              setFieldValue(current, field, manualValue),
                            )
                          }
                        />
                      )}
                    </div>
                  );
                })}
            </CardContent>
          </Card>
        ))
      ) : (
        <FallbackAnamnesisReview
          formState={reviewState}
          missingKeys={missingKeys}
          setSystemValue={setSystemValue}
        />
      )}

      <div className="flex justify-end border-t pt-6">
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="mr-2 h-4 w-4" />
          )}
          Enviar e salvar anamnese
        </Button>
      </div>
    </div>
  );
}

function MetricsGrid({ summary }: { summary?: ReviewSummary }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Metric
        icon={<Clock className="h-4 w-4" />}
        label="Tempo de consulta"
        value={formatDuration(summary?.durationSeconds)}
      />
      <Metric
        icon={<Mic2 className="h-4 w-4" />}
        label="Audio processado"
        value={formatDuration(summary?.transcriptionSeconds)}
      />
      <Metric
        icon={<AlertCircle className="h-4 w-4" />}
        label="Tokens totais"
        value={formatNumber(summary?.totalTokens)}
        detail={`${formatNumber(summary?.inputTokens)} entrada / ${formatNumber(
          summary?.outputTokens,
        )} saida`}
      />
      <Metric
        icon={<Coins className="h-4 w-4" />}
        label="Creditos usados"
        value={formatNumber(summary?.creditsConsumed)}
      />
    </div>
  );
}

function ManualNotesReviewCard({ notes }: { notes: string }) {
  const trimmed = notes.trim();

  return (
    <Card className="border-amber-500/40 bg-amber-500/5">
      <CardHeader>
        <CardTitle>Super rascunho do medico</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-200">
          <AlertCircle className="mt-0.5 h-4 w-4" />
          <p>
            Este rascunho livre sera descartado depois do envio. Copie para um
            campo da anamnese qualquer informacao que precise ficar salva.
          </p>
        </div>
        {trimmed ? (
          <Textarea value={trimmed} readOnly rows={5} />
        ) : (
          <p className="text-muted-foreground text-sm">
            Nenhuma super observacao foi registrada no rascunho manual.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ManualReplacementOffer({
  value,
  onApply,
}: {
  value: unknown;
  onApply: () => void;
}) {
  return (
    <div className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
          Resposta manual disponivel
        </p>
        <Button type="button" variant="outline" size="sm" onClick={onApply}>
          Substituir pela resposta manual
        </Button>
      </div>
      <pre className="text-foreground text-sm whitespace-pre-wrap">
        {formatHumanValue(value)}
      </pre>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="bg-muted/20 rounded-lg border p-3">
      <div className="text-muted-foreground mb-2 flex items-center gap-2 text-xs font-medium uppercase">
        {icon}
        {label}
      </div>
      <p className="text-xl font-semibold">{value}</p>
      {detail && <p className="text-muted-foreground mt-1 text-xs">{detail}</p>}
    </div>
  );
}

function PatientReviewCard({
  formState,
}: {
  formState: ConsolidatedFormState;
}) {
  const p = formState.patient;
  const cp = p.clinicalProfile;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Paciente</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ReadOnlyField label="Nome" value={p.name} />
          <ReadOnlyField label="Nascimento" value={formatDate(p.birthDate)} />
          <ReadOnlyField label="Genero" value={p.gender ?? ""} />
          <ReadOnlyField label="CPF" value={p.cpf ?? ""} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Perfil clinico</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ReadOnlyField
            label="Hipertensao"
            value={yesNo(cp.hasHypertension)}
          />
          <ReadOnlyField label="Diabetes" value={yesNo(cp.hasDiabetes)} />
          <ReadOnlyField
            label="Dislipidemia"
            value={yesNo(cp.hasDyslipidemia)}
          />
          <ReadOnlyField
            label="Infarto previo"
            value={yesNo(cp.hasPriorInfarction)}
          />
          <ReadOnlyField
            label="Tempo de diabetes"
            value={cp.diabetesDuration ? `${cp.diabetesDuration} anos` : ""}
          />
          <ReadOnlyField label="Exercicio" value={cp.exerciseLevel ?? ""} />
          <ReadOnlyField label="Tabagismo" value={yesNo(cp.smokingStatus)} />
          <ReadOnlyField
            label="Macos/ano"
            value={cp.smokingPacksYear ? String(cp.smokingPacksYear) : ""}
          />
          <ReadOnlyField label="Alcool" value={cp.alcoholConsumption ?? ""} />
          <ReadOnlyFieldFull label="Alergias" value={cp.allergies ?? ""} />
          <ReadOnlyFieldFull
            label="Cirurgias previas"
            value={cp.priorSurgeries ?? ""}
          />
          <ReadOnlyFieldFull
            label="Historico familiar"
            value={cp.familyHistoryOthers ?? ""}
          />
        </CardContent>
      </Card>
    </>
  );
}

function FallbackAnamnesisReview({
  formState,
  missingKeys,
  setSystemValue,
}: {
  formState: ConsolidatedFormState;
  missingKeys: Set<string>;
  setSystemValue: (key: string, value: unknown) => void;
}) {
  const fields = [
    {
      key: "chiefComplaint",
      label: "Queixa Principal",
      fieldType: "TEXT" as const,
      isRequired: true,
      isVisible: true,
    },
    {
      key: "currentIllnessHistory",
      label: "Historia da Doenca Atual",
      fieldType: "TEXT" as const,
      isRequired: true,
      isVisible: true,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Anamnese</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map((field) => (
          <div
            key={field.key}
            id={getFieldDomId(field.key)}
            tabIndex={-1}
            className={
              missingKeys.has(field.key)
                ? "border-destructive/60 bg-destructive/5 ring-destructive/30 rounded-lg border p-3 outline-none focus-visible:ring-2"
                : "outline-none"
            }
          >
            <DynamicFieldRenderer
              field={field}
              value={getSystemValue(formState.anamnesis, field.key)}
              onChange={(value) => setSystemValue(field.key, value)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Label className="text-muted-foreground mb-1 block text-xs uppercase">
        {label}
      </Label>
      <Input value={value} readOnly />
    </div>
  );
}

function ReadOnlyFieldFull({ label, value }: { label: string; value: string }) {
  return (
    <div className="sm:col-span-full">
      <Label className="text-muted-foreground mb-1 block text-xs uppercase">
        {label}
      </Label>
      <Textarea value={value} readOnly rows={2} />
    </div>
  );
}
