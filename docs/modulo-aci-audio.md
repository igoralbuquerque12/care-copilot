# Modulo ACI - Ambient Clinical Intelligence (Captura de Audio)

Este documento descreve em detalhe o modulo de preenchimento automatico de anamneses por captura inteligente de audio implementado nesta base de codigo. Serve como referencia tecnica para desenvolvedores, revisores e para a IA em iteracoes futuras.

---

## Visao geral

O modulo ACI permite que um medico conduza uma consulta falando normalmente com o paciente enquanto o sistema:

1. captura audio continuamente via microfone no browser
2. agrupa o audio em lotes de ate 150 segundos com sobreposicao de 5 segundos entre lotes
3. envia cada lote de forma assincrona para o backend
4. transcreve o audio via Whisper
5. usa um LLM (Gemini) para fundir a transcricao com o estado atual do formulario de anamnese
6. persiste o resultado atomicamente no banco
7. atualiza a tela do medico via Supabase Realtime sem recarregar a pagina
8. cobra creditos proporcionalmente ao uso de audio e de IA

O formulario manual legado em 5 etapas (`/anamnesis`) nao foi alterado. O novo modulo existe em `/anamnesis/audio` de forma completamente independente.

---

## Arquitetura em camadas

```
Browser
  │
  ├── PatientGatekeeperStep    (confirma paciente antes de qualquer gravacao)
  ├── RecorderControl          (UI de controle: iniciar / pausar / parar / finalizar)
  ├── AudioAnamnesisForm       (formulario consolidado, somente leitura, atualizado em tempo real)
  ├── CreditsBadge             (saldo de creditos do profissional)
  │
  ├── useVadStateMachine       (FSM: IDLE | LISTENING | BUFFERING, timer de 7s)
  ├── useAudioBatchBuffer      (acumula Float32Array, overlap de 80k amostras, monta WAV)
  ├── useAudioBatchUploader    (fila de upload com retry exponencial)
  ├── useAnamnesisFormSync     (Supabase Realtime, merge defensivo por lastBatchIndex)
  └── useAudioConsultation     (orquestrador geral)

HTTP
  │
  ├── POST /api/audio/ingest   (recebe FormData, sobe WAV ao Storage, publica no QStash)
  └── POST /api/audio/process  (worker assincrono: transcreve + merge LLM + persiste + debita)

tRPC
  ├── audioConsultation.start       (cria sessao, valida ownership e saldo)
  ├── audioConsultation.getById     (hidrata UI com o estado inicial da sessao)
  ├── audioConsultation.finalize    (mapeia formState → Anamnesis legada + fecha sessao)
  ├── credits.getBalance            (saldo atual do profissional)
  └── credits.getRecentLedger       (historico paginado)

Services
  ├── audioSession.service          (CRUD de sessoes, validacao de ownership)
  ├── audioIngestion.service        (orquestra ingestao: validacao + storage + fila)
  ├── audioBatchStorage.service     (abstrai Supabase Storage)
  ├── audioProcessingQueue.service  (abstrai QStash / fallback inline)
  ├── audioWorker.service           (worker completo: transcricao + merge + creditos + cleanup)
  ├── anamnesisMerge.service        (monta prompt, chama LLM, valida saida)
  ├── transcriptExtraction (AI)     (provider Whisper, interface abstrata)
  └── creditLedger.service          (saldo, ledger, idempotencia por sessionId+batchIndex+type)

Banco (Prisma / PostgreSQL)
  ├── AudioConsultationSession
  ├── AudioBatchRecord
  ├── CreditLedgerEntry
  └── Profile.creditsBalance  (novo campo)
```

---

## Variaveis de ambiente necessarias

### Existentes (confirmadas em uso no modulo)

