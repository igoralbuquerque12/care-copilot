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

export function ConsultationHeader({ selectedDate, onDateChange }: ConsultationHeaderProps) {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <CalendarDays className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Consultas</h1>
                    <p className="text-sm text-muted-foreground">Gerencie seus agendamentos</p>
                </div>
            </div>

            <div className="flex items-end gap-3">
                <div>
                    <Label htmlFor="filter-date" className="mb-1 block text-xs text-muted-foreground">
                        Filtrar por data
                    </Label>
                    <Input
                        id="filter-date"
                        type="date"
                        value={selectedDate}
                        onChange={(e) => onDateChange(e.target.value)}
                        className="w-44"
                    />
                </div>
                <Button asChild>
                    <Link href="/consultas/agendar">
                        <Plus className="mr-2 h-4 w-4" />
                        Nova Consulta
                    </Link>
                </Button>
            </div>
        </div>
    );
}
