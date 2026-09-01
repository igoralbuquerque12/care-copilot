import type { FormFieldType } from "~/schemas/form-template";

export type FormSnapshotField = {
  key: string;
  systemKey: string | null;
  label: string;
  description: string | null;
  fieldType: FormFieldType;
  isSystemField: boolean;
  isVisible: boolean;
  isRequired: boolean;
  config: unknown;
};

export type FormSnapshot = {
  source: "EXACT" | "APPROXIMATED";
  templateId: string | null;
  templateName: string;
  capturedAt: string;
  sections: Array<{
    name: string;
    description: string | null;
    fields: FormSnapshotField[];
  }>;
};
