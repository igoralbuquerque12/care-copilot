"use client";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";

import type { FormData } from "~/features/anamnesis/hooks/use-anamnesis-form";

type DiagnosisStepProps = {
  formData: Partial<FormData>;
  setFormData: (data: Partial<FormData>) => void;
  medications: Array<{ name: string; dosage: string; frequency: string }>;
  addMedication: () => void;
  updateMedication: (index: number, field: string, value: string) => void;
  removeMedication: (index: number) => void;
};

export function DiagnosisStep({
  formData,
  setFormData,
  medications,
  addMedication,
  updateMedication,
  removeMedication,
}: DiagnosisStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="diagnosticHypothesis" className="mb-2 block">
          Hipótese Diagnóstica
        </Label>
        <Textarea
          id="diagnosticHypothesis"
          value={formData.diagnosticHypothesis ?? ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              diagnosticHypothesis: e.target.value,
            })
          }
          placeholder="Descreva a hipótese diagnóstica"
          rows={3}
        />
      </div>

      <div className="border-t pt-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-medium">Medicamentos</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addMedication}
          >
            Adicionar Medicamento
          </Button>
        </div>

        {medications.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nenhum medicamento adicionado
          </p>
        ) : (
          <div className="space-y-4">
            {medications.map((med, index) => (
              <div
                key={index}
                className="grid grid-cols-1 gap-3 rounded-lg border p-4 md:grid-cols-3"
              >
                <div>
                  <Label htmlFor={`med-name-${index}`} className="mb-2 block">
                    Nome
                  </Label>
                  <Input
                    id={`med-name-${index}`}
                    value={med.name}
                    onChange={(e) =>
                      updateMedication(index, "name", e.target.value)
                    }
                    placeholder="Nome do medicamento"
                  />
                </div>
                <div>
                  <Label htmlFor={`med-dosage-${index}`} className="mb-2 block">
                    Dosagem
                  </Label>
                  <Input
                    id={`med-dosage-${index}`}
                    value={med.dosage}
                    onChange={(e) =>
                      updateMedication(index, "dosage", e.target.value)
                    }
                    placeholder="Ex: 50mg"
                  />
                </div>
                <div>
                  <Label
                    htmlFor={`med-frequency-${index}`}
                    className="mb-2 block"
                  >
                    Frequência
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id={`med-frequency-${index}`}
                      value={med.frequency}
                      onChange={(e) =>
                        updateMedication(index, "frequency", e.target.value)
                      }
                      placeholder="Ex: 2x/dia"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => removeMedication(index)}
                    >
                      ×
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="conduct" className="mb-2 block">
          Conduta
        </Label>
        <Textarea
          id="conduct"
          value={formData.conduct ?? ""}
          onChange={(e) =>
            setFormData({ ...formData, conduct: e.target.value })
          }
          placeholder="Descreva a conduta terapêutica"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="nextRecallDate" className="mb-2 block">
          Data do Próximo Retorno
        </Label>
        <Input
          id="nextRecallDate"
          type="date"
          value={
            formData.nextRecallDate
              ? new Date(formData.nextRecallDate).toISOString().split("T")[0]
              : ""
          }
          onChange={(e) =>
            setFormData({
              ...formData,
              nextRecallDate: new Date(e.target.value),
            })
          }
        />
      </div>
    </div>
  );
}
