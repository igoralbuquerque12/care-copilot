"use client"

import { useState } from "react"
import { toast } from "sonner"
import { api } from "~/trpc/react"
import { type CreatePatientInput } from "~/schemas/patient"
import { type CreateAnamnesisInput } from "~/schemas/anamnesis"
import { useRouter } from "next/navigation"

export type FormData = {
  name: string
  birthDate: Date
  gender: "MASCULINO" | "FEMININO" | "OUTRO"
  clinicalProfile?: {
    hasHypertension?: boolean
    hasDiabetes?: boolean
    diabetesDuration?: number
    allergies?: string
  }

  type: "PRIMEIRA_CONSULTA" | "RETORNO" | "EMERGENCIA"
  chiefComplaint: string
  currentIllnessHistory: string
  treatmentResponse?: string
  symptomEvolution?: string
  newEvents?: string
  nyhaClass: "I" | "II" | "III" | "IV"
  hasPalpitations: boolean
  hasSyncope: boolean
  hasEdema: boolean
  hasChestPain: boolean
  physicalExam?: {
    weight?: number
    height?: number
    bpSystolic?: number
    bpDiastolic?: number
    heartRate?: number
    oxygenSaturation?: number
    heartAuscultation?: string
    lungAuscultation?: string
    peripheralPulses?: string
    edemaGrade?: string
  }

  medications?: Array<{
    name: string
    dosage: string
    frequency: string
  }>

  diagnosticHypothesis?: string
  conduct?: string
  nextRecallDate?: Date
}

export function useAnamnesisForm() {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1)
  const [patientId, setPatientId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<Partial<FormData>>({
    hasPalpitations: false,
    hasSyncope: false,
    hasEdema: false,
    hasChestPain: false,
    nyhaClass: "I",
  })
  
  const [medications, setMedications] = useState<Array<{ name: string; dosage: string; frequency: string }>>([])

  const createPatientMutation = api.patient.create.useMutation({
    onSuccess: (data) => {
      setPatientId(data.id)
      setCurrentStep(2)
      toast.success("Paciente cadastrado com sucesso")
    },
    onError: (error) => {
      console.error("Erro ao criar paciente:", error)
      toast.error(error.message ?? "Erro ao salvar paciente.")
    }
  })

  const createAnamnesisMutation = api.anamnesis.create.useMutation({
    onSuccess: () => {
      toast.success("Anamnese finalizada com sucesso!")
      router.push("/")
    },
    onError: (error) => {
      console.error("Erro ao criar anamnese:", error)
      toast.error(error.message ?? "Erro ao salvar anamnese.")
    }
  })

  const isLoading = createPatientMutation.isPending || createAnamnesisMutation.isPending

  const handleNext = async () => {
    if (currentStep === 1) {
      if (!formData.name || !formData.birthDate || !formData.gender) {
        toast.error("Preencha os campos obrigatórios do paciente.")
        return
      }

      const genderMap: Record<string, "Masculino" | "Feminino" | "Outro"> = {
        "MASCULINO": "Masculino",
        "FEMININO": "Feminino",
        "OUTRO": "Outro"
      }

      const patientData: CreatePatientInput = {
        name: formData.name,
        birthDate: formData.birthDate,
        gender: genderMap[formData.gender] ?? "Outro",
        clinicalProfile: formData.clinicalProfile,
      }

      createPatientMutation.mutate(patientData)
      return
    }

    setCurrentStep(currentStep + 1)
  }

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1)
  }

  const handleFinalSubmit = async () => {
    if (!patientId) {
      toast.error("ID do paciente não encontrado.")
      return
    }

    if (!formData.type || !formData.chiefComplaint || !formData.currentIllnessHistory) {
      toast.error("Preencha os dados obrigatórios da anamnese.")
      return
    }

    const typeMap: Record<string, "FIRST_VISIT" | "FOLLOW_UP" | "ROUTINE"> = {
      "PRIMEIRA_CONSULTA": "FIRST_VISIT",
      "RETORNO": "FOLLOW_UP",
      "EMERGENCIA": "ROUTINE" 
    }

    const anamnesisData: CreateAnamnesisInput = {
      patientId,
      type: typeMap[formData.type] ?? "ROUTINE",
      chiefComplaint: formData.chiefComplaint,
      currentIllnessHistory: formData.currentIllnessHistory,
      treatmentResponse: formData.treatmentResponse,
      symptomEvolution: formData.symptomEvolution,
      newEvents: formData.newEvents,
      nyhaClass: formData.nyhaClass ?? "I",
      
      hasPalpitations: formData.hasPalpitations ?? false,
      hasSyncope: formData.hasSyncope ?? false,
      hasEdema: formData.hasEdema ?? false,
      hasChestPain: formData.hasChestPain ?? false,
      
      physicalExam: formData.physicalExam,
      medications: medications.length > 0 ? medications : undefined,
      
      diagnosticHypothesis: formData.diagnosticHypothesis,
      conduct: formData.conduct,
      nextRecallDate: formData.nextRecallDate,
    }

    createAnamnesisMutation.mutate(anamnesisData)
  }

  const addMedication = () => {
    setMedications([...medications, { name: "", dosage: "", frequency: "" }])
  }

  const updateMedication = (index: number, field: string, value: string) => {
    const updated = [...medications]
    const currentItem = updated[index]
    if (currentItem) {
      updated[index] = { ...currentItem, [field]: value };
      setMedications(updated)
    }
  }

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index))
  }

  return {
    currentStep,
    patientId,
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
  }
}