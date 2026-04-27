"use client";

import { useState } from "react";
import { Loader2, UserPlus, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { PatientSearch } from "~/features/patients/components/patient-search";
import { api } from "~/trpc/react";

type Props = {
  consultationId?: string;
  onReady: (sessionId: string) => void;
};

type Mode = "select" | "create";

export function PatientGatekeeperStep({ consultationId, onReady }: Props) {
  const [mode, setMode] = useState<Mode>("select");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [newPatient, setNewPatient] = useState({
    name: "",
    birthDate: "",
    gender: "" as "Masculino" | "Feminino" | "Outro" | "",
    cpf: "",
  });

  const utils = api.useUtils();

  const createPatient = api.patient.create.useMutation();
  const startSession = api.audioConsultation.start.useMutation();

  const isStarting = createPatient.isPending || startSession.isPending;

  const start = async (patientId: string) => {
    try {
      const session = await startSession.mutateAsync({ patientId, consultationId });
      await utils.credits.getBalance.invalidate();
      onReady(session.id);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao iniciar sessao";
      toast.error(message);
    }
  };

  const handleStartWithExisting = async () => {
    if (!selectedPatientId) {
      toast.error("Selecione um paciente para continuar");
      return;
    }
    await start(selectedPatientId);
  };

  const handleStartWithNew = async () => {
    if (!newPatient.name || !newPatient.birthDate || !newPatient.gender) {
      toast.error("Preencha nome, data de nascimento e genero");
      return;
    }
    try {
      const created = await createPatient.mutateAsync({
        name: newPatient.name,
        birthDate: new Date(newPatient.birthDate),
        gender: newPatient.gender,
        cpf: newPatient.cpf || undefined,
      });
      await start(created.id);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao cadastrar paciente";
      toast.error(message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Antes de comecar</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">
          A gravacao so pode comecar com um paciente associado. Selecione um
          existente ou cadastre um novo agora.
        </p>

        <div className="flex gap-2">
          <Button
            type="button"
            variant={mode === "select" ? "default" : "outline"}
            onClick={() => setMode("select")}
          >
            Paciente existente
          </Button>
          <Button
            type="button"
            variant={mode === "create" ? "default" : "outline"}
            onClick={() => setMode("create")}
          >
            <UserPlus className="mr-2 h-4 w-4" /> Novo paciente
          </Button>
        </div>

        {mode === "select" ? (
          <div className="space-y-4">
            <PatientSearch
              onSelect={(id) => setSelectedPatientId(id)}
              onClear={() => setSelectedPatientId(null)}
              selectedPatientId={selectedPatientId}
            />
            <Button
              onClick={handleStartWithExisting}
              disabled={!selectedPatientId || isStarting}
            >
              {isStarting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="mr-2 h-4 w-4" />
              )}
              Iniciar consulta
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label className="mb-1.5 block text-sm">Nome completo</Label>
              <Input
                value={newPatient.name}
                onChange={(e) =>
                  setNewPatient((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label className="mb-1.5 block text-sm">Nascimento</Label>
                <Input
                  type="date"
                  value={newPatient.birthDate}
                  onChange={(e) =>
                    setNewPatient((prev) => ({
                      ...prev,
                      birthDate: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label className="mb-1.5 block text-sm">Genero</Label>
                <Select
                  value={newPatient.gender}
                  onValueChange={(v) =>
                    setNewPatient((prev) => ({
                      ...prev,
                      gender: v as "Masculino" | "Feminino" | "Outro",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Masculino">Masculino</SelectItem>
                    <SelectItem value="Feminino">Feminino</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">
                CPF <span className="text-muted-foreground text-xs">(opcional)</span>
              </Label>
              <Input
                value={newPatient.cpf}
                onChange={(e) =>
                  setNewPatient((prev) => ({ ...prev, cpf: e.target.value }))
                }
              />
            </div>
            <Button onClick={handleStartWithNew} disabled={isStarting}>
              {isStarting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="mr-2 h-4 w-4" />
              )}
              Cadastrar e iniciar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