| Variavel | Obrigatoria | Descricao |
|---|---|---|
| `DATABASE_URL` | Sim | Connection string PostgreSQL via pooler (Supabase / outro) |
| `DIRECT_URL` | Sim | URL direta para migrations |
| `SUPABASE_URL` | Sim | URL do projeto Supabase (server-side) |
| `SUPABASE_ANON_KEY` | Sim | Chave anonima do Supabase (server-side) |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim | Chave de servico para operacoes admin no Storage |
| `APP_URL` | Sim | URL base da aplicacao (ex: `https://app.taqto.com`) — usada pelo QStash para callback |
| `GEMINI_API_KEY` | Sim | Chave da API Gemini para o LLM de extracao/merge |
| `QSTASH_TOKEN` | Opcional | Token do QStash. Se ausente, o processamento roda inline (sem fila) |
| `QSTASH_CURRENT_SIGNING_KEY` | Opcional | Chave de verificacao de assinatura QStash (producao) |
| `QSTASH_NEXT_SIGNING_KEY` | Opcional | Chave de rotacao QStash (producao) |

### Novas (adicionadas por este modulo)

| Variavel | Obrigatoria | Descricao |
|---|---|---|
| `OPENAI_API_KEY` | **Sim** para transcricao | Chave da OpenAI para o Whisper. Sem ela, o worker falha ao processar audio |
| `NEXT_PUBLIC_SUPABASE_URL` | **Sim** | URL do Supabase exposta ao browser para o cliente Realtime |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Sim** | Chave anonima exposta ao browser para autenticacao do cliente Realtime |

> **Nota sobre `NEXT_PUBLIC_*`**: essas variaveis provavelmente ja existem no projeto com outros nomes (`SUPABASE_URL`, `SUPABASE_ANON_KEY`). Se o `.env` ja tiver esses valores, basta duplica-los com o prefixo `NEXT_PUBLIC_` para que o browser os acesse.

### Exemplo de `.env.local` completo para o modulo

```env
# Banco
DATABASE_URL="postgresql://postgres:[password]@[host]:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[password]@[host]:5432/postgres"

# Supabase server-side
SUPABASE_URL="https://[project].supabase.co"
SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# Supabase browser (Realtime)
NEXT_PUBLIC_SUPABASE_URL="https://[project].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."

# IA
GEMINI_API_KEY="AIzaSy..."
OPENAI_API_KEY="sk-..."

# App
APP_URL="http://localhost:3000"

# QStash (opcional em dev, necessario em producao)
QSTASH_TOKEN="qstash_..."
QSTASH_CURRENT_SIGNING_KEY="sig_..."
QSTASH_NEXT_SIGNING_KEY="sig_..."
```

---

## Setup inicial necessario

Alem das variaveis de ambiente, estas acoes precisam ser feitas uma unica vez:

### 1. Instalar dependencias de audio

```bash
npm install
```

As seguintes dependencias foram adicionadas ao `package.json`:

| Pacote | Versao | Uso |
|---|---|---|
| `@ricky0123/vad-web` | `^0.0.27` | Voice Activity Detection (VAD) no browser com modelo ONNX |
| `onnxruntime-web` | `^1.20.1` | Runtime ONNX necessario pelo VAD |

### 2. Aplicar a migracao do banco

```bash
npx prisma migrate dev --name aci_audio_and_credits
```

Isso cria as tabelas `audio_consultation_session`, `audio_batch_record`, `credit_ledger_entry` e adiciona a coluna `credits_balance` em `profile`.

### 3. Habilitar Realtime na tabela de sessoes

