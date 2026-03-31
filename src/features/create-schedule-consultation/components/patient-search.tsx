"use client";

import { useState, useEffect } from "react";
import { Search, X, UserCheck } from "lucide-react";
import { Input } from "~/components/ui/input";
import { api } from "~/trpc/react";
import type { PatientOption } from "~/features/create-schedule-consultation/types/schedule-consultation.types";

type PatientSearchProps = {
    selectedPatient: PatientOption | null;
    onSelect: (patient: PatientOption) => void;
    onClear: () => void;
};

export function PatientSearch({ selectedPatient, onSelect, onClear }: PatientSearchProps) {
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    // Debounce input
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query), 300);
        return () => clearTimeout(timer);
    }, [query]);

    const { data: rawResults = [], isLoading } = api.scheduleConsultation.searchPatients.useQuery(
        { query: debouncedQuery },
        { enabled: debouncedQuery.length >= 2 },
    );

    // Map to PatientOption — cpf exists after prisma generate, IDE may show stale types
    const results: PatientOption[] = rawResults.map((p) => ({
        id: p.id,
        name: p.name,
        cpf: (p as unknown as { cpf?: string | null }).cpf,
    }));

    const handleSelect = (patient: PatientOption) => {
        onSelect(patient);
        setQuery("");
        setDebouncedQuery("");
        setIsOpen(false);
    };

    if (selectedPatient) {
        return (
            <div className="flex items-center gap-3 rounded-lg border border-primary/40 bg-primary/5 p-3">
                <UserCheck className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{selectedPatient.name}</p>
                    {selectedPatient.cpf && (
                        <p className="text-xs text-muted-foreground">CPF: {selectedPatient.cpf}</p>
                    )}
                </div>
                <button
                    type="button"
                    onClick={onClear}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="Remover paciente selecionado"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        );
    }

    return (
        <div className="relative">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                    placeholder="Buscar paciente por nome ou CPF..."
                    className="pl-9"
                />
            </div>

            {isOpen && debouncedQuery.length >= 2 && (
                <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover shadow-lg overflow-hidden">
                    {isLoading ? (
                        <div className="p-3 text-sm text-muted-foreground text-center">Buscando...</div>
                    ) : results.length === 0 ? (
                        <div className="p-3 text-sm text-muted-foreground text-center">
                            Nenhum paciente encontrado
                        </div>
                    ) : (
                        <ul>
                            {results.map((patient) => (
                                <li key={patient.id}>
                                    <button
                                        type="button"
                                        className="w-full text-left px-4 py-3 hover:bg-accent transition-colors border-b last:border-b-0"
                                        onMouseDown={() => handleSelect(patient)}
                                    >
                                        <p className="text-sm font-medium">{patient.name}</p>
                                        {patient.cpf && (
                                            <p className="text-xs text-muted-foreground">CPF: {patient.cpf}</p>
                                        )}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
