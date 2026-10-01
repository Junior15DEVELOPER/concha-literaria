# Concha Literária 🐚📚

> **Plataforma Social de Leitura, Biblioteca Pessoal, Acompanhamento de Hábitos e Imersão Literária**

O **Concha Literária** é um ecossistema completo para leitores apaixonados. Reúne organização de estante, acompanhamento analítico de leitura com cronômetro de precisão por timestamps, diário reflexivo, escaneamento de trechos com OCR, scanner de código de barras ISBN, metas gamificadas, rede social de compartilhamento de leituras e retrospectiva anual ("Concha Rewind").

---

## 1. Tecnologias Utilizadas

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS (Design System semântico com temas Claro, Escuro e Sépia).
- **PWA**: Service Worker inteligente, App Shell caching, manifest normatizado, navegação mobile-first e detecção de conectividade offline.
- **Backend & Serverless**: Arquitetura modular compatível com deploy na Vercel (`/api`), com tratamento rigoroso de autorização multiusuário (`userId`).
- **Banco de Dados & ORM**: PostgreSQL (compatível com Vercel Postgres, Neon e Supabase) gerenciado via Prisma ORM com migrations estruturadas e integridade referencial.
- **Validação de Schemas**: Zod (validação estrita ponta a ponta no frontend e na camada de API).
- **Hardware & Multimídia**:
  - OCR com Tesseract.js (captura de citações via câmera com tela de revisão do leitor).
  - Leitor de código de barras ISBN via ZXing com integração direta ao Google Books e Open Library.
- **Ícones e Efeitos**: Lucide React, Canvas Confetti.

---

## 2. Arquitetura do Projeto

O sistema adota uma arquitetura em camadas orientada a domínio (Domain-Driven):

```text
Frontend (React 19 + Vite + Tailwind + PWA)
      │
      ▼
Camada de API Serverless (/api)
      │  [Autenticação JWT / Sessão Segura / RBAC / Validação Zod]
      ▼
Camada de Domínio & ORM (Prisma Client)
      │  [Transações Atômicas, Índices e Integridade Referencial]
      ▼
Banco de Dados Relacional (PostgreSQL)
```

### Estrutura de Pastas

```text
concha-literaria/
├── .env.example              # Documentação das variáveis de ambiente
├── .gitignore                # Proteção de credenciais e caches
├── package.json              # Dependências e scripts de execução
├── tsconfig.json             # Configuração estrita do TypeScript
├── vercel.json               # Configuração de rewrites, headers e deploy Vercel
├── vite.config.ts            # Configuração do Vite e plugins
├── public/
│   ├── manifest.webmanifest  # Configuração de instalação PWA W3C
│   ├── sw.js                 # Service Worker (Cache estratégico e offline)
│   ├── favicon.svg           # Ícone vetorial da concha
│   └── icons.svg             # Sprites de ícones
├── api/                      # Endpoints serverless Vercel (Fases 2/3)
└── src/
    ├── components/
    │   ├── ui/               # Design System atômico (Button, Card, Input, Modal, Toast, Skeleton, EmptyState)
    │   ├── navigation/       # Header, Sidebar desktop e BottomNav mobile
    │   ├── books/            # Modais e cartões de livros da biblioteca
    │   └── quotes/           # OCR e visualizador de citações
    ├── context/              # Estado global estritamente necessário (Auth, Tema, Sessão ativa)
    ├── features/             # Módulos de domínio de negócio
    ├── hooks/                # Hooks customizados (useNetworkStatus, useReadingTimer, etc.)
    ├── lib/                  # Validações Zod, utilitários de data e formato
    ├── services/             # Integração com APIs externas (Google Books, Open Library, OCR)
    ├── types/                # Contratos e tipos TypeScript
    ├── views/                # Telas principais (Home, Biblioteca, Leitura, Descoberta, Perfil)
    ├── serviceWorkerRegistration.ts # Ciclo de vida do PWA
    ├── index.css             # Design Tokens (Claro, Escuro e Sépia)
    └── main.tsx              # Ponto de entrada da aplicação
```

---

## 3. Instalação e Desenvolvimento Local

### Pré-requisitos
- Node.js `v20+` (testado na `v24.18.0`)
- npm `v10+` (ou pnpm)
- Instância PostgreSQL (local ou remota via Neon/Supabase)

### Passo a Passo

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/Junior15DEVELOPER/concha-literaria.git
   cd concha-literaria
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   # No Windows PowerShell: npm.cmd install
   ```

3. **Configure as Variáveis de Ambiente:**
   Copie o arquivo de exemplo:
   ```bash
   cp .env.example .env
   ```
   Preencha os valores de `DATABASE_URL` e `AUTH_SECRET`.

4. **Inicie o Ambiente de Desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse a aplicação em: `http://localhost:5173`.

---

## 4. Banco de Dados, Migrations e Seed

O Concha Literária utiliza PostgreSQL com Prisma ORM:

- **Executar Migrations:**
  ```bash
  npx prisma migrate dev --name init
  ```
- **Gerar Prisma Client:**
  ```bash
  npx prisma generate
  ```
- **Popular Dados Iniciais para Desenvolvimento (Seed):**
  ```bash
  npx prisma db seed
  ```
  *(Nota: Dados fictícios de seed são executados exclusivamente em ambiente de desenvolvimento local, nunca em produção).*

---

## 5. Build e Deploy na Vercel

1. **Compilação e Verificação Estática:**
   ```bash
   npm run build
   ```
   O comando executa `tsc -b` para checagem estrita de tipos e gera o pacote estático otimizado em `/dist`.

2. **Deploy na Vercel:**
   - Conecte o repositório do GitHub na Vercel.
   - Configure o framework como **Vite**.
   - Defina as Variáveis de Ambiente no painel da Vercel (`DATABASE_URL`, `AUTH_SECRET`, etc.).
   - O arquivo `vercel.json` na raiz gerencia os rewrites de rotas SPA e o roteamento das Serverless Functions `/api`.

---

## 6. Recursos Específicos

- **Cronômetro de Leitura de Alta Precisão**:
  Não depende de `setInterval` ingênuo. Registra timestamps reais (`startedAt`, `pausedAt`, `resumedAt`), recalculando o tempo decorrido mesmo se o aparelho for bloqueado ou a aba for para segundo plano.
- **Scanner ISBN com ZXing**:
  Permite leitura direta via câmera e busca de metadados em lote via Google Books API e Open Library API.
- **Citações com OCR**:
  Permite fotografar trechos de páginas físicas. O texto é extraído pelo motor Tesseract.js e apresentado para revisão do leitor antes de salvar.
- **Respeito à Privacidade e Multiusuário**:
  Toda requisição valida o proprietário dos recursos (`resource.userId === session.userId`). Notas pessoais são privadas por padrão.
