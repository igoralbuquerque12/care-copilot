"use client";

import { useState } from "react";
import { Pencil, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import { CONSULTATION_TYPE_LABELS, type ConsultationItem, type ConsultationType } from "~/features/list-schedule-consultation/types/consultation.types";

type MutationLike<TInput> = {
    mutate: (input: TInput, options?: { onSuccess?: () => void }) => void;
    isPending: boolean;
};

type ConsultationDetailModalProps = {
    consultation: ConsultationItem; // Traduzido de 'consulta'
    open: boolean;
    onClose: () => void;
    updateMutation: MutationLike<{ id: string; date?: string; type?: ConsultationType }>;
};

function toDatetimeLocal(date: Date) {
    return new Date(date).toISOString().slice(0, 16);
}

export function ConsultationDetailModal({ consultation, open, onClose, updateMutation }: ConsultationDetailModalProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editDate, setEditDate] = useState(toDatetimeLocal(consultation.date));
    const [editType, setEditType] = useState<ConsultationType>(consultation.type);

    const handleSave = () => {
        updateMutation.mutate(
            {
                id: consultation.id,
                date: new Date(editDate).toISOString(),
                type: editType,
            },
            {
                onSuccess: () => {
                    setIsEditing(false);
                    onClose();
                },
            },
        );
    };

    const handleClose = () => {
        setIsEditing(false);
        setEditDate(toDatetimeLocal(consultation.date));
        setEditType(consultation.type);
        onClose();
    };

    const formattedDate = new Date(consultation.date).toLocaleString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC",
    });

    return (
        <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between gap-2">
                        <span>Detalhes da Consulta</span>
                        {!isEditing && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setIsEditing(true)}
                            >
                                <Pencil className="mr-2 h-3.5 w-3.5" />
                                Habilitar Edição
                            </Button>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Paciente</p>
                        <p className="font-semibold text-foreground">{consultation.patient.name}</p>
                        {consultation.patient.cpf && (
                            <p className="text-sm text-muted-foreground">CPF: {consultation.patient.cpf}</p>
                        )}
                    </div>

                    <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Data e Hora</p>
                        {isEditing ? (
                            <div>
                                <Label htmlFor="edit-date" className="sr-only">Data e hora</Label>
                                <Input
                                    id="edit-date"
                                    type="datetime-local"
                                    value={editDate}
                                    onChange={(e) => setEditDate(e.target.value)}
                                />
                            </div>
                        ) : (
                            <p className="capitalize text-sm font-medium">{formattedDate}</p>
                        )}
                    </div>

                    <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Tipo</p>
                        {isEditing ? (
                            <Select value={editType} onValueChange={(v) => setEditType(v as ConsultationType)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="FIRST_VISIT">Primeira Consulta</SelectItem>
                                    <SelectItem value="FOLLOW_UP">Retorno</SelectItem>
                                    <SelectItem value="ROUTINE">Rotina</SelectItem>
                                </SelectContent>
                            </Select>
                        ) : (
                            <Badge variant="outline">
                                {CONSULTATION_TYPE_LABELS[consultation.type] ?? consultation.type}
                            </Badge>
                        )}
                    </div>

                    {consultation.anamnesis && (
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Anamnese</p>
                            <Badge variant="secondary">Anamnese registrada</Badge>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={handleClose}>
                        Cancelar
                    </Button>
                    {isEditing && (
                        <Button onClick={handleSave} disabled={updateMutation.isPending}>
                            {updateMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Salvar
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}