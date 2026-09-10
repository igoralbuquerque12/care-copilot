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

export function PatientSearch({
  selectedPatient,
  onSelect,
  onClear,
}: PatientSearchProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: rawResults = [], isLoading } = api.patient.search.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.length >= 2 },
  );

  const results: PatientOption[] = rawResults.map((p) => ({
    id: p.id,
    name: p.name,
    cpf: p.cpf,
  }));

  const handleSelect = (patient: PatientOption) => {
    onSelect(patient);
    setQuery("");
    setDebouncedQuery("");
    setIsOpen(false);
  };

  if (selectedPatient) {
    return (
      <div className="border-primary/40 bg-primary/5 flex items-center gap-3 rounded-lg border p-3">
        <UserCheck className="text-primary h-5 w-5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-foreground truncate text-sm font-semibold">
            {selectedPatient.name}
          </p>
          {selectedPatient.cpf && (
            <p className="text-muted-foreground text-xs">
              CPF: {selectedPatient.cpf}
            </p>
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
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
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
        <div className="bg-popover absolute z-50 mt-1 w-full overflow-hidden rounded-lg border shadow-lg">
          {isLoading ? (
            <div className="text-muted-foreground p-3 text-center text-sm">
              Buscando...
            </div>
          ) : results.length === 0 ? (
            <div className="text-muted-foreground p-3 text-center text-sm">
              Nenhum paciente encontrado
            </div>
          ) : (
            <ul>
              {results.map((patient) => (
                <li key={patient.id}>
                  <button
                    type="button"
                    className="hover:bg-accent w-full border-b px-4 py-3 text-left transition-colors last:border-b-0"
                    onMouseDown={() => handleSelect(patient)}
                  >
                    <p className="text-sm font-medium">{patient.name}</p>
                    {patient.cpf && (
                      <p className="text-muted-foreground text-xs">
                        CPF: {patient.cpf}
                      </p>
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
