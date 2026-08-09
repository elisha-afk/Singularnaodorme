# 🗄️ Guia de Integração Supabase - SingularNãoDorme

## ✅ Status Atual

- ✅ Banco de dados criado no Supabase
- ✅ Tabelas `relatos` e `contatos` configuradas
- ✅ Row Level Security (RLS) ativado
- ✅ Scripts Supabase adicionados ao HTML

## 🔑 Credenciais Necessárias

Você precisa adicionar suas credenciais do Supabase ao arquivo `supabase.config.js`:

```javascript
const SUPABASE_URL = 'https://seu-projeto.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOi...' // Chave pública
```

### Como Encontrar suas Credenciais:

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá para **Settings** → **API**
4. Copie:
   - **Project URL**
   - **anon public key** (IMPORTANTE: use a chave pública, não a privada!)

---

## 📝 Exemplos de Uso

### 1. Enviar um Relato de Bullying

```javascript
const formData = {
  tipo: 'bullying',
  descricao: 'Fui xingado e empurrado no pátio',
  local: 'Pátio da escola',
  data: '2026-08-09',
  involved: 'João Silva (agressivo)',
  witnesses: 'Maria e Pedro',
  severity: 'grave',
  isAnonymous: true // Verdadeiro = anônimo
}

await submitReportToSupabase(formData)
```

### 2. Rastrear um Relato

```javascript
// Usar o código gerado no relato
const report = await fetchReportByCode('ABC123XYZ')

if (report) {
  console.log('Status:', report.status)
  console.log('Resposta:', report.resposta)
  console.log('Última atualização:', report.data_atualizacao)
}
```

### 3. Enviar Contato

```javascript
const formData = {
  name: 'João da Silva',
  email: 'joao@email.com',
  subject: 'Sugestão de melhoria',
  message: 'A plataforma é ótima! Sugestão: adicionar chat.'
}

await submitContactForm(formData)
```

---

## 🔒 Segurança

### Dados Anônimos
- Nenhuma informação identificável é coletada
- Sem IP, localização ou cookies
- Código de rastreamento único gerado
- Protegido por RLS do Supabase

### Dados Identificados
- Nome, email, telefone (opcional)
- Apenas para contato de follow-up
- Protegido por criptografia SSL
- Conformidade com LGPD

---

## 📊 Estrutura dos Dados

### Relatos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `tipo` | VARCHAR | bullying \| conflito \| sugestao |
| `descricao` | TEXT | Descrição completa do incidente |
| `local` | VARCHAR | Local onde ocorreu |
| `data_incidente` | DATE | Data do incidente |
| `severidade` | VARCHAR | leve \| moderado \| grave \| critico |
| `anonimo` | BOOLEAN | true = anônimo, false = identificado |
| `status` | VARCHAR | pendente \| investigando \| resolvido \| fechado |
| `resposta` | TEXT | Resposta da equipe |

### Contatos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `nome` | VARCHAR | Nome do contato |
| `email` | VARCHAR | Email para resposta |
| `assunto` | VARCHAR | Assunto da mensagem |
| `mensagem` | TEXT | Conteúdo da mensagem |

---

## 🛠️ Troubleshooting

### ❌ "Cannot find module '@supabase/supabase-js'"
**Solução:** O script CDN não carregou. Verificar conexão de internet.

### ❌ "Invalid API key"
**Solução:** Verificar credenciais em `supabase.config.js`

### ❌ "RLS policy violation"
**Solução:** As políticas RLS não foram criadas. Executar:
```sql
ALTER TABLE relatos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow inserts" ON relatos FOR INSERT WITH CHECK (true);
```

### ❌ Dados não aparecem no Supabase
**Solução:** 
1. Verificar console do navegador (F12)
2. Verificar CORS em Supabase Settings
3. Verificar se as tabelas existem

---

## 🔄 Fluxo de Denúncia

```
1. Usuário preenche formulário
   ↓
2. Validação no frontend
   ↓
3. Envio para Supabase via submitReportToSupabase()
   ↓
4. Dados armazenados em `relatos` table
   ↓
5. ID/Código gerado e mostrado ao usuário
   ↓
6. Usuário pode rastrear com fetchReportByCode()
   ↓
7. Admin processa em dashboard (futuro)
   ↓
8. Resposta adicionada em `resposta` field
   ↓
9. Status atualizado para 'resolvido' ou 'fechado'
```

---

## 📱 Testar Localmente

### 1. Abrir o site localmente
```bash
cd singularnaodorme
python -m http.server 8000
# Acessar http://localhost:8000
```

### 2. Fazer uma denúncia de teste
- Preencher formulário com dados fictícios
- Clicar "Enviar"
- Verificar console (F12)

### 3. Verificar no Supabase
- Ir para https://app.supabase.com
- Selecionar projeto
- Ir para "SQL Editor"
- Executar:
```sql
SELECT * FROM relatos ORDER BY data_criacao DESC LIMIT 10;
```

---

## 🚀 Próximos Passos

1. ✅ Banco de dados criado
2. ⏳ Testar integração localmente
3. ⏳ Ativar GitHub Pages (já configurado)
4. ⏳ Dashboard Admin (em desenvolvimento)
5. ⏳ Notificações por email
6. ⏳ Estatísticas e relatórios

---

## 📞 Suporte

**Documentação Supabase:** https://supabase.com/docs

**Problemas?** Verifique o console do navegador (F12) para mensagens de erro.

---

**Última atualização:** 09/08/2026  
**Status:** ✅ Integração Completa
