"use client";

import { Search, User, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api } from "~/trpc/react";

type Props = { onSelect: (id: string) => void; onClear: () => void; selectedPatientId: string | null };

export function PatientSearch({ onSelect, onClear, selectedPatientId }: Props) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const timer = setTimeout(() => setDebounced(query.trim()), 300); return () => clearTimeout(timer); }, [query]);
  useEffect(() => { const close = (event: MouseEvent) => { if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false); }; document.addEventListener("mousedown", close); return () => document.removeEventListener("mousedown", close); }, []);
  const results = api.patient.search.useQuery({ query: debounced }, { enabled: debounced.length > 0 });

  return <div ref={ref} className="relative w-full max-w-2xl">
    <Search className="absolute left-3 top-3.5 z-10 h-4 w-4 text-muted-foreground" />
    <input value={query} onChange={(event) => { setQuery(event.target.value); setOpen(true); }} onFocus={() => setOpen(Boolean(query))} placeholder="Buscar paciente por nome ou CPF..." className="w-full rounded-xl border bg-card py-3 pl-10 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary/20" aria-label="Buscar paciente" />
    {(query || selectedPatientId) && <button type="button" aria-label="Limpar busca" className="absolute right-3 top-3.5" onClick={() => { setQuery(""); setOpen(false); onClear(); }}><X className="h-4 w-4 text-muted-foreground" /></button>}
    {open && debounced && <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border bg-card shadow-xl">
      {results.isLoading ? <p className="p-4 text-sm text-muted-foreground">Buscando...</p> : results.data?.length ? results.data.map((patient) => <button key={patient.id} type="button" className="flex w-full items-center gap-3 border-b p-3 text-left last:border-0 hover:bg-muted/40" onClick={() => { setQuery(patient.name); setOpen(false); onSelect(patient.id); }}><span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10"><User className="h-4 w-4 text-primary" /></span><span className="min-w-0"><span className="block truncate text-sm font-medium">{patient.name}</span><span className="text-xs text-muted-foreground">{patient.cpf ?? "CPF não informado"}</span></span></button>) : <p className="p-4 text-sm text-muted-foreground">Nenhum paciente encontrado.</p>}
    </div>}
  </div>;
}
