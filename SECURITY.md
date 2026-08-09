# 🔐 Guia de Segurança - SingularNãoDorme

## ✅ Resumo de Segurança

| Item | Seguro? | Ação |
|------|---------|------|
| **Deixar chave pública no GitHub** | ✅ SIM | Permitido (é frontend) |
| **Deixar chave privada no GitHub** | ❌ NÃO | NUNCA! |
| **Usar variáveis de ambiente** | ✅ MELHOR | Recomendado |
| **RLS no Supabase** | ✅ PROTEGE | Dados seguros |

---

## 🔑 Tipos de Chaves Supabase

### ✅ SUPABASE_ANON_KEY (Chave Pública - SEGURA)
```
- Para: Frontend (navegador)
- Segurança: Row Level Security (RLS)
- Pode ficar no GitHub? SIM
- Exemplo: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### ❌ SUPABASE_SERVICE_ROLE_KEY (Chave Privada - PERIGOSA)
```
- Para: Backend apenas
- Segurança: ACESSO TOTAL ao banco
- Pode ficar no GitHub? NUNCA!
- Onde guardar: GitHub Secrets ou variáveis de ambiente
```

---

## 📁 Estrutura de Arquivos Segura

```
singularnaodorme/
├── .env                    ❌ NÃO COMMITAR (chaves locais)
├── .env.example           ✅ COMMITAR (template)
├── .gitignore             ✅ Inclui .env
├── supabase.config.js     ✅ Lê de .env ou fallback
└── ...
```

---

## 🛠️ Setup Local (Desenvolvimento)

### 1. Copiar Template
```bash
cp .env.example .env
```

### 2. Adicionar suas Credenciais em `.env`
```
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-publica-aqui
```

### 3. Testar Localmente
```bash
python -m http.server 8000
# Acessar http://localhost:8000
```

### ✅ Git verá:
```bash
git status
# On branch main
# nothing to commit (arquivos .env ignorados)
```

---

## 🚀 Setup GitHub Pages (Produção)

### Opção 1: Adicionar diretamente no HTML (Seguro!)
Como já temos a `anon key`, é seguro adicionar diretamente:

```html
<script>
  const SUPABASE_URL = 'https://seu-projeto.supabase.co'
  const SUPABASE_ANON_KEY = 'sua-chave-publica-aqui'
</script>
```

### Opção 2: Usar GitHub Secrets (Mais Seguro)

1. Vá para: `github.com/elisha-afk/Singularnaodorme/settings/secrets`
2. Clique em "New repository secret"
3. Adicione:
   - Name: `SUPABASE_URL`
   - Value: `https://seu-projeto.supabase.co`
4. Repita para `SUPABASE_ANON_KEY`

---

## 🔒 Proteção de Dados com RLS

Mesmo com a chave pública no GitHub, os dados estão protegidos:

```sql
-- Política de Segurança: Usuário anônimo só vê dados públicos
CREATE POLICY "Allow insert anonymously" ON relatos
  FOR INSERT
  WITH CHECK (true);

-- Usuário identificado só vê seus próprios dados
CREATE POLICY "User can view own reports" ON relatos
  FOR SELECT
  USING (auth.uid() = user_id OR anonimo = true);
```

---

## ⚠️ O Que NUNCA Fazer

```javascript
❌ const privateKey = 'sk_live_...'  // NUNCA no GitHub
❌ const dbPassword = 'senha123'     // NUNCA no GitHub
❌ const apiSecret = 'secret_...'    // NUNCA no GitHub

✅ const apiKey = 'pk_anon_...'      // OK no GitHub (pública)
```

---

## 📋 Checklist de Segurança

- [ ] `.env` não está no repositório (verificar `.gitignore`)
- [ ] `.env.example` está no repositório
- [ ] Usando apenas `anon key` no frontend
- [ ] Row Level Security ativado no Supabase
- [ ] Sem senhas ou tokens privados no código
- [ ] HTTPS ativado (GitHub Pages faz isso automaticamente)
- [ ] Sem dados sensíveis em comentários

---

## 🧪 Testar Segurança

### 1. Verificar se .env foi commitado
```bash
git log --name-only | grep ".env"
# Não deve aparecer .env (só .env.example OK)
```

### 2. Verificar se chaves estão expostas
```bash
git grep "sk_live" || echo "OK - sem chaves privadas encontradas"
```

### 3. Escanear repositório
Usar ferramentas como:
- GitGuardian (https://www.gitguardian.com)
- TruffleHog (https://github.com/trufflesecurity/trufflehog)

---

## 📱 Se Acidentalmente Fizer Commit

### Opção 1: Remover do Histórico (Recomendado)
```bash
# Remover .env do repositório (mantém arquivo local)
git rm --cached .env
git commit -m "Remove .env from git tracking"
git push
```

### Opção 2: Regenerar Chaves
Se tiver acidentalmente commitado uma chave privada:
1. Ir para Supabase Settings
2. Regenerar chaves
3. Remover do Git

---

## 📚 Referências

- [Supabase - API Keys](https://supabase.com/docs/guides/api/api-keys)
- [GitHub - Managing Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [OWASP - Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

---

## ✅ Conclusão

**SUA SITUAÇÃO (Repositório Público):**
- ✅ OK ter a `anon key` no código ou GitHub
- ✅ OK porque é feita para frontend público
- ✅ Dados protegidos por RLS do Supabase
- ❌ NUNCA colocar a `service role key`

**Você está seguro! 🔐**

---

**Última atualização:** 09/08/2026
