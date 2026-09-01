"use client";

import { Loader2, CalendarPlus } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";

import { useScheduleConsultationForm } from "~/features/create-schedule-consultation/hooks/use-schedule-consultation-form";
import { PatientSearch } from "~/features/create-schedule-consultation/components/patient-search";
import { NewPatientFields } from "~/features/create-schedule-consultation/components/new-patient-fields";
import { DailyAppointmentsPanel } from "~/features/create-schedule-consultation/components/daily-appointments-panel";
import type { ConsultationType } from "~/features/create-schedule-consultation/types/schedule-consultation.types";

export function ScheduleConsultationForm() {
  const {
    formData,
    setFormData,
    selectedPatient,
    isLoading,
    handleSelectPatient,
    handleClearPatient,
    handleSubmit,
  } = useScheduleConsultationForm();

  const isNewPatient = !formData.patientId;

  return (
    <main className="bg-muted/20 w-full p-4 md:p-6 lg:p-8">
      {/* Page header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-xl">
          <CalendarPlus className="text-primary h-5 w-5" />
        </div>
        <div>
          <h1 className="text-foreground text-2xl font-bold">
            Agendar Consulta
          </h1>
          <p className="text-muted-foreground text-sm">
            Busque um paciente existente ou cadastre um novo e defina o horário
            da consulta
          </p>
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
        {/* ── Left column: form ── */}
        <div className="flex-1 space-y-6">
          {/* Section 1 – Patient */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Paciente</CardTitle>
              <CardDescription>
                Pesquise por nome ou CPF. Se não encontrar, preencha os dados
                abaixo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <PatientSearch
                selectedPatient={selectedPatient}
                onSelect={handleSelectPatient}
                onClear={handleClearPatient}
              />

              {isNewPatient && (
                <>
                  <Separator className="my-2" />
                  <NewPatientFields
                    formData={formData}
                    setFormData={setFormData}
                  />
                </>
              )}
            </CardContent>
          </Card>

          {/* Section 2 – Consultation details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detalhes da Consulta</CardTitle>
              <CardDescription>
                Horário exibido conforme o fuso do sistema.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="date" className="mb-1.5 block text-sm">
                    Data <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, date: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="time" className="mb-1.5 block text-sm">
                    Horário (UTC) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, time: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="type" className="mb-1.5 block text-sm">
                  Tipo de Consulta
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) =>
                    setFormData((p) => ({ ...p, type: v as ConsultationType }))
                  }
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIRST_VISIT">
                      Primeira Consulta
                    </SelectItem>
                    <SelectItem value="FOLLOW_UP">Retorno</SelectItem>
                    <SelectItem value="ROUTINE">Rotina</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Agendando...
                    </>
                  ) : (
                    <>
                      <CalendarPlus className="mr-2 h-4 w-4" />
                      Confirmar Agendamento
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right column: daily appointments ── */}
        <div className="w-full">
          <Card className="xl:sticky xl:top-4">
            <CardHeader>
              <CardTitle className="text-base">Agenda do Dia</CardTitle>
              <CardDescription>
                Selecione uma data para ver os horários ocupados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DailyAppointmentsPanel date={formData.date || undefined} />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
