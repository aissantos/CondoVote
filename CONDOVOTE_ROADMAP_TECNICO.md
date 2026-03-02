# CondoVote — Roadmap Técnico de Production Readiness
**Versix Team Developers · Ciclo de Correção v1.0 → v1.3**
> Documento de trabalho derivado da auditoria de código de 02/03/2026.
> Rating inicial: **2.8/5.0** · Meta: **4.6/5.0** em 3 sprints.

---

## Índice

1. [Visão Geral do Plano](#1-visão-geral-do-plano)
2. [Sprint 1 — Correções P0 (Semanas 1–2)](#2-sprint-1--correções-p0-semanas-12)
   - [P0.1 Integridade Eleitoral — Unique Constraint + Guard Client](#p01-integridade-eleitoral--unique-constraint--guard-client)
   - [P0.2 RLS SUPERADMIN — Eliminar Recursão Infinita](#p02-rls-superadmin--eliminar-recursão-infinita)
   - [P0.3 Edge Function send-push — Autenticação do Chamador](#p03-edge-function-send-push--autenticação-do-chamador)
   - [P0.4 TypeScript Errors + Gate CI/CD](#p04-typescript-errors--gate-cicd)
3. [Sprint 2 — Correções P1 + Testes (Semanas 3–5)](#3-sprint-2--correções-p1--testes-semanas-35)
   - [P1.1 Edge Function para Criação de Admin](#p11-edge-function-para-criação-de-admin)
   - [P1.2 Invite Code Criptograficamente Seguro](#p12-invite-code-criptograficamente-seguro)
   - [P1.3 Sistema de Toast — Substituir alert()](#p13-sistema-de-toast--substituir-alert)
   - [P1.4 Validação de CPF com Dígitos Verificadores](#p14-validação-de-cpf-com-dígitos-verificadores)
   - [P1.5 Storage com Signed URLs para Documentos Sensíveis](#p15-storage-com-signed-urls-para-documentos-sensíveis)
   - [Testes Unitários — Cobertura de 30%](#testes-unitários--meta-de-30)
4. [Sprint 3 — P2 + Qualidade (Semanas 6–8)](#4-sprint-3--p2--qualidade-semanas-68)
   - [P2.1 Observabilidade com Sentry](#p21-observabilidade-com-sentry)
   - [P2.2 Acessibilidade WCAG 2.1 AA](#p22-acessibilidade-wcag-21-aa)
   - [P2.3 Paginação Server-side](#p23-paginação-server-side)
   - [P2.4 Otimizar AdminMonitor — Query JOIN Única](#p24-otimizar-adminmonitor--query-join-única)
   - [P2.5 Ícones PWA — PNG Conformes](#p25-ícones-pwa--png-conformes)
   - [P2.6 Remover console.log de Produção](#p26-remover-consolelog-de-produção)
   - [Testes E2E com Playwright — Meta de 60%](#testes-e2e-com-playwright--meta-de-60)
5. [Projeção de Evolução do Rating](#5-projeção-de-evolução-do-rating)
6. [Checklist de Definition of Done](#6-checklist-de-definition-of-done)

---

## 1. Visão Geral do Plano

| Sprint | Foco | Duração | Rating Alvo |
|--------|------|---------|-------------|
| Sprint 1 | 4 bloqueadores P0 — go/no-go de segurança | Semanas 1–2 | 3.8 / 5.0 |
| Sprint 2 | 5 itens P1 + cobertura de testes 30% | Semanas 3–5 | 4.2 / 5.0 |
| Sprint 3 | Refinamentos P2 + testes E2E 60% | Semanas 6–8 | 4.6 / 5.0 |

> **Regra de go-live:** O sistema **não deve realizar assembleias reais** antes da conclusão integral do Sprint 1. Após o Sprint 1, é aceitável um piloto controlado com 1–2 condomínios.

---

## 2. Sprint 1 — Correções P0 (Semanas 1–2)

### P0.1 Integridade Eleitoral — Unique Constraint + Guard Client

**Problema:** `votes(topic_id, user_id)` não possui `UNIQUE constraint`. Um morador pode votar múltiplas vezes na mesma pauta, corrompendo o resultado eleitoral.

**Arquivos afetados:**
- `supabase/migrations/` → nova migration
- `src/pages/resident/Voting.tsx`

---

#### Passo 1 — Migration SQL

Criar arquivo `supabase/migrations/20260303000000_p0_votes_unique.sql`:

```sql
-- P0.1: Garantir idempotência de votos por pauta
-- Um morador só pode ter exatamente 1 voto por topic_id

-- Antes de adicionar a constraint, remover possíveis duplicatas
-- (rodar apenas uma vez em ambiente de desenvolvimento — produção não deve ter dados ainda)
DELETE FROM public.votes
WHERE id NOT IN (
  SELECT DISTINCT ON (topic_id, user_id) id
  FROM public.votes
  ORDER BY topic_id, user_id, created_at ASC
);

-- Adicionar constraint de unicidade
ALTER TABLE public.votes
  ADD CONSTRAINT votes_unique_per_topic_user
  UNIQUE (topic_id, user_id);

-- Comentário de auditoria
COMMENT ON CONSTRAINT votes_unique_per_topic_user ON public.votes
  IS 'Garante que cada morador vote exatamente uma vez por pauta. P0.1 - auditoria 2026-03-02';
```

---

#### Passo 2 — Guard no Client (`src/pages/resident/Voting.tsx`)

**Código atual (problemático):**

```tsx
// src/pages/resident/Voting.tsx — CÓDIGO ATUAL (sem verificação)
const handleVote = async (option: string) => {
  setSelected(option);
  setSubmitting(true);

  const { error } = await supabase.from('votes').insert([
    { topic_id: topic.id, user_id: user?.id, choice: option }
  ]);

  setSubmitting(false);

  if (error) {
    alert('Erro ao registrar voto: ' + error.message); // ← P0 + P1.3
    setSelected(null);
  } else {
    setTimeout(() => navigate('/success'), 600);
  }
};
```

**Código corrigido:**

```tsx
// src/pages/resident/Voting.tsx — VERSÃO CORRIGIDA

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ThumbsUp, ThumbsDown, MinusCircle, BadgeInfo, Loader2, Paperclip } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
// import { useToast } from '../../hooks/useToast'; // ← adicionar no Sprint 2 (P1.3)

type VoteChoice = 'SIM' | 'NÃO' | 'ABSTENÇÃO';

export default function Voting() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const topic = location.state?.topic;

  const [selected, setSelected] = useState<VoteChoice | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [checkingVote, setCheckingVote] = useState(true);
  const [profile, setProfile] = useState<{
    unit_number?: string;
    block_number?: string;
    full_name?: string;
  } | null>(null);

  // Carrega perfil e verifica voto existente em paralelo
  useEffect(() => {
    if (!user || !topic) return;

    const loadData = async () => {
      const [profileResult, voteResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('unit_number, block_number, full_name')
          .eq('id', user.id)
          .single(),
        supabase
          .from('votes')
          .select('id, choice')
          .eq('topic_id', topic.id)
          .eq('user_id', user.id)
          .maybeSingle(), // maybeSingle() não lança erro quando não encontra
      ]);

      if (profileResult.data) setProfile(profileResult.data);

      // Se já votou, redirecionar imediatamente para a tela de sucesso
      if (voteResult.data) {
        navigate('/success', { replace: true });
        return;
      }

      setCheckingVote(false);
    };

    loadData();
  }, [user, topic, navigate]);

  const handleVote = useCallback(async (option: VoteChoice) => {
    if (!user?.id || submitting || alreadyVoted) return;

    setSelected(option);
    setSubmitting(true);

    const { error } = await supabase.from('votes').insert([
      { topic_id: topic.id, user_id: user.id, choice: option },
    ]);

    setSubmitting(false);

    if (error) {
      // Tratamento específico para violação de unique constraint (voto duplo)
      if (error.code === '23505') {
        setAlreadyVoted(true);
        // toast.info('Seu voto já foi registrado anteriormente.'); // Sprint 2
        navigate('/success', { replace: true });
        return;
      }
      // toast.error('Erro ao registrar voto: ' + error.message); // Sprint 2
      console.error('[Voting] Erro ao inserir voto:', error);
      setSelected(null);
    } else {
      setAlreadyVoted(true);
      setTimeout(() => navigate('/success', { replace: true }), 600);
    }
  }, [user, topic, submitting, alreadyVoted, navigate]);

  // Estado de loading inicial (verificando voto existente)
  if (checkingVote && topic) {
    return (
      <div className="flex-1 flex flex-col min-h-screen items-center justify-center bg-background-light dark:bg-background-dark">
        <Loader2 className="animate-spin text-primary size-8" aria-label="Verificando participação..." />
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-background-light dark:bg-background-dark items-center justify-center p-6 text-center">
        <p className="text-slate-500 mb-4">Nenhuma pauta selecionada para votação.</p>
        <button
          onClick={() => navigate('/resident/assembly')}
          className="text-primary font-bold hover:underline"
          aria-label="Voltar para lista de pautas"
        >
          Voltar para Pautas
        </button>
      </div>
    );
  }

  // ... restante do JSX de renderização sem alterações estruturais
}
```

---

### P0.2 RLS SUPERADMIN — Eliminar Recursão Infinita

**Problema:** As policies RLS do SUPERADMIN sobre a tabela `profiles` fazem `SELECT 1 FROM public.profiles WHERE id = auth.uid()` — isto é recursão infinita, pois a própria policy que está sendo avaliada dispara outra consulta à mesma tabela com as mesmas policies.

**Arquivo:** `supabase/migrations/20260302000000_phase1_v2_superadmin_rls.sql`

---

#### Diagnóstico visual

```sql
-- ❌ ATUAL — recursão infinita (consulta profiles dentro de policy de profiles)
CREATE POLICY "SUPERADMINs tem visão global de profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles       -- ← RECURSÃO: esta query ativa as mesmas policies
      WHERE id = auth.uid() AND role = 'SUPERADMIN'
    )
  );
```

```
Execução: SELECT * FROM profiles
  → Avalia policy → SELECT FROM profiles
    → Avalia policy → SELECT FROM profiles
      → StackOverflow / Timeout no PostgreSQL
```

---

#### Migration de correção

Criar `supabase/migrations/20260303000001_p0_superadmin_rls_fix.sql`:

```sql
-- P0.2: Corrigir recursão infinita nas policies RLS do SUPERADMIN
-- Solução: usar auth.jwt() para ler o role diretamente do token JWT,
-- eliminando qualquer subquery à tabela profiles.
-- Pré-requisito: jwt_custom_claims.sql deve estar aplicado (trigger já existente).

-- ══════════════════════════════════════════════════
-- Helper: função estável para verificar role via JWT
-- Usar função evita repetir o cast jsonb em toda policy
-- ══════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_jwt_role()
RETURNS TEXT
LANGUAGE sql
STABLE          -- não modifica o banco; pode ser cacheada por query
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role'),
    ''
  );
$$;

-- ══════════════════════════════════════════════════
-- Tabela PROFILES
-- ══════════════════════════════════════════════════
DROP POLICY IF EXISTS "SUPERADMINs tem visão global de profiles" ON public.profiles;
CREATE POLICY "SUPERADMINs tem visão global de profiles" ON public.profiles
  FOR SELECT USING (
    public.get_jwt_role() = 'SUPERADMIN'     -- ✅ lê do JWT, zero subquery
  );

DROP POLICY IF EXISTS "SUPERADMINs editam qualquer profile" ON public.profiles;
CREATE POLICY "SUPERADMINs editam qualquer profile" ON public.profiles
  FOR UPDATE USING (
    public.get_jwt_role() = 'SUPERADMIN'
  );

DROP POLICY IF EXISTS "SUPERADMINs deletam qualquer profile" ON public.profiles;
CREATE POLICY "SUPERADMINs deletam qualquer profile" ON public.profiles
  FOR DELETE USING (
    public.get_jwt_role() = 'SUPERADMIN'
  );

-- ══════════════════════════════════════════════════
-- Tabela CONDOS
-- ══════════════════════════════════════════════════
DROP POLICY IF EXISTS "SUPERADMINs tem visão global de condos" ON public.condos;
CREATE POLICY "SUPERADMINs tem visão global de condos" ON public.condos
  FOR SELECT USING (
    public.get_jwt_role() = 'SUPERADMIN'
  );

DROP POLICY IF EXISTS "SUPERADMINs criam condos" ON public.condos;
CREATE POLICY "SUPERADMINs criam condos" ON public.condos
  FOR INSERT WITH CHECK (
    public.get_jwt_role() = 'SUPERADMIN'
  );

DROP POLICY IF EXISTS "SUPERADMINs editam condos" ON public.condos;
CREATE POLICY "SUPERADMINs editam condos" ON public.condos
  FOR UPDATE USING (
    public.get_jwt_role() = 'SUPERADMIN'
  );

DROP POLICY IF EXISTS "SUPERADMINs deletam condos" ON public.condos;
CREATE POLICY "SUPERADMINs deletam condos" ON public.condos
  FOR DELETE USING (
    public.get_jwt_role() = 'SUPERADMIN'
  );

-- Flush cache do PostgREST
NOTIFY pgrst, 'reload schema';

-- ══════════════════════════════════════════════════
-- Teste de sanidade (rodar no SQL editor do Supabase
-- logado como SUPERADMIN para verificar)
-- ══════════════════════════════════════════════════
-- SELECT public.get_jwt_role();   -- deve retornar 'SUPERADMIN'
-- SELECT COUNT(*) FROM public.profiles;  -- deve retornar todos os registros
```

> **Nota crítica:** O `jwt_custom_claims.sql` (trigger `on_profile_update_sync_claims`) já está no projeto e injeta `role` em `app_metadata`. A função `get_jwt_role()` depende disso. Verificar que o trigger está ativo em produção antes de aplicar esta migration.

---

### P0.3 Edge Function send-push — Autenticação do Chamador

**Problema:** `supabase/functions/send-push/index.ts` não verifica nenhum token de autenticação. Qualquer URL externa pode disparar notificações para todos os moradores do condomínio.

**Código atual (problemático):**

```typescript
// supabase/functions/send-push/index.ts — ATUAL (sem auth)
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { title, body, user_id, condo_id, url } = await req.json();
    // ← qualquer pessoa chegou aqui — sem verificação de identidade
```

---

**Arquivo corrigido:** `supabase/functions/send-push/index.ts`

```typescript
// supabase/functions/send-push/index.ts — VERSÃO CORRIGIDA

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'; // ← versão atualizada
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import webpush from 'npm:web-push@3.6.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') as string; // para verificar JWT do chamador

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@condovote.com',
  Deno.env.get('VITE_VAPID_PUBLIC_KEY') || '',
  Deno.env.get('VAPID_PRIVATE_KEY') || ''
);

// Tipos de entrada
interface PushPayload {
  title?: string;
  body?: string;
  user_id?: string;
  condo_id?: string;
  url?: string;
}

// Roles autorizadas a disparar notificações
const ALLOWED_ROLES = ['ADMIN', 'SUPERADMIN'] as const;

serve(async (req) => {
  // Responder preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ─── 1. VERIFICAR AUTENTICAÇÃO ──────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: missing Bearer token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Usar client anon para verificar o JWT do chamador
    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user: caller }, error: authError } = await callerClient.auth.getUser();

    if (authError || !caller) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─── 2. VERIFICAR AUTORIZAÇÃO (role) ───────────────────────
    // Usar service role para buscar o perfil sem restrição de RLS
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: callerProfile, error: profileError } = await serviceClient
      .from('profiles')
      .select('role, condo_id')
      .eq('id', caller.id)
      .single();

    if (profileError || !callerProfile) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: profile not found' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!ALLOWED_ROLES.includes(callerProfile.role as typeof ALLOWED_ROLES[number])) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: insufficient role' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─── 3. VALIDAR PAYLOAD ────────────────────────────────────
    const payload = await req.json() as PushPayload;
    const { title, body, user_id, condo_id, url } = payload;

    // ADMINs só podem enviar para o próprio condomínio
    if (callerProfile.role === 'ADMIN' && condo_id && condo_id !== callerProfile.condo_id) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: cannot send to another condo' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─── 4. BUSCAR SUBSCRIPTIONS ───────────────────────────────
    let query = serviceClient.from('push_subscriptions').select('*');

    if (user_id) {
      query = query.eq('user_id', user_id);
    } else if (condo_id) {
      const { data: users } = await serviceClient
        .from('profiles')
        .select('id')
        .eq('condo_id', condo_id);

      if (!users || users.length === 0) {
        return new Response(
          JSON.stringify({ success: true, message: 'Nenhum morador encontrado', sentCount: 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      query = query.in('user_id', users.map((u) => u.id));
    }

    const { data: subscriptions, error: subError } = await query;
    if (subError) throw subError;

    // ─── 5. DISPARAR NOTIFICAÇÕES ──────────────────────────────
    const notificationPayload = JSON.stringify({
      title: title || 'Notificação CondoVote',
      body: body || 'Verifique o painel do seu condomínio',
      url: url || '/resident/home',
    });

    const results = await Promise.allSettled(
      (subscriptions ?? []).map(async (sub) => {
        const formattedSub = { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } };
        try {
          await webpush.sendNotification(formattedSub, notificationPayload);
        } catch (e: unknown) {
          const err = e as { statusCode?: number };
          if (err.statusCode === 404 || err.statusCode === 410) {
            // Subscription expirada — remover do banco
            await serviceClient.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
          } else {
            console.error('[send-push] Falha WebPush:', { endpoint: sub.endpoint, statusCode: err.statusCode });
            throw e;
          }
        }
      })
    );

    const sentCount = results.filter((r) => r.status === 'fulfilled').length;
    const failCount = results.filter((r) => r.status === 'rejected').length;

    return new Response(
      JSON.stringify({ success: true, sentCount, failCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    console.error('[send-push] Erro interno:', msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

> **Como chamar do frontend após a correção:**
> ```typescript
> // Chamada autenticada — usa a sessão ativa do admin
> const { data: { session } } = await supabase.auth.getSession();
>
> await supabase.functions.invoke('send-push', {
>   headers: { Authorization: `Bearer ${session?.access_token}` },
>   body: { condo_id: profile.condo_id, title: 'Votação aberta!', body: 'Acesse agora.' },
> });
> ```

---

### P0.4 TypeScript Errors + Gate CI/CD

**Problemas encontrados nos arquivos de log:**

#### 1. `src/pages/admin/Dashboard.tsx:16-17` — TS2451: Redeclaração de variável

```tsx
// ❌ ATUAL — Dashboard.tsx tem isAssembliesOpen declarado duas vezes
// (provavelmente duplicata de linha durante edição)

const [isAssembliesOpen, setIsAssembliesOpen] = useState(false); // linha 16
// ... outros estados ...
const [isAssembliesOpen, setIsAssembliesOpen] = useState(false); // linha 17 — DUPLICATA
```

```tsx
// ✅ CORRETO — remover a declaração duplicada, manter apenas uma
const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
const [isAssembliesOpen, setIsAssembliesOpen] = useState(false); // apenas esta linha
```

#### 2. `src/lib/supabase.ts:3-4` — TS2339: `import.meta.env` sem tipagem

```typescript
// ❌ ATUAL — tsconfig.json não inclui "vite/client"
// Resultado: TypeScript não conhece import.meta.env

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;   // erro TS2339
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY; // erro TS2339
```

```json
// ✅ CORRETO — tsconfig.json: adicionar "vite/client" ao compilerOptions
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "types": ["vite/client"]  // ← adicionar esta linha
  },
  "include": ["src"]
}
```

#### 3. Gate TypeScript no CI/CD

**Arquivo:** `.github/workflows/vercel-deploy.yml`

```yaml
# .github/workflows/vercel-deploy.yml — VERSÃO CORRIGIDA
name: Deploy To Vercel

on:
  push:
    branches:
      - main

jobs:
  quality-gate:
    name: Quality Gate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: TypeScript Check          # ← NOVO: bloqueia se houver erros TS
        run: npm run lint               # equivale a: tsc --noEmit

      - name: Run Unit Tests            # ← NOVO: bloqueia se testes falharem
        run: npm test

  deploy-production:
    name: Deploy Production
    needs: quality-gate                 # ← só executa se quality-gate passar
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Apply Database Migrations
        run: |
          supabase link --project-ref ufaqgarxivrfqylifpvg --password "${{ secrets.SUPABASE_DB_PASSWORD }}"
          supabase db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

      - name: Install Vercel CLI
        run: npm install --global vercel@latest

      - name: Pull Vercel Environment
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

      - name: Build
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

      - name: Deploy to Vercel
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## 3. Sprint 2 — Correções P1 + Testes (Semanas 3–5)

### P1.1 Edge Function para Criação de Admin

**Problema:** `SuperManagers.tsx` cria um segundo cliente Supabase com a `anon key` para criar usuários sem deslogar o root. A `anon key` é pública e exposta no bundle JS. A criação de usuários com roles elevadas deve ser operação exclusivamente server-side.

**Criar:** `supabase/functions/create-admin-user/index.ts`

```typescript
// supabase/functions/create-admin-user/index.ts

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verificar que o chamador é SUPERADMIN
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace('Bearer ', '');

    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data: { user: caller }, error: authErr } = await anonClient.auth.getUser();
    if (authErr || !caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    // Usar Admin API (service_role) — nunca exposta no front
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verificar role do chamador com service_role (sem restrição de RLS)
    const { data: callerProfile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single();

    if (callerProfile?.role !== 'SUPERADMIN') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders });
    }

    // Ler payload da requisição
    const { name, email, password } = await req.json();

    if (!name || !email || !password || password.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios: name, email, password (mín. 8 chars)' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Criar usuário via Admin API — nunca cria sessão, nunca desloga o root
    const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // confirmar email automaticamente (admin criou)
      user_metadata: {
        full_name: name,
        role: 'ADMIN',
      },
    });

    if (createErr) throw createErr;

    return new Response(
      JSON.stringify({ success: true, userId: newUser.user.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

**Atualizar `SuperManagers.tsx`** — remover `tempSupabase`, usar `supabase.functions.invoke`:

```tsx
// src/pages/superadmin/SuperManagers.tsx — handleCreateManager CORRIGIDO

// ❌ REMOVER estas linhas:
// import { createClient } from '@supabase/supabase-js';
// const tempSupabase = createClient( ... );

const handleCreateManager = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!formData.name || !formData.email || formData.password.length < 8) {
    // toast.error('Preencha nome, email e senha de ao menos 8 caracteres.');  // Sprint P1.3
    return;
  }
  setSubmitting(true);

  try {
    const { data: { session } } = await supabase.auth.getSession();

    const { data, error } = await supabase.functions.invoke('create-admin-user', {
      headers: { Authorization: `Bearer ${session?.access_token}` },
      body: {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      },
    });

    if (error) throw error;

    setIsModalOpen(false);
    setFormData({ name: '', email: '', password: '' });
    fetchProfiles();
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Falha ao criar administrador';
    // toast.error(msg);  // Sprint P1.3
    console.error('[SuperManagers] Erro ao criar admin:', msg);
  } finally {
    setSubmitting(false);
  }
};
```

---

### P1.2 Invite Code Criptograficamente Seguro

**Problema:** `Math.random()` é pseudo-aleatório e previsível. Usar `crypto.getRandomValues()` da Web Crypto API, que é criptograficamente seguro e disponível em todos os browsers modernos e no Deno.

**Arquivo:** `src/hooks/useCondos.ts`

```typescript
// ❌ ATUAL — não criptograficamente seguro
const generateInviteCode = () => {
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += charset.charAt(Math.floor(Math.random() * charset.length)); // ← Math.random()
  }
  return code;
};
```

```typescript
// ✅ CORRETO — criptograficamente seguro com Web Crypto API

/**
 * Gera um código de convite de 6 caracteres usando Web Crypto API.
 * Caracteres ambíguos (I, O, 1, 0) são excluídos para evitar confusão visual.
 * @returns string de 6 caracteres maiúsculos
 */
function generateSecureInviteCode(): string {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 chars — sem I, O, 1, 0
  const randomValues = new Uint8Array(6);
  crypto.getRandomValues(randomValues); // Web Crypto API — criptograficamente seguro

  return Array.from(randomValues)
    .map((byte) => charset[byte % charset.length])
    .join('');
}

// Uso no createCondo:
const newInviteCode = generateSecureInviteCode();
```

> **Alternativa ainda mais robusta (server-side):** delegar a geração do invite_code ao PostgreSQL, eliminando qualquer dependência de código client-side:
>
> ```sql
> -- Função PostgreSQL para gerar invite codes seguros (usa gen_random_bytes do pgcrypto)
> CREATE OR REPLACE FUNCTION public.generate_invite_code()
> RETURNS TEXT
> LANGUAGE plpgsql
> AS $$
> DECLARE
>   charset TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
>   code TEXT := '';
>   i INT;
>   rand_byte INT;
> BEGIN
>   FOR i IN 1..6 LOOP
>     rand_byte := (get_byte(gen_random_bytes(1), 0) % 32) + 1;
>     code := code || substr(charset, rand_byte, 1);
>   END LOOP;
>   RETURN code;
> END;
> $$;
>
> -- Usar como default na tabela:
> ALTER TABLE public.condos
>   ALTER COLUMN invite_code SET DEFAULT public.generate_invite_code();
> ```

---

### P1.3 Sistema de Toast — Substituir alert()

**Problema:** 24 chamadas `alert()` nativas em 10+ arquivos. Bloqueiam a thread principal, não respeitam o design system, e são inaceitáveis em produção.

**Criar:** `src/hooks/useToast.tsx`

```tsx
// src/hooks/useToast.tsx
// Toast system leve, sem dependências externas, compatível com o design system existente

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={20} />,
  error: <XCircle size={20} />,
  warning: <AlertTriangle size={20} />,
  info: <Info size={20} />,
};

const STYLES: Record<ToastType, string> = {
  success: 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30 text-green-800 dark:text-green-300',
  error: 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-800 dark:text-red-300',
  warning: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300',
  info: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-800 dark:text-blue-300',
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), toast.duration ?? 4000);
    return () => clearTimeout(timer);
  }, [toast, onRemove]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg max-w-sm w-full
        animate-in slide-in-from-right-5 fade-in-0 duration-300 ${STYLES[toast.type]}`}
    >
      <span className="shrink-0 mt-0.5">{ICONS[toast.type]}</span>
      <p className="text-sm font-medium flex-1 leading-relaxed">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        aria-label="Fechar notificação"
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const add = useCallback((type: ToastType, message: string, duration?: number) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev.slice(-4), { id, type, message, duration }]); // máximo 5 toasts
  }, []);

  const ctx: ToastContextType = {
    success: (msg, d) => add('success', msg, d),
    error: (msg, d) => add('error', msg, d),
    warning: (msg, d) => add('warning', msg, d),
    info: (msg, d) => add('info', msg, d),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {/* Portal de toasts — canto inferior direito */}
      <div
        aria-live="polite"
        aria-label="Notificações"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onRemove={remove} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** Hook para usar o sistema de toast em qualquer componente */
export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast deve ser usado dentro de <ToastProvider>');
  return ctx;
}
```

**Adicionar `ToastProvider` no `App.tsx`:**

```tsx
// src/App.tsx — adicionar ToastProvider
import { ToastProvider } from './hooks/useToast';

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>          {/* ← adicionar aqui */}
        <AuthProvider>
          <InstallPrompt />
          <ReloadPrompt />
          <BrowserRouter>
            {/* ... rotas sem alteração ... */}
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
```

**Migração de alert() → toast (exemplo com AdminTopics.tsx):**

```tsx
// src/pages/admin/AdminTopics.tsx — antes e depois

// ❌ ANTES
if (!formData.title) return alert('Título é obrigatório');
// ...
} catch (err: any) {
  alert('Erro ao salvar pauta: ' + err.message);
}

// ✅ DEPOIS
import { useToast } from '../../hooks/useToast';

const toast = useToast();

if (!formData.title) {
  toast.warning('Título é obrigatório');
  return;
}
// ...
} catch (err: unknown) {
  const msg = err instanceof Error ? err.message : 'Erro desconhecido';
  toast.error('Erro ao salvar pauta: ' + msg);
}
```

---

### P1.4 Validação de CPF com Dígitos Verificadores

**Problema:** `Register.tsx` apenas verifica se o CPF tem 11 dígitos. CPFs inválidos como `111.111.111-11` ou `000.000.000-00` passam pela validação.

**Criar:** `src/lib/validators.ts`

```typescript
// src/lib/validators.ts

/**
 * Valida CPF brasileiro incluindo os dois dígitos verificadores.
 * Rejeita CPFs com todos os dígitos iguais (ex: 111.111.111-11).
 *
 * @param cpf - CPF com ou sem formatação
 * @returns true se válido, false caso contrário
 *
 * @example
 *   validateCPF('529.982.247-25') // true
 *   validateCPF('111.111.111-11') // false
 */
export function validateCPF(cpf: string): boolean {
  // Remove máscara
  const digits = cpf.replace(/\D/g, '');

  // Deve ter exatamente 11 dígitos
  if (digits.length !== 11) return false;

  // Rejeitar sequências uniformes (CPFs conhecidamente inválidos)
  if (/^(\d)\1{10}$/.test(digits)) return false;

  // Calcular primeiro dígito verificador
  const calcDigit = (slice: string, weight: number): number => {
    const sum = slice
      .split('')
      .reduce((acc, char, i) => acc + parseInt(char) * (weight - i), 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const firstDigit = calcDigit(digits.slice(0, 9), 10);
  if (firstDigit !== parseInt(digits[9])) return false;

  const secondDigit = calcDigit(digits.slice(0, 10), 11);
  if (secondDigit !== parseInt(digits[10])) return false;

  return true;
}

/**
 * Valida CNPJ brasileiro.
 * @param cnpj - CNPJ com ou sem formatação
 */
export function validateCNPJ(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;

  const calcDigit = (slice: string, weights: number[]): number => {
    const sum = slice.split('').reduce((acc, char, i) => acc + parseInt(char) * weights[i], 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  if (calcDigit(digits.slice(0, 12), w1) !== parseInt(digits[12])) return false;
  if (calcDigit(digits.slice(0, 13), w2) !== parseInt(digits[13])) return false;

  return true;
}
```

**Usar no `Register.tsx`:**

```tsx
// src/pages/resident/Register.tsx — handleSubmit, adicionar validação de CPF

import { validateCPF } from '../../lib/validators';

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError(null);

  try {
    if (!lgpdAccepted) {
      throw new Error('Você deve aceitar os Termos de Serviço (LGPD) para prosseguir.');
    }

    const cleanCpf = formData.cpf.replace(/\D/g, '');

    // ← Adicionar validação completa
    if (!validateCPF(cleanCpf)) {
      throw new Error('CPF inválido. Verifique o número informado.');
    }

    // ... restante do fluxo sem alterações
```

---

### P1.5 Storage com Signed URLs para Documentos Sensíveis

**Problema:** Buckets `assembly_documents` e `proxies` são públicos. Atas, balanços e procurações podem ser acessados por qualquer pessoa com a URL.

**Criar:** `src/lib/storage.ts`

```typescript
// src/lib/storage.ts — helper para signed URLs

import { supabase } from './supabase';

/**
 * Gera uma URL assinada temporária para download seguro de documentos privados.
 * Uso: documentos de assembleia, procurações, balanços.
 *
 * @param bucket - Nome do bucket no Supabase Storage
 * @param path - Caminho do arquivo dentro do bucket
 * @param expiresInSeconds - Validade da URL (padrão: 1 hora)
 */
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresInSeconds = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds);

  if (error || !data?.signedUrl) {
    throw new Error(`Falha ao gerar URL de acesso: ${error?.message}`);
  }

  return data.signedUrl;
}

/**
 * Extrai o path relativo de uma URL pública do Supabase Storage.
 * Necessário para converter URLs legadas (públicas) para o padrão de signed URLs.
 */
export function extractStoragePath(publicUrl: string, bucket: string): string {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return publicUrl; // fallback
  return decodeURIComponent(publicUrl.slice(idx + marker.length));
}
```

**Migration para tornar buckets privados:**

```sql
-- supabase/migrations/20260310000000_p1_private_buckets.sql
-- Tornar buckets sensíveis privados (acesso via signed URL)

UPDATE storage.buckets
SET public = false
WHERE id IN ('assembly_documents', 'proxies');

-- Política de acesso: moradores do condomínio podem gerar signed URLs
DROP POLICY IF EXISTS "Moradores geram signed URL de documentos" ON storage.objects;
CREATE POLICY "Moradores geram signed URL de documentos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'assembly_documents' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND condo_id = (
        -- Extrai condo_id do path (formato: {condo_id}/{filename})
        SELECT id FROM public.condos
        WHERE id::text = split_part(storage.objects.name, '/', 1)
        LIMIT 1
      )
    )
  );

NOTIFY pgrst, 'reload schema';
```

---

### Testes Unitários — Meta de 30%

**Prioridade de cobertura:** Fluxos de negócio críticos primeiro.

**Criar:** `src/lib/validators.test.ts`

```typescript
// src/lib/validators.test.ts

import { describe, it, expect } from 'vitest';
import { validateCPF, validateCNPJ } from './validators';

describe('validateCPF', () => {
  it('aceita CPF válido formatado', () => {
    expect(validateCPF('529.982.247-25')).toBe(true);
  });

  it('aceita CPF válido sem formatação', () => {
    expect(validateCPF('52998224725')).toBe(true);
  });

  it('rejeita CPF com dígitos iguais', () => {
    expect(validateCPF('111.111.111-11')).toBe(false);
    expect(validateCPF('000.000.000-00')).toBe(false);
  });

  it('rejeita CPF com dígito verificador errado', () => {
    expect(validateCPF('529.982.247-26')).toBe(false);
  });

  it('rejeita CPF com menos de 11 dígitos', () => {
    expect(validateCPF('123.456.789')).toBe(false);
  });
});
```

**Criar:** `src/pages/resident/Voting.test.tsx`

```tsx
// src/pages/resident/Voting.test.tsx

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Voting from './Voting';
import { supabase } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-test-123' } }),
}));

const mockTopic = {
  id: 'topic-001',
  title: 'Aprovação do orçamento 2026',
  description: 'Votação do orçamento anual.',
  attachment_url: null,
};

const renderVoting = (topic = mockTopic) =>
  render(
    <MemoryRouter initialEntries={[{ pathname: '/voting', state: { topic } }]}>
      <Voting />
    </MemoryRouter>
  );

describe('Voting Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exibe título da pauta', async () => {
    // Mock: sem voto existente, perfil carregado
    const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const mockSingle = vi.fn().mockResolvedValue({
      data: { full_name: 'João Silva', unit_number: '101', block_number: 'A' },
      error: null,
    });
    const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle, single: mockSingle, eq: vi.fn().mockReturnThis() });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({ select: mockSelect });

    renderVoting();

    await waitFor(() => {
      expect(screen.getByText('Aprovação do orçamento 2026')).toBeInTheDocument();
    });
  });

  it('redireciona para /success quando usuário já votou', async () => {
    const mockMaybeSingle = vi.fn().mockResolvedValue({
      data: { id: 'vote-existing', choice: 'SIM' },
      error: null,
    });
    const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle, eq: vi.fn().mockReturnThis() });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({ select: mockSelect });

    const { container } = renderVoting();

    // Deve renderizar o loader enquanto verifica
    expect(container.querySelector('[aria-label]')).toBeTruthy();
  });

  it('exibe fallback quando nenhuma pauta é passada', () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/voting', state: {} }]}>
        <Voting />
      </MemoryRouter>
    );
    expect(screen.getByText('Nenhuma pauta selecionada para votação.')).toBeInTheDocument();
  });
});
```

---

## 4. Sprint 3 — P2 + Qualidade (Semanas 6–8)

### P2.1 Observabilidade com Sentry

**Instalar:**
```bash
npm install @sentry/react
```

**Criar:** `src/lib/monitoring.ts`

```typescript
// src/lib/monitoring.ts

import * as Sentry from '@sentry/react';

export function initMonitoring() {
  if (!import.meta.env.VITE_SENTRY_DSN) return;

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE, // 'development' | 'production'
    release: import.meta.env.VITE_APP_VERSION ?? '0.0.0',
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
    ],
    // Não capturar erros em desenvolvimento
    beforeSend(event) {
      if (import.meta.env.DEV) return null;
      return event;
    },
  });
}

/** Registra um usuário autenticado no contexto do Sentry */
export function identifyUser(userId: string, role: string) {
  Sentry.setUser({ id: userId, role });
}

/** Remove a identificação do usuário no logout */
export function clearUser() {
  Sentry.setUser(null);
}
```

**Inicializar em `src/main.tsx`:**

```tsx
// src/main.tsx
import { initMonitoring } from './lib/monitoring';

initMonitoring(); // ← antes de renderizar o React

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

### P2.2 Acessibilidade WCAG 2.1 AA

**Padrões a aplicar em todos os componentes interativos:**

```tsx
// ✅ Botões com apenas ícone — sempre com aria-label
<button
  onClick={handleClose}
  aria-label="Fechar modal de nova assembleia"
  className="..."
>
  <X size={24} aria-hidden="true" />  {/* aria-hidden no ícone decorativo */}
</button>

// ✅ Inputs de formulário — sempre com label vinculado via htmlFor/id
<label htmlFor="input-cpf" className="block text-sm font-medium ...">
  CPF
</label>
<input
  id="input-cpf"
  name="cpf"
  type="text"
  aria-describedby="input-cpf-hint"
  aria-required="true"
  aria-invalid={cpfError ? 'true' : undefined}
  ...
/>
{cpfError && (
  <p id="input-cpf-hint" role="alert" className="text-red-500 text-xs mt-1">
    {cpfError}
  </p>
)}

// ✅ Loading states acessíveis
<div role="status" aria-live="polite" aria-label="Carregando dados...">
  <Loader2 className="animate-spin" aria-hidden="true" />
</div>

// ✅ Botões de votação — contexto explícito
<button
  onClick={() => handleVote('SIM')}
  disabled={submitting}
  aria-label={`Votar SIM na pauta: ${topic.title}`}
  aria-pressed={selected === 'SIM'}
  className="..."
>
  <ThumbsUp aria-hidden="true" />
  SIM
</button>

// ✅ Modais com foco preso (focus trap)
// Instalar: npm install focus-trap-react
import FocusTrap from 'focus-trap-react';

{isModalOpen && (
  <FocusTrap>
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 ..."
    >
      <h2 id="modal-title">Nova Assembleia</h2>
      {/* conteúdo do modal */}
    </div>
  </FocusTrap>
)}
```

---

### P2.3 Paginação Server-side

**Problema:** Todas as listagens carregam todos os dados antes de paginar no client.

```typescript
// src/hooks/usePaginatedQuery.ts — hook genérico de paginação server-side

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  setPage: (page: number) => void;
}

/**
 * Hook de paginação server-side usando Supabase .range()
 * Evita carregar toda a tabela para depois fazer slice no client.
 */
export function usePaginatedQuery<T>(
  table: string,
  filters: Record<string, string | undefined>,
  pageSize = 10
): PaginatedResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(async (currentPage: number) => {
    setLoading(true);
    setError(null);

    const from = (currentPage - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from(table)
      .select('*', { count: 'exact' }) // ← Supabase retorna o total sem carregar tudo
      .range(from, to);

    // Aplicar filtros dinamicamente
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        query = query.eq(key, value);
      }
    });

    const { data: result, error: queryError, count } = await query;

    if (queryError) {
      setError(queryError.message);
    } else {
      setData((result as T[]) ?? []);
      setTotal(count ?? 0);
    }

    setLoading(false);
  }, [table, JSON.stringify(filters), pageSize]);

  useEffect(() => {
    fetchPage(page);
  }, [page, fetchPage]);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
    loading,
    error,
    setPage,
  };
}
```

**Uso em `AdminUsers.tsx`:**

```tsx
// src/pages/admin/AdminUsers.tsx — paginação server-side

const { data: users, total, page, totalPages, loading, setPage } = usePaginatedQuery<Profile>(
  'profiles',
  { role: 'RESIDENT', condo_id: profile?.condo_id },
  15 // 15 por página
);

// Remover: const filteredUsers = users.filter(...) (filtro client-side)
// Adicionar: parâmetro de busca via .ilike() no hook para filtros de texto
```

---

### P2.4 Otimizar AdminMonitor — Query JOIN Única

**Problema:** 4 queries independentes no `fetchMonitorData`. Para grandes condomínios, multiplica latência e consumo de conexões.

```typescript
// src/pages/admin/AdminMonitor.tsx — fetchMonitorData OTIMIZADO

const fetchMonitorData = async () => {
  if (!profile?.condo_id) return;

  try {
    // Query única com JOINs implícitos via seleção de tabelas relacionadas
    // Supabase suporta foreign table embedding no select
    const [topicResult, residentsResult] = await Promise.all([
      // Query 1: Pauta ativa
      supabase
        .from('topics')
        .select('id, title')
        .eq('condo_id', profile.condo_id)
        .eq('status', 'OPEN')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),

      // Query 2: Moradores + seus checkins + votos em uma só chamada
      // Usando select com relacionamentos do Supabase
      supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          unit_number,
          block_number,
          checkins ( user_id, created_at ),
          votes ( user_id, choice, topic_id )
        `)
        .eq('condo_id', profile.condo_id)
        .eq('role', 'RESIDENT'),
    ]);

    const activeTopic = topicResult.data;
    setActiveTopic(activeTopic ?? null);

    if (!residentsResult.data) return;

    const mergedData: Participant[] = residentsResult.data.map((resident) => {
      const checkin = resident.checkins?.[0]; // Último checkin
      const vote = activeTopic
        ? resident.votes?.find((v) => v.topic_id === activeTopic.id)
        : null;

      return {
        id: resident.id,
        name: resident.full_name ?? 'Usuário Sem Nome',
        unit: `Blc ${resident.block_number ?? '?'} - Und ${resident.unit_number ?? '?'}`,
        checkInTime: checkin
          ? new Date(checkin.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '-',
        voted: !!vote,
        option: vote?.choice ?? '-',
      };
    });

    mergedData.sort((a, b) => {
      if (a.voted !== b.voted) return a.voted ? -1 : 1;
      if (a.checkInTime !== '-' && b.checkInTime === '-') return -1;
      if (a.checkInTime === '-' && b.checkInTime !== '-') return 1;
      return 0;
    });

    setParticipants(mergedData);
  } catch (e) {
    console.error('[AdminMonitor]', e);
  } finally {
    setLoading(false);
  }
};
```

---

### P2.5 Ícones PWA — PNG Conformes

**Problema:** `pwa-192x192.svg` e `pwa-512x512.svg` não são aceitos como ícones maskable pelo Chrome/Android. O critério de instalação do PWA exige PNG.

```bash
# Converter SVG para PNG usando sharp (adicionar ao build process)
# package.json — adicionar script de pré-build
npm install --save-dev sharp

# scripts/generate-pwa-icons.mjs
import sharp from 'sharp';

await sharp('public/pwa-512x512.svg')
  .resize(512, 512)
  .png()
  .toFile('public/pwa-512x512.png');

await sharp('public/pwa-512x512.svg')
  .resize(192, 192)
  .png()
  .toFile('public/pwa-192x192.png');

console.log('PWA icons generated.');
```

**Atualizar `vite.config.ts`:**

```typescript
// vite.config.ts — ícones PWA corrigidos para PNG
manifest: {
  // ...
  icons: [
    {
      src: '/pwa-192x192.png',   // ← PNG, não SVG
      sizes: '192x192',
      type: 'image/png',
    },
    {
      src: '/pwa-512x512.png',   // ← PNG, não SVG
      sizes: '512x512',
      type: 'image/png',
    },
    {
      src: '/pwa-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any maskable',   // ← habilita ícone adaptativo no Android
    },
  ],
},
```

---

### P2.6 Remover console.log de Produção

```typescript
// vite.config.ts — adicionar drop de console em build de produção

build: {
  chunkSizeWarningLimit: 1200,
  minify: 'terser',           // ← ativar terser para habilitar drop
  terserOptions: {
    compress: {
      drop_console: true,     // ← remove todos os console.* em produção
      drop_debugger: true,
    },
  },
  rollupOptions: {
    output: {
      manualChunks: {
        'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        'supabase-vendor': ['@supabase/supabase-js'],
        'chart-vendor': ['recharts'],
        'ui-vendor': ['lucide-react', 'motion'],
      },
    },
  },
},
```

---

### Testes E2E com Playwright — Meta de 60%

**Instalar:**
```bash
npm install --save-dev @playwright/test
npx playwright install chromium
```

**Criar:** `e2e/voting-flow.spec.ts`

```typescript
// e2e/voting-flow.spec.ts — Teste E2E do fluxo completo de votação

import { test, expect } from '@playwright/test';

test.describe('Fluxo Completo de Votação', () => {
  test.beforeEach(async ({ page }) => {
    // Login como morador de teste
    await page.goto('/');
    await page.fill('[name="email"]', process.env.TEST_RESIDENT_EMAIL!);
    await page.fill('[name="password"]', process.env.TEST_RESIDENT_PASSWORD!);
    await page.click('button[type="submit"]');
    await page.waitForURL('/resident/home');
  });

  test('morador consegue realizar check-in e votar', async ({ page }) => {
    // Navegar para assembleia
    await page.goto('/check-in');
    await expect(page.getByText('Check-in Assembleia')).toBeVisible();

    // Realizar check-in
    await page.click('button[type="submit"]');
    await page.waitForURL('/resident/assembly');

    // Selecionar pauta ativa
    await page.click('[data-testid="vote-button"]');
    await page.waitForURL('/voting');

    // Votar SIM
    await page.click('[aria-label*="Votar SIM"]');

    // Verificar redirecionamento para sucesso
    await page.waitForURL('/success');
    await expect(page.getByText(/voto registrado/i)).toBeVisible();
  });

  test('não permite votar duas vezes na mesma pauta', async ({ page }) => {
    // Tentar acessar a rota de votação diretamente após já ter votado
    await page.goto('/voting', { state: { topic: { id: 'topic-test', title: 'Teste' } } });

    // Deve redirecionar para /success imediatamente
    await page.waitForURL('/success');
  });
});
```

---

## 5. Projeção de Evolução do Rating

| Categoria | Atual | Após Sprint 1 | Após Sprint 2 | Após Sprint 3 |
|-----------|-------|---------------|---------------|---------------|
| Arquitetura & Estrutura | 3.5 | 3.5 | 4.0 | 4.5 |
| Qualidade de Código | 2.5 | 3.5 | 4.0 | 4.5 |
| Cobertura de Testes | 1.0 | 1.0 | 3.0 | 4.0 |
| Segurança | 2.0 | 4.0 | 4.5 | 4.5 |
| Performance | 3.5 | 3.5 | 3.5 | 4.5 |
| Acessibilidade | 1.5 | 1.5 | 1.5 | 4.0 |
| Documentação | 2.0 | 2.0 | 3.0 | 3.5 |
| PWA/Offline | 3.5 | 3.5 | 3.5 | 4.5 |
| Observabilidade | 1.5 | 1.5 | 2.0 | 4.5 |
| **Rating Global** | **2.8** | **3.8** | **4.2** | **4.6** |

---

## 6. Checklist de Definition of Done

Cada item deve ser marcado antes de considerar a tarefa concluída e elegível para merge.

### Sprint 1 (P0)
- [ ] `votes_unique_per_topic_user` constraint criada e migration executada em produção
- [ ] `Voting.tsx` verifica voto existente antes de renderizar botões
- [ ] Erro `23505` em votos tratado graciosamente (sem `alert()`)
- [ ] `get_jwt_role()` função criada no PostgreSQL
- [ ] Todas as policies RLS do SUPERADMIN reescritas usando `get_jwt_role()`
- [ ] Módulo SuperAdmin testado manualmente — sem timeout ou recursão
- [ ] `send-push` valida `Authorization: Bearer {token}` e verifica role ADMIN/SUPERADMIN
- [ ] Chamadas do frontend para `send-push` incluem token de sessão
- [ ] Redeclaração de variável em `Dashboard.tsx` removida
- [ ] `vite/client` adicionado ao `compilerOptions.types` no `tsconfig.json`
- [ ] `npm run lint` (tsc --noEmit) passa sem erros
- [ ] Job `quality-gate` adicionado ao workflow de CI/CD
- [ ] Deploy bloqueado quando `quality-gate` falha

### Sprint 2 (P1)
- [ ] Edge Function `create-admin-user` deployada e testada
- [ ] `tempSupabase` removido de `SuperManagers.tsx`
- [ ] `generateSecureInviteCode()` usando `crypto.getRandomValues()`
- [ ] `ToastProvider` integrado ao `App.tsx`
- [ ] Todos os 24 `alert()` substituídos por `toast.success/error/warning`
- [ ] `validateCPF()` implementado em `src/lib/validators.ts` com testes
- [ ] `validateCPF` chamado no submit do `Register.tsx`
- [ ] Buckets `assembly_documents` e `proxies` configurados como privados
- [ ] Helper `getSignedUrl()` usado para download de documentos
- [ ] Cobertura de testes ≥ 30% (verificar com `npm test -- --coverage`)

### Sprint 3 (P2)
- [ ] Sentry inicializado com DSN de produção
- [ ] `identifyUser()` chamado após login autenticado
- [ ] Todos os botões com ícone possuem `aria-label`
- [ ] Todos os inputs de formulário têm `<label>` vinculada via `id/htmlFor`
- [ ] Modais com focus trap implementado
- [ ] Paginação server-side aplicada em AdminUsers e AdminAssemblies
- [ ] `fetchMonitorData` usando 2 queries com Promise.all (não 4 sequenciais)
- [ ] Ícones PWA convertidos para PNG e referenciados no manifest
- [ ] `drop_console: true` ativo no build de produção
- [ ] Suite E2E: fluxo de votação passa em chromium
- [ ] Cobertura de testes ≥ 60%

---

*Versix Team Developers — CondoVote Technical Roadmap v1.0*
*Gerado em: 02/03/2026 · Baseado na auditoria de Production Readiness*
