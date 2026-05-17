# Codex Subagents

Этот каталог содержит проектные role cards для автономной разработки `Живое Городище` в Codex.

Это не `.claude/agents` и не новые системные tool-типы. В Codex фактический механизм такой:

```txt
role file -> spawn_agent(worker/explorer) prompt -> bounded task -> result
```

## How To Use

1. Перед делегированием определи зону задачи по `task-routing.md`.
2. Прочитай соответствующий файл ассистента.
3. Если задача подходит для параллельной или специализированной работы, вызови `spawn_agent`.
4. Для coding work используй `worker`; для анализа, QA и browser verification используй `explorer`.
5. Передай агенту:
   - роль из файла;
   - конкретную задачу;
   - ownership файлов;
   - запрет откатывать чужие изменения;
   - ожидаемый формат результата.

## Core Rules

- Один coding-agent владеет только своим write scope.
- Параллельная работа разрешена только при непересекающихся write scopes.
- QA/security/browser agents работают read-only.
- Агентам нельзя делать unrelated refactor.
- Секреты не записываются в клиентский код и публичные env.
- Реальный donation становится `paid` только через webhook ЮKassa или явно разрешенный manual admin flow.
- После значимых frontend-изменений нужен dev server и browser-check.

## MCP Usage

Используй подключенные MCP только когда они дают конкретную пользу задаче.

### Context7

Используй Context7 для актуальной документации по библиотекам и фреймворкам, если задача затрагивает API или поведение:

- Next.js App Router;
- React;
- Supabase JS / SSR / Auth;
- Tailwind CSS;
- shadcn/ui;
- lucide-react;
- Playwright.

Правила:

- сначала resolve library id, затем query docs;
- задавай узкий вопрос по конкретной задаче;
- не отправляй в Context7 секреты, токены, персональные данные или приватный код целиком;
- если Context7 не покрывает нужный внешний сервис, используй официальную документацию этого сервиса.

### Playwright MCP

Используй Playwright MCP для локальной проверки UI и пользовательских сценариев:

- после значимых frontend-изменений;
- при проверке desktop/mobile layout;
- при проверке карты, bottom sheet, форм, админских таблиц;
- при расследовании console/network errors;
- для screenshot/snapshot evidence в QA.

Минимальные viewport checks для UI-задач:

- desktop: около `1440x900`;
- mobile: `360x800`.

## Documentation Rule

Файлы в `.agents/codex-subagents/` являются частью проектной документации.

Обновляй их вместе с:

- `AGENTS.md`;
- `SPEC.md`;
- `DATA_MODEL.md`;
- `IMPLEMENTATION_PLAN.md`, если меняется порядок или зона разработки;
- `DESIGN_SYSTEM.md`, если меняются UI-правила, влияющие на public/admin UI agents.

При изменении архитектуры, платежного сценария, ролей, RLS, структуры админки или правил UI проверь, не устарели ли соответствующие role cards.
