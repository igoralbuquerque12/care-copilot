"use client";

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

import type { AnamnesisType, NYHAClass } from "~/features/anamnesis/types/anamnesis.types";

type AnamnesisDataStepProps = {
  formData: Partial<FormData>;
  setFormData: (data: Partial<FormData>) => void;
};

export function AnamnesisDataStep({
  formData,
  setFormData,
}: AnamnesisDataStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="type" className="mb-2 block">
          Tipo de Consulta *
        </Label>
        <Select
          value={formData.type}
          onValueChange={(value: AnamnesisType) =>
            setFormData({ ...formData, type: value })
          }
        >
          <SelectTrigger id="type">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PRIMEIRA_CONSULTA">Primeira Consulta</SelectItem>
            <SelectItem value="RETORNO">Retorno</SelectItem>
            <SelectItem value="EMERGENCIA">Emergência</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="chiefComplaint" className="mb-2 block">
          Queixa Principal *
        </Label>
        <Textarea
          id="chiefComplaint"
          value={formData.chiefComplaint ?? ""}
          onChange={(e) =>
            setFormData({ ...formData, chiefComplaint: e.target.value })
          }
          placeholder="Descreva a queixa principal do paciente"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="currentIllnessHistory" className="mb-2 block">
          História da Doença Atual *
        </Label>
        <Textarea
          id="currentIllnessHistory"
          value={formData.currentIllnessHistory ?? ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              currentIllnessHistory: e.target.value,
            })
          }
          placeholder="Descreva a história da doença atual"
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="treatmentResponse" className="mb-2 block">
          Resposta ao Tratamento
        </Label>
        <Textarea
          id="treatmentResponse"
          value={formData.treatmentResponse ?? ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              treatmentResponse: e.target.value,
            })
          }
          placeholder="Como o paciente respondeu aos tratamentos anteriores"
          rows={2}
        />
      </div>

      <div>
        <Label htmlFor="symptomEvolution" className="mb-2 block">
          Evolução dos Sintomas
        </Label>
        <Textarea
          id="symptomEvolution"
          value={formData.symptomEvolution ?? ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              symptomEvolution: e.target.value,
            })
          }
          placeholder="Descreva a evolução dos sintomas"
          rows={2}
        />
      </div>

      <div>
        <Label htmlFor="newEvents" className="mb-2 block">
          Novos Eventos
        </Label>
        <Textarea
          id="newEvents"
          value={formData.newEvents ?? ""}
          onChange={(e) =>
            setFormData({ ...formData, newEvents: e.target.value })
          }
          placeholder="Registre eventos novos ou relevantes"
          rows={2}
        />
      </div>

      <div>
        <Label htmlFor="nyhaClass" className="mb-2 block">
          Classe NYHA
        </Label>
        <Select
          value={formData.nyhaClass}
          onValueChange={(value: NYHAClass) =>
            setFormData({ ...formData, nyhaClass: value })
          }
        >
          <SelectTrigger id="nyhaClass">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="I">Classe I</SelectItem>
            <SelectItem value="II">Classe II</SelectItem>
            <SelectItem value="III">Classe III</SelectItem>
            <SelectItem value="IV">Classe IV</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6 border-t pt-4">
        <h3 className="mb-4 font-medium">Sintomas</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasPalpitations"
              checked={formData.hasPalpitations}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  hasPalpitations: checked as boolean,
                })
              }
            />
            <Label htmlFor="hasPalpitations" className="font-normal">
              Palpitações
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasSyncope"
              checked={formData.hasSyncope}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  hasSyncope: checked as boolean,
                })
              }
            />
            <Label htmlFor="hasSyncope" className="font-normal">
              Síncope
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasEdema"
              checked={formData.hasEdema}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, hasEdema: checked as boolean })
              }
            />
            <Label htmlFor="hasEdema" className="font-normal">
              Edema
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasChestPain"
              checked={formData.hasChestPain}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  hasChestPain: checked as boolean,
                })
              }
            />
            <Label htmlFor="hasChestPain" className="font-normal">
              Dor Torácica
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
}
