import type { Prisma } from "@prisma/client";
import type { FormSnapshot } from "~/types/form-snapshot";

type TemplateWithSections = {
  id: string;
  name: string;
  sections: Array<{
    name: string;
    description: string | null;
    fields: Array<{
      key: string;
      systemKey: string | null;
      label: string;
      description: string | null;
      fieldType: string;
      isSystemField: boolean;
      isVisible: boolean;
      isRequired: boolean;
      config: unknown;
    }>;
  }>;
};

export const createFormSnapshot = (
  template: TemplateWithSections,
  source: FormSnapshot["source"] = "EXACT",
): Prisma.InputJsonValue => ({
  source,
  templateId: template.id,
  templateName: template.name,
  capturedAt: new Date().toISOString(),
  sections: template.sections.map((section) => ({
    name: section.name,
    description: section.description,
    fields: section.fields.map((field) => ({
      key: field.key,
      systemKey: field.systemKey,
      label: field.label,
      description: field.description,
      fieldType: field.fieldType,
      isSystemField: field.isSystemField,
      isVisible: field.isVisible,
      isRequired: field.isRequired,
      config: field.config,
    })),
  })),
}) as Prisma.InputJsonValue;

export const readFormSnapshot = (value: unknown): FormSnapshot | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const snapshot = value as Partial<FormSnapshot>;
  if (!Array.isArray(snapshot.sections)) return null;
  return snapshot as FormSnapshot;
};
