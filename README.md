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

**Versão:** 1.0.0  
**Status:** Em Desenvolvimento  
**Hospedagem:** GitHub Pages  
**Banco de Dados:** Supabase  
**Tecnologias:** HTML5, CSS3, JavaScript Vanilla, Tailwind CSS

## 📁 Estrutura do Projeto

```
singularnaodorme/
├── index.html                    # Página inicial
├── css/
│   └── styles.css               # Estilos customizados
├── js/
│   └── script.js                # JavaScript principal
├── pages/
│   ├── relatar.html             # Página de denúncias
│   ├── recursos.html            # Recursos e apoio
│   └── faq.html                 # Perguntas frequentes
├── .github/
│   └── workflows/
│       └── deploy.yml           # GitHub Actions (Deploy automático)
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

### 2. Abrir no Navegador (Desenvolvimento Local)

Simplesmente abra o arquivo `index.html` em um navegador, ou use um servidor local:

```bash
# Com Python 3
python -m http.server 8000

# Com Node.js
npx http-server

# Com PHP
php -S localhost:8000
```

Depois acesse: `http://localhost:8000`

### 3. Deploy Automático (GitHub Pages)

1. Faça push do código para o repositório GitHub:
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. Ative GitHub Pages:
   - Vá para Settings → Pages
   - Branch: `main`
   - Pasta: `/ (root)`
   - Clique em Save

3. Pronto! Seu site estará em `https://seu-usuario.github.io/singularnaodorme`

O workflow automático em `.github/workflows/deploy.yml` fará o deploy a cada push para `main`.

## 🔧 Configuração do Supabase

### Setup Inicial

1. Crie uma conta em [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Obtenha a URL e a chave pública no Project Settings
4. Crie o arquivo `supabase.config.js`:

```javascript
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'sua-url-aqui'
const SUPABASE_ANON_KEY = 'sua-chave-publica-aqui'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
```

### Tabelas Necessárias

No Supabase, crie as seguintes tabelas:

#### `relatos`
```sql
CREATE TABLE relatos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo VARCHAR(50) NOT NULL, -- 'bullying', 'conflito', 'sugestao'
  descricao TEXT NOT NULL,
  local VARCHAR(255),
  data_incidente DATE,
  envolvidos TEXT,
  testemunhas TEXT,
  severidade VARCHAR(20), -- 'leve', 'moderado', 'grave', 'critico'
  anônimo BOOLEAN DEFAULT true,
  nome VARCHAR(255),
  email VARCHAR(255),
  telefone VARCHAR(20),
  escola VARCHAR(255),
  anexos JSONB,
  status VARCHAR(50) DEFAULT 'pendente', -- 'pendente', 'investigando', 'resolvido', 'fechado'
  resposta TEXT,
  data_criacao TIMESTAMP DEFAULT NOW(),
  data_atualizacao TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `contatos`
```sql
CREATE TABLE contatos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  assunto VARCHAR(255),
  mensagem TEXT NOT NULL,
  data_envio TIMESTAMP DEFAULT NOW()
);
```

## 🔒 Segurança

✅ **Implementado:**
- HTTPS/SSL obrigatório
- Criptografia de dados sensíveis
- Remoção de dados anônimos (sem IP, localização)
- Validação de formulários no frontend
- LGPD compliance

⚠️ **A Implementar:**
- Autenticação no backend
- Rate limiting
- CAPTCHA para formulários
- Verificação de email
- Encriptação end-to-end no Supabase

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
- [ ] Integração com Supabase
- [ ] Dashboard Admin
- [ ] Autenticação de usuários
- [ ] Chat de apoio
- [ ] Notificações por email
- [ ] Relatórios e estatísticas

## 📄 Licença

Este projeto está sob a licença MIT - veja o arquivo LICENSE para detalhes.

## 👥 Autores

- **Jader** - Criador do projeto

## 📧 Contato

Para mais informações ou reportar bugs, entre em contato através do site ou abra uma issue no GitHub.

---

**Última atualização:** 09/08/2026  
**Status:** Em Desenvolvimento Ativo 🚀

*SingularNãoDorme - Sua voz segura contra o bullying*
