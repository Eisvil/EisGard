"use client";

import { useState } from "react";
import { Bell, CreditCard, ExternalLink, Landmark, Mail, Save, ShieldCheck } from "lucide-react";
import type { PaymentProviderPreference, ProjectSettings } from "@/lib/types";

type AdminSettingsManagerProps = {
  initialSettings: ProjectSettings;
  yookassaEnvReady: boolean;
};

export function AdminSettingsManager({ initialSettings, yookassaEnvReady }: AdminSettingsManagerProps) {
  const [settings, setSettings] = useState<ProjectSettings>(initialSettings);
  const [savedMessage, setSavedMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const integrationCards = [
    {
      title: "ЮKassa",
      description: yookassaEnvReady
        ? "Env заполнен. Следующий шаг - create-payment route и webhook."
        : "Секреты задаются только в .env.local или server env.",
      icon: CreditCard,
      status: yookassaEnvReady ? "Env готов" : "Ожидает env"
    },
    {
      title: "Т-Банк Сборы",
      description: settings.tbankCollectionEnabled
        ? "Публичная форма будет предлагать внешнюю ссылку на сбор."
        : "Можно включить как ручной внешний платежный сценарий.",
      icon: Landmark,
      status: settings.tbankCollectionEnabled ? "Включено" : "Выключено"
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

  function updateSetting<Key extends keyof ProjectSettings>(key: Key, value: ProjectSettings[Key]) {
    setSettings((current) => ({
      ...current,
      [key]: value
    }));
  }

  async function saveSettings() {
    setIsSaving(true);
    setSavedMessage("");
    setErrorMessage("");

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(settings)
      });

      const result = (await response.json()) as { ok?: boolean; mode?: string; message?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.message ?? "Не удалось сохранить настройки");
      }

      setSavedMessage(result.mode === "supabase" ? "Настройки сохранены в Supabase." : "Настройки сохранены в mock-режиме.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Не удалось сохранить настройки");
    } finally {
      setIsSaving(false);
    }
  }

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
          <button className="primary-button" type="button" onClick={saveSettings} disabled={isSaving}>
            <Save size={16} />
            {isSaving ? "Сохраняем..." : "Сохранить"}
          </button>
        </div>

        {savedMessage ? <div className="admin-success">{savedMessage}</div> : null}
        {errorMessage ? <div className="form-error">{errorMessage}</div> : null}

        <div className="admin-form-grid">
          <label>
            Название проекта
            <input value={settings.projectName} onChange={(event) => updateSetting("projectName", event.target.value)} />
          </label>
          <label>
            Юридическое лицо
            <input value={settings.legalName} onChange={(event) => updateSetting("legalName", event.target.value)} />
          </label>
          <label>
            Контактный email
            <input value={settings.contactEmail} onChange={(event) => updateSetting("contactEmail", event.target.value)} />
          </label>
          <label>
            Telegram admin chat
            <input value={settings.telegramAdminChat} onChange={(event) => updateSetting("telegramAdminChat", event.target.value)} />
          </label>
          <label>
            Активный платежный режим
            <select
              value={settings.paymentProviderPreference}
              onChange={(event) => updateSetting("paymentProviderPreference", event.target.value as PaymentProviderPreference)}
            >
              <option value="mock">Mock без реальной оплаты</option>
              <option value="tbank_collection_manual">Т-Банк Сборы вручную</option>
              <option value="yookassa">ЮKassa webhook</option>
            </select>
          </label>
          <label className="checkbox-field admin-checkbox-field">
            <input
              checked={settings.tbankCollectionEnabled}
              type="checkbox"
              onChange={(event) => updateSetting("tbankCollectionEnabled", event.target.checked)}
            />
            <span>Включить Т-Банк Сборы на публичной форме</span>
          </label>
          <label>
            Название сбора Т-Банка
            <input
              value={settings.tbankCollectionTitle}
              onChange={(event) => updateSetting("tbankCollectionTitle", event.target.value)}
            />
          </label>
          <label>
            Ссылка на сбор Т-Банка
            <input
              placeholder="https://..."
              value={settings.tbankCollectionUrl}
              onChange={(event) => updateSetting("tbankCollectionUrl", event.target.value)}
            />
          </label>
          <label className="admin-form-wide">
            Описание внешнего сбора
            <textarea
              rows={4}
              value={settings.tbankCollectionDescription}
              onChange={(event) => updateSetting("tbankCollectionDescription", event.target.value)}
            />
          </label>
          <label className="admin-form-wide">
            Условия пожертвования
            <textarea rows={5} value={settings.donationTerms} onChange={(event) => updateSetting("donationTerms", event.target.value)} />
          </label>
          <label className="admin-form-wide">
            Политика обработки персональных данных
            <textarea rows={5} value={settings.privacyPolicy} onChange={(event) => updateSetting("privacyPolicy", event.target.value)} />
          </label>
        </div>

        {settings.tbankCollectionEnabled && settings.tbankCollectionUrl ? (
          <a className="secondary-button settings-external-link" href={settings.tbankCollectionUrl} target="_blank" rel="noreferrer">
            <ExternalLink size={16} />
            Открыть сбор Т-Банка
          </a>
        ) : null}

        <div className="admin-muted-line">
          Секретные ключи не вводятся в браузере. Для ЮKassa используются `YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY`,
          `YOOKASSA_WEBHOOK_SECRET` в `.env.local` или server env.
        </div>
      </section>
    </div>
  );
}
