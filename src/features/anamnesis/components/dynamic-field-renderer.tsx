"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import {
  formFieldConfigSchema,
  type FormFieldType,
} from "~/schemas/form-template";

type Medication = { name: string; dosage: string; frequency: string };

export type DynamicField = {
  key: string;
  label: string;
  description?: string | null;
  fieldType: FormFieldType;
  isRequired: boolean;
  isVisible: boolean;
  config?: unknown;
};

type Props = {
  field: DynamicField;
  value: unknown;
  onChange: (value: unknown) => void;
  medications?: Medication[];
  addMedication?: () => void;
  updateMedication?: (index: number, field: string, value: string) => void;
  removeMedication?: (index: number) => void;
  readOnly?: boolean;
};

const toDateInputValue = (value: unknown) => {
  if (!value) return "";
  if (
    !(value instanceof Date) &&
    typeof value !== "string" &&
    typeof value !== "number"
  ) {
    return "";
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().split("T")[0]!;
};

const getConfig = (value: unknown) => {
  const parsed = formFieldConfigSchema.safeParse(value ?? {});
  return parsed.success ? parsed.data : {};
};

export function DynamicFieldRenderer({
  field,
  value,
  onChange,
  medications = [],
  addMedication,
  updateMedication,
  removeMedication,
  readOnly = false,
}: Props) {
  if (!field.isVisible) return null;

  const config = getConfig(field.config);
  const label = (
    <Label htmlFor={field.key} className="mb-2 block">
      {field.label}
      {field.isRequired ? " *" : ""}
    </Label>
  );

  if (field.fieldType === "MEDICATIONS") {
    return (
      <div className="space-y-3 border-t pt-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-medium">{field.label}</h3>
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
          </div>
          {!readOnly && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addMedication}
            >
              <Plus className="h-4 w-4" />
              Adicionar
            </Button>
          )}
        </div>

        {medications.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum medicamento adicionado
          </p>
        ) : (
          <div className="space-y-3">
            {medications.map((med, index) => (
              <div
                key={index}
                className="grid grid-cols-1 gap-3 rounded-lg border p-4 md:grid-cols-[1fr_1fr_1fr_auto]"
              >
                <Input
                  value={med.name}
                  onChange={(event) =>
                    updateMedication?.(index, "name", event.target.value)
                  }
                  placeholder="Medicamento"
                  readOnly={readOnly}
                />
                <Input
                  value={med.dosage}
                  onChange={(event) =>
                    updateMedication?.(index, "dosage", event.target.value)
                  }
                  placeholder="Dosagem"
                  readOnly={readOnly}
                />
                <Input
                  value={med.frequency}
                  onChange={(event) =>
                    updateMedication?.(index, "frequency", event.target.value)
                  }
                  placeholder="Frequencia"
                  readOnly={readOnly}
                />
                {!readOnly && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMedication?.(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Remover medicamento</span>
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (field.fieldType === "BOOLEAN") {
    return (
      <div className="flex items-center gap-2">
        <Checkbox
          id={field.key}
          checked={Boolean(value)}
          onCheckedChange={(checked) => onChange(Boolean(checked))}
          disabled={readOnly}
        />
        <Label htmlFor={field.key} className="font-normal">
          {field.label}
        </Label>
      </div>
    );
  }

  return (
    <div>
      {label}
      {field.description && (
        <p className="mb-2 text-sm text-muted-foreground">{field.description}</p>
      )}

      {field.fieldType === "TEXT" && (
        <Textarea
          id={field.key}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={config.placeholder}
          maxLength={config.maxLength}
          readOnly={readOnly}
          rows={3}
        />
      )}

      {field.fieldType === "SHORT_TEXT" && (
        <Input
          id={field.key}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={config.placeholder}
          maxLength={config.maxLength}
          readOnly={readOnly}
        />
      )}

      {field.fieldType === "NUMBER" && (
        <div className="flex items-center gap-2">
          <Input
            id={field.key}
            type="number"
            min={config.min}
            max={config.max}
            step={config.step ?? 1}
            value={typeof value === "number" && !Number.isNaN(value) ? value : ""}
            readOnly={readOnly}
            onChange={(event) =>
              onChange(
                event.target.value === "" ? undefined : Number(event.target.value),
              )
            }
          />
          {config.unit && (
            <span className="w-16 text-sm text-muted-foreground">
              {config.unit}
            </span>
          )}
        </div>
      )}

      {field.fieldType === "SELECT" && (
        <Select
          value={typeof value === "string" ? value : ""}
          onValueChange={onChange}
          disabled={readOnly}
        >
          <SelectTrigger id={field.key}>
            <SelectValue placeholder={config.placeholder ?? "Selecione"} />
          </SelectTrigger>
          <SelectContent>
            {(config.options ?? []).map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {field.fieldType === "RADIO" && (
        <RadioGroup
          value={typeof value === "string" ? value : ""}
          onValueChange={onChange}
          disabled={readOnly}
          className="grid grid-cols-1 gap-2 sm:grid-cols-2"
        >
          {(config.options ?? []).map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 rounded-md border p-3 text-sm"
            >
              <RadioGroupItem value={option.value} />
              {option.label}
            </label>
          ))}
        </RadioGroup>
      )}

      {field.fieldType === "DATE" && (
        <Input
          id={field.key}
          type="date"
          value={toDateInputValue(value)}
          readOnly={readOnly}
          onChange={(event) =>
            onChange(event.target.value ? new Date(event.target.value) : undefined)
          }
        />
      )}

      {field.fieldType === "NYHA_CLASS" && (
        <Select
          value={typeof value === "string" ? value : "I"}
          onValueChange={onChange}
          disabled={readOnly}
        >
          <SelectTrigger id={field.key}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="I">Classe I</SelectItem>
            <SelectItem value="II">Classe II</SelectItem>
            <SelectItem value="III">Classe III</SelectItem>
            <SelectItem value="IV">Classe IV</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
