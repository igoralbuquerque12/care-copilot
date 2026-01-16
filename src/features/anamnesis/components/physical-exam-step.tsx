"use client";

import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";

import type { FormData } from "~/features/anamnesis/hooks/use-anamnesis-form";

type PhysicalExamStepProps = {
  formData: Partial<FormData>;
  setFormData: (data: Partial<FormData>) => void;
};

export function PhysicalExamStep({
  formData,
  setFormData,
}: PhysicalExamStepProps) {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground mb-4 text-sm">
        Todos os campos são opcionais. Preencha conforme necessário.
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="weight" className="mb-2 block">
            Peso (kg)
          </Label>
          <Input
            id="weight"
            type="number"
            step="0.1"
            value={formData.physicalExam?.weight ?? ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                physicalExam: {
                  ...formData.physicalExam,
                  weight: Number.parseFloat(e.target.value),
                },
              })
            }
            placeholder="Ex: 70.5"
          />
        </div>

        <div>
          <Label htmlFor="height" className="mb-2 block">
            Altura (cm)
          </Label>
          <Input
            id="height"
            type="number"
            step="0.1"
            value={formData.physicalExam?.height ?? ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                physicalExam: {
                  ...formData.physicalExam,
                  height: Number.parseFloat(e.target.value),
                },
              })
            }
            placeholder="Ex: 175"
          />
        </div>

        <div>
          <Label htmlFor="bpSystolic" className="mb-2 block">
            PA Sistólica (mmHg)
          </Label>
          <Input
            id="bpSystolic"
            type="number"
            value={formData.physicalExam?.bpSystolic ?? ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                physicalExam: {
                  ...formData.physicalExam,
                  bpSystolic: Number.parseInt(e.target.value),
                },
              })
            }
            placeholder="Ex: 120"
          />
        </div>

        <div>
          <Label htmlFor="bpDiastolic" className="mb-2 block">
            PA Diastólica (mmHg)
          </Label>
          <Input
            id="bpDiastolic"
            type="number"
            value={formData.physicalExam?.bpDiastolic ?? ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                physicalExam: {
                  ...formData.physicalExam,
                  bpDiastolic: Number.parseInt(e.target.value),
                },
              })
            }
            placeholder="Ex: 80"
          />
        </div>

        <div>
          <Label htmlFor="heartRate" className="mb-2 block">
            Frequência Cardíaca (bpm)
          </Label>
          <Input
            id="heartRate"
            type="number"
            value={formData.physicalExam?.heartRate ?? ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                physicalExam: {
                  ...formData.physicalExam,
                  heartRate: Number.parseInt(e.target.value),
                },
              })
            }
            placeholder="Ex: 72"
          />
        </div>

        <div>
          <Label htmlFor="oxygenSaturation" className="mb-2 block">
            Saturação O2 (%)
          </Label>
          <Input
            id="oxygenSaturation"
            type="number"
            value={formData.physicalExam?.oxygenSaturation ?? ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                physicalExam: {
                  ...formData.physicalExam,
                  oxygenSaturation: Number.parseInt(e.target.value),
                },
              })
            }
            placeholder="Ex: 98"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="heartAuscultation" className="mb-2 block">
          Ausculta Cardíaca
        </Label>
        <Textarea
          id="heartAuscultation"
          value={formData.physicalExam?.heartAuscultation ?? ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              physicalExam: {
                ...formData.physicalExam,
                heartAuscultation: e.target.value,
              },
            })
          }
          placeholder="Descreva os achados da ausculta cardíaca"
          rows={2}
        />
      </div>

      <div>
        <Label htmlFor="lungAuscultation" className="mb-2 block">
          Ausculta Pulmonar
        </Label>
        <Textarea
          id="lungAuscultation"
          value={formData.physicalExam?.lungAuscultation ?? ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              physicalExam: {
                ...formData.physicalExam,
                lungAuscultation: e.target.value,
              },
            })
          }
          placeholder="Descreva os achados da ausculta pulmonar"
          rows={2}
        />
      </div>

      <div>
        <Label htmlFor="peripheralPulses" className="mb-2 block">
          Pulsos Periféricos
        </Label>
        <Input
          id="peripheralPulses"
          value={formData.physicalExam?.peripheralPulses ?? ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              physicalExam: {
                ...formData.physicalExam,
                peripheralPulses: e.target.value,
              },
            })
          }
          placeholder="Ex: Simétricos e amplos"
        />
      </div>

      <div>
        <Label htmlFor="edemaGrade" className="mb-2 block">
          Grau de Edema
        </Label>
        <Input
          id="edemaGrade"
          value={formData.physicalExam?.edemaGrade ?? ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              physicalExam: {
                ...formData.physicalExam,
                edemaGrade: e.target.value,
              },
            })
          }
          placeholder="Ex: +/4+"
        />
      </div>
    </div>
  );
}
