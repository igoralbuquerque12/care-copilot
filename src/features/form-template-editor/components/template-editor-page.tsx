"use client";

import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ChevronDown,
  Eye,
  EyeOff,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";
import {
  FIELD_TYPE_META,
  FIELD_TYPE_OPTIONS,
} from "~/features/form-template-editor/constants/field-type-meta";
import type {
  EditorField,
  EditorSection,
  EditorState,
} from "~/features/form-template-editor/types/editor.types";
import type { FormFieldConfig, FormFieldType } from "~/schemas/form-template";
import { api } from "~/trpc/react";
import type { RouterOutputs } from "~/trpc/react";

type Props = {
  templateId: string;
};

const tempId = () => crypto.randomUUID();

const buildField = (order: number): EditorField => ({
  key: `custom_${Date.now()}`,
  label: "Novo campo",
  order,
  fieldType: "TEXT",
  isRequired: false,
  isVisible: true,
  isSystemField: false,
  config: {},
  tempId: tempId(),
});

const sortByOrder = <T extends { order: number }>(items: T[]) =>
  [...items].sort((a, b) => a.order - b.order);

type TemplateOutput = RouterOutputs["formTemplate"]["getById"];

const transformTemplate = (template: TemplateOutput): EditorState => ({
  id: template.id,
  name: template.name,
  description: template.description,
  isDefault: template.isDefault,
  sections: sortByOrder(template.sections).map((section) => ({
    id: section.id,
    name: section.name,
    description: section.description,
    order: section.order,
    isCollapsible: section.isCollapsible,
    tempId: section.id,
    fields: sortByOrder(section.fields).map((field) => ({
      id: field.id,
      key: field.key,
      label: field.label,
      description: field.description,
      order: field.order,
      fieldType: field.fieldType,
      isRequired: field.isRequired,
      isVisible: field.isVisible,
      isSystemField: field.isSystemField,
      systemKey: field.systemKey,
      config: (field.config ?? {}) as FormFieldConfig,
      tempId: field.id,
    })),
  })),
});

const renumberSections = (sections: EditorSection[]) =>
  sections.map((section, index) => ({
    ...section,
    order: index,
    fields: section.fields.map((field, fieldIndex) => ({
      ...field,
      order: fieldIndex,
    })),
  }));

