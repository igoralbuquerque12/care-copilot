import type { FormFieldConfig, FormFieldType } from "~/schemas/form-template";

export type EditorField = {
  id?: string;
  key: string;
  label: string;
  description?: string | null;
  order: number;
  fieldType: FormFieldType;
  isRequired: boolean;
  isVisible: boolean;
  isSystemField: boolean;
  systemKey?: string | null;
  config?: FormFieldConfig | null;
  tempId: string;
};

export type EditorSection = {
  id?: string;
  name: string;
  description?: string | null;
  order: number;
  isCollapsible: boolean;
  fields: EditorField[];
  tempId: string;
};

export type EditorState = {
  id: string;
  name: string;
  description?: string | null;
  isDefault: boolean;
  sections: EditorSection[];
};
