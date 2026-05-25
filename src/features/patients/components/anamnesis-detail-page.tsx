"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft, Pencil, Save, Undo2, Calendar, Pill, AlertCircle,
  Stethoscope, Activity, Plus, Trash2,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { api } from "~/trpc/react";
import type { AnamnesisDetail } from "./anamnesis-detail-dialog";

type FormState = {
  chiefComplaint: string;
  currentIllnessHistory: string;
  treatmentResponse: string;
  symptomEvolution: string;
  newEvents: string;
  nyhaClass: "I" | "II" | "III" | "IV";
  hasPalpitations: boolean;
  hasSyncope: boolean;
  hasEdema: boolean;
  hasChestPain: boolean;
  diagnosticHypothesis: string;
  conduct: string;
  nextRecallDate: string;
  physicalExam: {
    weight: string; height: string; bpSystolic: string; bpDiastolic: string;
    heartRate: string; oxygenSaturation: string; heartAuscultation: string;
    lungAuscultation: string; peripheralPulses: string; edemaGrade: string;
  };
  medications: { name: string; dosage: string; frequency: string }[];
};

type Props = {
  anamnesis: AnamnesisDetail;
  patientId: string;
  onBack: () => void;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const toForm = (a: AnamnesisDetail): FormState => ({
  chiefComplaint: a.chiefComplaint,
  currentIllnessHistory: a.currentIllnessHistory,
  treatmentResponse: a.treatmentResponse ?? "",
  symptomEvolution: a.symptomEvolution ?? "",
  newEvents: a.newEvents ?? "",
  nyhaClass: (a.nyhaClass as "I" | "II" | "III" | "IV") ?? "I",
  hasPalpitations: a.hasPalpitations,
  hasSyncope: a.hasSyncope,
  hasEdema: a.hasEdema,
  hasChestPain: a.hasChestPain,
  diagnosticHypothesis: a.diagnosticHypothesis ?? "",
  conduct: a.conduct ?? "",
  nextRecallDate: a.nextRecallDate
    ? new Date(a.nextRecallDate).toISOString().split("T")[0]!
    : "",
  physicalExam: {
    weight: a.physicalExam?.weight?.toString() ?? "",
    height: a.physicalExam?.height?.toString() ?? "",
    bpSystolic: a.physicalExam?.bpSystolic?.toString() ?? "",
    bpDiastolic: a.physicalExam?.bpDiastolic?.toString() ?? "",
    heartRate: a.physicalExam?.heartRate?.toString() ?? "",
    oxygenSaturation: a.physicalExam?.oxygenSaturation?.toString() ?? "",
    heartAuscultation: a.physicalExam?.heartAuscultation ?? "",
    lungAuscultation: a.physicalExam?.lungAuscultation ?? "",
    peripheralPulses: a.physicalExam?.peripheralPulses ?? "",
    edemaGrade: a.physicalExam?.edemaGrade ?? "",
  },
  medications: a.medications.map((m) => ({ ...m })),
});

const num = (v: string) => (v === "" ? undefined : Number(v));

const nyhaColors: Record<string, string> = {
  I: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  II: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  III: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  IV: "bg-red-500/10 text-red-700 dark:text-red-400",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
      {children}
    </h3>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-muted-foreground mb-1">{label}</p>
      {children}
    </div>
  );
}

function ReadText({ value, empty = "—" }: { value?: string | null; empty?: string }) {
  return (
    <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">
      {value || empty}
    </p>
  );
}

