# 📋 Plano de Projeto - Plataforma Anti-Bullying SingularNãoDorme

## 1. VISÃO GERAL

**Objetivo:** Criar uma plataforma segura e anônima para estudantes relatarem bullying, conflitos e sugerirem melhorias no ambiente escolar.

**Público-alvo:** Alunos (ensino fundamental e médio)

**Pilares:**
- 🔒 Segurança e privacidade
- 🤝 Apoio e acolhimento
- 📢 Voz segura para denúncias
- 💪 Empoderamento estudantil

---

## 2. FUNCIONALIDADES PRINCIPAIS

### 2.1 Para Usuários
- ✅ **Relatar Bullying**
  - Formulário de denúncia seguro
  - Descrição detalhada do ocorrido
  - Local e data do incidente
  - Opção anônima ou identificado
  - Envio de anexos/evidências

- ✅ **Relatar Conflitos**
  - Relacionamentos problemáticos
  - Discriminação
  - Assédio
  - Violência física/psicológica

- ✅ **Fazer Sugestões**
  - Melhorias no ambiente escolar
  - Novas políticas/regras
  - Feedback geral

- ✅ **Recursos de Apoio**
  - Telefones de emergência
  - Psicólogos/Orientadores
  - Chat com orientador (futura versão)
  - Materiais educativos

- ✅ **Acompanhamento Anônimo**
  - Código de rastreamento do relato
  - Status da denúncia
  - Respostas confidenciais

### 2.2 Para Administradores
- Dashboard com relatos
- Filtrar e categorizar denúncias
- Responder/Acompanhar casos
- Gerar relatórios
- Gerenciar usuários

---

## 3. ESTRUTURA DO SITE

```
Home
├── Início / Bem-vindo
├── Relatar Bullying
├── Relatar Conflito
├── Fazer Sugestão
├── Recursos de Apoio
│   ├── Contatos Importantes
│   ├── Artigos Educativos
│   ├── Como Ajudar um Amigo
│   └── Direitos do Estudante
├── Sobre a Plataforma
├── FAQ
└── Contato
```

---

## 4. TECNOLOGIAS RECOMENDADAS

### Frontend (Site Estático)
- **HTML5 + CSS3** - Estrutura e design responsivo
- **JavaScript Vanilla** - Interatividade (sem dependências pesadas)
- **Framework CSS:** Tailwind CSS ou Bootstrap
- **Hospedagem:** GitHub Pages, Vercel, Netlify

### Backend (para armazenar relatos)
- **Firebase Firestore** - Banco de dados em nuvem
- **Firebase Authentication** - Autenticação segura
- **Firebase Cloud Functions** - Processamento serverless
- **SendGrid/AWS SES** - Envio de emails

**OU (Alternativa mais simples):**
- **Formspree/Basin** - Formulários que enviam para email

---

## 5. DESIGN E UX

### Paleta de Cores
- Cor primária: Azul acolhedor (#4A90E2)
- Cor secundária: Verde esperança (#27AE60)
- Neutras: Cinza suave
- Alertas: Vermelho (#E74C3C) - para perigos

### Princípios
- ✨ Interface simples e intuitiva
- 🎯 Call-to-action claro
- 📱 Responsivo (mobile-first)
- ♿ Acessibilidade (WCAG)
- 🌙 Modo claro/escuro

---

## 6. SEGURANÇA E PRIVACIDADE

### Implementação
- 🔐 SSL/HTTPS obrigatório
- 🔒 Criptografia end-to-end para relatos
- 📝 Dados anônimos quando solicitado
- 🚫 Sem IP logging para relatos anônimos
- 🔑 Autenticação segura para acesso admin

### LGPD Compliance
- ✅ Política de Privacidade clara
- ✅ Consentimento informado
- ✅ Direito ao esquecimento
- ✅ Transparência sobre coleta de dados

---

## 7. FLUXO DE RELATO

```
1. Usuário acessa plataforma
   ↓
2. Escolhe tipo de relato (Bullying/Conflito/Sugestão)
   ↓
3. Preenche formulário
   - Descrição detalhada
   - Data/Local/Envolvidos
   - Nível de severidade
   ↓
4. Escolhe se é anônimo ou identificado
   ↓
5. Revisa antes de enviar
   ↓
6. Recebe código de rastreamento (se não anônimo)
   ↓
7. Administrador recebe notificação
   ↓
8. Caso é investigado
   ↓
9. Resposta/Acompanhamento é enviado
```

---

## 8. SEÇÕES DO SITE

### Home
- Título impactante
- Valor da plataforma
- CTA principal: "Faça sua Denúncia"
- Números/Estatísticas (privacidade mantida)
- Depoimentos de estudantes

### Relatar
- Formulário interativo
- Instruções passo a passo
- Validação de campos
- Confirmação de envio

### Recursos
- Base de conhecimento
- Artigos educativos
- Vídeos de apoio
- Contatos úteis

### FAQ
- Dúvidas frequentes
- Como funciona?
- O que é bullying?
- Posso ser punido por denunciar?

### Dashboard Admin (área restrita)
- Lista de relatos
- Filtros e busca
- Status de cada caso
- Ferramentas de resposta

---

## 9. CRONOGRAMA SUGERIDO

| Fase | Duração | Atividades |
|------|---------|-----------|
| **1. Planejamento** | 1 semana | Definir estrutura, design, tecnologias |
| **2. Design UI/UX** | 2 semanas | Protótipos, wireframes, design system |
| **3. Frontend** | 3-4 semanas | HTML, CSS, JavaScript |
| **4. Backend** | 3-4 semanas | Banco de dados, APIs, segurança |
| **5. Integração** | 2 semanas | Conectar frontend com backend |
| **6. Testes** | 2 semanas | Testes funcionais, segurança, UX |
| **7. Lançamento** | 1 semana | Deploy, documentação, treinamento |

---

## 10. PRÓXIMOS PASSOS

1. ✅ **Validar este plano** - Ajustar conforme necessário
2. 📐 **Criar wireframes** - Estrutura visual das páginas
3. 🎨 **Desenvolver design system** - Cores, tipografia, componentes
4. 💻 **Iniciar desenvolvimento** - Frontend e backend em paralelo
5. 🧪 **Testes com usuários** - Beta testing com alunos
6. 🚀 **Lançamento piloto** - Em uma escola
7. 📊 **Feedback e iteração** - Melhorias contínuas

---

## 11. RECURSOS E CONTACTS IMPORTANTES

### Plataformas de Apoio (para integrar links)
- CVV (Centro de Valorização da Vida): 188
- Disque 100 (Disque Direitos Humanos)
- CRAI (Centro de Referência de Assistência Social)
- Conselho Tutelar Local
- Delegacia de Crimes contra Crianças

### Legislação
- Lei 14.651/2023 (Campanhas anti-bullying)
- Lei 13.185/2015 (Política de combate ao bullying)

---

## 12. CONSIDERAÇÕES ÉTICAS

- ⚖️ Confidencialidade absoluta garantida
- 🛡️ Proteção contra retaliações
- 🚨 Protocolo de casos graves (risco de vida)
- 📞 Encaminhamento a autoridades competentes
- 🎓 Educação sobre consequências do bullying

---

**Status:** 📋 Planejamento  
**Última atualização:** 09/08/2026