No SQL Editor do Supabase (ou via migration manual):

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE audio_consultation_session;
```

Sem isso, a tela nao se atualiza automaticamente quando o worker processar um lote.

### 4. Criar o bucket de audio no Supabase Storage

- Nome: **`audio-batches`**
- Visibilidade: **Privado** (acesso apenas via signed URLs)
- Nenhuma politica publica de leitura

---

## Sub-features e arquivos

### 1. Modelagem de dados

#### Arquivos alterados

| Arquivo | Tipo | O que mudou |
|---|---|---|
| [prisma/schema/users.prisma](prisma/schema/users.prisma) | Alterado | Campo `creditsBalance Int @default(0)` adicionado ao `Profile`; relacoes `audioSessions` e `creditLedgerEntries` |
| [prisma/schema/clinical.prisma](prisma/schema/clinical.prisma) | Alterado | Relacao `audioSessions` adicionada a `Patient` e `ScheduleConsultation` |

#### Arquivos criados

| Arquivo | O que faz |
|---|---|
| [prisma/schema/credits.prisma](prisma/schema/credits.prisma) | Define `CreditLedgerEntry` (historico de creditos) e enum `CreditLedgerType`. Unico composto `(sessionId, batchIndex, type)` garante que o mesmo lote nunca seja cobrado duas vezes pelo mesmo tipo de operacao |
| [prisma/schema/audio.prisma](prisma/schema/audio.prisma) | Define `AudioConsultationSession` (sessao de consulta com audio), `AudioBatchRecord` (rastreamento de cada lote), e os enums `AudioSessionStatus` e `AudioBatchStatus` |

#### Entidade `AudioConsultationSession`

| Campo | Tipo | Descricao |
|---|---|---|
| `id` | cuid | Identificador unico |
| `profileId` | UUID | Profissional dono da sessao |
| `patientId` | cuid | Paciente da consulta |
| `consultationId` | cuid? | Consulta agendada opcional |
| `status` | enum | `WAITING_FOR_PATIENT \| READY \| RECORDING \| PROCESSING \| SYNCED \| FINALIZED \| ERROR \| INSUFFICIENT_CREDITS` |
| `currentFormState` | Json | Estado atual do formulario consolidado (atualizado a cada lote) |
| `lastBatchIndex` | Int | Index do ultimo lote processado com sucesso (usado para merge defensivo) |
| `lastProcessedTranscript` | Text? | Ultima transcricao bruta (auditoria) |
| `lastFieldOperations` | Json? | Changelog de campos gerado pelo LLM (auditoria, usado futuramente para highlights na UI) |
| `creditsConsumed` | Int | Total de creditos consumidos nesta sessao |
| `errorMessage` | Text? | Mensagem do ultimo erro |

#### Entidade `AudioBatchRecord`

| Campo | Tipo | Descricao |
|---|---|---|
| `sessionId` + `batchIndex` | unique | Chave de idempotencia do lote |
| `storagePath` | String | Caminho do arquivo no bucket `audio-batches` |
| `audioDurationSeconds` | Int | Duracao real do audio em segundos |
| `status` | enum | `PENDING \| PROCESSING \| PROCESSED \| ERROR` |
| `retries` | Int | Contador de tentativas (incrementado em cada retry do QStash) |

#### Entidade `CreditLedgerEntry`

| Campo | Tipo | Descricao |
|---|---|---|
| `profileId` | UUID | Dono do credito |
| `sessionId` + `batchIndex` + `type` | unique | Tripla de idempotencia — impossibilita cobrar o mesmo item duas vezes |
| `type` | enum | `SIGNUP_BONUS \| AUDIO_TRANSCRIPTION \| PROMPT_INPUT \| LLM_OUTPUT \| MANUAL_ADJUSTMENT \| REFUND` |
| `credits` | Int | Quantidade de creditos (positivo = credito, negativo = debito) |
| `metadata` | Json? | Detalhes como `audioDurationSeconds`, `inputTokens`, etc. |

---

### 2. Sistema de creditos

#### Arquivos alterados

| Arquivo | O que mudou |
|---|---|
| [src/server/ai/credits/config.ts](src/server/ai/credits/config.ts) | Adicionados `minimumRequiredCreditsToStartSession: 300` e `minimumRequiredCreditsPerBatch: 100` |
| [src/server/services/profile.service.ts](src/server/services/profile.service.ts) | `createProfile` e `getProfileById` agora chamam `grantSignupBonus` (idempotente — so credita uma vez) |

#### Arquivos criados

| Arquivo | O que faz |
|---|---|
| [src/server/services/credits/creditLedger.service.ts](src/server/services/credits/creditLedger.service.ts) | Toda a logica de creditos: bonus de cadastro (10.000), validacao de saldo minimo, debito transacional por lote com 3 entries atomicas, historico paginado |
| [src/server/api/routers/credits.router.ts](src/server/api/routers/credits.router.ts) | `credits.getBalance` e `credits.getRecentLedger` — expostos via tRPC para o frontend |

#### Regras de cobranca

| Operacao | Formula | Exemplo |
|---|---|---|
| Audio transcrito | `ceil(segundos) * 3` creditos/s | 37s = 111 creditos |
| Tokens de entrada do prompt | `ceil(tokens / 5)` | 420 tokens = 84 creditos |
| Tokens de saida do LLM | `tokens * 1` | 180 tokens = 180 creditos |
| **Lote total** | soma dos tres | **375 creditos** |

O debito acontece **dentro de uma transacao unica** junto com a atualizacao do `currentFormState`. Saldo negativo e permitido para finalizar uma sessao em andamento, mas bloqueia novas sessoes e novos lotes.

---

### 3. Schemas Zod

#### Arquivos criados

| Arquivo | O que exporta |
|---|---|
| [src/schemas/audio-anamnesis-form.ts](src/schemas/audio-anamnesis-form.ts) | `consolidatedFormStateSchema` — schema completo do JSON que a IA preenche; `llmExtractionResponseSchema` — schema da saida do LLM com `nextFormState + fieldOperations`; `buildEmptyConsolidatedFormState` — factory que cria um estado inicial vazio opcionalmente pre-populado com dados do paciente; `consolidatedFormStateSchemaDescription` — string textual do schema injetada no prompt da IA |
| [src/schemas/audio-session.ts](src/schemas/audio-session.ts) | `audioBatchMetadataSchema` — metadados enviados pelo browser em cada lote; `qstashAudioJobSchema` — payload completo publicado no QStash (inclui `storagePath` e `signedAudioUrl`); `startAudioSessionSchema`, `finalizeAudioSessionSchema` |

---

### 4. Pipeline de captura de audio (frontend)

O pipeline segue uma FSM (maquina de estados finita) de 3 estados e um buffer com sobreposicao.

#### Estado da FSM

```
          onSpeechStart               onSpeechStart
