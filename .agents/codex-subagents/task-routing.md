# Task Routing

Используй эту таблицу перед делегированием работы субагенту Codex.

| Task type | Assistant file | Codex type | MCP usage | Primary ownership |
| --- | --- | --- | --- | --- |
| Supabase schema, migrations, RLS, seed, storage, indexes | `supabase-data-architect.md` | `worker` or `explorer` | Context7 for Supabase docs when API behavior is uncertain | `supabase/`, `DATA_MODEL.md` |
| Public/admin API routes, server auth checks, service-role reads/writes | `backend-admin-api-engineer.md` | `worker` | Context7 for Next.js and Supabase server APIs | `app/api/`, `lib/auth/`, `lib/supabase/`, `lib/data.ts`, `lib/types.ts` |
| ЮKassa create-payment, webhook, idempotency, donation transitions, notifications | `payments-webhook-engineer.md` | `worker` | Context7 for Next.js/Supabase helpers; official provider docs for ЮKassa if needed | `app/api/yookassa/`, `lib/yookassa/`, `lib/telegram/`, `lib/email/`, payment docs |
| Public map, markers, object pages, donation/volunteer forms, accessibility | `public-map-ui-engineer.md` | `worker` | Context7 for UI APIs; Playwright MCP for browser checks | `app/page.tsx`, `app/objects/`, `app/chronicle/`, `app/volunteers/`, `components/map/`, `components/building/` |
| Admin pages, tables, filters, forms, settings, map editor | `admin-console-engineer.md` | `worker` | Context7 for UI/API APIs; Playwright MCP for admin workflow checks | `app/admin/`, `components/admin/`, admin-facing integration code |
| Security, RLS, roles, PII, service-role leaks, payment regressions | `qa-security-reviewer.md` | `explorer` | Context7 for current framework/security behavior when needed | none, read-only |
| Typecheck, lint, build/dev smoke, desktop/mobile browser verification | `release-browser-verifier.md` | `explorer` | Playwright MCP required for browser verification | none, read-only |

## Sequencing

- DB contracts should be designed before backend/API implementation.
- Payment webhook work should be serialized with donation status code because both touch payment state transitions.
- Public UI and admin UI may run in parallel if they do not edit shared components.
- QA/security review should run after auth, RLS, payment, or service-role changes.
- Release/browser verification should run after meaningful frontend changes.

## Spawn Prompt Template

```txt
Read and follow .agents/codex-subagents/<assistant>.md.

Task: <specific task>
Ownership: <files/directories this agent may edit>
Constraints:
- You are not alone in the codebase.
- Do not revert or overwrite edits made by others.
- Keep changes scoped to the ownership above.
- Use Context7/Playwright MCP only when required by the assistant file or task.
- Report changed files and verification results.
```
