"use client";

import { useState, useEffect } from "react";
import { Search, X, UserCheck } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import { Textarea } from "~/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Checkbox } from "~/components/ui/checkbox";

import { api } from "~/trpc/react";
import type { FormData } from "~/features/anamnesis/hooks/use-anamnesis-form";
import type { Gender } from "~/features/anamnesis/types/anamnesis.types";

type PatientDataStepProps = {
  formData: Partial<FormData>;
  setFormData: (data: Partial<FormData>) => void;
  /** When a patient is selected from search, the parent hook receives the id to skip patient creation */
  onSelectExistingPatient: (id: string) => void;
  onClearExistingPatient: () => void;
  selectedPatientId: string | null;
};

type PatientResult = {
  id: string;
  name: string;
  birthDate: Date;
  gender: string;
  cpf?: string | null;
};

export function PatientDataStep({
  formData,
  setFormData,
  onSelectExistingPatient,
  onClearExistingPatient,
  selectedPatientId,
}: PatientDataStepProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const { data: rawResults = [], isLoading: isSearching } =
    api.patient.search.useQuery(
      { query: debouncedQuery },
      { enabled: debouncedQuery.length >= 2 },
    );

  const results = rawResults as PatientResult[];

  const handleSelect = (patient: PatientResult) => {
    // Map Prisma gender (e.g. "Masculino") back to internal enum
    const genderMap: Record<string, "MASCULINO" | "FEMININO" | "OUTRO"> = {
      Masculino: "MASCULINO",
      Feminino: "FEMININO",
      Outro: "OUTRO",
    };

    setFormData({
      ...formData,
      name: patient.name,
      birthDate: new Date(patient.birthDate),
      gender: genderMap[patient.gender] ?? "OUTRO",
      cpf: patient.cpf ?? undefined,
    });
    onSelectExistingPatient(patient.id);
    setQuery("");
    setDebouncedQuery("");
    setIsOpen(false);
  };

  const handleClear = () => {
    setFormData({
      ...formData,
      name: "",
      cpf: undefined,
      birthDate: undefined,
      gender: undefined,
    });
    onClearExistingPatient();
    setQuery("");
  };

  const isLocked = !!selectedPatientId;

  return (
    <div className="space-y-4">
      {/* ── Patient search ── */}
      <div>
        <Label className="mb-2 block text-sm font-medium">
          Buscar Paciente Existente
        </Label>

        {isLocked ? (
          /* Selected patient chip */
          <div className="flex items-center gap-3 rounded-lg border border-primary/40 bg-primary/5 p-3">
            <UserCheck className="h-5 w-5 shrink-0 text-primary" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{formData.name} - {formData.cpf}</p>
              <p className="text-xs text-muted-foreground">Paciente existente selecionado</p>
            </div>
            <Badge variant="secondary" className="shrink-0 text-xs">existente</Badge>
            <button
              type="button"
              onClick={handleClear}
              className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
              aria-label="Remover paciente selecionado"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          /* Search input + dropdown */
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                placeholder="Buscar por nome ou CPF (deixe vazio para novo paciente)"
                className="pl-9"
              />
            </div>

            {isOpen && debouncedQuery.length >= 2 && (
              <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover shadow-lg overflow-hidden">
                {isSearching ? (
                  <div className="p-3 text-sm text-muted-foreground text-center">
                    Buscando...
                  </div>
                ) : results.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground text-center">
                    Nenhum paciente encontrado — preencha os dados abaixo
                  </div>
                ) : (
                  <ul>
                    {results.map((patient) => (
                      <li key={patient.id}>
                        <button
                          type="button"
                          className="w-full text-left px-4 py-3 hover:bg-accent transition-colors border-b last:border-b-0"
                          onMouseDown={() => handleSelect(patient)}
                        >
                          <p className="text-sm font-medium">{patient.name}</p>
                          {patient.cpf && (
                            <p className="text-xs text-muted-foreground">
                              CPF: {patient.cpf}
                            </p>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t pt-4">
        <p className="mb-4 text-xs text-muted-foreground">
          {isLocked
            ? "Dados preenchidos automaticamente — remova o paciente acima para editar."
            : "Preencha os dados do novo paciente:"}
        </p>

        {/* ── Name ── */}
        <div className="mb-4">
          <Label htmlFor="name" className="mb-2 block">
            Nome Completo *
          </Label>
          <Input
            id="name"
            value={formData.name ?? ""}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Digite o nome do paciente"
            disabled={isLocked}
            className={isLocked ? "bg-muted text-muted-foreground cursor-not-allowed" : ""}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* ── CPF ── */}
          <div>
            <Label htmlFor="cpf" className="mb-2 block">
              CPF
            </Label>
            <Input
              id="cpf"
              value={formData.cpf ?? ""}
              onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
              placeholder="000.000.000-00"
              disabled={isLocked}
              className={
                isLocked
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : ""
              }
            />
          </div>

          {/* ── Birth date ── */}
          <div>
            <Label htmlFor="birthDate" className="mb-2 block">
              Data de Nascimento *
            </Label>
            <Input
              id="birthDate"
              type="date"
              value={
                formData.birthDate
                  ? new Date(formData.birthDate).toISOString().split("T")[0]
                  : ""
              }
              onChange={(e) =>
                setFormData({
                  ...formData,
                  birthDate: new Date(e.target.value),
                })
              }
              disabled={isLocked}
              className={
                isLocked
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : ""
              }
            />
          </div>

          {/* ── Gender ── */}
          <div>
            <Label htmlFor="gender" className="mb-2 block">
              Gênero *
            </Label>
            <Select
              value={formData.gender}
              onValueChange={(value: Gender) =>
                setFormData({ ...formData, gender: value })
              }
              disabled={isLocked}
            >
              <SelectTrigger
                id="gender"
                className={
                  isLocked
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : ""
                }
              >
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MASCULINO">Masculino</SelectItem>
                <SelectItem value="FEMININO">Feminino</SelectItem>
                <SelectItem value="OUTRO">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ── Clinical profile (always editable) ── */}
      <div className="mt-6 border-t pt-4">
        <h3 className="mb-4 font-medium">Perfil Clínico Inicial (Opcional)</h3>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasHypertension"
              checked={formData.clinicalProfile?.hasHypertension ?? false}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  clinicalProfile: {
                    ...formData.clinicalProfile,
                    hasHypertension: checked as boolean,
                  },
                })
              }
            />
            <Label htmlFor="hasHypertension" className="font-normal">
              Hipertensão
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasDiabetes"
              checked={formData.clinicalProfile?.hasDiabetes ?? false}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  clinicalProfile: {
                    ...formData.clinicalProfile,
                    hasDiabetes: checked as boolean,
                  },
                })
              }
            />
            <Label htmlFor="hasDiabetes" className="font-normal">
              Diabetes
            </Label>
          </div>

          {formData.clinicalProfile?.hasDiabetes && (
            <div>
              <Label htmlFor="diabetesDuration" className="mb-2 block">
                Tempo de Diabetes (anos)
              </Label>
              <Input
                id="diabetesDuration"
                type="number"
                value={formData.clinicalProfile?.diabetesDuration ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    clinicalProfile: {
                      ...formData.clinicalProfile,
                      diabetesDuration: Number.parseInt(e.target.value),
                    },
                  })
                }
              />
            </div>
          )}

          <div>
            <Label htmlFor="allergies" className="mb-2 block">
              Alergias
            </Label>
            <Textarea
              id="allergies"
              value={formData.clinicalProfile?.allergies ?? ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  clinicalProfile: {
                    ...formData.clinicalProfile,
                    allergies: e.target.value,
                  },
                })
              }
              placeholder="Descreva alergias conhecidas"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
