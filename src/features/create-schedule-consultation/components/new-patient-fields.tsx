"use client";

import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import type { ScheduleConsultationFormData } from "~/features/create-schedule-consultation/types/schedule-consultation.types";

type NewPatientFieldsProps = {
    formData: ScheduleConsultationFormData;
    setFormData: React.Dispatch<React.SetStateAction<ScheduleConsultationFormData>>;
};

export function NewPatientFields({ formData, setFormData }: NewPatientFieldsProps) {
    return (
        <div className="space-y-4 rounded-lg border border-dashed border-muted-foreground/40 bg-muted/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Dados do Novo Paciente
            </p>

            <div>
                <Label htmlFor="newPatientName" className="mb-1.5 block text-sm">
                    Nome Completo <span className="text-destructive">*</span>
                </Label>
                <Input
                    id="newPatientName"
                    value={formData.newPatientName}
                    onChange={(e) => setFormData((p) => ({ ...p, newPatientName: e.target.value }))}
                    placeholder="Nome do paciente"
                />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <Label htmlFor="newPatientBirthDate" className="mb-1.5 block text-sm">
                        Data de Nascimento <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="newPatientBirthDate"
                        type="date"
                        value={formData.newPatientBirthDate}
                        onChange={(e) => setFormData((p) => ({ ...p, newPatientBirthDate: e.target.value }))}
                    />
                </div>

                <div>
                    <Label htmlFor="newPatientGender" className="mb-1.5 block text-sm">
                        Gênero <span className="text-destructive">*</span>
                    </Label>
                    <Select
                        value={formData.newPatientGender}
                        onValueChange={(v) =>
                            setFormData((p) => ({
                                ...p,
                                newPatientGender: v as "Masculino" | "Feminino" | "Outro",
                            }))
                        }
                    >
                        <SelectTrigger id="newPatientGender">
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
                <Label htmlFor="newPatientCpf" className="mb-1.5 block text-sm">
                    CPF <span className="text-muted-foreground text-xs">(opcional)</span>
                </Label>
                <Input
                    id="newPatientCpf"
                    value={formData.newPatientCpf}
                    onChange={(e) => setFormData((p) => ({ ...p, newPatientCpf: e.target.value }))}
                    placeholder="000.000.000-00"
                />
            </div>
        </div>
    );
}
