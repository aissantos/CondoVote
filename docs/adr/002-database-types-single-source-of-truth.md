# ADR-002: database.types.ts como única fonte de verdade de tipos

**Status:** Aceito  
**Data:** 2026-03-03  
**Decisores:** VTD Tech Lead

## Contexto

Temos que lidar com constantes mudanças nas tabelas para escalar a performance com as Views ou ajustar a modelagem com novas Constraints. Cada mudança antes gerava dor no TypeScript e inconsistência de `any`.

## Decisão

Tipos genéricos do TypeScript serão derivados exclusivamente do schema via CLI `supabase gen types typescript`.
Fica estritamente **proibido** criar interfaces TypeScript manuais e estáticas para simular o reflexo das tabelas do banco.

## Consequências

✅ Divergência é 100% detectada no CI (multi-stage verification rule)  
✅ Renomear coluna no banco quebra o Build Pipeline do Vercel, impedindo fallbacks fatais  
⚠️ Requer `SUPABASE_ACCESS_TOKEN` da Master branch injetado nos Secrets do GitHub Actions.
