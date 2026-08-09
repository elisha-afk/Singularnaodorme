# SingularNãoDorme 🛡️

Uma plataforma segura, anônima e confidencial para estudantes denunciarem bullying, conflitos escolares e fazerem sugestões de melhorias no ambiente escolar.

## 🎯 Objetivo

Criar um espaço seguro onde alunos possam:
- 📢 Denunciar bullying de forma anônima
- 🤝 Reportar conflitos e violências
- 💡 Sugerir melhorias no ambiente escolar
- 🔒 Manter total confidencialidade
- 📞 Acessar recursos de apoio e contatos importantes

## 🌐 Sobre o Projeto

**Versão:** 2.0.0
**Status:** Em Desenvolvimento  
**Site:** https://singularnaodorme.com.br
**Hospedagem:** GitHub Pages com domínio próprio
**Banco de Dados:** Supabase  
**Tecnologias:** React, Vite, Node.js, Supabase Edge Functions

## 📁 Estrutura do Projeto

```
singularnaodorme/
├── src/
│   ├── App.jsx                  # Rotas e telas React
│   ├── Admin.jsx                # Painel da coordenação
│   ├── adminApi.js              # Cliente autenticado do painel
│   ├── admin.css                # Estilos do painel
│   ├── supabase.js              # Cliente HTTP das Edge Functions
│   └── styles.css               # Estilos da aplicação
├── supabase/
│   ├── functions/               # APIs públicas e administrativas
│   └── migrations/              # Schema, RLS e políticas de acesso
├── public/CNAME                 # Domínio próprio do GitHub Pages
├── package.json                 # Scripts Node.js
├── vite.config.js               # Exportação estática para Pages
├── .github/
│   └── workflows/
│       └── deploy.yml           # Build e deploy do dist/
├── PLANO_PROJETO.md             # Plano detalhado
├── README.md                    # Este arquivo
└── supabase.config.js           # Configuração do Supabase (em breve)
```

## 🚀 Como Usar

### 1. Clonar o Repositório

```bash
git clone https://github.com/seu-usuario/singularnaodorme.git
cd singularnaodorme
```

### 2. Executar localmente

Requer Node.js 22 ou superior:

```bash
npm install
npm run dev
```

Para gerar o export estático:

```bash
npm run build
```

O Vite cria o site publicável no diretório `dist/`.

### 3. Deploy Automático (GitHub Pages)

1. Faça push do código para o repositório GitHub:
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. Ative GitHub Pages:
   - Vá para Settings → Pages
  - Em **Build and deployment**, selecione **GitHub Actions**
   - Clique em Save

3. Configure o domínio `singularnaodorme.com.br` nas opções do GitHub Pages.

O workflow automático em `.github/workflows/deploy.yml` fará o deploy a cada push para `main`.

## 🔧 Configuração do Supabase

### Setup local

1. Crie uma conta em [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Obtenha a URL e a chave publicável no Project Settings.
4. Vincule o Supabase CLI ao projeto e aplique as migrations em `supabase/migrations/`.
5. Implante as funções em `supabase/functions/`.

Nunca exponha a service role no frontend. Ela é usada somente pelas Edge Functions.

### Painel administrativo

O painel está disponível em `https://singularnaodorme.com.br/#/adm` e usa Supabase Auth.

- `admin`: gerencia equipe, usuários e relatos.
- `coordinator`: consulta, classifica, atribui, registra notas e responde relatos.
- Contas novas e senhas redefinidas exigem troca no próximo acesso.
- O botão **Esqueceu a senha?** envia um link temporário pelo Resend e limita solicitações repetidas.
- Relatos anônimos não podem receber respostas por e-mail.

### Respostas por e-mail

As respostas usam a função `respond-relato` e o Resend. Configure os secrets diretamente no Supabase:

```bash
supabase secrets set RESEND_API_KEY=...
supabase secrets set "RESEND_FROM_EMAIL=Singular Não Dorme <relatos@singularnaodorme.com.br>"
```

O domínio do remetente precisa estar verificado no Resend.

### Banco de dados

O schema é versionado exclusivamente pelas migrations em `supabase/migrations/`. Elas criam as tabelas públicas e administrativas, índices, funções de autorização, políticas RLS e bloqueio de leitura pública dos relatos.

## 🔒 Segurança

✅ **Implementado:**
- HTTPS/SSL obrigatório
- Criptografia de dados sensíveis
- Remoção de dados anônimos (sem IP, localização)
- Validação de formulários no frontend
- LGPD compliance

⚠️ **Melhorias futuras:**
- Rate limiting
- CAPTCHA para formulários
- Políticas de retenção e exclusão de dados

## 📞 Contatos Importantes

- **CVV (Centro de Valorização da Vida):** 188
- **Disque 100 (Direitos Humanos):** 100
- **Polícia:** 190
- **Conselho Tutelar:** Procure em sua cidade

## 🤝 Como Contribuir

1. Faça fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Add MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📋 Roadmap

- [x] Página Home
- [x] Página de Relatos
- [x] Página de Recursos
- [x] Página de FAQ
- [x] Deploy automático (GitHub Pages)
- [x] Integração com Supabase
- [x] Dashboard Admin
- [x] Autenticação de usuários
- [ ] Chat de apoio
- [x] Respostas por e-mail
- [x] Relatórios e estatísticas

## 📄 Licença

Este projeto está sob a licença MIT - veja o arquivo LICENSE para detalhes.

## 👥 Autores

- **Elisha Ariel** - Criador do projeto

## 📧 Contato

Para mais informações ou reportar bugs, entre em contato através do site ou abra uma issue no GitHub.

---

**Última atualização:** 09/08/2026  
**Status:** Em Desenvolvimento Ativo 🚀

*SingularNãoDorme - Sua voz segura contra o bullying*
