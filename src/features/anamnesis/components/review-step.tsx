import type { FormData } from "~/features/anamnesis/hooks/use-anamnesis-form"

type ReviewStepProps = {
  formData: Partial<FormData>
  medications: Array<{ name: string; dosage: string; frequency: string }>
  template?: {
    sections: Array<{
      fields: Array<{
        key: string
        label: string
        isSystemField: boolean
        isVisible: boolean
      }>
    }>
  }
  customValues?: Record<string, unknown>
}

const formatCustomValue = (value: unknown) => {
  if (value == null || value === "") return "Nao informado"
  if (value instanceof Date) return value.toLocaleDateString("pt-BR")
  if (typeof value === "string") return value
  if (typeof value === "number") return String(value)
  if (typeof value === "boolean") return value ? "Sim" : "Nao"
  if (Array.isArray(value)) return value.join(", ")
  if (typeof value === "object") return JSON.stringify(value)
  return "Nao informado"
}

export function ReviewStep({
  formData,
  medications,
  template,
  customValues = {},
}: ReviewStepProps) {
  const customFields =
    template?.sections.flatMap((section) =>
      section.fields.filter((field) => !field.isSystemField && field.isVisible),
    ) ?? []

  return (
    <div className="space-y-6">
      <div className="bg-muted/50 p-4 rounded-lg">
        <h3 className="font-medium mb-3">Anamnese</h3>
        <div className="space-y-2 text-sm">
          <div className="grid grid-cols-3 gap-2">
            <span className="text-muted-foreground">Queixa:</span>
            <span className="col-span-2">{formData.chiefComplaint}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <span className="text-muted-foreground">História:</span>
            <span className="col-span-2">{formData.currentIllnessHistory}</span>
          </div>
          {formData.treatmentResponse && (
            <div className="grid grid-cols-3 gap-2">
              <span className="text-muted-foreground">Resposta:</span>
              <span className="col-span-2">{formData.treatmentResponse}</span>
            </div>
          )}
          <div className="grid grid-cols-3 gap-2">
            <span className="text-muted-foreground">Classe NYHA:</span>
            <span className="col-span-2">{formData.nyhaClass}</span>
          </div>
        </div>
      </div>

      <div className="bg-muted/50 p-4 rounded-lg">
        <h3 className="font-medium mb-3">Sintomas</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${formData.hasPalpitations ? "bg-primary" : "bg-muted"}`} />
            <span>Palpitações</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${formData.hasSyncope ? "bg-primary" : "bg-muted"}`} />
            <span>Síncope</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${formData.hasEdema ? "bg-primary" : "bg-muted"}`} />
            <span>Edema</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${formData.hasChestPain ? "bg-primary" : "bg-muted"}`} />
            <span>Dor Torácica</span>
          </div>
        </div>
      </div>

      {(formData.physicalExam?.weight ?? formData.physicalExam?.height ?? formData.physicalExam?.bpSystolic) && (
        <div className="bg-muted/50 p-4 rounded-lg">
          <h3 className="font-medium mb-3">Exame Físico</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {formData.physicalExam?.weight && (
              <div>
                <span className="text-muted-foreground">Peso:</span> {formData.physicalExam.weight} kg
              </div>
            )}
            {formData.physicalExam?.height && (
              <div>
                <span className="text-muted-foreground">Altura:</span> {formData.physicalExam.height} cm
              </div>
            )}
            {formData.physicalExam?.bpSystolic && (
              <div>
                <span className="text-muted-foreground">PA:</span> {formData.physicalExam.bpSystolic}/
                {formData.physicalExam.bpDiastolic} mmHg
              </div>
            )}
            {formData.physicalExam?.heartRate && (
              <div>
                <span className="text-muted-foreground">FC:</span> {formData.physicalExam.heartRate} bpm
              </div>
            )}
          </div>
        </div>
      )}

      {medications.length > 0 && (
        <div className="bg-muted/50 p-4 rounded-lg">
          <h3 className="font-medium mb-3">Medicamentos</h3>
          <div className="space-y-2 text-sm">
            {medications.map((med, index) => (
              <div key={index} className="flex gap-2">
                <span className="text-muted-foreground">•</span>
                <span>
                  {med.name} - {med.dosage} - {med.frequency}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {formData.diagnosticHypothesis && (
        <div className="bg-muted/50 p-4 rounded-lg">
          <h3 className="font-medium mb-3">Hipótese Diagnóstica</h3>
          <p className="text-sm">{formData.diagnosticHypothesis}</p>
        </div>
      )}

      {formData.conduct && (
        <div className="bg-muted/50 p-4 rounded-lg">
          <h3 className="font-medium mb-3">Conduta</h3>
          <p className="text-sm">{formData.conduct}</p>
        </div>
      )}

      {customFields.length > 0 && (
        <div className="bg-muted/50 p-4 rounded-lg">
          <h3 className="font-medium mb-3">Campos personalizados</h3>
          <div className="space-y-2 text-sm">
            {customFields.map((field) => (
              <div key={field.key} className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">{field.label}:</span>
                <span className="col-span-2">
                  {formatCustomValue(customValues[field.key])}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