export function TemplateEditorPage({ templateId }: Props) {
  const router = useRouter();
  const utils = api.useUtils();
  const template = api.formTemplate.getById.useQuery({ id: templateId });
  const [editor, setEditor] = useState<EditorState | null>(null);

  useEffect(() => {
    if (template.data) setEditor(transformTemplate(template.data));
  }, [template.data]);

  const update = api.formTemplate.update.useMutation({
    onSuccess: async (saved) => {
      await utils.formTemplate.list.invalidate();
      await utils.formTemplate.getById.invalidate({ id: saved.id });
      toast.success("Template salvo");
      setEditor(transformTemplate(saved));
    },
    onError: (error) => toast.error(error.message),
  });

  const visibleFieldCount = useMemo(
    () =>
      editor?.sections.reduce(
        (total, section) =>
          total + section.fields.filter((field) => field.isVisible).length,
        0,
      ) ?? 0,
    [editor],
  );

  if (template.isLoading || !editor) {
    return (
      <div className="bg-background w-full p-4 md:p-6 lg:p-8">
        <div>
          <Card>
            <CardContent className="text-muted-foreground py-10 text-center text-sm">
              Carregando editor...
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const setSection = (sectionIndex: number, patch: Partial<EditorSection>) => {
    setEditor((prev) =>
      prev
        ? {
            ...prev,
            sections: prev.sections.map((section, index) =>
              index === sectionIndex ? { ...section, ...patch } : section,
            ),
          }
        : prev,
    );
  };

  const setField = (
    sectionIndex: number,
    fieldIndex: number,
    patch: Partial<EditorField>,
  ) => {
    setEditor((prev) =>
      prev
        ? {
            ...prev,
            sections: prev.sections.map((section, index) =>
              index === sectionIndex
                ? {
                    ...section,
                    fields: section.fields.map((field, currentFieldIndex) =>
                      currentFieldIndex === fieldIndex
                        ? { ...field, ...patch }
                        : field,
                    ),
                  }
                : section,
            ),
          }
        : prev,
    );
  };

  const moveSection = (sectionIndex: number, direction: -1 | 1) => {
    const target = sectionIndex + direction;
    if (target < 0 || target >= editor.sections.length) return;
    const sections = [...editor.sections];
    const [section] = sections.splice(sectionIndex, 1);
    if (!section) return;
    sections.splice(target, 0, section);
    setEditor({ ...editor, sections: renumberSections(sections) });
  };

  const moveField = (
    sectionIndex: number,
    fieldIndex: number,
    direction: -1 | 1,
  ) => {
    const section = editor.sections[sectionIndex];
    if (!section) return;
    const target = fieldIndex + direction;
    if (target < 0 || target >= section.fields.length) return;
    const fields = [...section.fields];
    const [field] = fields.splice(fieldIndex, 1);
    if (!field) return;
    fields.splice(target, 0, field);
    setSection(sectionIndex, {
      fields: fields.map((item, index) => ({ ...item, order: index })),
    });
  };

  const save = () => {
    update.mutate({
      id: editor.id,
      name: editor.name,
      description: editor.description,
      isDefault: editor.isDefault,
      sections: renumberSections(editor.sections).map((section) => ({
        id: section.id,
        name: section.name,
        description: section.description,
        order: section.order,
        isCollapsible: section.isCollapsible,
        fields: section.fields.map((field) => ({
          id: field.id,
          key: field.key,
          label: field.label,
          description: field.description,
          order: field.order,
          fieldType: field.fieldType,
          isRequired: field.isRequired,
          isVisible: field.isVisible,
          isSystemField: field.isSystemField,
          systemKey: field.systemKey,
          config: field.config,
        })),
      })),
    });
  };

  return (
    <main className="bg-background w-full p-4 md:p-6 lg:p-8">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Voltar</span>
            </Button>
            <div>
              <h1 className="text-3xl font-semibold">Editor de formulário</h1>
              <p className="text-muted-foreground">
                {editor.sections.length} seções, {visibleFieldCount} campos
                visíveis
              </p>
            </div>
          </div>
          <Button onClick={save} disabled={update.isPending}>
            <Save className="h-4 w-4" />
            {update.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>

        <Card>
          <CardContent className="grid gap-4 pt-6 md:grid-cols-[1fr_2fr_auto]">
            <div>
              <Label htmlFor="template-name" className="mb-2 block">
                Nome
              </Label>
              <Input
                id="template-name"
                value={editor.name}
                onChange={(event) =>
                  setEditor({ ...editor, name: event.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="template-description" className="mb-2 block">
                Descrição
              </Label>
              <Input
                id="template-description"
                value={editor.description ?? ""}
                onChange={(event) =>
                  setEditor({ ...editor, description: event.target.value })
                }
              />
            </div>
            <label className="flex items-center gap-2 self-end rounded-md border px-3 py-2 text-sm">
              <Switch
                checked={editor.isDefault}
                onCheckedChange={(checked) =>
                  setEditor({ ...editor, isDefault: checked })
                }
              />
              Padrão
            </label>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {editor.sections.map((section, sectionIndex) => (
            <Collapsible
              key={section.tempId}
              defaultOpen={sectionIndex === 0}
              className="group"
            >
              <Card>
                <CardHeader className="gap-4 md:grid-cols-[1fr_auto]">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input
                      value={section.name}
                      onChange={(event) =>
                        setSection(sectionIndex, { name: event.target.value })
                      }
                      aria-label="Nome da seção"
                    />
                    <Input
                      value={section.description ?? ""}
                      onChange={(event) =>
                        setSection(sectionIndex, {
                          description: event.target.value,
                        })
                      }
                      aria-label="Descrição da seção"
                      placeholder="Descrição opcional"
                    />
                  </div>
                  <div className="flex gap-1">
                    <CollapsibleTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mr-1 gap-1.5"
                      >
                        {section.fields.length}{" "}
                        {section.fields.length === 1 ? "campo" : "campos"}
                        <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                        <span className="sr-only">
                          Expandir ou recolher campos da seção
                        </span>
                      </Button>
                    </CollapsibleTrigger>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => moveSection(sectionIndex, -1)}
                    >
                      <ArrowUp className="h-4 w-4" />
                      <span className="sr-only">Subir seção</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => moveSection(sectionIndex, 1)}
                    >
                      <ArrowDown className="h-4 w-4" />
                      <span className="sr-only">Descer seção</span>
                    </Button>
                  </div>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="space-y-3">
                    {section.fields.map((field, fieldIndex) => (
                      <FieldEditor
                        key={field.tempId}
                        field={field}
                        onChange={(patch) =>
                          setField(sectionIndex, fieldIndex, patch)
                        }
                        onMoveUp={() => moveField(sectionIndex, fieldIndex, -1)}
                        onMoveDown={() =>
                          moveField(sectionIndex, fieldIndex, 1)
                        }
                        onRemove={() =>
                          setSection(sectionIndex, {
                            fields: section.fields.filter(
                              (_, i) => i !== fieldIndex,
                            ),
                          })
                        }
                      />
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setSection(sectionIndex, {
                          fields: [
                            ...section.fields,
                            buildField(section.fields.length),
                          ],
                        })
                      }
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar campo
                    </Button>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() =>
            setEditor({
              ...editor,
              sections: [
                ...editor.sections,
                {
                  name: "Nova seção",
                  description: "",
                  order: editor.sections.length,
                  isCollapsible: false,
                  fields: [],
                  tempId: tempId(),
                },
              ],
            })
          }
        >
          <Plus className="h-4 w-4" />
          Adicionar seção
        </Button>
      </div>
    </main>
  );
}

function FieldEditor({
  field,
  onChange,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  field: EditorField;
  onChange: (patch: Partial<EditorField>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  const meta = FIELD_TYPE_META[field.fieldType];
  const Icon = meta.icon;

  return (
    <div className="rounded-lg border p-4">
      <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr_180px_auto]">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Icon className="text-muted-foreground h-4 w-4" />
            <Input
              value={field.label}
              onChange={(event) => onChange({ label: event.target.value })}
              aria-label="Label do campo"
            />
            {field.isSystemField && <Badge variant="secondary">Sistema</Badge>}
          </div>
          <Input
            value={field.description ?? ""}
            onChange={(event) => onChange({ description: event.target.value })}
            placeholder="Texto de ajuda opcional"
            aria-label="Descrição do campo"
          />
        </div>

        <div className="space-y-2">
          <Input
            value={field.key}
            onChange={(event) => onChange({ key: event.target.value })}
            disabled={field.isSystemField}
            aria-label="Chave do campo"
          />
          <ConfigEditor field={field} onChange={onChange} />
        </div>

        <div className="space-y-2">
          <Select
            value={field.fieldType}
            onValueChange={(value: FormFieldType) =>
              onChange({ fieldType: value })
            }
            disabled={field.isSystemField}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FIELD_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex flex-wrap gap-3 text-sm">
            <label className="flex items-center gap-2">
              <Switch
                checked={field.isRequired}
                onCheckedChange={(checked) => onChange({ isRequired: checked })}
              />
              Obrigatório
            </label>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground flex items-center gap-1"
              onClick={() => onChange({ isVisible: !field.isVisible })}
            >
              {field.isVisible ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
              {field.isVisible ? "Visível" : "Oculto"}
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-1">
          <Button type="button" variant="ghost" size="icon" onClick={onMoveUp}>
            <ArrowUp className="h-4 w-4" />
            <span className="sr-only">Subir campo</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onMoveDown}
          >
            <ArrowDown className="h-4 w-4" />
            <span className="sr-only">Descer campo</span>
          </Button>
          {!field.isSystemField && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onRemove}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Remover campo</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ConfigEditor({
  field,
  onChange,
}: {
  field: EditorField;
  onChange: (patch: Partial<EditorField>) => void;
}) {
  const config = field.config ?? {};

  if (field.fieldType === "NUMBER") {
    return (
      <Input
        value={config.unit ?? ""}
        placeholder="Unidade, ex: kg"
        onChange={(event) =>
          onChange({ config: { ...config, unit: event.target.value } })
        }
      />
    );
  }

  if (field.fieldType === "SELECT" || field.fieldType === "RADIO") {
    const optionsText = (config.options ?? [])
      .map((option) => `${option.value}|${option.label}`)
      .join("\n");

    return (
      <Textarea
        value={optionsText}
        rows={2}
        placeholder={"valor|Label\noutro|Outro label"}
        onChange={(event) =>
          onChange({
            config: {
              ...config,
              options: event.target.value
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean)
                .map((line) => {
                  const [value, label] = line.split("|");
                  return {
                    value: value ?? "",
                    label: label ?? value ?? "",
                  };
                }),
            },
          })
        }
      />
    );
  }

  return (
    <Input
      value={config.placeholder ?? ""}
      placeholder="Placeholder"
      onChange={(event) =>
        onChange({ config: { ...config, placeholder: event.target.value } })
      }
    />
  );
}
