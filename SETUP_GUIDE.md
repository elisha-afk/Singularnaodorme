# 🚀 Guia de Setup - Supabase + GitHub Pages

## Passo 1: Criar Conta no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Clique em "Sign up"
3. Crie uma conta com seu email
4. Crie uma novo projeto

## Passo 2: Obter Credenciais

1. Abra seu projeto no Supabase
2. Vá para **Settings** → **API**
3. Copie:
   - **Project URL** (ex: https://seu-projeto.supabase.co)
   - **anon public key** (Chave pública)

⚠️ **NÃO compartilhe a chave privada!**

## Passo 3: Criar Tabelas no Supabase

### Tabela: `relatos`

Vá para **SQL Editor** e cole:

```sql
CREATE TABLE relatos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo VARCHAR(50) NOT NULL,
  descricao TEXT NOT NULL,
  local VARCHAR(255),
  data_incidente DATE,
  envolvidos TEXT,
  testemunhas TEXT,
  severidade VARCHAR(20),
  anônimo BOOLEAN DEFAULT true,
  nome VARCHAR(255),
  email VARCHAR(255),
  telefone VARCHAR(20),
  escola VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pendente',
  resposta TEXT,
  data_criacao TIMESTAMP DEFAULT NOW(),
  data_atualizacao TIMESTAMP DEFAULT NOW()
);

-- Criar política de segurança para permitir inserts
CREATE POLICY "Allow inserts" ON relatos
  FOR INSERT
  WITH CHECK (true);

-- Criar política para permitir selects apenas de dados anônimos
CREATE POLICY "Allow select anonymous" ON relatos
  FOR SELECT
  USING (anônimo = true);
```

### Tabela: `contatos`

```sql
CREATE TABLE contatos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  assunto VARCHAR(255),
  mensagem TEXT NOT NULL,
  data_envio TIMESTAMP DEFAULT NOW()
);

CREATE POLICY "Allow inserts" ON contatos
  FOR INSERT
  WITH CHECK (true);
```

## Passo 4: Configurar o Arquivo supabase.config.js

1. Abra `supabase.config.js` no projeto
2. Substitua:
   - `SUPABASE_URL` pela URL do seu projeto
   - `SUPABASE_ANON_KEY` pela chave pública

Exemplo:
```javascript
const SUPABASE_URL = 'https://seu-projeto.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

## Passo 5: Testar a Integração

1. Abra o site localmente
2. Preencha um formulário de denúncia
3. Vá para Supabase Dashboard → `relatos`
4. Verifique se o relato apareceu

## Passo 6: Configurar GitHub Pages

### 6.1 Criar Repositório no GitHub

```bash
git init
git add .
git commit -m "Initial commit - SingularNãoDorme v1.0"
git branch -M main
git remote add origin https://github.com/seu-usuario/singularnaodorme.git
git push -u origin main
```

### 6.2 Ativar GitHub Pages

1. Vá para **Settings** → **Pages**
2. **Source**: Deploy from a branch
3. **Branch**: `main`
4. **Folder**: `/ (root)`
5. Clique em **Save**

### 6.3 Acessar o Site

Seu site estará em:
```
https://seu-usuario.github.io/singularnaodorme
```

Ou configure um domínio customizado em **Settings** → **Pages** → **Custom domain**

## Passo 7: Setup de Produção

### Ativar HTTPS
- GitHub Pages ativa HTTPS automaticamente ✅

### Configurar Domínio Customizado (Opcional)

1. Compre um domínio (ex: singularnaodorme.com)
2. Configure os DNS registros:
   ```
   A 185.199.108.153
   A 185.199.109.153
   A 185.199.110.153
   A 185.199.111.153
   ```
3. Em GitHub Pages, adicione seu domínio

## 📧 Passo 8: Configurar Emails (Formspree ou Supabase)

### Opção 1: Formspree (Mais Simples)

```html
<form action="https://formspree.io/f/seu-id" method="POST">
  <input type="email" name="email" required>
  <textarea name="message" required></textarea>
  <button type="submit">Enviar</button>
</form>
```

### Opção 2: SendGrid + Supabase Functions (Avançado)

Requer configuração de Cloud Functions no Supabase.

## 🧪 Teste de Segurança

- [ ] Fazer denúncia anônima
- [ ] Verificar que IP não está armazenado
- [ ] Testar com código de rastreamento
- [ ] Verificar HTTPS
- [ ] Testar em dispositivo móvel
- [ ] Testar validações de formulário

## 🐛 Troubleshooting

### Supabase não funciona
- Verificar que a chave está correta
- Verificar CORS no Supabase Settings
- Ver console do navegador (F12)

### Site não aparece no GitHub Pages
- Esperar 1-2 minutos após push
- Verificar se branch está ativa em Settings
- Fazer push novamente

### Erros CORS
1. No Supabase, vá para **Settings** → **API** → **CORS**
2. Adicione seu domínio:
   ```
   https://seu-usuario.github.io
   https://seu-dominio.com
   ```

## 📚 Próximos Passos

1. Implementar Dashboard Admin
2. Adicionar autenticação
3. Configurar notificações por email
4. Integrar com escola (login SSO)
5. Criar app mobile
6. Análise de dados/estatísticas

## 🆘 Precisa de Ajuda?

- **Documentação Supabase:** https://supabase.com/docs
- **GitHub Pages:** https://pages.github.com
- **Nossa página de contato:** Link no site

---

**Pronto! Seu site SingularNãoDorme está ao vivo! 🎉**
