"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import type { ScheduleConsultationFormData, PatientOption, ConsultationType } from "~/features/create-schedule-consultation/types/schedule-consultation.types";

const initialFormData: ScheduleConsultationFormData = {
    patientId: undefined,
    newPatientName: "",
    newPatientBirthDate: "",
    newPatientGender: "",
    newPatientCpf: "",
    date: "",
    time: "",
    type: "ROUTINE",
};

export function useScheduleConsultationForm() {
    const router = useRouter();
    const [formData, setFormData] = useState<ScheduleConsultationFormData>(initialFormData);
    const [selectedPatient, setSelectedPatient] = useState<PatientOption | null>(null);

    const createMutation = api.scheduleConsultation.create.useMutation({
        onSuccess: () => {
            toast.success("Consulta agendada com sucesso!");
            router.push("/");
        },
        onError: (error) => {
            toast.error(error.message ?? "Erro ao agendar consulta.");
        },
    });

    const handleSelectPatient = (patient: PatientOption) => {
        setSelectedPatient(patient);
        setFormData((prev) => ({
            ...prev,
            patientId: patient.id,
            newPatientName: "",
            newPatientBirthDate: "",
            newPatientGender: "",
            newPatientCpf: "",
        }));
    };

    const handleClearPatient = () => {
        setSelectedPatient(null);
        setFormData((prev) => ({ ...prev, patientId: undefined }));
    };

    const handleSubmit = () => {
        if (!formData.date || !formData.time) {
            toast.error("Preencha a data e o horário da consulta.");
            return;
        }

        const isNewPatient = !formData.patientId;
        if (isNewPatient) {
            if (!formData.newPatientName || !formData.newPatientBirthDate || !formData.newPatientGender) {
                toast.error("Preencha todos os dados do paciente.");
                return;
            }
        }

        // Build UTC ISO string from date + time (treated as UTC zero)
        const dateTimeUtc = new Date(`${formData.date}T${formData.time}:00.000Z`);

        createMutation.mutate({
            patientId: formData.patientId,
            newPatient: isNewPatient
                ? {
                    name: formData.newPatientName,
                    birthDate: new Date(`${formData.newPatientBirthDate}T00:00:00.000Z`),
                    gender: formData.newPatientGender as "Masculino" | "Feminino" | "Outro",
                    cpf: formData.newPatientCpf || undefined,
                }
                : undefined,
            date: dateTimeUtc.toISOString(),
            type: formData.type as ConsultationType,
        });
    };

    const isLoading = createMutation.isPending;

    return {
        formData,
        setFormData,
        selectedPatient,
        isLoading,
        handleSelectPatient,
        handleClearPatient,
        handleSubmit,
    };
}
