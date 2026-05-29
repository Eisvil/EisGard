import Link from 'next/link';
import { Eye, BookOpen, Leaf } from 'lucide-react';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export async function Footer() {
  let socialVk = '';
  let socialTelegram = '';
  let socialYoutube = '';

  let socialVkIcon = '';
  let socialTelegramIcon = '';
  let socialYoutubeIcon = '';

  try {
    const supabase = (await createServerSupabaseClient()) as AnyClient;
    const { data } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['social_vk', 'social_telegram', 'social_youtube', 'social_vk_icon', 'social_telegram_icon', 'social_youtube_icon']);

    for (const row of (data ?? []) as { key: string; value: unknown }[]) {
      if (row.key === 'social_vk') socialVk = String(row.value ?? '');
      if (row.key === 'social_telegram') socialTelegram = String(row.value ?? '');
      if (row.key === 'social_youtube') socialYoutube = String(row.value ?? '');
      if (row.key === 'social_vk_icon') socialVkIcon = String(row.value ?? '');
      if (row.key === 'social_telegram_icon') socialTelegramIcon = String(row.value ?? '');
      if (row.key === 'social_youtube_icon') socialYoutubeIcon = String(row.value ?? '');
    }
  } catch {
    // fail silently — footer renders without social links
  }

  return (
    <footer className="site-footer" id="about">
      <div className="footer-scene" aria-hidden="true"></div>
      <div className="footer-inner">
        <div className="footer-brand">
          <img src="/logo.png" alt="" width={72} height={72} />
          <strong>Живое<br />Городище</strong>
        </div>
        <div className="principle">
          <b><Eye size={28} strokeWidth={1.5} aria-hidden="true" /></b>
          <strong>Открытость</strong>
          <p>Показываем процесс честно и без прикрас. Строим поселение и принимаем решения вместе с вами. Сохраняем в истории общие дела.</p>
        </div>
        <div className="principle">
          <b><BookOpen size={28} strokeWidth={1.5} aria-hidden="true" /></b>
          <strong>Историческая основа</strong>
          <p>Изучаем быт и ремёсла X–XIII веков. Экспериментальная реконструкция, ручной труд. Проживаем историю вместе.</p>
        </div>
        <div className="principle">
          <b><Leaf size={28} strokeWidth={1.5} aria-hidden="true" /></b>
          <strong>Гармоничность</strong>
          <p>Строим в гармонии с природой и людьми. Создаем своё место для близких по духу родных, друзей, и гостей.</p>
        </div>
        <div className="social" aria-label="Социальные сети">
          <div className="social-row">
            {socialVk && (
              <a href={socialVk} aria-label="ВКонтакте" target="_blank" rel="noopener noreferrer">
                {socialVkIcon
                  ? <img src={socialVkIcon} alt="ВКонтакте" width={40} height={40} style={{ display: 'block', objectFit: 'contain' }} />
                  : <svg viewBox="0.4 1.6 28 28" aria-hidden="true"><path d="M3.4 6.1h4.8c.3 5 2.3 7 3.8 7.4V6.1h4.5v4.2c1.5-.2 3.2-2.1 3.8-4.2h4.5c-.5 2.6-2.7 5-4.3 6 1.6.8 4.2 3 5.1 6.8h-5c-.7-2-2.2-3.6-4.1-3.9v3.9H16C8.1 18.9 3.6 13.7 3.4 6.1Z" /></svg>
                }
              </a>
            )}
            {socialTelegram && (
              <a href={socialTelegram} aria-label="Телеграм" target="_blank" rel="noopener noreferrer">
                {socialTelegramIcon
                  ? <img src={socialTelegramIcon} alt="Телеграм" width={40} height={40} style={{ display: 'block', objectFit: 'contain' }} />
                  : <svg viewBox="-1.7 0.2 28 28" aria-hidden="true"><path d="M25.4 4.3 21.3 24c-.3 1.4-1.1 1.8-2.3 1.1l-6.3-4.7-3 2.9c-.3.3-.6.6-1.3.6l.5-6.4L20.5 7.2c.5-.5-.1-.8-.8-.3L5.4 15.8-.8 13.9c-1.3-.4-1.4-1.3.3-2l24.1-9.3c1.1-.4 2.1.3 1.8 1.7Z" transform="translate(1.6 .2)" /></svg>
                }
              </a>
            )}
            {socialYoutube && (
              <a href={socialYoutube} aria-label="Ютуб" target="_blank" rel="noopener noreferrer">
                {socialYoutubeIcon
                  ? <img src={socialYoutubeIcon} alt="YouTube" width={40} height={40} style={{ display: 'block', objectFit: 'contain' }} />
                  : <svg viewBox="0 0 28 28" aria-hidden="true"><path d="M25.1 8.3c-.3-1.4-1.5-2.5-2.9-2.9C19.8 4.8 14 4.8 14 4.8s-5.8 0-8.2.6C4.4 5.8 3.3 6.9 2.9 8.3c-.6 2.5-.6 5.7-.6 5.7s0 3.2.6 5.7c.4 1.4 1.5 2.5 2.9 2.9 2.4.6 8.2.6 8.2.6s5.8 0 8.2-.6c1.4-.4 2.6-1.5 2.9-2.9.6-2.5.6-5.7.6-5.7s0-3.2-.6-5.7Zm-13.7 9.4V10.3l6.5 3.7-6.5 3.7Z" /></svg>
                }
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="footer-legal">
        <Link href="/privacy">Политика конфиденциальности</Link>
        <Link href="/personal-data">Обработка персональных данных</Link>
        <Link href="/about">О проекте</Link>
      </div>
    </footer>
  );
}
