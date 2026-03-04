# ADR-001: RLS no Supabase em vez de API Gateway

**Status:** Aceito  
**Data:** 2026-03-03  
**Decisores:** VTD Tech Lead

## Contexto

O CondoVote precisa de isolamento entre condomínios. A alternativa era um API
Gateway personalizado que filtraria `condo_id` em cada request. A complexidade do Proxy e rate limit tornariam o gerenciamento caro.

## Decisão

Usar Row Level Security (RLS) do Supabase como única camada de controle de acesso
por tenant. Todas as políticas derivam de `auth.uid()` e JWT claims setadas dinamicamente.

## Consequências

✅ Elimina surface de ataque de API Gateway customizado  
✅ Policies testáveis com pgTAP na suite do CI
✅ Funciona com Realtime subscriptions automaticamente, evitando polling  
⚠️ Requer gerência rigorosa de Migration Scripts, forçando deploy atômico (code+BD)
⚠️ Migrations de RLS precisam ser testadas no ambiente local com Roles isoladas antes de push
