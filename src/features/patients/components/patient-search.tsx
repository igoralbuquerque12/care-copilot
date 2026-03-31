"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, User } from "lucide-react";
import { api } from "~/trpc/react";

type PatientSearchProps = {
  onSelect: (id: string) => void;
  onClear: () => void;
  selectedPatientId: string | null;
};

export function PatientSearch({ onSelect, onClear, selectedPatientId }: PatientSearchProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const searchQuery = api.patient.search.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.length >= 1 }
  );

  const results = searchQuery.data ?? [];

  const handleSelect = (id: string, name: string) => {
    setQuery(name);
    setIsOpen(false);
    onSelect(id);
  };

  const handleClear = () => {
    setQuery("");
    setDebouncedQuery("");
    setIsOpen(false);
    onClear();
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar paciente por nome ou CPF..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (query.length >= 1) setIsOpen(true);
          }}
          className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        />
        {(query || selectedPatientId) && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && debouncedQuery.length >= 1 && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-border bg-card shadow-lg overflow-hidden">
          {searchQuery.isLoading ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Buscando...
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              Nenhum paciente encontrado.
            </div>
          ) : (
            <ul className="max-h-60 overflow-y-auto">
              {results.map((patient) => (
                <li key={patient.id}>
                  <button
                    onClick={() => handleSelect(patient.id, patient.name)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {patient.name}
                      </p>
                      {patient.cpf && (
                        <p className="text-xs text-muted-foreground">
                          CPF: {patient.cpf}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {patient.gender}
                    </span>
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
