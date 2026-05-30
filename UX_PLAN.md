# UX-план улучшений — «Живое Городище»

> Создан: 2026-05-30 | Статус: В работе
> Аудит проведён через Playwright MCP (Desktop 1440px + Mobile 390px)

---

## Статус блоков

| Блок | Описание | Статус |
|------|----------|--------|
| **D** | UX-исправления (auth, карточки, новости, материалы, пароль) | ✅ Готово (QA пройден 2026-05-30) |
| **C** | Убрать объект-подписку со страниц объектов | ✅ Готово (уже не было, проверено) |
| **F** | UX-полировка (гость, placeholder карты, счётчики, scroll-to-top, мета) | ✅ Готово (QA пройден 2026-05-30) |
| **F8** | Console error settlement.jpg → .png | ✅ Исправлено |
| **E** | Мобильное бургер-меню + polish | ✅ Готово (QA пройден 2026-05-30) |
| **B** | Sequential slots (sort_order + locked UI) | ✅ Готово (QA пройден 2026-05-30) |
| **A** | Новый лейаут страницы объекта + ObjectsGrid | ✅ Готово (QA пройден 2026-05-30) |

---

## БЛОК D — UX-исправления

### D1. Кнопка «← Живое Городище» на auth-страницах
- **Файл:** `src/app/(auth)/layout.tsx`
- **CSS:** `src/styles/components.css` — класс `.auth-back-link`
- **Суть:** пользователь не может выйти из auth-потока без браузерного «Назад»

### D2. «Как поддержать» — кнопки уже кликабельны
- **Статус:** ✅ Уже реализовано (onClick-навигация в MapSection)
- **Нужно:** добавить hover-стиль `.support-grid button:hover`

### D3. Кнопка «Все новости →» после секции новостей
- **Файл:** `src/components/features/MapSection.tsx` (раздел `chronicle panel`)
- **Суть:** после карточек новостей нет ссылки «смотреть все»

### D4. Текст кнопки материалов: «Пожертвовать» → «Предложить материал»
- **Файл:** `src/components/features/MaterialsClient.tsx` (строка ~89)

### D5. Тогл «показать пароль» на формах входа и регистрации
- **Файлы:** `src/app/(auth)/auth/login/page.tsx`, `src/app/(auth)/auth/register/page.tsx`
- **Иконки:** `Eye`/`EyeOff` из `lucide-react`

---

## БЛОК C — Подписка только проектная

### C1. Удалить SubscribeSectionClient со страниц объектов
- **Файл:** `src/app/(public)/objects/[slug]/page.tsx`
- **Оставить:** кнопку «Поддержать проект» на главной (MapSection)

### C2. Проверить SupportModal с object_id = null
- **Файл:** `src/app/api/donations/subscribe/route.ts`

---

## БЛОК F — UX-полировка

### F1. Предупреждение для гостей перед редиректом
- **Файлы:** `src/components/features/VolunteersClient.tsx`, `MaterialsClient.tsx`
- **Суть:** вместо тихого редиректа — мини-уведомление с кнопками Войти/Зарегистрироваться

### F2. Placeholder «Выберите объект» на карте
- **Файл:** `src/components/features/MapSection.tsx`
- **Суть:** убрать автовыбор первого объекта, показывать placeholder в левой панели

### F3. Disabled + tooltip для закрытых заездов
- **Файл:** `src/components/features/VolunteersClient.tsx`

### F4. Счётчики событий в фильтрах летописи
- **Файл:** `src/components/features/ChronicleList.tsx`
- **Вид:** `Пожертвования (4)`, `Волонтёрство (1)`

### F5. Пустое состояние летописи
- **Файл:** `src/components/features/ChronicleList.tsx`

### F6. Кнопка «Наверх» на длинных страницах
- **Новый файл:** `src/components/features/ScrollToTop.tsx`
- **Подключить в:** `src/app/(public)/layout.tsx` или на нужных страницах

### F7. Метатеги и page titles
- **Файлы:** страницы `/objects/[slug]`, `/volunteers`, `/materials`, `/chronicle`

### F8. Console error на /auth/login
- Расследовать: `src/app/(auth)/auth/login/page.tsx`

### F9. Fade-mask фильтров объектов на мобиле
- **Файл:** `src/styles/responsive.css`

---

## БЛОК E — Мобильный

### E1. Бургер-меню (hamburger drawer)
- **Файл:** `src/components/layouts/Header.tsx`
- **CSS:** `src/styles/layout.css`, `src/styles/responsive.css`

### E2. Tap-targets хотспотов ≥ 44px
- **Файл:** `src/styles/map.css`

### E3. Компактный футер на мобиле
- **Файл:** `src/styles/responsive.css`

---

## БЛОК B — Sequential slots

### B1. Миграция: ADD COLUMN display_order в slots
- **Файл:** новая миграция `supabase/migrations/`

### B2. Логика активного/заблокированного слота
- **Файл:** `src/app/(public)/objects/[slug]/page.tsx`

### B3. UI заблокированных слотов
- **Файлы:** `src/components/features/SlotsSection.tsx`, `src/styles/components.css`

### B4. Admin: управление порядком слотов
- **Файл:** `src/components/features/admin/SlotsManager.tsx`

---

## БЛОК A — Новый лейаут страницы объекта

### A1. ObjectsGrid.tsx — новый компонент
- Переиспользует `.object-card` стили
- Принимает `objects[]` + `currentSlug`
- Навигация через `<Link href="/objects/[slug]">` (Next.js soft navigation)

### A2. Рефакторинг /objects/[slug]/page.tsx
- Новый порядок секций:
  1. Hero (картинка + название)
  2. Общая шкала прогресса (ObjectProgress)
  3. ObjectsGrid (все объекты, текущий выделен)
  4. Слоты (с sequential locking)
  5. Описание + Историческая справка
  6. Комментарии

### A3. ObjectProgress.tsx — компонент общей шкалы
- Показывает `raised_value / total_goal_rub` крупной полосой

---

## История изменений

| Дата | Блок | Что сделано |
|------|------|-------------|
| 2026-05-30 | D | auth layout ← ссылка, «Все новости →», «Предложить материал», Eye-тогл пароля |
| 2026-05-30 | F8 | CSS: settlement.jpg → settlement.png (console error 404 исправлен) |
| 2026-05-30 | C | Проверено — SubscribeSectionClient отсутствует на /objects/[slug] |
| 2026-05-30 | F | Гость-предупреждение (volunteers+materials), placeholder карты, ScrollToTop, метатеги, счётчики летописи, пустое состояние летописи, fade-mask фильтров (mobile) |
| 2026-05-30 | E | Бургер-меню с drawer (6 пунктов + CTA), tap-targets ≥44px, компактный футер на mobile |
| 2026-05-30 | B | Sequential slots: sort_order уже был в БД; is_locked вычисляется на сервере; locked-слоты — 50% opacity + замок + подсказка; кнопка не рендерится |
| 2026-05-30 | A | ObjectsGrid.tsx: сетка объектов на странице объекта между прогрессом и слотами; текущий объект выделен olive-рамкой; Next.js Link-навигация (soft nav) |
