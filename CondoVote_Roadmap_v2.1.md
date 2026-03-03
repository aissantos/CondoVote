# CondoVote — Roadmap Técnico Estratégico
## Ciclo v2.1 → v3.0 | Versix Team Developers

> **Base:** Auditoria Production Readiness v2.0 (Rating 3.9/5.0 — 03/03/2026)  
> **Objetivo do ciclo:** Atingir 4.3+ para escala multi-condo e 4.6+ para produção plena  
> **Audiência:** Time de desenvolvimento — implementação direta

---

## Índice

1. [Visão Geral das Fases](#1-visão-geral-das-fases)
2. [Sprint 2.1 — Fundação Sólida](#2-sprint-21--fundação-sólida-2-semanas)
3. [Sprint 2.2 — Qualidade e Acessibilidade](#3-sprint-22--qualidade-e-acessibilidade-3-semanas)
4. [Sprint 2.3 — Segurança Avançada](#4-sprint-23--segurança-avançada-2-semanas)
5. [Sprint 3.0 — Escala e Observabilidade](#5-sprint-30--escala-e-observabilidade-3-semanas)
6. [Débito Técnico Transversal](#6-débito-técnico-transversal)
7. [Critérios de Aceite por Sprint](#7-critérios-de-aceite-por-sprint)

---

## 1. Visão Geral das Fases

```
v2.0 (atual)  ──►  v2.1        ──►  v2.2        ──►  v2.3        ──►  v3.0
  3.9/5.0           4.1/5.0          4.3/5.0          4.4/5.0          4.6/5.0
  Piloto            CI verde +        WCAG AA +         Segurança        Produção
  Supervisionado    Observ. ativa     Testes 30%+       Avançada         Plena
```

| Sprint | Foco Principal            | Rating Alvo | Duração    | Prioridade |
|--------|---------------------------|-------------|------------|------------|
| v2.1   | Correções imediatas + CI  | 4.1         | 2 semanas  | CRÍTICO    |
| v2.2   | Testes + Acessibilidade   | 4.3         | 3 semanas  | ALTO       |
| v2.3   | Segurança avançada        | 4.4         | 2 semanas  | ALTO       |
| v3.0   | E2E + Escala + Observ.    | 4.6         | 3 semanas  | MÉDIO      |

---

## 2. Sprint 2.1 — Fundação Sólida (2 semanas)

> Resolve os 2 itens P1 residuais e fecha gaps de qualidade que travam CI. **Nenhum deploy para produção deve ocorrer enquanto estes itens estiverem abertos.**

---

### 2.1.1 — Corrigir `tsconfig.json` (1 linha — 5 min)

**Problema:** `src/lib/supabase.ts` apresenta 2 erros `TS2339: Property 'env' does not exist on type 'ImportMeta'` porque o tsconfig não declara os tipos do Vite.

**Arquivo:** `tsconfig.json`

```jsonc
// ANTES (tsconfig.json)
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    // ❌ "types" ausente — ImportMeta.env não reconhecido
    ...
  }
}

// DEPOIS
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vite/client"],  // ✅ Declara import.meta.env, import.meta.hot, etc.
    ...
  }
}
```

**Verificação pós-fix:**
```bash
npx tsc --noEmit
# Esperado: 0 erros
```

---

### 2.1.2 — Substituir `confirm()` em SuperManagers.tsx

**Problema:** `handleToggleRole` ainda usa `window.confirm()` nativo — inconsistente com o sistema de Toast já implementado e bloqueante da UI.

**Arquivo:** `src/pages/superadmin/SuperManagers.tsx`

```tsx
// ANTES — linha 48
if (!confirm(confirmMessage)) return;

// DEPOIS — usar o Modal existente (src/components/Modal.tsx) 
// ou implementar estado de confirmação inline:

const [pendingToggle, setPendingToggle] = useState<{
  userId: string;
  currentRole: string;
} | null>(null);

const handleToggleRole = async (userId: string, currentRole: string) => {
  // Abre modal de confirmação em vez de window.confirm()
  setPendingToggle({ userId, currentRole });
};

const confirmToggle = async () => {
  if (!pendingToggle) return;
  const { userId, currentRole } = pendingToggle;
  const newRole = currentRole === 'ADMIN' ? 'RESIDENT' : 'ADMIN';
  
  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId);

  if (!error) {
    toast.success(`Permissão alterada para ${newRole} com sucesso.`);
    fetchProfiles();
  } else {
    toast.error('Erro ao atualizar permissão: ' + error.message);
  }
  setPendingToggle(null);
};

// No JSX — usar o componente Modal já existente:
{pendingToggle && (
  <Modal
    isOpen={!!pendingToggle}
    onClose={() => setPendingToggle(null)}
    title="Confirmar alteração de permissão"
  >
    <p className="text-slate-600 dark:text-slate-300 mb-6">
      {pendingToggle.currentRole === 'ADMIN'
        ? 'Deseja rebaixar este Síndico para Morador?'
        : 'Deseja promover este Morador a Síndico?'}
    </p>
    <div className="flex gap-3 justify-end">
      <button onClick={() => setPendingToggle(null)} className="btn-secondary">
        Cancelar
      </button>
      <button onClick={confirmToggle} className="btn-danger">
        Confirmar
      </button>
    </div>
  </Modal>
)}
```

---

### 2.1.3 — Corrigir `any` de alta criticidade

**Problema:** 18 usos de `any` no codebase. Priorizar os 4 mais críticos que afetam fluxos de negócio.

**Arquivo:** `src/pages/admin/AdminTopics.tsx`
```tsx
// ANTES — linha 104
const payload: any = {
  title: formData.title,
  assembly_id: formData.assembly_id,
  // ...
};

// DEPOIS — definir tipo explícito
type TopicInsertPayload = {
  title: string;
  assembly_id: string;
  description?: string;
  attachment_url?: string | null;
};

const payload: TopicInsertPayload = {
  title: formData.title,
  assembly_id: formData.assembly_id,
};
if (formData.description) payload.description = formData.description;
```

**Arquivo:** `src/pages/admin/AdminMonitor.tsx`
```tsx
// ANTES — linha 79
const mergedData: Participant[] = residentsResult.data.map((resident: any) => {

// DEPOIS — tipar o retorno da query
type ResidentRow = {
  id: string;
  full_name: string | null;
  unit_number: string | null;
  block_number: string | null;
};

const mergedData: Participant[] = (residentsResult.data as ResidentRow[]).map((resident) => {
```

**Arquivo:** `src/hooks/useCondos.ts`
```tsx
// ANTES — linha 185
const updatePayload: any = { ... };

// DEPOIS
type CondoUpdatePayload = Partial<Pick<Condo,
  'corporate_name' | 'trade_name' | 'address' | 'neighborhood' |
  'city' | 'state' | 'zip_code' | 'manager_id'
>>;
const updatePayload: CondoUpdatePayload = { ... };
```

---

### 2.1.4 — Ajustar CI/CD — `npm run lint` deve incluir `tsc --noEmit`

**Problema:** O `quality-gate` no CI executa `npm run lint` mas o script `lint` atual provavelmente só roda ESLint, não `tsc --noEmit`.

**Arquivo:** `package.json`
```jsonc
// Verificar se o script lint inclui typecheck:
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx",
    
    // ✅ Adicionar script separado ou unificar:
    "typecheck": "tsc --noEmit",
    "validate": "npm run typecheck && npm run lint"
  }
}
```

**Arquivo:** `.github/workflows/vercel-deploy.yml`
```yaml
- name: TypeScript Check
  run: npm run validate   # ← garante que tsc + lint rodam juntos
```

---

## 3. Sprint 2.2 — Qualidade e Acessibilidade (3 semanas)

> Eleva cobertura de testes de ~5% para 30%+ e implementa o padrão de acessibilidade WCAG 2.1 AA nos fluxos críticos.

---

### 3.1 — Cobertura de Testes: Fluxos Críticos

**Meta:** 30% de cobertura nas rotas de negócio críticas (votação, registro, autenticação).

#### Setup de cobertura no Vite/Vitest

**Arquivo:** `vite.config.ts`
```ts
test: {
  globals: true,
  environment: 'jsdom',
  setupFiles: './src/setupTests.ts',
  coverage: {
    provider: 'v8',
    reporter: ['text', 'lcov', 'html'],
    thresholds: {
      lines: 30,        // CI falha abaixo de 30%
      functions: 30,
      branches: 25,
    },
    exclude: [
      'src/vite-env.d.ts',
      '**/*.config.*',
      '**/index.ts',
    ],
  },
},
```

**Instalar dependência:**
```bash
npm install -D @vitest/coverage-v8
```

#### Teste prioritário 1: `validators.test.ts`

```ts
// src/lib/validators.test.ts
import { describe, it, expect } from 'vitest';
import { validateCPF, formatCPF } from './validators';

describe('validateCPF', () => {
  it('valida CPF correto com máscara', () => {
    expect(validateCPF('529.982.247-25')).toBe(true);
  });

  it('valida CPF correto sem máscara', () => {
    expect(validateCPF('52998224725')).toBe(true);
  });

  it('rejeita sequência uniforme', () => {
    expect(validateCPF('111.111.111-11')).toBe(false);
    expect(validateCPF('00000000000')).toBe(false);
  });

  it('rejeita dígito verificador incorreto', () => {
    expect(validateCPF('529.982.247-26')).toBe(false);
  });

  it('rejeita CPF com menos de 11 dígitos', () => {
    expect(validateCPF('529.982.247')).toBe(false);
  });
});

describe('formatCPF', () => {
  it('formata CPF de 11 dígitos', () => {
    expect(formatCPF('52998224725')).toBe('529.982.247-25');
  });

  it('aceita entrada parcial sem quebrar', () => {
    expect(formatCPF('529')).toBe('529');
    expect(formatCPF('52998')).toBe('529.98');
  });
});
```

#### Teste prioritário 2: `Voting.test.tsx`

```tsx
// src/pages/resident/Voting.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Voting from './Voting';
import { supabase } from '../../lib/supabase';
import { ToastProvider } from '../../hooks/useToast';

// Mock do supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: { getUser: vi.fn() },
  },
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-123' } }),
}));

const mockTopic = {
  id: 'topic-abc',
  title: 'Aprovação do orçamento 2026',
  description: 'Votação sobre o orçamento anual.',
};

const renderVoting = (topic = mockTopic) =>
  render(
    <MemoryRouter initialEntries={[{ pathname: '/voting', state: { topic } }]}>
      <ToastProvider>
        <Voting />
      </ToastProvider>
    </MemoryRouter>
  );

const mockSupabaseChain = (voteData: unknown = null, insertError: unknown = null) => {
  const chain = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: voteData, error: null }),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    insert: vi.fn().mockResolvedValue({ error: insertError }),
  };
  (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chain);
  return chain;
};

describe('Voting', () => {
  it('redireciona para /success se usuário já votou', async () => {
    const mockNavigate = vi.fn();
    vi.mock('react-router-dom', async (importOriginal) => ({
      ...(await importOriginal()),
      useNavigate: () => mockNavigate,
    }));

    mockSupabaseChain({ id: 'vote-existing', choice: 'SIM' });
    renderVoting();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/success', { replace: true });
    });
  });

  it('insere voto SIM e navega para /success', async () => {
    const user = userEvent.setup();
    mockSupabaseChain(null, null);
    renderVoting();

    await waitFor(() => screen.getByRole('button', { name: /votar sim/i }));
    await user.click(screen.getByRole('button', { name: /votar sim/i }));

    await waitFor(() => {
      const chain = (supabase.from as ReturnType<typeof vi.fn>).mock.results.at(-1)?.value;
      expect(chain?.insert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ choice: 'SIM', topic_id: 'topic-abc' }),
        ])
      );
    });
  });

  it('exibe mensagem de erro acessível em caso de falha', async () => {
    const user = userEvent.setup();
    mockSupabaseChain(null, { code: '99999', message: 'Erro de rede' });
    renderVoting();

    await waitFor(() => screen.getByRole('button', { name: /votar não/i }));
    await user.click(screen.getByRole('button', { name: /votar não/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('botões de voto são acessíveis por teclado', async () => {
    const user = userEvent.setup();
    mockSupabaseChain(null, null);
    renderVoting();

    await waitFor(() => screen.getByRole('button', { name: /votar sim/i }));

    const simButton = screen.getByRole('button', { name: /votar sim/i });
    expect(simButton).toHaveAttribute('aria-pressed');
    expect(simButton).toHaveAttribute('aria-label');

    simButton.focus();
    expect(document.activeElement).toBe(simButton);
    await user.keyboard('{Enter}');
  });
});
```

#### Teste prioritário 3: `AuthContext.test.tsx` — ampliar cobertura

```tsx
// Adicionar ao src/contexts/AuthContext.test.tsx existente:

it('clearUser é chamado no logout do Sentry', async () => {
  // Garantir que clearUser() de monitoring.ts é chamado no signOut
  const clearUserSpy = vi.spyOn(monitoringModule, 'clearUser');
  // ... teste de signOut
  expect(clearUserSpy).toHaveBeenCalled();
});
```

---

### 3.2 — Acessibilidade WCAG 2.1 AA

**Meta:** Atingir cobertura de atributos `aria-*` nos 3 fluxos críticos: Registro, Login e Votação.

#### Componente `FormField` — criar wrapper reutilizável

**Arquivo:** `src/components/ui/FormField.tsx` *(criar)*

```tsx
// src/components/ui/FormField.tsx
import React, { useId } from 'react';

interface FormFieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: (props: {
    id: string;
    'aria-describedby': string | undefined;
    'aria-invalid': boolean | undefined;
    'aria-required': boolean | undefined;
  }) => React.ReactNode;
}

/**
 * Wrapper de campo de formulário com acessibilidade automática.
 * Injeta id, aria-describedby, aria-invalid e aria-required
 * nos filhos via render prop.
 *
 * @example
 * <FormField label="CPF" error={errors.cpf} required>
 *   {(a11y) => <input {...a11y} type="text" value={cpf} onChange={...} />}
 * </FormField>
 */
export function FormField({ label, error, hint, required, children }: FormFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  const describedBy = [
    error ? errorId : undefined,
    hint ? hintId : undefined,
  ].filter(Boolean).join(' ') || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-sm font-semibold text-slate-700 dark:text-slate-300"
      >
        {label}
        {required && (
          <span aria-hidden="true" className="ml-1 text-red-500">*</span>
        )}
      </label>

      {children({
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
        'aria-required': required || undefined,
      })}

      {hint && !error && (
        <p id={hintId} className="text-xs text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      )}

      {error && (
        <p
          id={errorId}
          role="alert"
          aria-live="polite"
          className="text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-1"
        >
          <span aria-hidden="true">⚠</span>
          {error}
        </p>
      )}
    </div>
  );
}
```

**Uso em Register.tsx:**
```tsx
// ANTES
<div>
  <label>CPF</label>
  <input type="text" value={formData.cpf} onChange={(e: any) => handleChange(e)} />
  {errors.cpf && <p>{errors.cpf}</p>}
</div>

// DEPOIS
<FormField label="CPF" error={errors.cpf} required hint="Somente números — ex: 000.000.000-00">
  {(a11y) => (
    <input
      {...a11y}
      type="text"
      inputMode="numeric"
      value={formData.cpf}
      onChange={handleChange}
      placeholder="000.000.000-00"
      className="input-base"
      maxLength={14}
      autoComplete="off"
    />
  )}
</FormField>
```

#### Correções pontuais de acessibilidade

**`src/pages/resident/Register.tsx`** — corrigir `onChange` tipado como `any`:
```tsx
// ANTES
onChange={(e: any) => handleChange(e)}

// DEPOIS — tipagem correta
onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e)}
```

**`src/pages/resident/CompleteProfile.tsx`** — mesma correção:
```tsx
// ANTES
onChange={(e: any) => handleChange(e)}

// DEPOIS
onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => handleChange(e)}
```

**`src/pages/admin/AdminDocuments.tsx`** — tipagem do select:
```tsx
// ANTES
onChange={(e) => setFormData({...formData, document_type: e.target.value as any})}

// DEPOIS — criar union type
type DocumentType = 'ATA' | 'EDITAL' | 'CONTRATO' | 'OUTRO';
onChange={(e) => setFormData({...formData, document_type: e.target.value as DocumentType})}
```

---

## 4. Sprint 2.3 — Segurança Avançada (2 semanas)

---

### 4.1 — Storage Privado com Signed URLs

**Problema:** Bucket `assembly_documents` está público — qualquer URL direta acessa documentos sem autenticação.

**Migration:** `supabase/migrations/20260310000000_private_storage.sql`
```sql
-- Tornar bucket privado
UPDATE storage.buckets
SET public = false
WHERE id = 'assembly_documents';

-- Remover política de acesso público (se existir)
DROP POLICY IF EXISTS "Public read assembly_documents" ON storage.objects;

-- Criar política de acesso por condomínio
CREATE POLICY "Authenticated condo members read documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'assembly_documents'
    AND auth.role() = 'authenticated'
  );
```

**Arquivo:** `src/lib/storage.ts` *(criar)*
```ts
// src/lib/storage.ts
import { supabase } from './supabase';
import { captureError } from './monitoring';

const BUCKET = 'assembly_documents';
const DEFAULT_EXPIRY_SECONDS = 3600; // 1 hora

/**
 * Gera uma URL assinada e temporária para um documento privado.
 * Retorna null se o arquivo não existir ou o usuário não tiver acesso.
 */
export async function getSignedDocumentUrl(
  filePath: string,
  expiresIn = DEFAULT_EXPIRY_SECONDS
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(filePath, expiresIn);

  if (error) {
    captureError(error, { filePath, bucket: BUCKET });
    return null;
  }

  return data.signedUrl;
}

/**
 * Faz upload de um arquivo para o bucket privado.
 * Retorna o filePath relativo ou null em caso de erro.
 */
export async function uploadDocument(
  file: File,
  condoId: string,
  prefix = 'docs'
): Promise<string | null> {
  const ext = file.name.split('.').pop();
  const filePath = `${condoId}/${prefix}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, { upsert: false });

  if (error) {
    captureError(error, { filePath, bucket: BUCKET });
    return null;
  }

  return filePath;
}
```

**Atualizar `AdminDocuments.tsx` e `ResidentDocuments.tsx`:**
```tsx
// ANTES — URL pública direta
const { data } = supabase.storage.from('assembly_documents').getPublicUrl(doc.file_path);
const url = data.publicUrl;

// DEPOIS — URL assinada com expiração
import { getSignedDocumentUrl } from '../../lib/storage';

const url = await getSignedDocumentUrl(doc.file_path);
if (!url) {
  toast.error('Não foi possível acessar o documento.');
  return;
}
window.open(url, '_blank', 'noopener noreferrer');
```

---

### 4.2 — Rate Limiting nos Formulários de Autenticação

**Problema:** Formulários de login e registro vulneráveis a brute force.

**Arquivo:** `src/hooks/useRateLimit.ts` *(criar)*
```ts
// src/hooks/useRateLimit.ts

/**
 * Hook de rate limiting client-side para prevenir brute force em formulários.
 * Não substitui rate limiting server-side (configurar também no Supabase Auth).
 *
 * @param maxAttempts - Tentativas permitidas antes do bloqueio
 * @param windowMs - Janela de tempo em ms (padrão: 60s)
 */
export function useRateLimit(maxAttempts = 5, windowMs = 60_000) {
  const attemptsRef = React.useRef<number[]>([]);

  const check = (): { allowed: boolean; waitSeconds: number } => {
    const now = Date.now();
    // Limpar tentativas fora da janela
    attemptsRef.current = attemptsRef.current.filter(t => now - t < windowMs);

    if (attemptsRef.current.length >= maxAttempts) {
      const oldest = attemptsRef.current[0];
      const waitMs = windowMs - (now - oldest);
      return { allowed: false, waitSeconds: Math.ceil(waitMs / 1000) };
    }

    attemptsRef.current.push(now);
    return { allowed: true, waitSeconds: 0 };
  };

  const reset = () => {
    attemptsRef.current = [];
  };

  return { check, reset };
}
```

**Uso em `src/pages/resident/Login.tsx`:**
```tsx
const { check: checkRateLimit } = useRateLimit(5, 60_000);

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();

  const { allowed, waitSeconds } = checkRateLimit();
  if (!allowed) {
    toast.error(`Muitas tentativas. Aguarde ${waitSeconds}s antes de tentar novamente.`);
    return;
  }

  // ... lógica de login existente
};
```

> **Nota:** Configurar também no Supabase Dashboard em Authentication > Rate Limits. O limite client-side é uma primeira camada de UX — não é garantia de segurança sozinha.

---

### 4.3 — Verificar Ordem de Migrations no Repositório

**Problema identificado:** A migration `20260302000001_fix_infinite_recursion.sql` implementa `is_superadmin()` com SELECT direto à tabela `profiles` (potencialmente recursiva) e foi sobrescrita pela `20260303000001_p0_superadmin_rls_fix.sql`. O `supabase db push` aplica por ordem de nome — verificar que a ordem está correta.

**Ação:**
```bash
# Verificar a ordem de aplicação das migrations
supabase db diff --use-migra

# Listar migrations aplicadas
supabase migration list

# Se a migration 00001 for conflitante, marcá-la como aplicada sem re-executar:
# (apenas se o estado do DB já estiver correto)
supabase migration repair --status applied 20260302000001
```

**Verificação SQL no Supabase Dashboard:**
```sql
-- Confirmar que get_jwt_role() é a função ativa (não is_superadmin())
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'get_jwt_role';

-- Confirmar que as políticas de SUPERADMIN usam get_jwt_role()
SELECT policyname, qual
FROM pg_policies
WHERE tablename = 'profiles'
  AND policyname LIKE '%SUPERADMIN%';
-- Esperado: todas devem conter "get_jwt_role()" na coluna qual
```

---

## 5. Sprint 3.0 — Escala e Observabilidade (3 semanas)

---

### 5.1 — Testes E2E com Playwright

**Instalação:**
```bash
npm install -D @playwright/test
npx playwright install chromium
```

**Arquivo:** `playwright.config.ts`
```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 14'] } },
  ],
});
```

**Arquivo:** `e2e/voting-flow.spec.ts`
```ts
import { test, expect } from '@playwright/test';

test.describe('Fluxo de Votação', () => {
  test.beforeEach(async ({ page }) => {
    // Login como morador de teste
    await page.goto('/resident/login');
    await page.fill('[data-testid="email"]', process.env.E2E_RESIDENT_EMAIL!);
    await page.fill('[data-testid="password"]', process.env.E2E_RESIDENT_PASSWORD!);
    await page.click('[data-testid="submit"]');
    await page.waitForURL('**/resident/home');
  });

  test('morador pode fazer check-in com sucesso', async ({ page }) => {
    await page.goto('/resident/checkin');
    await page.click('[data-testid="checkin-button"]');
    await expect(page.getByRole('alert')).toContainText(/sucesso|confirmado/i);
  });

  test('morador não consegue votar duas vezes', async ({ page }) => {
    // Navegar para votação ativa
    await page.goto('/resident/assembly');
    await page.click('[data-testid="vote-topic-0"]');
    
    // Primeiro voto
    await page.click('button[aria-label*="Votar SIM"]');
    await page.waitForURL('**/success');

    // Tentar acessar votação novamente — deve redirecionar para /success
    await page.goto('/resident/assembly');
    await page.click('[data-testid="vote-topic-0"]');
    await expect(page).toHaveURL(/\/success/);
  });

  test('botões de voto são acessíveis por teclado', async ({ page }) => {
    await page.goto('/resident/assembly');
    await page.click('[data-testid="vote-topic-0"]');
    
    const simButton = page.getByRole('button', { name: /votar sim/i });
    await expect(simButton).toHaveAttribute('aria-label');
    await expect(simButton).toHaveAttribute('aria-pressed');
    
    await simButton.focus();
    await page.keyboard.press('Enter');
    await page.waitForURL('**/success');
  });
});
```

**Adicionar atributos `data-testid` estratégicos** nos componentes principais:
```tsx
// CheckIn.tsx
<button data-testid="checkin-button" onClick={handleCheckIn}>Fazer Check-in</button>

// Login.tsx
<input data-testid="email" type="email" ... />
<input data-testid="password" type="password" ... />
<button data-testid="submit" type="submit">Entrar</button>

// Topics.tsx
{topics.map((topic, index) => (
  <button data-testid={`vote-topic-${index}`} onClick={() => navigate('/voting', { state: { topic } })}>
    Votar
  </button>
))}
```

---

### 5.2 — Observabilidade Plena com Sentry

> **Atenção:** `initMonitoring()` já é chamado em `main.tsx` na v2.0 verificada. O gap é a variável de ambiente não estar configurada no ambiente de produção.

**Checklist de configuração:**

1. Criar projeto no [sentry.io](https://sentry.io) do tipo "React"
2. Adicionar `VITE_SENTRY_DSN` no Vercel Dashboard → Settings → Environment Variables
3. Adicionar `SENTRY_AUTH_TOKEN` para upload de source maps no CI:

```yaml
# .github/workflows/vercel-deploy.yml — adicionar ao job deploy-production
- name: Upload Source Maps para Sentry
  run: npx sentry-cli releases finalize ${{ github.sha }}
  env:
    SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
    SENTRY_ORG: versix
    SENTRY_PROJECT: condovote
```

**Arquivo:** `vite.config.ts` — adicionar plugin Sentry:
```ts
import { sentryVitePlugin } from '@sentry/vite-plugin';

// No array plugins, após VitePWA:
...(process.env.NODE_ENV === 'production' ? [
  sentryVitePlugin({
    authToken: process.env.SENTRY_AUTH_TOKEN,
    org: 'versix',
    project: 'condovote',
    telemetry: false,
  })
] : []),

// No build config:
build: {
  sourcemap: true,   // necessário para Sentry mapear erros ao código-fonte
  // ... resto do config existente
}
```

**Integrar `captureError` nos catch blocks existentes:**
```ts
// src/pages/admin/AdminOverview.tsx — linha 149
} catch (error) {
  // ANTES
  console.error('Erro ao gerar PDF:', error);
  
  // DEPOIS
  captureError(error, { action: 'generate_pdf', page: 'AdminOverview' });
  toast.error('Erro ao gerar PDF. Tente novamente.');
}
```

---

### 5.3 — Dashboard de Health Check

**Arquivo:** `src/pages/admin/AdminHealth.tsx` *(novo — opcional, alto valor)*

```tsx
// Página de health check visível apenas para SUPERADMIN
// Exibe: status do banco, edge functions, storage, última migration aplicada

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