IDLE ─────────────────► LISTENING ◄──────────────────┐
 ▲                           │                         │
 │     idleTimer (7s)         │ onSpeechEnd             │
 └───────────────────── BUFFERING ────────────────────┘
                              │
                              └── flush se readyToFlush (150s)
```

#### Arquivos criados

| Arquivo | O que faz |
|---|---|
| [src/features/audio-anamnesis/utils/wav.ts](src/features/audio-anamnesis/utils/wav.ts) | Funcoes puras: `encodeWav` (Float32Array → Blob WAV), `floatTo16BitPCM`, `concatFloat32`, `extractTail` (retorna os ultimos 80.000 samples = 5s para overlap) |
| [src/features/audio-anamnesis/hooks/useVadStateMachine.ts](src/features/audio-anamnesis/hooks/useVadStateMachine.ts) | FSM de VAD. Usa `@ricky0123/vad-web` com `MicVAD.new()`. Timer de 7 segundos de ociosidade. Limite suave de 150 segundos com flag `readyToFlush` |
| [src/features/audio-anamnesis/hooks/useAudioBatchBuffer.ts](src/features/audio-anamnesis/hooks/useAudioBatchBuffer.ts) | Acumula chunks `Float32Array`, prepende o tail do lote anterior (5s = 80.000 amostras), monta o WAV final, esvazia o buffer apos flush |
| [src/features/audio-anamnesis/hooks/useAudioBatchUploader.ts](src/features/audio-anamnesis/hooks/useAudioBatchUploader.ts) | Fila local de upload. Retry exponencial ate 3 tentativas. Nao bloqueia o microfone |
| [src/features/audio-anamnesis/hooks/useAudioConsultation.ts](src/features/audio-anamnesis/hooks/useAudioConsultation.ts) | Orquestrador: combina VAD + buffer + uploader + sync. Expoe `start`, `pause`, `stop`, `visualState`, `formState` |

#### Por que overlap de 5 segundos?

Sem sobreposicao, uma palavra pode ser partida entre dois lotes:

```
Lote 1: "... tomei Para"
Lote 2: "cetamol de manha."
```

Com overlap, o inicio do lote 2 repete o fim do lote 1. O prompt instrui o LLM a tratar esse inicio como contexto repetido, garantindo a palavra completa na transcricao.

---

### 5. Ingestion — rota de upload

#### Arquivos criados

| Arquivo | O que faz |
|---|---|
| [src/app/api/audio/ingest/route.ts](src/app/api/audio/ingest/route.ts) | Endpoint `POST /api/audio/ingest`. Autentica, le `FormData`, delega para `audioIngestion.service`. Responde 200 imediatamente sem aguardar transcricao |
| [src/server/services/audio/audioIngestion.service.ts](src/server/services/audio/audioIngestion.service.ts) | Valida ownership do paciente + sessao, verifica saldo, sobe WAV para o Storage, cria `AudioBatchRecord`, publica job no QStash com `deduplicationId = sessionId:batchIndex` |
| [src/server/services/audio/audioBatchStorage.service.ts](src/server/services/audio/audioBatchStorage.service.ts) | Abstrai Supabase Storage: `uploadAudioBatch`, `createSignedUrl` (TTL 30min), `deleteAudioBatch`, `downloadAudioFromSignedUrl` |
| [src/server/services/audio/audioProcessingQueue.service.ts](src/server/services/audio/audioProcessingQueue.service.ts) | Publica no QStash com `retries: 3` e `deduplicationId`. Fallback inline se `QSTASH_TOKEN` estiver ausente |

#### Caminho do arquivo no Storage

```
audio-batches/{profileId}/{sessionId}/{batchIndex}.wav
```

---

### 6. Worker assincrono — rota de processamento

#### Arquivos criados

| Arquivo | O que faz |
|---|---|
| [src/app/api/audio/process/route.ts](src/app/api/audio/process/route.ts) | Endpoint `POST /api/audio/process`. Verifica assinatura QStash, faz parse do job, delega para `audioWorker.service`. `maxDuration = 300s` |
| [src/server/services/audio/audioWorker.service.ts](src/server/services/audio/audioWorker.service.ts) | Fluxo completo: (1) verifica idempotencia — pula se lote ja processado; (2) valida saldo; (3) baixa audio; (4) transcreve; (5) faz merge LLM; (6) calcula breakdown; (7) debita + atualiza sessao em transacao unica; (8) deleta arquivo do Storage |
| [src/server/services/audio/anamnesisMerge.service.ts](src/server/services/audio/anamnesisMerge.service.ts) | Monta o system prompt + user prompt (com schema e `currentFormState`), chama `aiClient.generate`, valida saida com `llmExtractionResponseSchema`. Em falha de schema retorna erro para o caller (QStash fara retry) |
| [src/server/ai/transcription/client.ts](src/server/ai/transcription/client.ts) | Interface `AudioTranscriber` — abstrai qualquer provider de transcricao |
| [src/server/ai/transcription/providers/whisper.ts](src/server/ai/transcription/providers/whisper.ts) | Provider OpenAI Whisper (`whisper-1`). Retorna texto + `durationSeconds` |
| [src/server/ai/transcription/index.ts](src/server/ai/transcription/index.ts) | Factory `getAudioTranscriber()` — lazy singleton, lanca erro descritivo se `OPENAI_API_KEY` faltar |

#### Ciclo de vida do arquivo WAV

```
Ingestao: upload para Storage
              ↓
         Signed URL gerada (TTL 30min)
              ↓
         Job publicado no QStash (apenas metadados + signed URL)
              ↓
         Worker baixa o WAV via signed URL
              ↓
         Transcreve → Merge → Debita → Persiste (em transacao)
              ↓
         [apenas se transacao OK] → deleta WAV do Storage