function EditTextarea({
  value, onChange, rows = 3,
}: {
  value: string; onChange: (v: string) => void; rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
    />
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AnamnesisDetailPage({ anamnesis, patientId, onBack }: Props) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState>(() => toForm(anamnesis));

  const utils = api.useUtils();

  const updateMutation = api.anamnesis.update.useMutation({
    onSuccess: async () => {
      toast.success("Anamnese atualizada");
      await utils.patient.getFullProfile.invalidate({ patientId });
      setEditing(false);
    },
    onError: (e) => toast.error(e.message ?? "Erro ao salvar"),
  });

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const setExam = (key: keyof FormState["physicalExam"], value: string) =>
    setForm((prev) => ({ ...prev, physicalExam: { ...prev.physicalExam, [key]: value } }));

  const addMed = () =>
    setForm((prev) => ({
      ...prev,
      medications: [...prev.medications, { name: "", dosage: "", frequency: "" }],
    }));

  const removeMed = (i: number) =>
    setForm((prev) => ({
      ...prev,
      medications: prev.medications.filter((_, idx) => idx !== i),
    }));

  const setMed = (i: number, key: "name" | "dosage" | "frequency", value: string) =>
    setForm((prev) => ({
      ...prev,
      medications: prev.medications.map((m, idx) =>
        idx === i ? { ...m, [key]: value } : m,
      ),
    }));

  const cancel = () => { setForm(toForm(anamnesis)); setEditing(false); };

  const save = () => {
    updateMutation.mutate({
      id: anamnesis.id,
      chiefComplaint: form.chiefComplaint || undefined,
      currentIllnessHistory: form.currentIllnessHistory || undefined,
      treatmentResponse: form.treatmentResponse || null,
      symptomEvolution: form.symptomEvolution || null,
      newEvents: form.newEvents || null,
      nyhaClass: form.nyhaClass,
      hasPalpitations: form.hasPalpitations,
      hasSyncope: form.hasSyncope,
      hasEdema: form.hasEdema,
      hasChestPain: form.hasChestPain,
      diagnosticHypothesis: form.diagnosticHypothesis || null,
      conduct: form.conduct || null,
      nextRecallDate: form.nextRecallDate ? new Date(form.nextRecallDate) : null,
      physicalExam: {
        weight: num(form.physicalExam.weight),
        height: num(form.physicalExam.height),
        bpSystolic: num(form.physicalExam.bpSystolic),
        bpDiastolic: num(form.physicalExam.bpDiastolic),
        heartRate: num(form.physicalExam.heartRate),
        oxygenSaturation: num(form.physicalExam.oxygenSaturation),
        heartAuscultation: form.physicalExam.heartAuscultation || null,
        lungAuscultation: form.physicalExam.lungAuscultation || null,
        peripheralPulses: form.physicalExam.peripheralPulses || null,
        edemaGrade: form.physicalExam.edemaGrade || null,
      },
      medications: form.medications.filter((m) => m.name.trim()),
    });
  };

  const date = new Date(anamnesis.date);
  const symptoms = [
    form.hasPalpitations && "Palpitações",
    form.hasSyncope && "Síncope",
    form.hasEdema && "Edema",
    form.hasChestPain && "Dor torácica",
  ].filter(Boolean) as string[];

  return (
    <div className="flex flex-col h-full">
      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-6 py-4 border-b border-border bg-background shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="sm" onClick={onBack} className="shrink-0 gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>

          <div className="w-px h-5 bg-border shrink-0" />

          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Stethoscope className="h-4 w-4 text-primary" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-sm font-semibold text-foreground truncate">
                {anamnesis.chiefComplaint}
              </h1>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0 ${nyhaColors[form.nyhaClass] ?? ""}`}>
                NYHA {form.nyhaClass}
              </span>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {editing ? (
            <>
              <Button variant="outline" size="sm" onClick={cancel} disabled={updateMutation.isPending}>
                <Undo2 className="h-3.5 w-3.5 mr-1.5" />
                Cancelar
              </Button>
              <Button size="sm" onClick={save} disabled={updateMutation.isPending}>
                <Save className="h-3.5 w-3.5 mr-1.5" />
                {updateMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Editar
            </Button>
          )}
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto bg-muted/20">
        <div className="max-w-5xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left (2/3) ── */}
          <div className="lg:col-span-2 space-y-5">

            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <SectionTitle>Consulta</SectionTitle>
              <Field label="Queixa Principal">
                {editing
                  ? <EditTextarea value={form.chiefComplaint} onChange={(v) => set("chiefComplaint", v)} rows={2} />
                  : <ReadText value={form.chiefComplaint} />}
              </Field>
              <Field label="História da Doença Atual">
                {editing
                  ? <EditTextarea value={form.currentIllnessHistory} onChange={(v) => set("currentIllnessHistory", v)} rows={4} />
                  : <ReadText value={form.currentIllnessHistory} />}
              </Field>
              {(editing || form.treatmentResponse) && (
                <Field label="Resposta ao Tratamento">
                  {editing
                    ? <EditTextarea value={form.treatmentResponse} onChange={(v) => set("treatmentResponse", v)} />
                    : <ReadText value={form.treatmentResponse} />}
                </Field>
              )}
              {(editing || form.symptomEvolution) && (
                <Field label="Evolução dos Sintomas">
                  {editing
                    ? <EditTextarea value={form.symptomEvolution} onChange={(v) => set("symptomEvolution", v)} />
                    : <ReadText value={form.symptomEvolution} />}
                </Field>
              )}
              {(editing || form.newEvents) && (
                <Field label="Novos Eventos">
                  {editing
                    ? <EditTextarea value={form.newEvents} onChange={(v) => set("newEvents", v)} />
                    : <ReadText value={form.newEvents} />}
                </Field>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <SectionTitle>Sintomas</SectionTitle>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {(
                  [
                    ["hasPalpitations", "Palpitações"],
                    ["hasSyncope", "Síncope"],
                    ["hasEdema", "Edema"],
                    ["hasChestPain", "Dor Torácica"],
                  ] as const
                ).map(([key, label]) => (
                  <label
                    key={key}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                      form[key]
                        ? "border-primary/40 bg-primary/5 text-foreground"
                        : "border-border bg-muted/20 text-muted-foreground"
                    } ${!editing ? "pointer-events-none cursor-default" : "cursor-pointer"}`}
                  >
                    <input
                      type="checkbox"
                      checked={form[key]}
                      onChange={(e) => set(key, e.target.checked)}
                      disabled={!editing}
                      className="accent-primary"
                    />
                    {label}
                  </label>
                ))}
              </div>
              <Field label="Classe NYHA">
                {editing ? (
                  <div className="flex gap-2">
                    {(["I", "II", "III", "IV"] as const).map((cls) => (
                      <button
                        key={cls}
                        type="button"
                        onClick={() => set("nyhaClass", cls)}
                        className={`rounded-lg border px-4 py-1.5 text-sm font-medium transition-colors ${
                          form.nyhaClass === cls
                            ? (nyhaColors[cls] ?? "") + " border-current"
                            : "border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {cls}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${nyhaColors[form.nyhaClass] ?? ""}`}>
                      Classe {form.nyhaClass}
                    </span>
                    {symptoms.length > 0 && (
                      <span className="text-xs text-muted-foreground">· {symptoms.join(", ")}</span>
                    )}
                  </div>
                )}
              </Field>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <SectionTitle>
                <span className="flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-primary" />
                  Hipótese e Conduta
                </span>
              </SectionTitle>
              <Field label="Hipótese Diagnóstica">
                {editing
                  ? <EditTextarea value={form.diagnosticHypothesis} onChange={(v) => set("diagnosticHypothesis", v)} />
                  : <ReadText value={form.diagnosticHypothesis} />}
              </Field>
              <Field label="Conduta">
                {editing
                  ? <EditTextarea value={form.conduct} onChange={(v) => set("conduct", v)} />
                  : <ReadText value={form.conduct} />}
              </Field>
              <Field label="Próximo Retorno">
                {editing ? (
                  <Input
                    type="date"
                    value={form.nextRecallDate}
                    onChange={(e) => set("nextRecallDate", e.target.value)}
                    className="w-48"
                  />
                ) : (
                  <ReadText
                    value={
                      form.nextRecallDate
                        ? new Date(form.nextRecallDate + "T00:00:00").toLocaleDateString("pt-BR")
                        : null
                    }
                  />
                )}
              </Field>
            </div>
          </div>

          {/* ── Right (1/3) ── */}
          <div className="space-y-5">

            <div className="rounded-xl border border-border bg-card p-5">
              <SectionTitle>
                <span className="flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5" />
                  Exame Físico
                </span>
              </SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    ["bpSystolic", "PAS", "mmHg"],
                    ["bpDiastolic", "PAD", "mmHg"],
                    ["heartRate", "FC", "bpm"],
                    ["oxygenSaturation", "SpO2", "%"],
                    ["weight", "Peso", "kg"],
                    ["height", "Altura", "cm"],
                  ] as const
                ).map(([key, label, unit]) => (
                  <div key={key} className="rounded-lg bg-muted/40 p-2.5">
                    <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
                    {editing ? (
                      <Input
                        type="number"
                        value={form.physicalExam[key]}
                        onChange={(e) => setExam(key, e.target.value)}
                        placeholder="—"
                        className="h-7 text-sm px-2"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-foreground">
                        {form.physicalExam[key] ? `${form.physicalExam[key]} ${unit}` : "—"}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-3 space-y-2">
                {(
                  [
                    ["heartAuscultation", "Ausculta Cardíaca"],
                    ["lungAuscultation", "Ausculta Pulmonar"],
                    ["peripheralPulses", "Pulsos Periféricos"],
                    ["edemaGrade", "Grau do Edema"],
                  ] as const
                ).map(([key, label]) =>
                  (editing || form.physicalExam[key]) ? (
                    <Field key={key} label={label}>
                      {editing ? (
                        <Input
                          value={form.physicalExam[key]}
                          onChange={(e) => setExam(key, e.target.value)}
                          placeholder="—"
                          className="h-8 text-sm"
                        />
                      ) : (
                        <ReadText value={form.physicalExam[key]} />
                      )}
                    </Field>
                  ) : null,
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <SectionTitle>
                  <span className="flex items-center gap-1.5">
                    <Pill className="h-3.5 w-3.5" />
                    Medicamentos
                  </span>
                </SectionTitle>
                {editing && (
                  <button
                    type="button"
                    onClick={addMed}
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Adicionar
                  </button>
                )}
              </div>

              {form.medications.length === 0 && !editing && (
                <p className="text-sm text-muted-foreground">Nenhum medicamento registrado.</p>
              )}

              <div className="space-y-2">
                {form.medications.map((med, i) =>
                  editing ? (
                    <div key={i} className="rounded-lg border border-border bg-muted/20 p-2.5 space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <Input
                          value={med.name}
                          onChange={(e) => setMed(i, "name", e.target.value)}
                          placeholder="Medicamento"
                          className="h-7 text-sm flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => removeMed(i)}
                          className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <Input
                          value={med.dosage}
                          onChange={(e) => setMed(i, "dosage", e.target.value)}
                          placeholder="Dose"
                          className="h-7 text-sm"
                        />
                        <Input
                          value={med.frequency}
                          onChange={(e) => setMed(i, "frequency", e.target.value)}
                          placeholder="Frequência"
                          className="h-7 text-sm"
                        />
                      </div>
                    </div>
                  ) : (
                    <div key={i} className="flex items-start gap-2 text-sm py-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <div>
                        <span className="font-medium text-foreground">{med.name}</span>
                        {med.dosage && <span className="text-muted-foreground"> · {med.dosage}</span>}
                        {med.frequency && <span className="text-muted-foreground/70"> ({med.frequency})</span>}
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
