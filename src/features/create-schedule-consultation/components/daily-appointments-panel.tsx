"use client";

import { Clock, Calendar, CalendarOff } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { useDailyAppointments } from "~/features/create-schedule-consultation/hooks/use-daily-appointments";
import {
  CONSULTATION_TYPE_LABELS,
  type ConsultationType,
} from "~/features/create-schedule-consultation/types/schedule-consultation.types";

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
        <Calendar className="text-primary h-4 w-4" />
        <h3 className="text-foreground text-sm font-semibold">
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
        <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-8 text-center">
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
        <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-8 text-center">
          <Clock className="h-8 w-8 opacity-40" />
          <p className="text-sm">Nenhum agendamento para este dia</p>
          <p className="text-xs opacity-70">
            Dia disponível para novos horários
          </p>
        </div>
      )}

      {date && !isLoading && appointments.length > 0 && (
        <ul className="max-h-96 space-y-2 overflow-y-auto overscroll-contain pr-1 xl:max-h-[calc(100dvh-19rem)]">
          {appointments.map((appt) => {
            const time = new Date(appt.date).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "UTC",
            });
            return (
              <li
                key={appt.id}
                className="bg-card flex items-start gap-3 rounded-lg border p-3 shadow-sm"
              >
                <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-md">
                  <Clock className="text-primary h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-foreground text-sm font-semibold">
                      {time}
                    </p>
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {CONSULTATION_TYPE_LABELS[
                        appt.type as ConsultationType
                      ] ?? appt.type}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground truncate text-sm">
                    {appt.patient.name}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