```

Se o worker falhar antes da persistencia, o arquivo permanece no Storage. O QStash reprocessa automaticamente (ate 3x).

---

### 7. Prompt da IA e merge idempotente

#### System prompt

O model e instruido a:
- retornar somente JSON valido
- nao inventar informacao ausente
- tratar o inicio da transcricao como overlap potencial (nao como informacao nova)
- atualizar JSON de forma idempotente
- nao duplicar sintomas, eventos ou medicacoes
- substituir apenas quando houver contradicao explicita

#### Estrategia por tipo de campo

| Tipo | Acao | Exemplo |
|---|---|---|
| Narrativo (texto livre) | `append` se complementar, `replace` se contradizer | `chiefComplaint`, `currentIllnessHistory` |
| Booleano | `replace` apenas com afirmacao clinica clara | `hasPalpitations`, `hasHypertension` |
| Numerico | `replace` com novo valor explicito | `weight`, `bpSystolic`, `heartRate` |
| Enum | `replace` apenas com valor valido do schema | `nyhaClass`, `exerciseLevel`, `gender` |
| Array (medicacoes) | `merge` com deduplicacao por `name + dosage + frequency` | `medications` |

#### Saida do LLM validada por Zod

```json
{
  "nextFormState": { "patient": {...}, "anamnesis": {...} },
  "fieldOperations": {
    "anamnesis.chiefComplaint": { "action": "append", "reason": "..." },
    "anamnesis.medications": { "action": "merge", "reason": "..." }
  }
}
```

`fieldOperations` e salvo em `lastFieldOperations` na sessao para auditoria futura e possivel exibicao na UI (highlights por campo).

---

### 8. Sincronizacao em tempo real (Realtime)

#### Arquivos criados

| Arquivo | O que faz |
|---|---|
| [src/lib/supabase/browser.ts](src/lib/supabase/browser.ts) | Singleton do cliente Supabase para o browser (`createBrowserClient`), usado para assinar o canal Realtime |
| [src/features/audio-anamnesis/hooks/useAnamnesisFormSync.ts](src/features/audio-anamnesis/hooks/useAnamnesisFormSync.ts) | Assina `postgres_changes` em `audio_consultation_session` filtrado por `id`. Merge defensivo: so substitui o estado local se o `lastBatchIndex` do evento for `>=` ao local — evita aplicar eventos fora de ordem |

#### Requisito de infraestrutura

A tabela `audio_consultation_session` precisa estar na publicacao Realtime do Supabase:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE audio_consultation_session;
```

