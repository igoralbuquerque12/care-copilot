# Formulários de Anamnese Personalizáveis

Este documento descreve a implementação do módulo de templates de anamnese e o novo fluxo de criação, captura por áudio e visualização de anamneses com campos personalizados.

## Objetivo

Antes desta mudança, o formulário de anamnese era fixo: os campos existiam diretamente no schema Prisma, nos schemas Zod, nos componentes React e no prompt usado pelo worker de áudio.

Agora, cada médico pode ter templates próprios de anamnese, com seções e campos configuráveis. O formulário atual continua existindo como o template padrão criado automaticamente para cada perfil.

## Modelo de Dados

Foram adicionados os arquivos e campos abaixo:

- `prisma/schema/form-template.prisma`
- `prisma/migrations/20260524123000_anamnesis_form_templates/migration.sql`
- alterações em `prisma/schema/clinical.prisma`
- alterações em `prisma/schema/users.prisma`

### Novas entidades

`AnamnesisFormTemplate`

Representa um modelo de formulário pertencente a um médico.

Campos principais:

- `profileId`: dono do template.
- `name`: nome do template.
- `description`: descrição opcional.
- `isDefault`: indica o template padrão do médico.
- `isArchived`: arquivamento lógico.
- `sections`: seções do formulário.
- `anamneses`: anamneses criadas com o template.

`AnamnesisFormSection`

Representa uma seção dentro do formulário, por exemplo `Anamnese`, `Exame Físico` ou `Hipótese e Conduta`.

Campos principais:

- `templateId`: template pai.
- `name`: nome da seção.
- `description`: descrição opcional.
- `order`: posição no formulário.
- `isCollapsible`: preparado para UI com seções recolhíveis.
- `fields`: campos da seção.

`AnamnesisFormField`

Representa um campo renderizável.

Campos principais:

- `sectionId`: seção pai.
- `key`: chave usada para salvar/ler a resposta.
- `label`: texto exibido na UI.
- `description`: ajuda opcional.
- `order`: posição dentro da seção.
- `fieldType`: tipo do campo.
- `isRequired`: validação obrigatória.
- `isVisible`: permite ocultar campos.
- `config`: JSON com opções e detalhes de configuração.
- `isSystemField`: indica campo do sistema.
- `systemKey`: chave original do campo fixo do schema.

### Tipos de campo

O enum `FormFieldType` suporta:

- `TEXT`
- `SHORT_TEXT`
- `NUMBER`
- `BOOLEAN`
- `SELECT`
- `RADIO`
- `DATE`
- `NYHA_CLASS`
- `MEDICATIONS`

### Alterações em `Anamnesis`

A tabela `Anamnesis` ganhou:

- `templateId`: FK opcional para o template usado.
- `customResponses`: JSON com respostas de campos personalizados.

Os campos clínicos críticos e já existentes continuam como colunas tipadas, por exemplo:

- `chiefComplaint`
- `currentIllnessHistory`
- `nyhaClass`
- sintomas booleanos
- `PhysicalExam`
- `PrescribedMedication`
- `diagnosticHypothesis`
- `conduct`
- `nextRecallDate`

Essa abordagem mantém compatibilidade com relatórios e filtros existentes, mas permite extensão via JSON para campos customizados.

## Template Padrão

O template padrão é criado pelo service:

`src/server/services/formTemplate.service.ts`

A função principal é:

`seedDefaultTemplate(db, profileId)`

Ela cria o template `Formulario Padrao` de forma idempotente. Se o médico já tiver um template default, nada é duplicado.

O template padrão reproduz o formulário antigo:

Seção `Anamnese`:

- `chiefComplaint`
- `currentIllnessHistory`
- `treatmentResponse`
- `symptomEvolution`
- `newEvents`
- `nyhaClass`
- `hasPalpitations`
- `hasSyncope`
- `hasEdema`
- `hasChestPain`

Seção `Exame Fisico`:

