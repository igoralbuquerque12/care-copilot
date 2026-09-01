# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS base

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Necessario para o engine do Prisma em Debian slim.
RUN apt-get update \
  && apt-get install --yes --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

FROM base AS dependencies

COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY scripts/copy-vad-assets.js ./scripts/copy-vad-assets.js

# O Prisma precisa de uma URL apenas para gerar o client; a URL real vem do .env
# quando o container e iniciado.
RUN DIRECT_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" npm ci

FROM dependencies AS builder

COPY . .

# Variaveis NEXT_PUBLIC sao incorporadas ao bundle do navegador durante o build.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

# Algumas rotas sao carregadas pelo Next durante o build. Valores inofensivos
# evitam que SDKs inicializados nessas rotas exijam as credenciais reais, que
# continuam sendo fornecidas exclusivamente em tempo de execucao pelo .env.
ENV SKIP_ENV_VALIDATION=1 \
  ENVIRONMENT=production \
  DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" \
  DIRECT_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" \
  SUPABASE_URL="https://placeholder.supabase.co" \
  SUPABASE_ANON_KEY="build-placeholder" \
  SUPABASE_SERVICE_ROLE_KEY="build-placeholder" \
  APP_URL="https://placeholder.invalid" \
  GEMINI_API_KEY="build-placeholder" \
  GROQ_API_KEY="build-placeholder" \
  OPENAI_API_KEY="build-placeholder" \
  QSTASH_URL="https://qstash.upstash.io"
RUN npm run build

FROM base AS runner

ENV NODE_ENV=production
ENV PORT=3003
ENV HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3003

CMD ["node", "server.js"]