---

### 9. Sessoes e finalizacao

#### Arquivos criados

| Arquivo | O que faz |
|---|---|
| [src/server/services/audio/audioSession.service.ts](src/server/services/audio/audioSession.service.ts) | `startSession` — cria sessao, valida ownership, valida saldo, pre-popula `currentFormState` com dados atuais do paciente; `finalizeSession` — mapeia `currentFormState` para `CreateAnamnesisInput` e chama `createAnamnesis` do service legado; `getSession`, `markSessionError` |
| [src/server/services/audio/mapConsolidatedToAnamnesis.ts](src/server/services/audio/mapConsolidatedToAnamnesis.ts) | Funcao pura `mapConsolidatedFormToAnamnesisInput` — converte o JSON consolidado para o schema `CreateAnamnesisInput` ja existente, garantindo compatibilidade com o fluxo legado |
| [src/server/api/routers/audioConsultation.router.ts](src/server/api/routers/audioConsultation.router.ts) | Router tRPC com `start`, `getById`, `finalize` |

#### O que acontece ao finalizar

1. `currentFormState` e mapeado via `mapConsolidatedFormToAnamnesisInput`
2. `createAnamnesis` e chamado (mesmo service do wizard legado)
3. Isso aciona `triggerDiagnosis` automaticamente (diagnostico por IA ja existente)
4. A sessao e marcada como `FINALIZED`
5. O medico e redirecionado para a pagina do paciente

---

### 10. Interface do usuario

#### Arquivos criados

