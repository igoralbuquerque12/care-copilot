# Regras de Negócio Atuais da Aplicação

Este documento descreve as regras de negócio que hoje estão refletidas no código do projeto. O objetivo é orientar futuras implementações da IA sem depender apenas de leitura difusa do código.

## Visão geral do domínio

O sistema é uma aplicação clínica voltada para profissionais autenticados. O núcleo funcional atual gira em torno de:

- perfil do profissional
- pacientes
- agendamento de consultas
- anamneses
- apoio com diagnóstico por IA

O isolamento principal dos dados é feito por `profileId`. Na prática, cada profissional enxerga e manipula apenas seus próprios pacientes, consultas e anamneses.

## Regra central de autorização e escopo

- As rotas principais são protegidas por autenticação via Supabase.
- O `user.id` autenticado é tratado como o identificador do `Profile`.
- Operações de leitura e escrita dos domínios clínicos devem ser filtradas por `profileId`.
- A IA deve preservar esse isolamento sempre que criar novas queries, mutations, services ou joins.

### Implicação prática

Sempre que uma feature nova tocar `Patient`, `Anamnesis`, `ScheduleConsultation` ou `AiDiagnosis`, a implementação deve garantir que o dado pertença ao profissional autenticado.

## Perfil do profissional

- O perfil representa o dono dos dados clínicos do sistema.
- O perfil possui dados pessoais básicos e endereço.
- O endereço é opcional e hoje é persistido por `upsert`.
- O email existe, mas é tratado como campo não editável na interface atual.

## Pacientes

- Todo paciente pertence a um único `Profile`.
- O cadastro mínimo de paciente exige:
  - nome
  - data de nascimento
  - gênero
- CPF é opcional.
- O paciente pode ter um `ClinicalProfile` associado com histórico clínico resumido.
- Busca de paciente hoje ocorre por nome ou CPF.
- A listagem e a busca retornam apenas pacientes do profissional autenticado.

## Perfil clínico do paciente

O `ClinicalProfile` concentra contexto clínico mais estável do paciente, por exemplo:

- hipertensão
- diabetes e duração
- dislipidemia
- infarto prévio
- cirurgias prévias
- alergias
- histórico familiar
- tabagismo
- consumo de álcool
- nível de exercício

Esse perfil é opcional no momento da criação do paciente.

## Agendamento de consultas

- Uma consulta agendada sempre pertence a um paciente e a um perfil profissional.
- O agendamento pode ser feito de duas formas:
  - usando um paciente já existente
  - criando um novo paciente no mesmo fluxo
- Se nenhum `patientId` for informado, os dados de `newPatient` passam a ser obrigatórios.
- O tipo de consulta atual é um enum com:
  - `FIRST_VISIT`
  - `FOLLOW_UP`
  - `ROUTINE`

### Regra temporal atual

- O frontend monta a data/hora como string ISO em UTC.
- O backend converte a string recebida para `Date`.
- A listagem por dia também é feita com recorte em UTC.

### Observação importante

Como a aplicação trabalha com data/hora em UTC em vários pontos, qualquer melhoria futura de agenda deve ser cuidadosa com fusos, exibição local e filtros por dia.

## Anamnese

- A anamnese sempre pertence a um paciente e a um perfil profissional.
- O cadastro de anamnese exige:
  - `patientId`
  - `chiefComplaint`
  - `currentIllnessHistory`
- `consultationId` é opcional, mas quando informado vincula a anamnese a uma consulta agendada.
- Sintomas e classificação funcional são registrados na própria anamnese.
- Exame físico é um bloco opcional, armazenado em entidade separada `PhysicalExam`.
- Medicações prescritas são armazenadas em coleção separada `PrescribedMedication`.
- A anamnese pode registrar:
  - hipótese diagnóstica
  - conduta
  - data de retorno

## Fluxo atual da anamnese

Na interface atual, o fluxo de nova anamnese é wizard e funciona assim:

1. O usuário escolhe um paciente existente ou cria um novo.
2. O sistema coleta dados clínicos da consulta.
3. O sistema coleta exame físico.
4. O sistema coleta diagnóstico inicial, conduta e medicações.
5. O sistema faz a revisão final e salva.

Se a anamnese vier de uma consulta agendada, o paciente da consulta pode ser pré-carregado no formulário.

## Diagnóstico por IA

- Após criar uma anamnese, o sistema dispara um processamento de diagnóstico por IA em modo assíncrono.
- Se QStash estiver configurado, o disparo é enfileirado.
- Se não estiver, o processamento roda no próprio backend.
- O prompt é montado com:
  - dados do paciente
  - perfil clínico
  - histórico de anamneses
  - exames físicos
  - medicações
- O resultado persistido contém:
  - resumo
  - hipótese principal
  - diagnósticos diferenciais
  - padrões identificados
  - alertas de risco
  - ações recomendadas
  - nível de confiança

### Regras importantes do diagnóstico por IA

- O sistema busca o diagnóstico válido mais recente por paciente.
- O profissional pode marcar um diagnóstico como inválido.
- A invalidação só é permitida quando o diagnóstico pertence a um paciente do mesmo `profileId`.
- O diagnóstico por IA é apoio clínico; não deve substituir registro médico explícito nem permissão de acesso.

## Listagens e recortes atuais

- Pacientes são listados em ordem alfabética.
- Anamneses de paciente são retornadas em ordem decrescente por data.
- O perfil completo do paciente busca apenas uma janela recente:
  - até 10 anamneses
  - até 20 consultas
- Existe paginação para anamneses por paciente.
- Existe paginação para consultas do dia.

## Convenções práticas que a IA deve respeitar

- Não criar acesso cruzado entre profissionais.
- Não mover regra de negócio para componentes visuais.
- Novas regras de validação devem começar em `src/schemas`.
- `router` deve permanecer fino e orquestrar autenticação, input e chamada de service.
- `service` deve concentrar regra de negócio, persistência e composição de dados.

## Inconsistências atuais que merecem cuidado

- Há conversões manuais entre valores de gênero no frontend da anamnese e o schema persistido no backend.
- Existe lógica de acesso direto ao banco em pelo menos uma rota de consulta, fugindo do padrão de service.
- Parte dos textos da UI apresenta problemas de encoding.

Esses pontos não invalidam o comportamento atual, mas a IA deve tratá-los como débitos técnicos e evitar ampliar essas inconsistências.
