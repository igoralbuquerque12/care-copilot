"use client"

import { useState } from "react"
import { Loader2, ChevronRight, ChevronLeft, Check, HeartPulse, SkipForward } from "lucide-react"

import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "~/components/ui/sheet"

import { useAnamnesisForm } from "~/features/anamnesis/hooks/use-anamnesis-form"
import { StepIndicator } from "~/features/anamnesis/components/step-indicator"
import { PatientDataStep } from "~/features/anamnesis/components/patient-data-step"
import { AnamnesisDataStep } from "~/features/anamnesis/components/anamnesis-data-step"
import { PhysicalExamStep } from "~/features/anamnesis/components/physical-exam-step"
import { DiagnosisStep } from "~/features/anamnesis/components/diagnosis-step"
import { ReviewStep } from "~/features/anamnesis/components/review-step"
import { DynamicSectionRenderer } from "~/features/anamnesis/components/dynamic-section-renderer"
import { SurgicalRiskForm } from "~/features/surgical-risk/components/surgical-risk-form"

export function AnamnesisWizard({ consultationId }: { consultationId?: string }) {
  const [sheetOpen, setSheetOpen] = useState(false)

  const {
    currentStep,
    isLoading,
    formData,
    setFormData,
    template,
    steps,
    customValues,
    setCustomValues,
    selectedPatientId,
    medications,
    handleNext,
    handlePrevious,
    handleFinalSubmit,
    handleSelectExistingPatient,
    handleClearExistingPatient,
    addMedication,
    updateMedication,
    removeMedication,
    createdAnamnesisId,
    navigateHome,
  } = useAnamnesisForm({ consultationId })

  const isFinalStep = currentStep === steps.length
  const currentTemplateSection = template?.sections[currentStep - 2]

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-foreground mb-2">Nova Anamnese</h1>
          <p className="text-muted-foreground">Preencha os dados do paciente e registre a consulta</p>
        </div>

        <StepIndicator steps={steps} currentStep={currentStep} />

        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep - 1]?.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentStep === 1 && (
              <PatientDataStep
                formData={formData}
                setFormData={setFormData}
                selectedPatientId={selectedPatientId}
                onSelectExistingPatient={handleSelectExistingPatient}
                onClearExistingPatient={handleClearExistingPatient}
              />
            )}
            {template && currentTemplateSection && !isFinalStep && (
              <DynamicSectionRenderer
                section={currentTemplateSection}
                formData={formData}
                setFormData={setFormData}
                customValues={customValues}
                setCustomValues={setCustomValues}
                medications={medications}
                addMedication={addMedication}
                updateMedication={updateMedication}
                removeMedication={removeMedication}
              />
            )}
            {!template && currentStep === 2 && <AnamnesisDataStep formData={formData} setFormData={setFormData} />}
            {!template && currentStep === 3 && <PhysicalExamStep formData={formData} setFormData={setFormData} />}
            {!template && currentStep === 4 && (
              <DiagnosisStep
                formData={formData}
                setFormData={setFormData}
                medications={medications}
                addMedication={addMedication}
                updateMedication={updateMedication}
                removeMedication={removeMedication}
              />
            )}
            {isFinalStep && (
              <ReviewStep
                formData={formData}
                medications={medications}
                template={template}
                customValues={customValues}
              />
            )}

            <div className="flex justify-between pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>

              {currentStep < steps.length ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={
                    isLoading ||
                    (currentStep === 1 && (!formData.name || !formData.birthDate || !formData.gender)) ||
                    (!template && currentStep === 2 &&
                      (!formData.chiefComplaint || !formData.currentIllnessHistory))
                  }
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      Próximo
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              ) : (
                <Button type="button" onClick={handleFinalSubmit} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Confirmar e Salvar
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* CTA pós-salvar: Risco Cirúrgico */}
        {createdAnamnesisId && (
          <Card className="mt-4 border-primary/30 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <HeartPulse className="h-5 w-5 text-primary" />
                Emitir Avaliação de Risco Cirúrgico?
              </CardTitle>
              <CardDescription>
                A anamnese foi salva com sucesso. Deseja calcular o risco cirúrgico perioperatório
                para esta consulta com base nos dados registrados?
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3">
              <Button onClick={() => setSheetOpen(true)}>
                <HeartPulse className="h-4 w-4 mr-2" />
                Calcular Risco Cirúrgico
              </Button>
              <Button variant="ghost" onClick={navigateHome}>
                <SkipForward className="h-4 w-4 mr-2" />
                Pular
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Sheet com o formulário de risco cirúrgico */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
            <SheetHeader className="mb-6 px-4 pt-6 sm:px-6 sm:pt-8">
              <SheetTitle className="flex items-center gap-2">
                <HeartPulse className="h-5 w-5 text-primary" />
                Risco Cirúrgico Perioperatório
              </SheetTitle>
              <SheetDescription>
                Avaliação baseada no Índice de Lee (RCRI). Os campos foram
                pré-preenchidos com base nos dados da anamnese registrada.
              </SheetDescription>
            </SheetHeader>
            <div className="px-4 pb-6 sm:px-6 sm:pb-8">
              {createdAnamnesisId && (
                <SurgicalRiskForm
                  anamnesisId={createdAnamnesisId}
                  onSuccess={() => {
                    setSheetOpen(false)
                    navigateHome()
                  }}
                />
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
