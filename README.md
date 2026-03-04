<div align="center">

<img width="1200" height="475" alt="CondoVote Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# CondoVote

**Plataforma digital de gestão condominial e votação eletrônica**

[![Version](https://img.shields.io/badge/version-1.1.0.0-6366f1?style=flat-square)](./package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-BaaS-3ecf8e?style=flat-square&logo=supabase)](https://supabase.com/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646cff?style=flat-square&logo=vite)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/license-Proprietary-red?style=flat-square)](./LICENSE)

</div>

---

## 📋 Visão Geral

O **CondoVote** é uma solução SaaS completa para gestão condominial, desenvolvida para síndicos, moradores e administradores. A plataforma centraliza assembleias virtuais, votações eletrônicas, gestão de documentos, controle de moradores e monitoramento operacional em uma única interface moderna e responsiva.

### ✨ Funcionalidades Principais

| Módulo                  | Descrição                                                                                                         |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Assembleias**         | Criação e gestão de assembleias ordinárias e extraordinárias com suporte a formatos presencial, híbrido e virtual |
| **Votação Eletrônica**  | Sistema de votação auditável com registro de presença (check-in) e suporte a procurações                          |
| **Pautas (Topics)**     | Criação e publicação de pautas associadas às assembleias com controle de status                                   |
| **Documentos**          | Upload e gestão de Atas, Editais e Balancetes via Supabase Storage com URLs assinadas                             |
| **Monitor de Presença** | Painel em tempo real para controle de quórum durante assembleias                                                  |
| **Moradores**           | Cadastro e gerenciamento de residentes com controle de perfil e unidades                                          |
| **Saúde do Sistema**    | Painel AdminHealth com métricas operacionais e integridade do sistema                                             |
| **Multi-Tenant**        | Suporte a múltiplos condomínios gerenciados via painel Superadmin                                                 |
| **PWA**                 | Aplicativo instalável com suporte offline e Web Push Notifications                                                |

---

## 🏗️ Arquitetura

```
CondoVote/
├── src/
│   ├── pages/
│   │   ├── admin/          # Painel do Síndico (Dashboard, Assembleias, Tópicos, Docs, Monitor, Usuários, Saúde)
│   │   ├── resident/       # Portal do Morador (Home, Votação, CheckIn, Documentos, Perfil)
│   │   ├── auth/           # Autenticação (Login Admin, ForgotPassword, ResetPassword)
│   │   └── superadmin/     # Painel SuperAdmin (Condos, Managers, Overview)
│   ├── components/         # Componentes reutilizáveis (ConfirmDialog, ThemeToggle, etc.)
│   ├── contexts/           # AuthContext, ThemeContext
│   ├── hooks/              # Hooks customizados (useToast, useCondos, useRateLimit, usePaginatedQuery, etc.)
│   ├── services/           # Camada de serviços (assemblies, votes, topics, consent, gdpr)
│   ├── lib/
│   │   ├── supabase.ts     # Cliente Supabase
│   │   ├── database.types.ts # Tipos gerados via CLI do Supabase
│   │   └── storage.ts      # Utilitários para Supabase Storage
│   └── layouts/            # Layouts compartilhados
├── e2e/                    # Testes End-to-End com Playwright
├── .storybook/             # Configuração do Storybook
├── docs/
│   ├── adr/                # Architecture Decision Records
│   └── runbook.md          # Runbook operacional de produção
└── scripts/                # Scripts utilitários (geração de ícones PWA, etc.)
```

### Stack Tecnológica

| Camada               | Tecnologia                                   |
| -------------------- | -------------------------------------------- |
| **Frontend**         | React 19, TypeScript 5.8, Vite 6             |
| **Estilização**      | Tailwind CSS 4, Lucide React                 |
| **Backend / BaaS**   | Supabase (Auth, Database, Storage, Realtime) |
| **Animações**        | Motion (Framer Motion)                       |
| **Visualização**     | Recharts                                     |
| **PDF / Export**     | jsPDF, html2canvas                           |
| **Observabilidade**  | Sentry (Error Tracking, Performance)         |
| **PWA**              | vite-plugin-pwa, Workbox                     |
| **Testes Unitários** | Vitest, Testing Library                      |
| **Testes E2E**       | Playwright                                   |
| **Documentação**     | Storybook 10                                 |
| **Qualidade**        | ESLint, Husky, lint-staged                   |

---

## 🚀 Início Rápido

### Pré-requisitos

- **Node.js** ≥ 20.x
- **npm** ≥ 10.x
- Conta no [Supabase](https://supabase.com) (projeto configurado)

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/aissantos/CondoVote.git
cd CondoVote

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais
```

### Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Supabase
VITE_SUPABASE_URL=https://<seu-projeto>.supabase.co
VITE_SUPABASE_ANON_KEY=<sua-anon-key>

# Sentry (opcional — monitoramento de erros)
VITE_SENTRY_DSN=https://<seu-dsn>@sentry.io/<projeto>

# Web Push (opcional — notificações push)
VITE_VAPID_PUBLIC_KEY=<sua-vapid-key>
```

### Executar em Desenvolvimento

```bash
npm run dev
```

Acesse em: [http://localhost:5173](http://localhost:5173)

---

## 📦 Scripts Disponíveis

| Script                    | Descrição                                         |
| ------------------------- | ------------------------------------------------- |
| `npm run dev`             | Servidor de desenvolvimento com HMR               |
| `npm run build`           | Build de produção (inclui geração de ícones PWA)  |
| `npm run preview`         | Preview do build de produção                      |
| `npm run lint:ts`         | Verificação de tipos TypeScript (`tsc --noEmit`)  |
| `npm run lint:es`         | Linting com ESLint (zero warnings)                |
| `npm run lint`            | TS + ESLint combinados                            |
| `npm run validate`        | Pipeline CI completo: lint + cobertura de testes  |
| `npm run test`            | Executa os testes unitários                       |
| `npm run test:watch`      | Testes em modo watch                              |
| `npm run test:coverage`   | Testes com relatório de cobertura                 |
| `npm run test:e2e`        | Testes E2E com Playwright                         |
| `npm run gen:types`       | Gera tipos TypeScript a partir do schema Supabase |
| `npm run storybook`       | Inicia o Storybook na porta 6006                  |
| `npm run build-storybook` | Build estático do Storybook                       |

---

## 🗄️ Banco de Dados

O banco de dados é gerenciado pelo Supabase (PostgreSQL). Para atualizar os tipos TypeScript após alterações no schema:

```bash
npm run gen:types
```

Este comando gera `src/lib/database.types.ts` com os tipos correspondentes ao schema público do seu projeto Supabase.

### Principais Tabelas

| Tabela               | Descrição                                           |
| -------------------- | --------------------------------------------------- |
| `condos`             | Condomínios cadastrados (multi-tenant)              |
| `profiles`           | Perfis de usuários (moradores, admins, superadmins) |
| `assemblies`         | Assembleias (ordinárias e extraordinárias)          |
| `topics`             | Pautas das assembleias                              |
| `votes`              | Registros de votos individuais                      |
| `assembly_documents` | Documentos anexados às assembleias                  |
| `check_ins`          | Registro de presença nas assembleias                |
| `notifications`      | Notificações push (Web Push)                        |

---

## 🔐 Autenticação e Segurança

- **Auth via Supabase**: Email/Senha + OAuth Google
- **Row Level Security (RLS)**: Todas as tabelas possuem políticas RLS ativas
- **RBAC**: Três níveis de acesso (`RESIDENT`, `ADMIN`, `SUPERADMIN`) controlados via `profiles.role`
- **Rate Limiting**: Hook `useRateLimit` previne abuso nas telas de login
- **GDPR / LGPD**: Módulo de consentimento funcional com registro auditável
- **Sentry**: Captura de erros e rastreamento de performance em produção

---

## 🧪 Testes

```bash
# Unitários e de integração
npm run test:coverage

# E2E (requer Playwright instalado)
npx playwright install
npm run test:e2e
```

A cobertura mínima exigida pelo CI é de **30%**.

---

## 📖 Documentação Viva

- **Storybook**: Catálogo interativo de componentes (`npm run storybook`)
- **ADRs** (`docs/adr/`): Architecture Decision Records documentando decisões técnicas significativas
- **Runbook** (`docs/runbook.md`): Guia operacional para produção, alertas e troubleshooting

---

## 🔄 CI/CD e Qualidade

O projeto utiliza **Husky** + **lint-staged** para gates de qualidade em cada commit:

```bash
# O pipeline de validação completo roda:
npm run validate   # lint:ts + lint:es + test:coverage
```

O Git hook `pre-commit` executa ESLint e TypeScript automaticamente nos arquivos staged antes de cada commit.

---

## 📁 Padrões de Código

- **TypeScript estrito** — sem `any` implícito ou explícito desnecessário
- **Tipos do Supabase** — payloads de insert/update usam `Database['public']['Tables'][table]['Insert']`
- **Hooks encapsulados** — lógica de estado em hooks customizados (`useCondos`, `useToast`, etc.)
- **Serviços desacoplados** — chamadas ao Supabase centralizadas em `src/services/`
- **ESLint zero-warnings** — `--max-warnings 0` no CI

---

## 🗺️ Roadmap

| Versão      | Status       | Destaques                                                        |
| ----------- | ------------ | ---------------------------------------------------------------- |
| **1.0.0**   | ✅ Concluído | MVP: Auth, Assembleias, Votação, Documentos                      |
| **1.1.0.0** | ✅ Atual     | DX, CI/CD, PWA, Sentry, E2E, Storybook, ADRs, Runbook            |
| **1.2.0**   | 🔜 Planejado | Relatórios PDF avançados, Integração bancária, App mobile nativo |

---

## 🤝 Contribuindo

Este é um projeto proprietário da **Versix Solutions**. Contribuições externas estão sujeitas a revisão e aprovação. Para reportar bugs ou sugerir funcionalidades, abra uma Issue no repositório.

---

## 📄 Licença

Propriedade de **Versix Solutions** — Todos os direitos reservados.

---

<div align="center">

Feito com ❤️ por **Versix Solutions**

</div>
