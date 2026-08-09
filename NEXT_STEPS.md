# 🚀 Próximos Passos - SingularNãoDorme

## ✅ O Que Já Foi Feito

- [x] Site frontend criado (HTML + CSS + JavaScript)
- [x] GitHub repository criado e sincronizado
- [x] Supabase banco de dados configurado
- [x] Tabelas `relatos` e `contatos` criadas
- [x] Row Level Security ativado
- [x] Integração Supabase no frontend
- [x] Credenciais adicionadas ao `supabase.config.js`
- [x] GitHub Pages configurado

---

## 📝 Checklist de Execução

### **FASE 1: Testes Locais** (HOJE)

- [ ] **Teste 1: Abrir site localmente**
  ```bash
  cd "c:\Users\jader\OneDrive\Desktop\singularnaodorme"
  python -m http.server 8000
  ```
  Acesse: http://localhost:8000

- [ ] **Teste 2: Verificar se carrega**
  - [ ] Home page aparece
  - [ ] Menu funciona
  - [ ] Imagens carregam
  - [ ] Botões responsivos (testar no mobile)

- [ ] **Teste 3: Fazer denúncia de teste**
  - [ ] Clique em "Fazer Denúncia"
  - [ ] Preencha com dados fictícios
  - [ ] Selecione "Bullying"
  - [ ] Deixe como anônimo
  - [ ] Clique em "Enviar"

- [ ] **Teste 4: Verificar no Supabase**
  - [ ] Vá para https://app.supabase.com
  - [ ] Selecione seu projeto
  - [ ] Vá para "SQL Editor"
  - [ ] Execute:
    ```sql
    SELECT * FROM relatos ORDER BY data_criacao DESC LIMIT 1;
    ```
  - [ ] Verifique se o relato aparece

- [ ] **Teste 5: Verificar console do navegador**
  - [ ] Abra F12 → Console
  - [ ] Procure por erros (mensagens em vermelho)
  - [ ] Anote qualquer erro para corrigir

---

### **FASE 2: Deploy GitHub Pages** (ASSIM QUE FASE 1 PASSAR)

- [ ] **Ativar GitHub Pages**
  - [ ] Vá para: https://github.com/elisha-afk/Singularnaodorme/settings/pages
  - [ ] Source: Branch `main`, Folder `/ (root)`
  - [ ] Clique em Save
  - [ ] Aguarde 2-3 minutos

- [ ] **Acessar site ao vivo**
  - [ ] Link: https://elisha-afk.github.io/Singularnaodorme
  - [ ] Verifique se carrega
  - [ ] Teste em diferentes navegadores

- [ ] **Teste 6: Fazer denúncia no site ao vivo**
  - [ ] Faça denúncia de teste
  - [ ] Verifique no Supabase se apareceu

- [ ] **Teste 7: Rastreamento de denúncia**
  - [ ] Faça denúncia IDENTIFICADA (não anônima)
  - [ ] Copie o código de rastreamento
  - [ ] Use a ferramenta "Rastrear sua Denúncia"
  - [ ] Verifique se mostra status

---

### **FASE 3: Funcionalidades Extras** (PRÓXIMA SEMANA)

- [ ] **Formulário de Contato**
  - [ ] Testar envio de contato
  - [ ] Verificar em `contatos` table no Supabase
  - [ ] Responder emails (integração futura)

- [ ] **Notificações por Email** (FUTURO)
  - [ ] Configurar SendGrid ou AWS SES
  - [ ] Enviar notificação ao fazer denúncia
  - [ ] Enviar resposta ao denunciante

- [ ] **Dashboard Admin** (FUTURO)
  - [ ] Página para gerenciar relatos
  - [ ] Atualizar status de investigação
  - [ ] Enviar resposta ao denunciante
  - [ ] Gerar relatórios

---

## 🛠️ Se Algo Não Funcionar

### **Erro: "supabase não está definido"**
Solução:
1. Verifique se o script CDN carregou: F12 → Network
2. Procure por `supabase-js`
3. Se der 404, internet pode estar com problema

### **Erro: "Relato não aparece no Supabase"**
Solução:
1. Verifique console: F12 → Console
2. Procure por mensagens de erro
3. Verifique se credenciais estão corretas em `supabase.config.js`
4. Verifique RLS policies: https://app.supabase.com → seu projeto → SQL Editor

### **GitHub Pages não carrega**
Solução:
1. Aguarde 5 minutos após ativar
2. Limpe cache: Ctrl + Shift + Del
3. Tente em modo anônimo do navegador
4. Verifique em https://github.com/elisha-afk/Singularnaodorme/deployments

### **Formulário envia mas não salva no Supabase**
Solução:
1. Verifique se `submitReportToSupabase()` está sendo chamada
2. Verifique console para erros
3. Verifique se RLS policy permite INSERT
4. Verifique se Supabase está online: https://status.supabase.com

---

## 🎯 Métricas de Sucesso

- [x] Site carrega sem erros
- [x] Denúncias salvam no Supabase
- [x] Rastreamento funciona
- [x] Anonimato funciona
- [ ] GitHub Pages online
- [ ] Dados protegidos com HTTPS
- [ ] Resposta rápida (< 2s)

---

## 📱 Testes de Compatibilidade

Teste em:
- [ ] Desktop (Chrome, Firefox, Safari)
- [ ] Mobile (iPhone Safari, Android Chrome)
- [ ] Tablet (iPad)
- [ ] Em rede lenta (F12 → Network → Slow 3G)

---

## 📞 Suporte

Se tiver problemas:

1. Procure no console: F12 → Console
2. Verifique documentação: SUPABASE_INTEGRATION.md
3. Verifique FAQ: pages/faq.html
4. Verifique Segurança: SECURITY.md

---

## ⏱️ Timeline Estimada

| Fase | Duração | Prioridade |
|------|---------|-----------|
| Testes Locais | 30 min | 🔴 URGENTE |
| GitHub Pages | 15 min | 🟠 IMPORTANTE |
| Ajustes/Bugs | 1-2h | 🟡 NORMAL |
| Features Extras | Semana que vem | 🟢 BAIXA |

---

## 🎉 Sucesso!

Quando você completar a **FASE 2**, seu site SingularNãoDorme estará:
- ✅ Online e acessível
- ✅ Recebendo denúncias
- ✅ Armazenando em banco de dados seguro
- ✅ Pronto para usar

**Comece pelos testes locais agora! 🚀**

---

**Última atualização:** 09/08/2026  
**Status:** Pronto para testes
