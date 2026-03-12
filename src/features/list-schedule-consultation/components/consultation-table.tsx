"use client";

import { useState } from "react";
import { Eye, Trash2, ArrowRight } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { ConfirmDialog } from "~/components/dialogs/confirm-dialog";
import {
  CONSULTATION_TYPE_LABELS,
  type ConsultationItem,
  type ConsultationType,
} from "~/features/list-schedule-consultation/types/consultation.types";
import { ConsultationDetailModal } from "~/features/list-schedule-consultation/components/consultation-detail-modal";

type MutationLike<TInput> = {
  mutate: (input: TInput, options?: { onSuccess?: () => void }) => void;
  isPending: boolean;
};

type ConsultationTableProps = {
  items: ConsultationItem[];
  isLoading: boolean;
  updateMutation: MutationLike<{
    id: string;
    date?: string;
    type?: ConsultationType;
  }>;
  deleteMutation: MutationLike<{ id: string }>;
};

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

export function ConsultationTable({
  items,
  isLoading,
  updateMutation,
  deleteMutation,
}: ConsultationTableProps) {
  const [selectedConsultation, setSelectedConsultation] =
    useState<ConsultationItem | null>(null);
  const [consultationToDelete, setConsultationToDelete] =
    useState<ConsultationItem | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-center">
        <p className="text-sm font-medium">
          Nenhuma consulta encontrada para este dia
        </p>
        <p className="text-xs opacity-70">
          Agende uma nova consulta para começar
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-card overflow-hidden rounded-xl border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hora</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead className="hidden sm:table-cell">CPF</TableHead>
              <TableHead className="hidden md:table-cell">Tipo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((consultation) => (
              <TableRow key={consultation.id}>
                <TableCell className="font-mono text-sm font-medium">
                  {formatTime(consultation.date)}
                </TableCell>
                <TableCell className="font-medium">
                  {consultation.patient.name}
                </TableCell>
                <TableCell className="text-muted-foreground hidden text-sm sm:table-cell">
                  {consultation.patient.cpf ?? "—"}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge variant="outline" className="text-xs">
                    {CONSULTATION_TYPE_LABELS[
                      consultation.type
                    ] ?? consultation.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button asChild size="sm" variant="default">
                      <Link
                        href={`/anamnesis?consultationId=${consultation.id}`}
                      >
                        <ArrowRight className="mr-1 h-3 w-3" />
                        Ir para Consulta
                      </Link>
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() => setSelectedConsultation(consultation)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="text-destructive hover:bg-destructive/10 h-8 w-8"
                      onClick={() => setConsultationToDelete(consultation)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedConsultation && (
        <ConsultationDetailModal
          consultation={selectedConsultation}
          open={!!selectedConsultation}
          onClose={() => setSelectedConsultation(null)}
          updateMutation={updateMutation}
        />
      )}

      <ConfirmDialog
        open={!!consultationToDelete}
        onOpenChange={(open) => !open && setConsultationToDelete(null)}
        title="Excluir Consulta"
        description={`Tem certeza que deseja excluir a consulta de ${consultationToDelete?.patient.name ?? ""}? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="destructive"
        onConfirm={() => {
          if (consultationToDelete) {
            deleteMutation.mutate(
              { id: consultationToDelete.id },
              { onSuccess: () => setConsultationToDelete(null) },
            );
          }
        }}
      />
    </>
  );
}