- `weight`
- `height`
- `bpSystolic`
- `bpDiastolic`
- `heartRate`
- `oxygenSaturation`
- `heartAuscultation`
- `lungAuscultation`
- `peripheralPulses`
- `edemaGrade`

Seção `Hipotese e Conduta`:

- `medications`
- `diagnosticHypothesis`
- `conduct`
- `nextRecallDate`

## Backend

### Schemas Zod

Foi criado:

`src/schemas/form-template.ts`

Ele define:

- `formFieldTypeSchema`
- `formFieldConfigSchema`
- `upsertFormFieldSchema`
- `upsertFormSectionSchema`
- `createFormTemplateSchema`
- `updateFormTemplateSchema`
- lista de chaves de campos sistema

Também foram atualizados:

- `src/schemas/anamnesis.ts`
- `src/schemas/audio-anamnesis-form.ts`

`createAnamnesisSchema` e `updateAnamnesisSchema` agora aceitam:

- `templateId`
- `customResponses`

`consolidatedFormStateSchema`, usado no áudio, agora aceita:

- `customFields`
- `templateId`

### Service de Templates

Arquivo:

`src/server/services/formTemplate.service.ts`

Funções principais:

- `getDefaultTemplate`
- `seedDefaultTemplate`
- `listTemplates`
- `getTemplateById`
- `createTemplate`
- `updateTemplate`
- `setDefaultTemplate`
- `duplicateTemplate`
- `archiveTemplate`
- `sanitizeCustomResponses`

Regras importantes:

- Campos do sistema não podem ser removidos.
- Campos do sistema não podem ter `fieldType` alterado.
- Campos do sistema podem ser ocultados via `isVisible`.
- Ao definir um template como default, o service desmarca o default anterior em transação.
- Templates são arquivados, não deletados.

### Router tRPC

Foi criado:

`src/server/api/routers/formTemplate.router.ts`

Registrado em:

`src/server/api/root.ts`

Endpoints:

- `formTemplate.getDefault`
- `formTemplate.list`
- `formTemplate.getById`
- `formTemplate.create`
- `formTemplate.update`
- `formTemplate.setDefault`
- `formTemplate.duplicate`
- `formTemplate.archive`

### Criação de Perfil

Arquivo alterado:

`src/server/services/profile.service.ts`

Ao criar ou buscar um perfil, o sistema garante:

- bônus de cadastro
- template padrão de anamnese

Isso evita usuários sem formulário default.

### Criação e Edição de Anamnese

Arquivo alterado:

`src/server/services/anamnesis.service.ts`

Novo comportamento:

1. Se `templateId` vier no input, valida ownership do template.
2. Se `templateId` não vier, busca/cria o template padrão do médico.
3. Salva `templateId` na anamnese.
4. Filtra `customResponses` para remover qualquer chave que seja campo do sistema.
5. Salva apenas campos realmente personalizados em `customResponses`.

Isso impede que campos customizados sobrescrevam dados críticos do schema fixo.

## Fluxo Manual de Anamnese

Arquivos principais:

- `src/features/anamnesis/hooks/use-anamnesis-form.tsx`
- `src/features/anamnesis/components/anamnesis-wizard.tsx`
- `src/features/anamnesis/components/dynamic-section-renderer.tsx`
- `src/features/anamnesis/components/dynamic-field-renderer.tsx`
- `src/features/anamnesis/components/review-step.tsx`

### Fluxo

1. A tela de nova anamnese busca `formTemplate.getDefault`.
2. A primeira etapa continua sendo `Dados do Paciente`.
3. As etapas clínicas passam a ser geradas a partir de `template.sections`.
4. Cada seção renderiza seus campos com `DynamicSectionRenderer`.
5. Cada campo é renderizado por `DynamicFieldRenderer`, conforme `fieldType`.
6. Campos do sistema continuam escrevendo em `formData`.
7. Campos customizados escrevem em `customValues`.
8. No submit final, a anamnese envia:

```ts
{
  templateId: defaultTemplate.id,
  customResponses: customValues,
  ...camposSistema
}
```

### Renderização dinâmica

