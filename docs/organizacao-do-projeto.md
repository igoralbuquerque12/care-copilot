# Princípios e Regras de Organização e Arquivos do Projeto

Este documento registra como o projeto está organizado hoje e quais princípios a IA deve seguir ao criar, mover ou refatorar arquivos.

## Stack atual

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS
- tRPC
- React Query
- Prisma + PostgreSQL
- Supabase Auth
- Gemini para IA
- QStash para processamento assíncrono opcional

## Organização macro

### `src/app`

Responsável por rotas, layouts e entrypoints do App Router.

Diretrizes:

- arquivos em `app` devem ser finos
- páginas devem compor features já prontas
- lógica de domínio não deve nascer em `page.tsx`

Uso atual:

- `src/app/(main)` concentra a aplicação autenticada
- `src/app/auth` concentra autenticação
- `src/app/api` expõe endpoints auxiliares, como integração assíncrona de IA

### `src/features`

Camada principal do frontend por domínio funcional.

Cada feature idealmente agrupa:

- `components/`
- `hooks/`
- `types/`
- `constants/`
- `helpers/` ou `utils/` quando fizer sentido
- `loading/` para skeletons e estados de carregamento

Features atuais:

- `anamnesis`
- `auth`
- `create-schedule-consultation`
- `layout`
- `list-schedule-consultation`
- `patients`
- `profile`

### `src/components`

Componentes compartilhados entre features.

Uso esperado:

- `ui/` para componentes base reutilizáveis
- `dialogs/` para elementos compartilhados de interação

Regra:

- se um componente é genérico e não pertence semanticamente a uma única feature, ele deve morar aqui
- se ele expressa um fluxo de negócio específico, deve ficar dentro da feature

### `src/schemas`

Contratos de validação e tipos inferidos com Zod.

Regra:

- toda entrada de formulário, mutation ou query deve nascer ou passar por schema aqui
- novas validações devem ser centralizadas aqui antes de espalhar lógica em hooks ou services

### `src/server`

Camada de backend da aplicação.

Subáreas atuais:

- `api/` para infraestrutura tRPC e routers
- `services/` para regra de negócio
- `auth/` para integração com autenticação
- `ai/` para cliente e provider de IA
- `qstash/` para fila assíncrona
- `supabase/` para utilitários administrativos

### `src/trpc`

Configuração do cliente React para consumo da API tRPC.

### `prisma`

Schema e migrations do banco.

## Regra arquitetural para backend

Este projeto deve seguir o princípio:

- `router` ou controller verifica autenticação, permissões, input e delega
- `service` concentra regra de negócio, persistência e composição de dados

### Como aplicar isso aqui

- Em tRPC, o equivalente prático ao controller é o `router`.
- O `router` deve ser fino.
- A lógica real deve ir para `src/server/services`.
- A IA deve preferir criar ou expandir services em vez de colocar regra em `router`.

### Exemplo do padrão desejado

- `router`: recebe input validado, pega `ctx.user.id`, chama `service`
- `service`: verifica pertencimento, acessa banco, monta resposta, trata casos de negócio

### Exceção atual

Existe pelo menos um caso em que a rota consulta diretamente o banco para buscar agendamento por id. Ao tocar nesse fluxo, a IA deve preferir mover essa responsabilidade para service, não replicar o antipadrão.

## Regra arquitetural para frontend

O frontend deve ser organizado por entidade ou fluxo de negócio, não por tipo técnico global.

### Padrão preferido

Dentro de cada feature:

- `components/` para UI da feature
- `hooks/` para estado, side-effects e integração com API
- `types/` para contratos locais de apresentação
- `constants/` para enums visuais, steps, labels e defaults

### O que evitar

- criar pasta global de `hooks` para regras de uma única feature
- misturar componentes reutilizáveis com componentes de domínio
- colocar query tRPC direto em muitos componentes irmãos quando um hook da feature pode encapsular isso

## Fluxo recomendado para novas implementações

1. Definir ou atualizar o schema em `src/schemas`.
2. Criar ou ajustar procedure no `router`.
3. Implementar regra no `service`.
4. Encapsular consumo no frontend em hook da feature quando houver estado relevante.
5. Montar componentes da feature com foco em composição.

## Regras de nomeação

- nomes de feature podem seguir o domínio atual do projeto, inclusive compostos com hífen
- componentes React em PascalCase
- hooks com prefixo `use`
- services com sufixo `.service.ts`
- routers com sufixo `.router.ts`
- schemas por domínio em arquivos curtos e explícitos

## Quando criar arquivo compartilhado

Criar em `src/components`, `src/lib`, `src/utils` ou `src/types` apenas quando o artefato for realmente transversal.

Critério prático:

- usado por várias features ou por toda a aplicação
- não carrega semântica forte de um fluxo específico
- reduz duplicação sem embaralhar responsabilidades

## Convenções que a IA deve seguir em mudanças futuras

- preservar separação entre `features` e `components` compartilhados
- preservar `services` como núcleo de regra de negócio
- adicionar validação em `schemas` antes de ampliar lógica no frontend
- manter páginas e layouts como composição, não como centro da regra
- manter isolamento por `profileId` em qualquer domínio clínico
- documentar novas convenções importantes nesta pasta `docs-ia`

## Débitos técnicos já visíveis

- há algumas inconsistências de encoding em textos da UI
- há conversões manuais de gênero em fluxos específicos
- parte do frontend ainda usa `useCallback` sem um padrão arquitetural forte por trás

A IA deve evitar propagar esses padrões quando criar código novo e, quando estiver alterando áreas adjacentes, pode aproveitar para corrigir de forma segura e incremental.
