# CondoVote — Runbook Operacional

Este Runbook serve como manual de sobrevivência, documentação SRE e manual de respostas padronizadas para a operação crítica e escalada do CondoVote na cloud.

## Contatos de Escalada

- Tech Lead VTD: devops@versix.com
- Supabase Dashboard: [Dashboard](https://supabase.com/dashboard/project/ufaqgarxivrfqylifpvg)
- Sentry Console: [CondoVote Project](https://versix.sentry.io/projects/condovote/)
- Vercel Admin: [Project URL](https://vercel.com/versix/condovote)

---

## Procedimentos de Incidente (SOPs)

### S01. Assembleia ativa — votação não registra no banco

1. Acesse o **Sentry** e filtre erros com o Log Tracking na transação OPA `/voting` ou pelo método do Service de banco de dados (`votes.error_code`).
2. Acesse a rota interna de **AdminHealth** via UI do browser do superadmin e valide a "Latência do Supabase".
3. Valide o Log Tracker de segurança (RLS): no SQL Editor do Supabase execute `SELECT * FROM pg_policies WHERE tablename = 'votes';`
4. Se o incidente foi um falso positivo gerado pelas Trigger Constraints, verifique se a Assembleia relacionada a pauta ainda tem STATUS = `OPEN`.

### S02. Usuário (Admin) bloqueado por Rate Limit

Devido ao RateLimiting adicionado nas senhas administrativas (5 tentativas).

1. Como trata-se de um bloqueio Client-Side local/in-hardware (UX constraint), guie o usuário a apagar o armazenamento SessionStorage/LocalStorage de seu painel do Browser.
2. Contudo, se sua conta caiu no _Brute Force Lock_ de MFA/Server do Supabase Auth, o desbloqueio só ocorrerá via liberação SRE no painel Admin do Supabase Dashboard -> **Auth** -> **Users** -> **Reset Password/Unblock**.

### S03. Conflito de migration em Deploy contínuo (Failed Pipeline no GHA)

Caso ocorra incompatibilidade entre Migrations em Pipeline CI/CD com Banco em PRD:

1. Executar via CLI `supabase migration list` apontando pro `--project-ref` em uso.
2. NUNCA rodar comandos como `db reset` na master, a perda de dados dos condomínios é letal pra compliance!
3. Corrigir falha usando `supabase migration repair --status applied <timestamp_da_falha>` após correção manual de SQL com Diff na Staging.

### S04. Rollback de Codebase

Se ocorrer falha crítica ou _Build Escaped Error_ na versão em Prod.

1. Retirar prioridade no Sentry.
2. No Vercel Dashboard → _Deployments_ → Selecione a hash da versão passada e opere _Promote to Production_.
3. Qualquer Migration disparada pelo deploy falho deve seguir regulação manual via `S03` ou criação de Rollback Migration nova (não existe reverse migration com o CLI `supabase`).
