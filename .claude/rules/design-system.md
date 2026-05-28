---
description: Дизайн-система проекта — CSS-переменные, компоненты, ограничения. Читать перед любой задачей публичного UI.
globs: ["src/app/(public)/**", "src/app/(auth)/**", "src/app/(cabinet)/**", "src/components/features/**", "src/components/layouts/**", "src/styles/**"]
---

## CSS-переменные (src/styles/globals.css)
--paper: #fcf9f1        фон страницы
--paper-strong: #fffdf8  фон карточек
--ink: #484236           основной текст
--olive: #667643         акцент, иконки в панелях
--olive-dark: #536333    заголовки, активные ссылки навигации
--olive-soft: #96a268    иконки статистики
--gold: #c9a64e          подчёркивание активного пункта навигации
--gold-soft: #eee2c1     декоративные разделительные линии
--line: #e6ddca          бордер карточек (светлый)
--line-strong: #dbc9a4   бордер карточек (тёмный)
--shadow: 0 6px 20px rgba(80,68,43,.06)
--serif: "Palatino Linotype","Book Antiqua",Georgia,serif
--sans: "Segoe UI",Arial,sans-serif
--page-gutter: clamp(18px,3vw,44px)

## Ключевые CSS-классы (семантику не менять)
.panel              — карточка: border 1px var(--line), border-radius 16px, shadow
.primary-button     — CTA: gradient #889653→#64733e, border-radius 10px
.text-link          — текстовая кнопка: прозрачный фон, olive-dark, serif
.hotspot            — иконка объекта на карте: 54px, абс. позиция по (x%, y%)
.hotspot-round      — белый кружок иконки: 54px, border #eadbbe
.hotspot-label      — подпись иконки (display:none → flex при .selected)
.badge              — бейдж статуса: background rgba(255,253,248,.95), ::before = --status-color
.mini-progress span — прогресс карточки: background = var(--status-color)
.progress span      — прогресс детали: gradient #6c8047→#8fa15b
.player-hud         — оверлей поверх карты: имя, титул, баллы пользователя
.eyebrow            — декор. подпись с золотыми линиями по бокам
.feature            — левая панель выбранного объекта

## Типографика
Заголовки h1–h3: font-family var(--serif), Palatino
Навигация, кнопки CTA: var(--serif)
Основной текст, описания: 16px/1.5 var(--sans)
Мелкий текст (бейджи, время): 11–13px var(--sans)

## Структура src/styles/
globals.css      — :root переменные, reset, body/a/button/h
components.css   — panel, primary-button, text-link, badge, progress, eyebrow
layout.css       — dashboard grid, site-header, site-footer
map.css          — map-canvas, hotspot, player-hud, legend, zoom
responsive.css   — @media 1399px / 920px / 760px / 430px

## Запрещено для публичных страниц
- Tailwind-утилиты (bg-*, text-*, p-* и т.д.)
- shadcn/ui компоненты (Button, Card, Badge и т.д.)
- Inline border-radius, box-shadow, background — только через классы
- Другие шрифты помимо var(--serif) и var(--sans)
- Хардкодить цвета статусов — только var(--status-color)
