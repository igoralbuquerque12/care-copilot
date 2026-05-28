"use client";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import type { ConsolidatedFormState } from "~/schemas/audio-anamnesis-form";
import { DynamicFieldRenderer } from "~/features/anamnesis/components/dynamic-field-renderer";
import { PHYSICAL_EXAM_FIELD_KEYS } from "~/features/anamnesis/constants/system-fields";
import type { FormFieldType } from "~/schemas/form-template";

type Props = {
  formState: ConsolidatedFormState;
  template?: {
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
  readOnly?: boolean;
};

const yesNo = (v: boolean | null | undefined) =>
  v === true ? "Sim" : v === false ? "Nao" : "-";

const getAudioSystemValue = (
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

export function AudioAnamnesisForm({ formState, template, readOnly }: Props) {
  const p = formState.patient;
  const cp = p.clinicalProfile;
  const a = formState.anamnesis;
  const px = a.physicalExam;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Paciente</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nome" value={p.name} />
          <Field
            label="Nascimento"
            value={p.birthDate ? new Date(p.birthDate).toLocaleDateString("pt-BR") : ""}
          />
          <Field label="Genero" value={p.gender ?? ""} />
          <Field label="CPF" value={p.cpf ?? ""} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Perfil clinico</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Hipertensao" value={yesNo(cp.hasHypertension)} />
          <Field label="Diabetes" value={yesNo(cp.hasDiabetes)} />
          <Field label="Dislipidemia" value={yesNo(cp.hasDyslipidemia)} />
          <Field label="Infarto previo" value={yesNo(cp.hasPriorInfarction)} />
          <Field
            label="Tempo de diabetes"
            value={cp.diabetesDuration ? `${cp.diabetesDuration} anos` : ""}
          />
          <Field label="Exercicio" value={cp.exerciseLevel ?? ""} />
          <Field label="Tabagismo" value={yesNo(cp.smokingStatus)} />
          <Field
            label="Macos/ano"
            value={cp.smokingPacksYear ? String(cp.smokingPacksYear) : ""}
          />
          <Field label="Alcool" value={cp.alcoholConsumption ?? ""} />
          <FieldFull label="Alergias" value={cp.allergies ?? ""} />
          <FieldFull label="Cirurgias previas" value={cp.priorSurgeries ?? ""} />
          <FieldFull
            label="Historico familiar"
            value={cp.familyHistoryOthers ?? ""}
          />
        </CardContent>
      </Card>

      {template ? (
        template.sections.map((section) => (
          <Card key={section.id}>
            <CardHeader>
              <CardTitle>{section.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {section.fields
                .filter((field) => field.isVisible)
                .map((field) => (
                  <DynamicFieldRenderer
                    key={field.id}
                    field={field}
                    value={
                      field.isSystemField
                        ? getAudioSystemValue(a, field.systemKey ?? field.key)
                        : formState.customFields[field.key]
                    }
                    onChange={() => undefined}
                    medications={a.medications}
                    readOnly
                  />
                ))}
            </CardContent>
          </Card>
        ))
      ) : (
        <>
      <Card>
        <CardHeader>
          <CardTitle>Anamnese</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldFull label="Queixa principal" value={a.chiefComplaint} multiline />
          <FieldFull
            label="Historia da doenca atual"
            value={a.currentIllnessHistory}
            multiline
          />
          <FieldFull
            label="Resposta ao tratamento"
            value={a.treatmentResponse}
            multiline
          />
          <FieldFull
            label="Evolucao dos sintomas"
            value={a.symptomEvolution}
            multiline
          />
          <FieldFull label="Eventos novos" value={a.newEvents} multiline />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="NYHA" value={a.nyhaClass ?? ""} />
            <Field label="Palpitacoes" value={yesNo(a.hasPalpitations)} />
            <Field label="Sincope" value={yesNo(a.hasSyncope)} />
            <Field label="Edema" value={yesNo(a.hasEdema)} />
            <Field label="Dor toracica" value={yesNo(a.hasChestPain)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exame fisico</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label="Peso (kg)" value={px.weight ? String(px.weight) : ""} />
          <Field label="Altura (cm)" value={px.height ? String(px.height) : ""} />
          <Field
            label="PA"
            value={
              px.bpSystolic && px.bpDiastolic
                ? `${px.bpSystolic}/${px.bpDiastolic} mmHg`
                : ""
            }
          />
          <Field label="FC" value={px.heartRate ? `${px.heartRate} bpm` : ""} />
          <Field
            label="SpO2"
            value={px.oxygenSaturation ? `${px.oxygenSaturation}%` : ""}
          />
          <Field label="Edema" value={px.edemaGrade ?? ""} />
          <FieldFull label="Ausculta cardiaca" value={px.heartAuscultation ?? ""} />
          <FieldFull label="Ausculta pulmonar" value={px.lungAuscultation ?? ""} />
          <FieldFull label="Pulsos perifericos" value={px.peripheralPulses ?? ""} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Medicacoes</CardTitle>
        </CardHeader>
        <CardContent>
          {a.medications.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma medicacao registrada ainda.
            </p>
          ) : (
            <ul className="space-y-2">
              {a.medications.map((med, idx) => (
                <li
                  key={`${med.name}-${idx}`}
                  className="rounded border border-border bg-muted/40 px-3 py-2 text-sm"
                >
                  <span className="font-medium">{med.name}</span>
                  {med.dosage && <span> - {med.dosage}</span>}
                  {med.frequency && <span> - {med.frequency}</span>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hipotese e conduta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldFull
            label="Hipotese diagnostica"
            value={a.diagnosticHypothesis}
            multiline
          />
          <FieldFull label="Conduta" value={a.conduct} multiline />
          <Field
            label="Retorno"
            value={
              a.nextRecallDate
                ? new Date(a.nextRecallDate).toLocaleDateString("pt-BR")
                : ""
            }
          />
        </CardContent>
      </Card>
        </>
      )}

      {readOnly && (
        <p className="text-xs text-muted-foreground">
          Os dados sao atualizados automaticamente pela IA conforme novos lotes
          de audio sao processados.
        </p>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      <Input value={value} readOnly />
    </div>
  );
}

function FieldFull({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="sm:col-span-full">
      <Label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {multiline ? (
        <Textarea value={value} readOnly rows={3} />
      ) : (
        <Input value={value} readOnly />
      )}
    </div>
  );
}
