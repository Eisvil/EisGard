---
description: Правила для React-компонентов
globs: ["src/components/**", "src/app/(public)/**", "src/app/(auth)/**", "src/app/(cabinet)/**"]
---
- Server Components по умолчанию, 'use client' только при необходимости
- Публичные страницы: только кастомный CSS через CSS-переменные, не Tailwind
- shadcn/ui только для src/app/(admin)/**
- Иконки объектов: ObjectIcon из src/lib/constants/objectIcons.ts
- Иконки UI: lucide-react
- Статусы объектов: только из src/lib/constants/objectStatus.ts
- Зоны: только из src/lib/constants/zones.ts (5 зон)
- Loading / Empty / Error у каждого компонента с данными
- formatMoney(kopecks) для вывода сумм — никогда сырые копейки пользователю
