"use client";

import type { FormData } from "~/features/anamnesis/hooks/use-anamnesis-form";
import { PHYSICAL_EXAM_FIELD_KEYS } from "~/features/anamnesis/constants/system-fields";
import {
  DynamicFieldRenderer,
  type DynamicField,
} from "~/features/anamnesis/components/dynamic-field-renderer";
import type { FormFieldType } from "~/schemas/form-template";

type TemplateSection = {
  id: string;
  fields: Array<DynamicField & {
    id: string;
    systemKey?: string | null;
    isSystemField: boolean;
    fieldType: FormFieldType;
  }>;
};

type Medication = { name: string; dosage: string; frequency: string };

type Props = {
  section: TemplateSection;
  formData: Partial<FormData>;
  setFormData: (data: Partial<FormData>) => void;
  customValues: Record<string, unknown>;
  setCustomValues: (data: Record<string, unknown>) => void;
  medications: Medication[];
  addMedication: () => void;
  updateMedication: (index: number, field: string, value: string) => void;
  removeMedication: (index: number) => void;
  readOnly?: boolean;
};

const getSystemValue = (formData: Partial<FormData>, key: string) => {
  if (PHYSICAL_EXAM_FIELD_KEYS.has(key)) {
    return formData.physicalExam?.[
      key as keyof NonNullable<FormData["physicalExam"]>
    ];
  }

  return formData[key as keyof FormData];
};

const setSystemValue = (
  formData: Partial<FormData>,
  setFormData: (data: Partial<FormData>) => void,
  key: string,
  value: unknown,
) => {
  if (PHYSICAL_EXAM_FIELD_KEYS.has(key)) {
    setFormData({
      ...formData,
      physicalExam: {
        ...formData.physicalExam,
        [key]: value,
      },
    });
    return;
  }

  setFormData({
    ...formData,
    [key]: value,
  });
};

export function DynamicSectionRenderer({
  section,
  formData,
  setFormData,
  customValues,
  setCustomValues,
  medications,
  addMedication,
  updateMedication,
  removeMedication,
  readOnly = false,
}: Props) {
  return (
    <div className="space-y-6">
      {section.fields
        .filter((field) => field.isVisible)
        .map((field) => {
          const systemKey = field.systemKey ?? field.key;
          const isSystemField = field.isSystemField;

          return (
            <DynamicFieldRenderer
              key={field.id}
              field={field}
              value={
                isSystemField
                  ? getSystemValue(formData, systemKey)
                  : customValues[field.key]
              }
              onChange={(value) => {
                if (isSystemField) {
                  setSystemValue(formData, setFormData, systemKey, value);
                  return;
                }

                setCustomValues({
                  ...customValues,
                  [field.key]: value,
                });
              }}
              medications={medications}
              addMedication={addMedication}
              updateMedication={updateMedication}
              removeMedication={removeMedication}
              readOnly={readOnly}
            />
          );
        })}
    </div>
  );
}
