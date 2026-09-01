"use client";

import { ArrowRight, UserRoundSearch, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { PatientSearch } from "./patient-search";

export function PatientsPage() {
  const router = useRouter();
  const patients = api.patient.list.useQuery();
  const open = (id: string) => router.push(`/pacientes/${id}`);
  return <main className="space-y-6 p-4 md:p-8">
    <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10"><Users className="h-5 w-5 text-primary" /></span><div><h1 className="text-2xl font-bold">Pacientes</h1><p className="text-sm text-muted-foreground">Busque um paciente e abra seu histórico clínico.</p></div></div>
    <PatientSearch onSelect={open} onClear={() => undefined} selectedPatientId={null} />
    <section className="rounded-2xl border bg-card"><div className="border-b p-4"><h2 className="text-sm font-semibold">Todos os pacientes</h2></div>
      {patients.isLoading ? <p className="p-6 text-sm text-muted-foreground">Carregando...</p> : patients.data?.length ? <div className="divide-y">{patients.data.map((patient) => <button key={patient.id} type="button" onClick={() => open(patient.id)} className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/30"><span><span className="block text-sm font-medium">{patient.name}</span><span className="text-xs text-muted-foreground">{patient.cpf ?? patient.gender}</span></span><ArrowRight className="h-4 w-4 text-muted-foreground" /></button>)}</div> : <div className="p-10 text-center"><UserRoundSearch className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-2 text-sm text-muted-foreground">Nenhum paciente cadastrado.</p></div>}
    </section>
  </main>;
}
