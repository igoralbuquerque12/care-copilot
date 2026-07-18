# Banco de Dados — Documentação Completa

Stack: **PostgreSQL** via **Prisma 7** com schema multi-arquivo (`prisma/schema/`).

---

## Visão Geral

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              USUÁRIO / MÉDICO                            │
│                                                                          │
│   Profile ──────────────────────────────────────────────────────────┐   │
│     │                                                                │   │
│     ├── Address                                                      │   │
│     │                                                                │   │
│     ├── Patient[] ──────────────────────────────────────────────┐   │   │
│     │     ├── ClinicalProfile                                    │   │   │
│     │     ├── ScheduleConsultation[] ──────────────────────┐    │   │   │
│     │     │                           └── Anamnesis ───────┤    │   │   │
│     │     │                                 ├── PhysicalExam│   │   │   │
│     │     │                                 ├── PrescribedMedication[]│  │
│     │     │                                 └── AiDiagnosis[]         │  │
│     │     ├── Anamnesis[] (sem consulta agendada)           │    │   │   │
│     │     └── AudioConsultationSession[] ───────────────────┘    │   │   │
│     │           └── AudioBatchRecord[]                            │   │   │
│     │                                                             │   │   │
│     ├── CreditLedgerEntry[]                                       │   │   │
│     └── creditsBalance (desnormalizado)                           │   │   │
└───────────────────────────────────────────────────────────────────┘───┘   
```

---

## Schemas por Arquivo

### `users.prisma` — Identidade e Endereço

#### `Profile`

Representa o médico/usuário autenticado. O `id` é o UUID do Supabase Auth — não é autogerado pelo Prisma.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | `UUID` PK | UUID do Supabase Auth |
| `email` | `String?` unique | E-mail do usuário |
| `name` | `String` | Nome completo |
| `phone` | `String?` | Telefone |
| `photo_url` | `String?` | URL do avatar |
| `address_id` | `UUID?` unique FK | Endereço vinculado |
| `credits_balance` | `Int` default 0 | Saldo de créditos desnormalizado (espelho do ledger) |
| `created_at` | `DateTime` | Data de criação |
| `updated_at` | `DateTime` | Atualização automática |

Relações:
- `Address?` — endereço opcional
- `Patient[]` — pacientes do médico
- `Anamnesis[]` — todas as anamneses criadas
- `ScheduleConsultation[]` — consultas agendadas
- `AudioConsultationSession[]` — sessões de captura de áudio
- `CreditLedgerEntry[]` — histórico de créditos

> **Nota de design:** `credits_balance` é um campo desnormalizado que replica o saldo real do ledger. É atualizado via transação sempre que uma `CreditLedgerEntry` é inserida. Serve para consultas rápidas sem precisar agregar o ledger.

---

#### `Address`

Endereço opcional do médico. UUID gerado pelo PostgreSQL (`gen_random_uuid()`).

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | `UUID` PK | Gerado pelo banco |
| `street` | `String?` | Logradouro |
| `number` | `String?` | Número |
| `complement` | `String?` | Complemento |
| `neighborhood` | `String?` | Bairro |
| `city` | `String?` | Cidade |
| `state` | `String?` | Estado |
| `zip_code` | `String?` | CEP |
| `country` | `String?` | País |
| `created_at` / `updated_at` | `DateTime` | Timestamps |

---

### `clinical.prisma` — Domínio Clínico

#### `Patient`

Paciente vinculado a um médico (`Profile`). Não tem autenticação própria.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | `cuid()` PK | ID interno |
| `name` | `String` | Nome completo |
| `cpf` | `String?` | CPF (não único globalmente — pacientes podem ser de médicos diferentes) |
| `birthDate` | `DateTime` | Data de nascimento |
| `gender` | `String` | Sexo (`Masculino`, `Feminino`, `Outro`) |
| `profileId` | `UUID` FK | Médico responsável |
| `createdAt` | `DateTime` | Data de cadastro |

Relações:
- `ClinicalProfile?` — perfil clínico 1:1
- `Anamnesis[]` — histórico de anamneses
- `ScheduleConsultation[]` — consultas agendadas
- `AiDiagnosis[]` — diagnósticos gerados por IA
- `AudioConsultationSession[]` — sessões de áudio

---

#### `ClinicalProfile`

Dados estáticos de saúde do paciente (comorbidades, histórico familiar, hábitos). Relação 1:1 com `Patient`.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | `cuid()` PK | |
| `patientId` | `String` unique FK | Paciente |
| `hasHypertension` | `Boolean` | Hipertensão |
| `hasDiabetes` | `Boolean` | Diabetes |
| `diabetesDuration` | `Int?` | Duração do diabetes (anos) |
| `hasDyslipidemia` | `Boolean` | Dislipidemia |
| `hasPriorInfarction` | `Boolean` | IAM prévio |
| `priorSurgeries` | `Text?` | Cirurgias anteriores |
| `allergies` | `Text?` | Alergias |
| `familyHistoryCoronaryEarly` | `Boolean` | Histórico familiar de DAC precoce |
| `familyHistorySuddenDeath` | `Boolean` | Histórico familiar de morte súbita |
| `familyHistoryOthers` | `Text?` | Outros históricos familiares |
| `smokingStatus` | `Boolean` | Tabagismo ativo |
| `smokingPacksYear` | `Int?` | Maços/ano |
| `alcoholConsumption` | `String?` | Etilismo |
| `exerciseLevel` | `ExerciseLevel` | Sedentário / Irregular / Ativo |
| `updatedAt` | `DateTime` | Última atualização |

---

#### `ScheduleConsultation`

Consulta agendada. Serve como âncora opcional para anamnese e sessão de áudio.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | `cuid()` PK | |
| `date` | `DateTime` | Data/hora da consulta |
| `type` | `ConsultationType` | `FIRST_VISIT`, `FOLLOW_UP`, `ROUTINE` |
| `patientId` | `String` FK | Paciente |
| `profileId` | `UUID` FK | Médico |
| `createdAt` / `updatedAt` | `DateTime` | Timestamps |

Relações:
- `Anamnesis?` — anamnese vinculada 1:1 (opcional)
- `AudioConsultationSession?` — sessão de áudio vinculada 1:1 (opcional)

---

#### `Anamnesis`

**Tabela central do domínio clínico.** Armazena os dados de uma consulta — tanto criadas manualmente quanto geradas pelo módulo de áudio. Não há distinção entre as origens no schema atual.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | `cuid()` PK | |
| `date` | `DateTime` | Data da anamnese |
| `patientId` | `String` FK | Paciente |
| `profileId` | `UUID` FK | Médico |
| `consultationId` | `String?` unique FK | Consulta agendada associada (opcional) |
| `chiefComplaint` | `Text` | Queixa principal |
| `currentIllnessHistory` | `Text` | História da doença atual |
| `treatmentResponse` | `Text?` | Resposta ao tratamento |
| `symptomEvolution` | `Text?` | Evolução dos sintomas |
| `newEvents` | `Text?` | Novos eventos clínicos |
| `nyhaClass` | `NyhaClass` | Classe NYHA (I–IV), default I |
| `hasPalpitations` | `Boolean` | Palpitações |
| `hasSyncope` | `Boolean` | Síncope |
| `hasEdema` | `Boolean` | Edema |
| `hasChestPain` | `Boolean` | Dor torácica |
| `diagnosticHypothesis` | `Text?` | Hipótese diagnóstica |
| `conduct` | `Text?` | Conduta |
| `nextRecallDate` | `DateTime?` | Próximo retorno |

Relações:
- `PhysicalExam?` — exame físico 1:1
- `PrescribedMedication[]` — medicações prescritas
- `AiDiagnosis[]` — diagnósticos IA gerados a partir desta anamnese

> **Lacuna conhecida:** não existe campo `source` (`MANUAL` vs `AUDIO_AI`) nem FK para `AudioConsultationSession`. Uma anamnese gerada por áudio é indistinguível de uma manual no banco. Ver seção [Gaps de Design](#gaps-de-design).

---

#### `PhysicalExam`

Exame físico vinculado 1:1 à anamnese.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | `cuid()` PK | |
| `anamnesisId` | `String` unique FK | |
| `weight` | `Float?` | Peso (kg) |
| `height` | `Float?` | Altura (cm) |
| `bpSystolic` | `Int?` | PAS (mmHg) |
| `bpDiastolic` | `Int?` | PAD (mmHg) |
| `heartRate` | `Int?` | FC (bpm) |
| `oxygenSaturation` | `Int?` | SpO2 (%) |
| `heartAuscultation` | `Text?` | Ausculta cardíaca |
| `lungAuscultation` | `Text?` | Ausculta pulmonar |
| `peripheralPulses` | `String?` | Pulsos periféricos |
| `edemaGrade` | `String?` | Grau do edema |

---

#### `PrescribedMedication`

Medicações registradas em uma anamnese. Sem FK para um catálogo de medicamentos — nome livre.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | `cuid()` PK | |
| `anamnesisId` | `String` FK | |
| `name` | `String` | Nome do medicamento |
| `dosage` | `String` | Dosagem |
| `frequency` | `String` | Frequência |

---

#### `AiDiagnosis`

Diagnóstico gerado automaticamente pela IA após uma anamnese. Uma anamnese pode ter múltiplos diagnósticos ao longo do tempo, com um flag `isValid` para controle de validade.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | `cuid()` PK | |
| `patientId` | `String` FK | Paciente |
| `anamnesisId` | `String` FK | Anamnese base |
| `summary` | `Text` | Resumo clínico |
| `mainDiagnosisHypothesis` | `Text` | Hipótese diagnóstica principal |
| `differentialDiagnoses` | `Text` | Diagnósticos diferenciais |
| `identifiedPatterns` | `Text` | Padrões identificados no histórico |
| `riskAlerts` | `Text` | Alertas de risco |
| `recommendedActions` | `Text` | Ações recomendadas |
| `confidenceLevel` | `String` | `ALTA`, `MEDIA` ou `BAIXA` |
| `isValid` | `Boolean` default true | Permite invalidar diagnósticos sem deletar |
| `createdAt` | `DateTime` | |

---

### `audio.prisma` — Módulo de Captura de Áudio (ACI)

#### `AudioConsultationSession`

Sessão de captura de áudio em tempo real. Acumula o estado do formulário de anamnese à medida que os batches são processados. Ao ser finalizada, gera uma `Anamnesis`.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | `cuid()` PK | |
| `profile_id` | `UUID` FK | Médico |
| `patient_id` | `String` FK | Paciente |
| `consultation_id` | `String?` unique FK | Consulta agendada (opcional) |
| `status` | `AudioSessionStatus` | Estado atual da sessão |
| `started_at` | `DateTime` | Início da sessão |
| `ended_at` | `DateTime?` | Fim (preenchido na finalização) |
| `last_batch_index` | `Int` default -1 | Índice do último batch processado |
| `current_form_state` | `Json` | Estado atual do formulário de anamnese (acumulado pelos batches) |
| `last_processed_transcript` | `Text?` | Última transcrição processada pelo LLM |
| `last_field_operations` | `Json?` | Mapa de operações do último merge (`replace`/`append`/`merge`/`noop`) |
| `credits_consumed` | `Int` default 0 | Total de créditos consumidos na sessão |
| `error_message` | `Text?` | Mensagem de erro se `status = ERROR` |
| `created_at` / `updated_at` | `DateTime` | Timestamps |

Índices:
- `(profile_id, status)` — busca de sessões ativas por médico

Enum `AudioSessionStatus`:

| Valor | Significado |
|---|---|
| `WAITING_FOR_PATIENT` | Aguardando paciente ser selecionado |
| `READY` | Pronta para iniciar gravação |
| `RECORDING` | Gravando ativamente |
| `PROCESSING` | Batch em processamento pelo worker |
| `SYNCED` | Formulário sincronizado após batch |
| `FINALIZED` | Sessão encerrada, anamnese gerada |
| `ERROR` | Falha irrecuperável |
| `INSUFFICIENT_CREDITS` | Saldo insuficiente para continuar |

---

#### `AudioBatchRecord`

Registro de cada lote de áudio enviado dentro de uma sessão. Garante idempotência e rastreabilidade do processamento.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | `cuid()` PK | |
| `session_id` | `String` FK | Sessão pai |
| `batch_index` | `Int` | Índice sequencial do batch na sessão |
| `storage_path` | `String` | Caminho no Supabase Storage (`{profileId}/{sessionId}/{index}.wav`) |
| `audio_duration_seconds` | `Int` | Duração do áudio em segundos |
| `status` | `AudioBatchStatus` | Estado do processamento |
| `retries` | `Int` default 0 | Número de tentativas de reprocessamento |
| `error_message` | `String?` | Erro se `status = ERROR` |
| `processed_at` | `DateTime?` | Quando foi processado com sucesso |
| `created_at` / `updated_at` | `DateTime` | Timestamps |

Constraints:
- `UNIQUE(session_id, batch_index)` — garante que cada batch de uma sessão seja registrado uma única vez (idempotência)

Índices:
- `(status, created_at)` — fila de reprocessamento de batches pendentes

Enum `AudioBatchStatus`:

| Valor | Significado |
|---|---|
| `PENDING` | Aguardando processamento pelo worker |
| `PROCESSING` | Worker em execução |
| `PROCESSED` | Concluído com sucesso |
| `ERROR` | Falhou após todas as tentativas |

---

### `credits.prisma` — Ledger de Créditos

#### `CreditLedgerEntry`

Histórico imutável de todas as transações de crédito. Cada linha é um débito ou crédito atômico. O saldo real é a soma de todas as entradas — `Profile.credits_balance` é um cache desse valor.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | `cuid()` PK | |
| `profile_id` | `UUID` FK | Médico |
| `session_id` | `String?` | Sessão de áudio relacionada (referência lógica, sem FK no schema) |
| `batch_index` | `Int?` | Índice do batch que gerou o débito |
| `type` | `CreditLedgerType` | Tipo da transação |
| `credits` | `Int` | Valor (positivo = crédito, negativo = débito) |
| `metadata` | `Json?` | Dados extras (ex: tokens usados, modelo, duração) |
| `created_at` | `DateTime` | Timestamp imutável |

Constraints:
- `UNIQUE(session_id, batch_index, type)` — impede débito duplicado para o mesmo batch e tipo (idempotência do worker)

Índices:
- `(profile_id, created_at)` — histórico cronológico por médico

Enum `CreditLedgerType`:

| Valor | Quando é gerado |
|---|---|
| `SIGNUP_BONUS` | Créditos de boas-vindas na criação da conta |
| `AUDIO_TRANSCRIPTION` | Débito pelo custo de transcrição Whisper (por segundo de áudio) |
| `PROMPT_INPUT` | Débito pelos tokens de entrada enviados ao LLM |
| `LLM_OUTPUT` | Débito pelos tokens de saída gerados pelo LLM |
| `MANUAL_ADJUSTMENT` | Ajuste manual por administrador |
| `REFUND` | Estorno de créditos |

---

## Enums

| Enum | Valores | Usado em |
|---|---|---|
| `ConsultationType` | `FIRST_VISIT`, `FOLLOW_UP`, `ROUTINE` | `ScheduleConsultation.type` |
| `NyhaClass` | `I`, `II`, `III`, `IV` | `Anamnesis.nyhaClass` |
| `ExerciseLevel` | `SEDENTARIO`, `IRREGULAR`, `ATIVO` | `ClinicalProfile.exerciseLevel` |
| `AudioSessionStatus` | 8 valores | `AudioConsultationSession.status` |
| `AudioBatchStatus` | `PENDING`, `PROCESSING`, `PROCESSED`, `ERROR` | `AudioBatchRecord.status` |
| `CreditLedgerType` | 6 valores | `CreditLedgerEntry.type` |

---

## Fluxos Principais

### Fluxo Manual (anamnese digitada)

```
Médico preenche formulário
  → cria/atualiza Anamnesis
      → cria PhysicalExam (1:1)
      → cria PrescribedMedication[] (1:N)
  → (assíncrono) dispara processAiDiagnosis
      → cria AiDiagnosis vinculado à Anamnesis
