# Configuração da análise clínica por IA

As credenciais informadas pelos médicos são cifradas com AES-256-GCM. Antes de
usar a análise clínica, configure no ambiente uma chave aleatória de 32 bytes em
base64:

```env
AI_CREDENTIALS_ENCRYPTION_KEY=<chave-base64-de-32-bytes>
```

Depois de publicar uma nova versão, aplique as migrações do Prisma antes de
iniciar a aplicação:

```sh
npx prisma migrate deploy
```

Não reutilize essa variável para outros fins nem a armazene no banco de dados.