| Arquivo | O que faz |
|---|---|
| [src/features/audio-anamnesis/types/audio-session.types.ts](src/features/audio-anamnesis/types/audio-session.types.ts) | Tipos locais: `AudioSessionView`, `VadFsmState`, `AudioVisualState` |
| [src/features/audio-anamnesis/utils/visual-state.ts](src/features/audio-anamnesis/utils/visual-state.ts) | `resolveVisualState` — combina status do servidor + estado VAD + flag de upload em um `AudioVisualState` unico; `VISUAL_STATE_LABEL` — mapa de labels em portugues |
| [src/features/audio-anamnesis/components/audio-anamnesis-page.tsx](src/features/audio-anamnesis/components/audio-anamnesis-page.tsx) | Componente raiz da pagina. Exibe gatekeeper se nao ha sessao, ou a sessao ativa se ja iniciada |
| [src/features/audio-anamnesis/components/patient-gatekeeper-step.tsx](src/features/audio-anamnesis/components/patient-gatekeeper-step.tsx) | Passo de selecao de paciente. Dois modos: busca de paciente existente (reusa `PatientSearch`) ou cadastro rapido de novo paciente. Bloqueia o avanco ate confirmar |
| [src/features/audio-anamnesis/components/audio-anamnesis-form.tsx](src/features/audio-anamnesis/components/audio-anamnesis-form.tsx) | Formulario consolidado em tela unica, somente leitura. Grupos: Paciente / Perfil clinico / Anamnese / Exame fisico / Medicacoes / Hipotese e conduta |
| [src/features/audio-anamnesis/components/recorder-control.tsx](src/features/audio-anamnesis/components/recorder-control.tsx) | Barra de controle com pill de status colorido, botoes Iniciar / Pausar / Parar lote / Finalizar consulta |
| [src/features/audio-anamnesis/components/credits-badge.tsx](src/features/audio-anamnesis/components/credits-badge.tsx) | Badge com saldo atual em creditos, atualizado via tRPC |
| [src/app/(main)/anamnesis/audio/page.tsx](<src/app/(main)/anamnesis/audio/page.tsx>) | Server component de entrada da rota `/anamnesis/audio` |

#### Estados visuais da pill de status

| Estado | Cor | Quando ocorre |
|---|---|---|
| `waiting_for_patient` | Cinza | Antes de selecionar paciente |
| `ready_to_record` | Primaria | Sessao criada, aguardando inicio |
| `listening` | Verde | VAD detectou fala ativa |
| `buffering` | Ambar | Fala terminou, aguardando proxima ou timer de 7s |
| `uploading` | Azul | Lote sendo enviado para o backend |
| `processing` | Indigo | Worker recebeu o lote, transcrevendo/mergeando |
| `synced` | Verde claro | Worker concluiu e atualizou o formulario |
| `error` | Vermelho | Erro em alguma etapa |
| `insufficient_credits` | Vermelho | Saldo insuficiente para novo lote |

---

### 11. Navegacao

| Arquivo alterado | O que mudou |
|---|---|
| [src/features/layout/constants/sidebarItems.ts](src/features/layout/constants/sidebarItems.ts) | Item "Captura de Voz" no grupo "Care AI" agora aponta para `/anamnesis/audio` |

---

### 12. Configuracao de ambiente

| Arquivo alterado | O que mudou |
|---|---|
| [src/env.js](src/env.js) | Adicionados `OPENAI_API_KEY` (opcional), `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` (client-side) — validados via `@t3-oss/env-nextjs` |

---

## Fluxo completo ponta a ponta

