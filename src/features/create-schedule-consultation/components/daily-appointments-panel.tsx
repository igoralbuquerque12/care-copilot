"use client";

import { Clock, Calendar, CalendarOff } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { useDailyAppointments } from "~/features/create-schedule-consultation/hooks/use-daily-appointments";
import { CONSULTATION_TYPE_LABELS, type ConsultationType } from "~/features/create-schedule-consultation/types/schedule-consultation.types";

type DailyAppointmentsPanelProps = {
    date: string | undefined;
};

export function DailyAppointmentsPanel({ date }: DailyAppointmentsPanelProps) {
    const { appointments, isLoading } = useDailyAppointments(date);

    const formattedDate = date
        ? new Date(`${date}T12:00:00Z`).toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
            timeZone: "UTC",
        })
        : null;

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                    {formattedDate ? (
                        <span className="capitalize">{formattedDate}</span>
                    ) : (
                        "Agendamentos do Dia"
                    )}
                </h3>
                {!isLoading && appointments.length > 0 && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                        {appointments.length} consulta{appointments.length !== 1 ? "s" : ""}
                    </Badge>
                )}
            </div>

            {!date && (
                <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-8 text-center text-muted-foreground">
                    <CalendarOff className="h-8 w-8 opacity-40" />
                    <p className="text-sm">Selecione uma data para ver os agendamentos</p>
                </div>
            )}

            {date && isLoading && (
                <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-full rounded-lg" />
                    ))}
                </div>
            )}

            {date && !isLoading && appointments.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-8 text-center text-muted-foreground">
                    <Clock className="h-8 w-8 opacity-40" />
                    <p className="text-sm">Nenhum agendamento para este dia</p>
                    <p className="text-xs opacity-70">Dia disponível para novos horários</p>
                </div>
            )}

            {date && !isLoading && appointments.length > 0 && (
                <ul className="space-y-2">
                    {appointments.map((appt) => {
                        const time = new Date(appt.date).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "UTC",
                        });
                        return (
                            <li
                                key={appt.id}
                                className="flex items-start gap-3 rounded-lg border bg-card p-3 shadow-sm"
                            >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
                                    <Clock className="h-4 w-4 text-primary" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm font-semibold text-foreground">{time}</p>
                                        <Badge variant="outline" className="text-xs shrink-0">
                                            {CONSULTATION_TYPE_LABELS[appt.type as ConsultationType] ?? appt.type}
                                        </Badge>
                                    </div>
                                    <p className="truncate text-sm text-muted-foreground">{appt.patient.name}</p>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