`DynamicFieldRenderer` suporta:

- textarea
- input curto
- número com unidade
- checkbox
- select
- radio
- date
- NYHA
- editor de medicamentos

Enquanto o template carrega, as telas antigas continuam servindo como fallback.

## Fluxo de Áudio

Arquivos principais:

- `src/schemas/audio-anamnesis-form.ts`
- `src/server/services/audio/services/session.service.ts`
- `src/server/services/audio/services/worker.service.ts`
- `src/features/audio-anamnesis/components/audio-anamnesis-page.tsx`
- `src/features/audio-anamnesis/components/audio-anamnesis-form.tsx`

### Início da sessão

Em `startSession`:

1. O paciente é validado.
2. O saldo de créditos é validado.
3. O template padrão do médico é buscado/criado.
4. `buildEmptyConsolidatedFormState` inicializa:

```ts
{
  patient,
  anamnesis,
  customFields,
  templateId
}
```

`customFields` recebe as chaves dos campos personalizados do template.

### Processamento pelo worker

Em `worker.service.ts`:

1. O worker carrega o `currentFormState`.
2. Busca o template pelo `templateId` do estado.
3. Gera uma descrição dinâmica do schema esperado.
4. Inclui no prompt os campos customizados disponíveis.
5. O LLM retorna `nextFormState` com:

```ts
{
  patient,
  anamnesis,
  customFields,
  templateId
}
```

### Finalização da sessão

Em `finalizeSession`:

1. O estado consolidado é convertido para `CreateAnamnesisInput`.
2. Campos sistema vão para colunas/tabelas existentes.
3. `customFields` vira `customResponses`.
4. `templateId` é salvo na anamnese.

## Editor de Templates

Rotas criadas:

- `src/app/(main)/configuracoes/formularios/page.tsx`
- `src/app/(main)/configuracoes/formularios/[templateId]/page.tsx`

Feature criada:

`src/features/form-template-editor/`

Arquivos principais:

- `components/template-list-page.tsx`
- `components/template-editor-page.tsx`
- `constants/field-type-meta.ts`
- `types/editor.types.ts`

### Tela de Lista

Permite:

- listar templates ativos
- ver qual é o padrão
- definir padrão
- duplicar template
- arquivar template não padrão
- abrir editor

### Tela de Editor

Permite:

- editar nome e descrição do template
- marcar como default
- editar seções
- adicionar seções
- reordenar seções com botões
- editar campos
- adicionar campos customizados
- reordenar campos com botões
- ocultar/mostrar campos
- configurar obrigatoriedade
- configurar tipo de campo
- configurar unidade para campos numéricos
- configurar opções para `SELECT` e `RADIO`

Observação: a primeira versão usa botões de subir/descer para reordenação. A estrutura local já deixa o caminho aberto para trocar por drag-and-drop depois.

## Sidebar

Arquivo alterado:

`src/features/layout/constants/sidebarItems.ts`

`Configurações` virou grupo e ganhou:

- `Minha Conta`
- `Formulários`

## Visualização de Anamneses

Arquivos alterados:

- `src/server/services/patient.service.ts`
- `src/features/patients/components/anamnesis-detail-dialog.tsx`
- `src/features/patients/components/anamnesis-detail-page.tsx`

As queries de paciente agora incluem o template da anamnese com seções e campos.

As telas de detalhe passam a renderizar campos personalizados em uma seção `Campos Personalizados`.

Durante edição:

- campos sistema continuam no fluxo existente.
- campos customizados usam `DynamicFieldRenderer`.
- ao salvar, `customResponses` é enviado para `anamnesis.update`.

## Migração de Dados

Foi adicionado:

`scripts/seed-default-templates.ts`

Esse script:

1. Busca todos os perfis.
2. Cria o template padrão para cada perfil, se ainda não existir.
3. Associa anamneses antigas sem `templateId` ao template padrão do médico.

Uso esperado:

```bash
npx tsx scripts/seed-default-templates.ts
```