```
Medico abre /anamnesis/audio
          │
          ▼
PatientGatekeeperStep
  busca paciente existente  ──► seleciona
  ou cria novo             ──► cria via patient.create mutation
          │
          ▼
audioConsultation.start (tRPC)
  valida ownership do paciente
  valida saldo >= 300 creditos
  cria AudioConsultationSession com currentFormState inicial
  retorna sessionId
          │
          ▼
SessionView renderiza
  hidrata com audioConsultation.getById
  assina canal Realtime (audio-session:{sessionId})
          │
          ▼
Medico clica "Iniciar"
  useVadStateMachine.start() → MicVAD.new()
          │
Medico/paciente fala
          │
onSpeechStart → cancela idleTimer, estado = LISTENING
onSpeechEnd   → push Float32Array no buffer
              → estado = BUFFERING
              → agenda idleTimer (7s)
          │
7 segundos de silencio  ──► OU  buffer >= 150s * 16000 samples
          │
buffer.flush()
  prependTail (5s = 80k samples do lote anterior)
  encodeWav → Blob
  salva novo tail para proximo lote
  limpa buffer
          │
uploader.enqueue()
  FormData { file: .wav, payload: JSON }
  POST /api/audio/ingest
          │
/api/audio/ingest
  autentica usuario
  audioIngestion.service.ingestBatch()
    valida ownership e saldo
    sobe .wav → Supabase Storage (audio-batches/{profileId}/{sessionId}/{n}.wav)
    cria AudioBatchRecord (status = PENDING)
    gera signed URL (TTL 30min)
    publica no QStash { job + signedAudioUrl }
  retorna 200 imediatamente
          │
          ▼ (assincrono via QStash ou inline)
/api/audio/process
  verifica assinatura QStash
  audioWorker.service.processAudioJob()
    verifica idempotencia (ja processado? skip)
    assertMinimumBalanceForBatch
    baixa .wav via signed URL
    WhisperTranscriber.transcribe() → texto + duracao
    anamnesisMerge.service.mergeBatch()
      monta prompt (system + user com schema + currentFormState + transcript)
      aiClient.generate() → JSON bruto
      valida com llmExtractionResponseSchema
    calculateCreditConsumptionBreakdown()
    prisma.$transaction()
      creditLedger.debitBatch() [3 ledger entries + decremento do saldo]
      audioConsultationSession.update [nextFormState, lastBatchIndex, status=SYNCED]
      audioBatchRecord.update [status=PROCESSED]
    deleteAudioBatch() [so apos commit]
          │
          ▼
Supabase emite evento postgres_changes UPDATE em audio_consultation_session
          │
useAnamnesisFormSync recebe evento
  valida lastBatchIndex >= estado local
  setSession(novoEstado)
          │
AudioAnamnesisForm re-renderiza com campos atualizados
Medico ve a anamnese sendo preenchida em tempo real
          │
Medico clica "Finalizar consulta"
  audioConsultation.finalize (tRPC)
    mapConsolidatedFormToAnamnesisInput()
    createAnamnesis() [service legado — cria Anamnesis, PhysicalExam, PrescribedMedication]
    triggerDiagnosis() [diagnostico IA existente]
    sessao marcada como FINALIZED
  redirect para /pacientes
```

---

## Restricoes e decisoes de design

1. **Formulario legado intacto**: o wizard de 5 etapas em `/anamnesis` nao foi alterado nem reaproveitado.
2. **Ownership estrito**: todo acesso ao banco filtra por `profileId`. Nenhum dado clinico escapa do profissional autenticado.
3. **Arquivo WAV so e deletado apos commit**: se qualquer etapa falhar, o arquivo permanece no Storage para retry.
4. **Debito de creditos e atomico com a atualizacao do formulario**: impossivel atualizar sem cobrar ou cobrar sem atualizar.
5. **Idempotencia em tres niveis**: `audioBatchRecord(sessionId, batchIndex)` + `creditLedgerEntry(sessionId, batchIndex, type)` + `deduplicationId` no QStash.
6. **Provider de transcricao abstrato**: a interface `AudioTranscriber` permite trocar Whisper por qualquer outro provider sem alterar o worker.
7. **Saldo negativo permitido apenas durante sessao em andamento**: bloqueia novas sessoes e novos lotes, mas nao aborta um lote que ja esta sendo processado.

---

## Debitos tecnicos e evolucoes futuras

| Item | Descricao |
|---|---|
| Highlights na UI | `lastFieldOperations` ja e salvo. A proxima iteracao pode usar esse dado para colorir campos atualizados no formulario |
| TTL de orfaos | Arquivos `audio-batches` de lotes em estado `ERROR` por mais de 24h podem ser limpos por um job periodico via QStash Schedule |
| Troca de provider de transcricao | Substituir `WhisperTranscriber` por Groq (whisper-large-v3-turbo, mais rapido) basta criar um novo arquivo em `src/server/ai/transcription/providers/` e atualizar o factory em `index.ts` |
| Planos e bonus recorrentes | A estrutura de ledger ja suporta os tipos `MANUAL_ADJUSTMENT` e `REFUND` para implementar recargas e ajustes manuais |
| Reserva antecipada por lote | Reservar creditos antes de processar para evitar saldo negativo inesperado em sessoes com muitos lotes paralelos |