```

### Fluxo de Áudio (ACI)

```
Médico seleciona paciente
  → cria AudioConsultationSession (status: READY)
      → current_form_state inicializado com dados do Patient + ClinicalProfile

A cada lote de áudio (VAD → batch):
  → frontend envia audio .wav para Supabase Storage
  → cria AudioBatchRecord (status: PENDING)
  → QStash enfileira worker

Worker (por batch):
  → Groq Whisper: audio → transcript
  → debita créditos → CreditLedgerEntry (AUDIO_TRANSCRIPTION, PROMPT_INPUT, LLM_OUTPUT)
  → atualiza Profile.credits_balance
  → Groq LLM (20B): transcript + current_form_state → novo form_state (JSON merge)
  → atualiza AudioConsultationSession.current_form_state
  → marca AudioBatchRecord (status: PROCESSED)
  → Supabase Realtime notifica o frontend → formulário atualiza em tempo real

Médico clica "Finalizar":
  → finalizeSession()
      → lê current_form_state
      → cria Anamnesis + PhysicalExam + PrescribedMedication[]
      → marca AudioConsultationSession (status: FINALIZED)
  → (assíncrono) dispara processAiDiagnosis
      → cria AiDiagnosis
```

---

## Gaps de Design

| Gap | Impacto | Solução sugerida |
|---|---|---|
| `Anamnesis` não distingue origem manual vs áudio | Impossível filtrar anamneses por origem na UI ou relatórios | Adicionar `source: AnamnesisSource` enum (`MANUAL`, `AUDIO_AI`) + `audioSessionId?` FK |
| `CreditLedgerEntry.session_id` é `String?` sem FK | Sem integridade referencial entre ledger e sessão | Adicionar FK para `AudioConsultationSession` (requer migração) |
| `AiDiagnosis.confidenceLevel` é `String` livre | Sem validação no banco | Converter para enum `ConfidenceLevel` (`ALTA`, `MEDIA`, `BAIXA`) |
| `Patient.cpf` não é único | Dois médicos podem cadastrar o mesmo CPF de formas diferentes; CPF duplicado para o mesmo médico não é bloqueado | Adicionar `UNIQUE(profileId, cpf)` |