Se o projeto não tiver `tsx` instalado, rode com o runner TypeScript adotado no ambiente ou adapte para o fluxo de scripts do deploy.

## Compatibilidade Retroativa

Anamneses antigas podem existir sem `templateId` até a execução do script de seed.

O sistema foi preparado para:

- criar template default automaticamente para perfis existentes quando acessados.
- continuar mostrando campos sistema existentes.
- associar anamneses antigas via script.

## Validações e Garantias

O que está protegido no backend:

- ownership do template por `profileId`.
- campos sistema não podem ser removidos.
- campos sistema não podem trocar de tipo.
- `customResponses` não aceita sobrescrever chaves de campos sistema.
- templates arquivados não podem virar default.
- template default anterior é desmarcado em transação.

## Arquivos Criados

- `prisma/schema/form-template.prisma`
- `prisma/migrations/20260524123000_anamnesis_form_templates/migration.sql`
- `scripts/seed-default-templates.ts`
- `src/schemas/form-template.ts`
- `src/server/services/formTemplate.service.ts`
- `src/server/api/routers/formTemplate.router.ts`
- `src/features/anamnesis/components/dynamic-field-renderer.tsx`
- `src/features/anamnesis/components/dynamic-section-renderer.tsx`
- `src/features/anamnesis/constants/system-fields.ts`
- `src/features/form-template-editor/components/template-list-page.tsx`
- `src/features/form-template-editor/components/template-editor-page.tsx`
- `src/features/form-template-editor/constants/field-type-meta.ts`
- `src/features/form-template-editor/types/editor.types.ts`
- `src/app/(main)/configuracoes/formularios/page.tsx`
- `src/app/(main)/configuracoes/formularios/[templateId]/page.tsx`

## Arquivos Alterados

Principais:

- `prisma/schema/clinical.prisma`
- `prisma/schema/users.prisma`
- `src/schemas/anamnesis.ts`
- `src/schemas/audio-anamnesis-form.ts`
- `src/server/api/root.ts`
- `src/server/services/anamnesis.service.ts`
- `src/server/services/profile.service.ts`
- `src/server/services/patient.service.ts`
- `src/server/services/audio/services/session.service.ts`
- `src/server/services/audio/services/worker.service.ts`
- `src/features/anamnesis/hooks/use-anamnesis-form.tsx`
- `src/features/anamnesis/components/anamnesis-wizard.tsx`
- `src/features/anamnesis/components/review-step.tsx`
- `src/features/audio-anamnesis/components/audio-anamnesis-page.tsx`
- `src/features/audio-anamnesis/components/audio-anamnesis-form.tsx`
- `src/features/patients/components/anamnesis-detail-dialog.tsx`
- `src/features/patients/components/anamnesis-detail-page.tsx`
- `src/features/layout/constants/sidebarItems.ts`

Também houve pequenos ajustes de typecheck em:

- `scripts/copy-vad-assets.js`
- `src/features/create-schedule-consultation/types/schedule-consultation.types.ts`
- `src/features/list-schedule-consultation/types/consultation.types.ts`

## Validação Executada

Foi executado:

```bash
npx prisma generate
npm run typecheck
```

Ambos passaram.

Também foi executado:

```bash
npm run lint
```

O lint ainda falhou por problemas já existentes fora do escopo principal da feature, em arquivos como:

- `src/components/ui/progress.tsx`
- `src/components/ui/textarea.tsx`
- hooks/utilitários do módulo de áudio
- `src/server/services/aiDiagnosis/index.ts`

## Pontos Pendentes / Próximos Passos

Melhorias naturais para uma próxima etapa:

- trocar os botões de reordenação do editor por drag-and-drop com `@dnd-kit`.
- adicionar preview lado a lado no editor.
- adicionar criação de template vazio, além de duplicar o template padrão.
- versionar templates para preservar exatamente a estrutura histórica usada por uma anamnese antiga.
- melhorar validação por tipo de campo em `customResponses`.
- rodar o script de seed em ambiente de staging/produção depois da migration.
