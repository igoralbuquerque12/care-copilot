import {
  Calendar,
  CheckSquare,
  CircleDot,
  Hash,
  HeartPulse,
  ListChecks,
  Pilcrow,
  Pill,
  TextCursorInput,
} from "lucide-react";

import type { FormFieldType } from "~/schemas/form-template";

export const FIELD_TYPE_META: Record<
  FormFieldType,
  {
    label: string;
    icon: typeof Pilcrow;
  }
> = {
  TEXT: { label: "Texto longo", icon: Pilcrow },
  SHORT_TEXT: { label: "Texto curto", icon: TextCursorInput },
  NUMBER: { label: "Número", icon: Hash },
  BOOLEAN: { label: "Sim/Não", icon: CheckSquare },
  SELECT: { label: "Lista", icon: ListChecks },
  RADIO: { label: "Escolha única", icon: CircleDot },
  DATE: { label: "Data", icon: Calendar },
  NYHA_CLASS: { label: "Classe NYHA", icon: HeartPulse },
  MEDICATIONS: { label: "Medicamentos", icon: Pill },
};

export const FIELD_TYPE_OPTIONS = Object.entries(FIELD_TYPE_META).map(
  ([value, meta]) => ({
    value: value as FormFieldType,
    label: meta.label,
  }),
);
