"use client";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
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

type DraftMedication =
  ConsolidatedFormState["anamnesis"]["medications"][number];

type Props = {
  formState: ConsolidatedFormState;
  onFormStateChange: (formState: ConsolidatedFormState) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
  template?: Template;
};

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

export function AudioManualDraftForm({
  formState,
  onFormStateChange,
  notes,
  onNotesChange,
  template,
}: Props) {
  const setSystemValue = (key: string, value: unknown) => {
    if (PHYSICAL_EXAM_FIELD_KEYS.has(key)) {
      onFormStateChange({
        ...formState,
        anamnesis: {
          ...formState.anamnesis,
          physicalExam: {
            ...formState.anamnesis.physicalExam,
            [key as keyof ConsolidatedFormState["anamnesis"]["physicalExam"]]:
              value ?? null,
          },
        },
      });
      return;
    }

    onFormStateChange({
      ...formState,
      anamnesis: {
        ...formState.anamnesis,
        [key as keyof ConsolidatedFormState["anamnesis"]]: value,
      },
    });
  };

  const setCustomValue = (key: string, value: unknown) => {
    onFormStateChange({
      ...formState,
      customFields: {
        ...formState.customFields,
        [key]: value,
      },
    });
  };

  const addMedication = () => {
    onFormStateChange({
      ...formState,
      anamnesis: {
        ...formState.anamnesis,
        medications: [
          ...formState.anamnesis.medications,
          { name: "", dosage: "", frequency: "" },
        ],
      },
    });
  };

  const updateMedication = (index: number, field: string, value: string) => {
    onFormStateChange({
      ...formState,
      anamnesis: {
        ...formState.anamnesis,
        medications: formState.anamnesis.medications.map(
          (medication, itemIndex) =>
            itemIndex === index
              ? { ...medication, [field as keyof DraftMedication]: value }
              : medication,
        ),
      },
    });
  };

  const removeMedication = (index: number) => {
    onFormStateChange({
      ...formState,
      anamnesis: {
        ...formState.anamnesis,
        medications: formState.anamnesis.medications.filter(
          (_, itemIndex) => itemIndex !== index,
        ),
      },
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Super observacoes</CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="audio-manual-super-notes" className="mb-2 block">
            Rascunho livre do medico
          </Label>
          <Textarea
            id="audio-manual-super-notes"
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
            placeholder="Escreva qualquer observacao livre da consulta. Este texto aparecera no topo da revisao, mas nao sera salvo automaticamente."
            rows={6}
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
                .map((field) => {
                  const key = field.systemKey ?? field.key;
                  return (
                    <DynamicFieldRenderer
                      key={field.id}
                      field={field}
                      value={
                        field.isSystemField
                          ? getSystemValue(formState.anamnesis, key)
                          : formState.customFields[field.key]
                      }
                      onChange={(value) =>
                        field.isSystemField
                          ? setSystemValue(key, value)
                          : setCustomValue(field.key, value)
                      }
                      medications={formState.anamnesis.medications}
                      addMedication={addMedication}
                      updateMedication={updateMedication}
                      removeMedication={removeMedication}
                    />
                  );
                })}
            </CardContent>
          </Card>
        ))
      ) : (
        <Card>
          <CardContent className="text-muted-foreground py-10 text-center text-sm">
            Carregando campos do rascunho...
          </CardContent>
        </Card>
      )}
    </div>
  );
}
