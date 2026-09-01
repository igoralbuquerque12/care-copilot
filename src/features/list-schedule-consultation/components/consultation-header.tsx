"use client";

import Link from "next/link";
import { CalendarDays, Plus } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

type ConsultationHeaderProps = {
  selectedDate: string;
  onDateChange: (date: string) => void;
};

export function ConsultationHeader({
  selectedDate,
  onDateChange,
}: ConsultationHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
          <CalendarDays className="text-primary h-5 w-5" />
        </div>
        <div>
          <h2
            id="consultations-title"
            className="text-2xl font-bold tracking-tight"
          >
            Consultas
          </h2>
          <p className="text-muted-foreground text-sm">
            Gerencie seus agendamentos
          </p>
        </div>
      </div>

      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-end">
        <div className="w-full sm:w-auto">
          <Label
            htmlFor="filter-date"
            className="text-muted-foreground mb-1 block text-xs"
          >
            Filtrar por data
          </Label>
          <Input
            id="filter-date"
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full sm:w-44"
          />
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/consultas/agendar">
            <Plus className="mr-2 h-4 w-4" />
            Nova Consulta
          </Link>
        </Button>
      </div>
    </div>
  );
}
