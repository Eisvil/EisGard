"use client";

import { useState } from "react";
import { Bell, CreditCard, Mail, Save, ShieldCheck } from "lucide-react";

const integrationCards = [
  {
    title: "ЮKassa",
    description: "Создание платежей, redirect и webhook payment.succeeded.",
    icon: CreditCard,
    status: "Ожидает env"
  },
  {
    title: "Telegram",
    description: "Уведомления организатору о новых донатах и заявках.",
    icon: Bell,
    status: "Ожидает env"
  },
  {
    title: "SMTP",
    description: "Письма после оплаты, заявки и будущие сертификаты.",
    icon: Mail,
    status: "Ожидает env"
  },
  {
    title: "152-ФЗ",
    description: "Политика ПДн, согласия и ограничение доступа к данным.",
    icon: ShieldCheck,
    status: "Нужны реквизиты"
  }
];

export function AdminSettingsManager() {
  const [projectName, setProjectName] = useState("Живое Городище");
  const [legalName, setLegalName] = useState("НКО / фонд будет указан позже");
  const [contactEmail, setContactEmail] = useState("info@example.ru");
  const [telegramChat, setTelegramChat] = useState("служебный чат не подключен");
  const [savedMessage, setSavedMessage] = useState("");

  return (
    <div className="admin-grid">
      <section className="admin-kpis integration-grid">
        {integrationCards.map((card) => {
          const Icon = card.icon;

          return (
            <article key={card.title}>
              <Icon size={22} />
              <span>{card.title}</span>
              <strong>{card.status}</strong>
              <small>{card.description}</small>
            </article>
          );
        })}
      </section>

      <section className="admin-panel admin-form-panel settings-panel">
        <div className="admin-panel__head">
          <h3>Основные настройки</h3>
          <button className="primary-button" type="button" onClick={() => setSavedMessage("Настройки сохранены в mock-состоянии.")}>
            <Save size={16} />
            Сохранить mock
          </button>
        </div>

        {savedMessage ? <div className="admin-success">{savedMessage}</div> : null}

        <div className="admin-form-grid">
          <label>
            Название проекта
            <input value={projectName} onChange={(event) => setProjectName(event.target.value)} />
          </label>
          <label>
            Юридическое лицо
            <input value={legalName} onChange={(event) => setLegalName(event.target.value)} />
          </label>
          <label>
            Контактный email
            <input value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} />
          </label>
          <label>
            Telegram admin chat
            <input value={telegramChat} onChange={(event) => setTelegramChat(event.target.value)} />
          </label>
          <label className="admin-form-wide">
            Условия пожертвования
            <textarea rows={5} defaultValue="Пожертвование является добровольным вкладом в строительство выбранного объекта. Публичное имя отображается только при согласии участника." />
          </label>
          <label className="admin-form-wide">
            Политика обработки персональных данных
            <textarea rows={5} defaultValue="Персональные данные используются для подтверждения вклада, связи с участником и ведения цифровой летописи проекта." />
          </label>
        </div>

        <div className="admin-muted-line">Секретные ключи не вводятся в браузере. Для них используется `.env.local` и серверные переменные окружения.</div>
      </section>
    </div>
  );
}

