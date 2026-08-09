# 🚀 Supabase Backend - SingularNãoDorme

Este diretório contém todo o backend serverless usando Supabase Edge Functions.

## 📁 Estrutura

```
supabase/
├── functions/                 # Edge Functions (Deno)
│   ├── submit-relato/
│   │   └── index.ts          # Processa denúncias
│   ├── get-relato/
│   │   └── index.ts          # Recupera denúncia
│   ├── submit-contato/
│   │   └── index.ts          # Processa contatos
│   ├── get-stats/
│   │   └── index.ts          # Estatísticas
│   └── deno.json             # Configuração Deno
├── migrations/               # SQL Migrations
│   └── add_tracking_code.sql
├── config.toml              # Configuração Supabase
└── .env.local              # Variáveis de ambiente (local)
```

## 🚀 Quick Start

### 1. Instalar Supabase CLI

```bash
npm install -g supabase
```

### 2. Fazer Login

```bash
supabase login
```

### 3. Iniciar Servidor Local

```bash
supabase start
```

### 4. Testar Edge Functions

```bash
# Em outro terminal
curl -X POST http://localhost:54321/functions/v1/submit-relato \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer seu-token" \
  -d '{"tipo":"bullying","descricao":"teste",...}'
```

### 5. Ver Logs

```bash
supabase functions logs submit-relato
```

### 6. Deploy para Produção

```bash
supabase link --project-ref seu-project-ref
supabase functions deploy
```

## 📝 Edge Functions

### submit-relato
- **Método:** POST
- **Rota:** `/functions/v1/submit-relato`
- **Função:** Processar nova denúncia
- **Validações:** Tipo, descrição, data, severidade
- **Resposta:** Código de rastreamento

### get-relato
- **Método:** GET
- **Rota:** `/functions/v1/get-relato?code=ABC123`
- **Função:** Recuperar denúncia por código
- **Segurança:** Remove dados sensíveis

### submit-contato
- **Método:** POST
- **Rota:** `/functions/v1/submit-contato`
- **Função:** Processar formulário de contato
- **Validações:** Nome, email, mensagem

### get-stats
- **Método:** GET
- **Rota:** `/functions/v1/get-stats?token=ADMIN_TOKEN`
- **Função:** Retornar estatísticas
- **Segurança:** Requer token admin

## 🔐 Variáveis de Ambiente

Copie `.env` (raiz) para `supabase/.env.local`:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-publica
SUPABASE_SERVICE_ROLE_KEY=sua-chave-privada
ADMIN_TOKEN=seu-token-admin
```

## 📚 Documentação

- [Edge Functions Guide](../EDGE_FUNCTIONS_GUIDE.md)
- [Frontend Integration](../FRONTEND_EDGE_FUNCTIONS_EXAMPLE.js)
- [Supabase Docs](https://supabase.com/docs)

## ✅ Próximos Passos

- [ ] Setup local com `supabase start`
- [ ] Testar Edge Functions
- [ ] Deploy para produção
- [ ] Monitorar logs
- [ ] Adicionar autenticação JWT
- [ ] Implementar emails (SendGrid)
- [ ] Criar dashboard admin

---

**Backend serverless pronto! 🎉**
