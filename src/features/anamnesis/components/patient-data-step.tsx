"use client";

import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Checkbox } from "~/components/ui/checkbox";

import type { FormData } from "~/features/anamnesis/hooks/use-anamnesis-form";

import type { Gender } from "~/features/anamnesis/types/anamnesis.types";

type PatientDataStepProps = {
  formData: Partial<FormData>;
  setFormData: (data: Partial<FormData>) => void;
};

export function PatientDataStep({
  formData,
  setFormData,
}: PatientDataStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name" className="mb-2 block">
          Nome Completo *
        </Label>
        <Input
          id="name"
          value={formData.name ?? ""}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Digite o nome do paciente"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
          />
        </div>

        <div>
          <Label htmlFor="gender" className="mb-2 block">
            Gênero *
          </Label>
          <Select
            value={formData.gender}
            onValueChange={(value: Gender) =>
              setFormData({ ...formData, gender: value })
            }
          > 
            <SelectTrigger id="gender">
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
