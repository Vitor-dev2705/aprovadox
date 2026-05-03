# AprovadoX 🎯
### A plataforma definitiva para quem quer passar em concursos públicos

> **Stack:** React + Vite + Tailwind | Node.js + Express | Neon PostgreSQL + Prisma | JWT Auth

---

## 📦 Estrutura do Projeto

```
aprovadox/
├── frontend/          # React + Vite (deploy Vercel)
├── backend/           # Node.js + Express (deploy Railway/Render)
├── prisma/            # Schema Prisma ORM
├── database/          # schema.sql + seeds.sql
├── vercel.json        # Configuração Vercel
├── .env.example       # Variáveis de ambiente
└── package.json       # Scripts raiz
```

---

## 🚀 Início Rápido (Desenvolvimento Local)

### 1. Pré-requisitos
- Node.js 18+
- npm ou yarn
- Conta no [Neon](https://neon.tech) (banco PostgreSQL gratuito)

### 2. Clonar e instalar
```bash
cd aprovadox

# Instalar dependências de todos os projetos
npm run install:all
```

### 3. Configurar variáveis de ambiente
```bash
# Copiar .env.example
cp .env.example backend/.env

# Editar com suas credenciais Neon
```

**Conteúdo do `backend/.env`:**
```env
DATABASE_URL="postgresql://SEU_USER:SUA_SENHA@ep-xxxx.us-east-1.aws.neon.tech/aprovadox?sslmode=require"
DIRECT_URL="postgresql://SEU_USER:SUA_SENHA@ep-xxxx.us-east-1.aws.neon.tech/aprovadox?sslmode=require"
JWT_SECRET="sua-chave-jwt-super-secreta-minimo-32-caracteres"
JWT_EXPIRES_IN="7d"
FRONTEND_URL="http://localhost:5173"
PORT=3001
```

### 4. Criar banco de dados no Neon
1. Acesse [console.neon.tech](https://console.neon.tech)
2. Crie um novo projeto chamado `aprovadox`
3. Copie a **Connection String** para o `.env`
4. Execute o schema:

**Opção A — SQL direto no Neon:**
```sql
-- Cole o conteúdo de database/schema.sql no SQL Editor do Neon
```

**Opção B — Via Prisma (recomendado):**
```bash
cd backend
npx prisma db push --schema=../prisma/schema.prisma
```

### 5. Rodar em desenvolvimento
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

Acesse: http://localhost:5173

---

## 🌐 Deploy na Vercel (Produção)

### Frontend

```bash
cd frontend
vercel deploy --prod
```

**Configurações Vercel (frontend):**
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variables:
  - `VITE_API_URL` = `https://seu-backend.railway.app/api`

### Backend (Railway)

1. Acesse [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Selecione a pasta `backend`
4. Configure as variáveis de ambiente:

```
DATABASE_URL=postgresql://...neon.tech/aprovadox?sslmode=require
JWT_SECRET=sua-chave-super-secreta
FRONTEND_URL=https://seu-frontend.vercel.app
PORT=3001
```

---

## 🗃️ Banco de Dados (Neon)

### Criar banco
1. Acesse [console.neon.tech](https://console.neon.tech)
2. Create Project → Nome: `aprovadox`
3. Copie a **Pooler Connection String** (para `DATABASE_URL`)
4. Copie a **Direct Connection String** (para `DIRECT_URL`)

### Migrations via Prisma
```bash
# Gerar cliente Prisma
npx prisma generate --schema=prisma/schema.prisma

# Aplicar schema ao banco
npx prisma db push --schema=prisma/schema.prisma

# Ver banco no browser
npx prisma studio --schema=prisma/schema.prisma
```

### Seed de demo
```bash
# Execute no SQL Editor do Neon
-- Copie o conteúdo de database/seeds.sql
```

**Credenciais demo:**
- Email: `demo@aprovadox.com`
- Senha: `demo123`

---

## 🔑 Variáveis de Ambiente

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DATABASE_URL` | Connection string Neon (pooler) | `postgresql://...` |
| `DIRECT_URL` | Connection string Neon (direct) | `postgresql://...` |
| `JWT_SECRET` | Chave secreta JWT (min 32 chars) | `minha-chave-secreta-32-chars` |
| `JWT_EXPIRES_IN` | Expiração do token | `7d` |
| `FRONTEND_URL` | URL do frontend (CORS) | `https://aprovadox.vercel.app` |
| `PORT` | Porta do backend | `3001` |
| `VITE_API_URL` | URL da API (frontend) | `https://api.railway.app/api` |

---

## 📱 Módulos do Sistema

| Módulo | Rota | Descrição |
|--------|------|-----------|
| Dashboard | `/dashboard` | Visão geral, stats, gráficos |
| Cronômetro | `/cronometro` | Timer com Pomodoro e técnicas |
| Concursos | `/concursos` | Gestão de concursos/provas |
| Matérias | `/materias` | Matérias com assuntos e progresso |
| Revisões | `/revisoes` | Revisão espaçada automática |
| Planejamento | `/planejamento` | Calendário semanal drag & drop |
| Estatísticas | `/estatisticas` | Gráficos e relatórios |
| Questões | `/questoes` | Banco de questões erradas |
| Técnicas | `/tecnicas` | Guias de técnicas de estudo |
| Gamificação | `/gamificacao` | XP, níveis, medalhas, missões |
| Motivação | `/motivacional` | Frases, progresso, streaks |
| Perfil | `/perfil` | Dados do usuário e configurações |

---

## 🛠️ Scripts Disponíveis

```bash
# Raiz
npm run dev              # Roda frontend + backend
npm run dev:frontend     # Só frontend
npm run dev:backend      # Só backend
npm run build:frontend   # Build do frontend

# Frontend (dentro de /frontend)
npm run dev
npm run build
npm run preview

# Backend (dentro de /backend)
npm run dev              # nodemon
npm start                # node direto
```

---

## 🔒 Autenticação

- **JWT Bearer Token** no header `Authorization`
- Tokens expiram em 7 dias
- Refresh via novo login

---

## 📡 API Endpoints

```
POST   /api/auth/register       - Criar conta
POST   /api/auth/login          - Login
GET    /api/auth/profile        - Perfil (auth)
PUT    /api/auth/profile        - Atualizar perfil (auth)
PUT    /api/auth/password       - Alterar senha (auth)
POST   /api/auth/avatar         - Upload foto (auth)

GET    /api/dashboard           - Dados do dashboard (auth)
GET    /api/dashboard/estatisticas - Estatísticas completas (auth)

GET    /api/concursos           - Listar concursos (auth)
POST   /api/concursos           - Criar concurso (auth)
PUT    /api/concursos/:id       - Atualizar (auth)
DELETE /api/concursos/:id       - Remover (auth)

GET    /api/materias            - Listar matérias (auth)
POST   /api/materias            - Criar matéria (auth)
PUT    /api/materias/:id        - Atualizar (auth)
DELETE /api/materias/:id        - Remover (auth)
POST   /api/materias/:id/assuntos           - Add assunto
PATCH  /api/materias/:id/assuntos/:aid/toggle - Toggle concluído

GET    /api/sessoes             - Listar sessões (auth)
GET    /api/sessoes/stats       - Stats de tempo (auth)
POST   /api/sessoes             - Criar sessão (auth) → agenda revisões automáticas

GET    /api/revisoes            - Listar revisões (auth)
GET    /api/revisoes/hoje       - Revisões pendentes hoje (auth)
PATCH  /api/revisoes/:id/concluir - Concluir revisão (auth)

GET    /api/gamificacao/status  - XP, nível, medalhas (auth)
GET    /api/gamificacao/missoes - Missões do dia (auth)
POST   /api/gamificacao/check-medalhas - Verificar novas medalhas (auth)

GET    /api/metas               - Listar metas (auth)
POST   /api/metas               - Criar meta (auth)
PUT    /api/metas/:id           - Atualizar (auth)

GET    /api/questoes            - Banco de questões (auth)
POST   /api/questoes            - Registrar questão (auth)
PATCH  /api/questoes/:id/revisar - Marcar como revisada (auth)

GET    /api/planejamento        - Planejamento semanal (auth)
POST   /api/planejamento        - Adicionar bloco (auth)
PUT    /api/planejamento/:id    - Atualizar bloco (auth)
DELETE /api/planejamento/:id    - Remover bloco (auth)
```

---

## 🎨 Design System

- **Cores principais:** Indigo (#6366f1) + Emerald (#10b981)
- **Fundo:** Dark slate (#0a0a0f, #111118, #1a1a27)
- **Fonte:** Inter (Google Fonts)
- **Animações:** Framer Motion
- **Gráficos:** Recharts
- **Drag & Drop:** @hello-pangea/dnd
- **Notificações:** react-hot-toast

---

## 🐛 Troubleshooting

**Backend não conecta ao banco:**
- Verifique se `DATABASE_URL` está correto no `.env`
- Certifique-se que o IP não está bloqueado no Neon
- Use `?sslmode=require` na connection string

**CORS error no frontend:**
- Verifique `FRONTEND_URL` no `.env` do backend
- Em dev: `http://localhost:5173`

**Prisma Client não gerado:**
```bash
npx prisma generate --schema=prisma/schema.prisma
```

---

## 📄 Licença

MIT License — use livremente, mas dê os créditos! 🙏

---

**AprovadoX** © 2024 — *Sua aprovação começa aqui* 🚀
