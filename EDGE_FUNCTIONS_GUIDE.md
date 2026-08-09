# 🚀 Guia de Edge Functions - SingularNãoDorme

## O que é uma Edge Function?

Uma Edge Function é uma função serverless que roda nos servidores da Supabase (Deno).
- ✅ Sem servidor para gerenciar
- ✅ Escalável automaticamente
- ✅ Executa validações e lógica de negócio
- ✅ Acesso direto ao banco de dados
- ✅ Seguro (chave privada nunca exposta)

---

## 🏗️ Estrutura de Edge Functions

```
supabase/
├── functions/
│   ├── submit-relato/          ← Processar denúncias
│   │   └── index.ts
│   ├── get-relato/             ← Recuperar denúncia
│   │   └── index.ts
│   ├── submit-contato/         ← Processar contatos
│   │   └── index.ts
│   └── get-stats/              ← Estatísticas (Admin)
│       └── index.ts
└── migrations/
    └── add_tracking_code.sql   ← Adicionar coluna de rastreamento
```

---

## 📝 Funções Implementadas

### 1. **submit-relato** (POST)
Processa novas denúncias com:
- ✅ Validação completa de dados
- ✅ Sanitização de strings
- ✅ Geração de código de rastreamento
- ✅ Salvamento no banco de dados
- ✅ Email de confirmação (futuro)
- ✅ Logging de auditoria

**Request:**
```bash
curl -X POST https://seu-projeto.supabase.co/functions/v1/submit-relato \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "bullying",
    "descricao": "Fui xingado...",
    "local": "Pátio",
    "data_incidente": "2026-08-09",
    "severidade": "moderado",
    "anonimo": true
  }'
```

**Response:**
```json
{
  "success": true,
  "trackingCode": "ABC123XY",
  "message": "Denúncia recebida com sucesso"
}
```

---

### 2. **get-relato** (GET)
Recupera denúncia por código de rastreamento.

**Request:**
```bash
curl https://seu-projeto.supabase.co/functions/v1/get-relato?code=ABC123XY \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "tipo": "bullying",
  "status": "pendente",
  "data_criacao": "2026-08-09T10:30:00Z",
  "resposta": null,
  "severidade": "moderado"
}
```

---

### 3. **submit-contato** (POST)
Processa formulário de contato com validação.

**Request:**
```bash
curl -X POST https://seu-projeto.supabase.co/functions/v1/submit-contato \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João",
    "email": "joao@email.com",
    "assunto": "Sugestão",
    "mensagem": "O site é ótimo!"
  }'
```

---

### 4. **get-stats** (GET)
Retorna estatísticas (requer token admin).

**Request:**
```bash
curl https://seu-projeto.supabase.co/functions/v1/get-stats?token=ADMIN_TOKEN \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

**Response:**
```json
{
  "total": 42,
  "por_tipo": {
    "bullying": 25,
    "conflito": 12,
    "sugestao": 5
  },
  "por_status": {
    "pendente": 10,
    "investigando": 20,
    "resolvido": 12
  },
  "por_severidade": {
    "leve": 5,
    "moderado": 15,
    "grave": 20,
    "critico": 2
  }
}
```

---

## 🛠️ Setup Local

### 1. Instalar Supabase CLI

```bash
# Windows
choco install supabase

# macOS
brew install supabase/tap/supabase

# Linux
curl -sSLO https://github.com/supabase/cli/releases/download/v1.140.0/supabase_1.140.0_linux_x86_64.tar.gz
tar -xvf supabase_1.140.0_linux_x86_64.tar.gz
```

### 2. Login no Supabase

```bash
supabase login
```

Você será redirecionado para autenticar.

### 3. Testar Edge Functions Localmente

```bash
cd "c:\Users\jader\OneDrive\Desktop\singularnaodorme"

# Iniciar servidor local do Supabase
supabase start

# Em outro terminal, testar a função
curl -X POST http://localhost:54321/functions/v1/submit-relato \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{"tipo": "bullying", ...}'
```

### 4. Parar servidor local

```bash
supabase stop
```

---

## 🚀 Deploy para Produção

### Método 1: CLI (Recomendado)

```bash
# 1. Fazer login
supabase login

# 2. Link ao projeto remoto
supabase link --project-ref seu-project-ref

# 3. Deploy das funções
supabase functions deploy

# 4. Ver status
supabase functions list
```

### Método 2: GitHub Actions (Automático)

Criar `.github/workflows/supabase-deploy.yml`:

```yaml
name: Deploy Supabase Functions

on:
  push:
    branches:
      - main
    paths:
      - 'supabase/functions/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: supabase/setup-cli@v1
        with:
          version: latest
      
      - run: supabase functions deploy
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_PROJECT_ID: seu-project-ref
```

---

## 📊 Monitorar Edge Functions

### Ver logs no Supabase Dashboard

1. Vá para: https://app.supabase.com/project/seu-project-ref/functions
2. Clique em cada função
3. Veja logs de execução

### Linha de comando

```bash
supabase functions logs submit-relato

# Ou específico para um projeto
supabase functions logs submit-relato --project-ref seu-project-ref
```

---

## 🔐 Segurança

### Chaves na Edge Function

```typescript
// ✅ SEGURO - Chaves armazenadas como variáveis de ambiente
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// ❌ NUNCA - Hardcoded
const supabaseUrl = 'https://...'
```

### Validação e Sanitização

```typescript
// ✅ Validar todos os inputs
function validateRelato(data) {
  if (!data.tipo || !['bullying', 'conflito'].includes(data.tipo))
    throw new Error('Tipo inválido')
}

// ✅ Sanitizar strings
function sanitizeRelato(data) {
  return {
    descricao: data.descricao.trim().substring(0, 5000)
  }
}
```

### CORS

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}
```

---

## 🧪 Testes

### Test local com cURL

```bash
# Test submit-relato
curl -X POST http://localhost:54321/functions/v1/submit-relato \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer seu-token" \
  -d '{
    "tipo": "bullying",
    "descricao": "Teste de denúncia",
    "local": "Pátio",
    "data_incidente": "2026-08-09",
    "severidade": "leve",
    "anonimo": true
  }'
```

### Test no browser

```javascript
// No console do navegador
fetch('https://seu-projeto.supabase.co/functions/v1/submit-relato', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
  },
  body: JSON.stringify({
    tipo: 'bullying',
    descricao: 'Teste',
    // ... outros dados
  })
})
.then(r => r.json())
.then(console.log)
```

---

## 🐛 Troubleshooting

### "Function not found"
- Edge Function não foi deployada
- Use: `supabase functions deploy`

### "Permission denied"
- Chave de API incorreta
- Verifique SUPABASE_SERVICE_ROLE_KEY em .env

### "CORS error"
- Domínio não está nas permissões CORS
- Adicione em Supabase Dashboard → Settings → API

### "Database connection failed"
- Supabase está offline
- Verifique status: https://status.supabase.com

---

## 📚 Recursos

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Deno Docs](https://docs.deno.com)
- [Deno Examples](https://examples.deno.land)

---

## ✅ Checklist Final

- [ ] CLI Supabase instalada
- [ ] Login feito (`supabase login`)
- [ ] Projeto linkado (`supabase link`)
- [ ] Funções testadas localmente
- [ ] Migrations executadas
- [ ] Funções deployadas
- [ ] CORS configurado
- [ ] Logs monitorados
- [ ] Site frontend funcionando com Edge Functions

---

**Seu backend serverless está pronto! 🎉**

Última atualização: 09/08/2026