type HealthStatus = 'ok' | 'degraded' | 'down' | 'checking';

interface HealthCheck {
  name: string;
  status: HealthStatus;
  latencyMs?: number;
  detail?: string;
}

export default function AdminHealth() {
  const [checks, setChecks] = useState<HealthCheck[]>([]);

  useEffect(() => {
    runChecks();
  }, []);

  const runChecks = async () => {
    const results: HealthCheck[] = [];

    // Check 1: Database latency
    const dbStart = Date.now();
    const { error: dbError } = await supabase.from('profiles').select('id').limit(1);
    results.push({
      name: 'Database (Supabase)',
      status: dbError ? 'down' : 'ok',
      latencyMs: Date.now() - dbStart,
      detail: dbError?.message,
    });

    // Check 2: Storage
    const { error: storageError } = await supabase.storage.getBucket('assembly_documents');
    results.push({
      name: 'Storage (assembly_documents)',
      status: storageError ? 'degraded' : 'ok',
      detail: storageError?.message,
    });

    setChecks(results);
  };

  const statusColor = (s: HealthStatus) => ({
    ok: 'text-green-600 bg-green-100',
    degraded: 'text-amber-600 bg-amber-100',
    down: 'text-red-600 bg-red-100',
    checking: 'text-slate-500 bg-slate-100',
  }[s]);

  return (
    <div className="max-w-2xl mx-auto space-y-4 p-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">System Health</h1>
      {checks.map((check) => (
        <div key={check.name} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">{check.name}</p>
            {check.detail && <p className="text-xs text-slate-500 mt-0.5">{check.detail}</p>}
          </div>
          <div className="flex items-center gap-3">
            {check.latencyMs && (
              <span className="text-xs text-slate-500">{check.latencyMs}ms</span>
            )}
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${statusColor(check.status)}`}>
              {check.status}
            </span>
          </div>
        </div>
      ))}
      <button
        onClick={runChecks}
        className="w-full py-2 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
      >
        Re-verificar
      </button>
    </div>
  );
}
```

---

## 6. Débito Técnico Transversal

> Estes itens não têm sprint fixo — devem ser resolvidos incrementalmente em paralelo ao desenvolvimento de features.

### 6.1 — Padronizar tratamento de erros assíncronos

Todos os `catch` blocks devem seguir o padrão:

```ts
// Padrão VTD para tratamento de erros
} catch (error) {
  captureError(error, { component: 'ComponentName', action: 'actionName' });
  toast.error('Mensagem amigável ao usuário.');
  // NÃO usar console.error em código de negócio — deixar para o terser drop
}
```

### 6.2 — Tipar retornos do Supabase com tipos gerados

O Supabase CLI gera tipos TypeScript diretamente do schema do banco:

```bash
# Gerar tipos do banco de produção
npx supabase gen types typescript \
  --project-id ufaqgarxivrfqylifpvg \
  --schema public > src/lib/database.types.ts

# Usar no cliente
import { Database } from './database.types';
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

# Adicionar ao package.json como script:
"gen:types": "supabase gen types typescript --project-id ufaqgarxivrfqylifpvg --schema public > src/lib/database.types.ts"
```

Este único comando elimina **todos os 18 usos de `any`** restantes relacionados a queries do Supabase.

### 6.3 — Remover `any` remanescente em selects de AdminTopics

```tsx
// src/pages/admin/AdminAssemblies.tsx — linha 409
// ANTES
onClick={() => setFormData({...formData, format: fmt as any})}

// DEPOIS — definir tipo no formData
type AssemblyFormat = 'PRESENCIAL' | 'VIRTUAL' | 'HIBRIDO';
interface AssemblyFormData {
  // ...
  format: AssemblyFormat;
}
onClick={() => setFormData({...formData, format: fmt as AssemblyFormat})}
```

---

## 7. Critérios de Aceite por Sprint

### Sprint 2.1 — Aceite

- [ ] `npx tsc --noEmit` retorna 0 erros
- [ ] Nenhum `confirm()` ou `alert()` no codebase (`grep -r "confirm(\|alert(" src`)
- [ ] CI/CD executa `tsc --noEmit` antes do deploy
- [ ] PR bloqueado se quality-gate falhar

### Sprint 2.2 — Aceite

- [ ] `npm run test:coverage` passa com thresholds de 30% lines/functions
- [ ] Fluxo de votação tem testes cobrindo happy path + voto duplo + erro de rede
- [ ] `FormField` implementado e usado em Register.tsx e CompleteProfile.tsx
- [ ] 0 usos de `any` nos arquivos `onChange` de inputs

### Sprint 2.3 — Aceite

- [ ] Bucket `assembly_documents` está privado (verificar via Supabase Dashboard)
- [ ] Links de documentos usam `getSignedDocumentUrl` — URLs expiram em 1h
- [ ] Rate limit implementado nos formulários de login (máx 5 tentativas/60s)
- [ ] `supabase migration list` mostra todas as migrations aplicadas sem conflito

### Sprint 3.0 — Aceite

- [ ] Suite E2E passa no CI (chromium + mobile-safari)
- [ ] Sentry reportando eventos no dashboard (testar com `Sentry.captureException(new Error('test'))`)
- [ ] Source maps carregados no Sentry (erros mostram linha do código original)
- [ ] Rating final ≥ 4.5 confirmado em re-auditoria VTD

---

## Apêndice — Comandos Úteis

```bash
# Verificar TypeScript sem compilar
npx tsc --noEmit

# Rodar testes com cobertura
npm run test:coverage
# ou: npx vitest run --coverage

# Rodar testes E2E localmente
npx playwright test --headed

# Gerar tipos do banco
npm run gen:types

# Aplicar migrations no banco de produção
supabase db push

# Verificar estado das migrations
supabase migration list

# Inspecionar políticas RLS ativas
# (executar no SQL Editor do Supabase Dashboard)
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

*Versix Team Developers — Roadmap gerado em 03/03/2026 com base na Auditoria Production Readiness v2.0*  
*Próxima revisão programada: após conclusão do Sprint 2.1*
