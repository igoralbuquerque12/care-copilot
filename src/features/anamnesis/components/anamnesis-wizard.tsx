"use client"

import { Loader2, ChevronRight, ChevronLeft, Check } from "lucide-react"

import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"

import { useAnamnesisForm } from "~/features/anamnesis/hooks/use-anamnesis-form"
import { StepIndicator } from "~/features/anamnesis/components/step-indicator"
import { PatientDataStep } from "~/features/anamnesis/components/patient-data-step"
import { AnamnesisDataStep } from "~/features/anamnesis/components/anamnesis-data-step"
import { PhysicalExamStep } from "~/features/anamnesis/components/physical-exam-step"
import { DiagnosisStep } from "~/features/anamnesis/components/diagnosis-step"
import { ReviewStep } from "~/features/anamnesis/components/review-step"

import { steps } from "~/features/anamnesis/constants/steps"


export function AnamnesisWizard() {
  const {
    currentStep,
    isLoading,
    formData,
    setFormData,
    medications,
    handleNext,
    handlePrevious,
    handleFinalSubmit,
    addMedication,
    updateMedication,
    removeMedication,
  } = useAnamnesisForm()

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
            {currentStep === 1 && <PatientDataStep formData={formData} setFormData={setFormData} />}
            {currentStep === 2 && <AnamnesisDataStep formData={formData} setFormData={setFormData} />}
            {currentStep === 3 && <PhysicalExamStep formData={formData} setFormData={setFormData} />}
            {currentStep === 4 && (
              <DiagnosisStep
                formData={formData}
                setFormData={setFormData}
                medications={medications}
                addMedication={addMedication}
                updateMedication={updateMedication}
                removeMedication={removeMedication}
              />
            )}
            {currentStep === 5 && <ReviewStep formData={formData} medications={medications} />}

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

              {currentStep < 5 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={
                    isLoading ||
                    (currentStep === 1 && (!formData.name || !formData.birthDate || !formData.gender)) ||
                    (currentStep === 2 &&
                      (!formData.type || !formData.chiefComplaint || !formData.currentIllnessHistory))
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
      </div>
    </div>
  )
}
