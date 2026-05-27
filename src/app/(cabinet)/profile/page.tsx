import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { formatMoney } from '@/lib/utils/formatMoney';
import { Header } from '@/components/layouts/Header';
import { Footer } from '@/components/layouts/Footer';
import { ProfileHero } from '@/components/features/ProfileHero';
import { TitleProgress } from '@/components/features/TitleProgress';
import { DonationsTable, type DonationRow } from '@/components/features/DonationsTable';
import { VolunteerTable, type VolunteerApplicationRow } from '@/components/features/VolunteerTable';
import { MaterialsDonationsTable, type MaterialApplicationRow } from '@/components/features/MaterialsDonationsTable';
import { CancelSubscriptionButton } from '@/components/features/CancelSubscriptionButton';
import { CertificateButton } from '@/components/features/CertificateButton';
import { ProfileEditForm } from '@/components/features/ProfileEditForm';
import { AvatarUploader } from '@/components/features/AvatarUploader';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

const SUB_STATUS_LABELS: Record<string, string> = {
  active: 'Активна',
  paused: 'Приостановлена',
  cancelled: 'Отменена',
  payment_failed: 'Ошибка платежа',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default async function ProfilePage() {
  const supabase = (await createServerSupabaseClient()) as AnyClient;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login?next=/profile');

  const [
    profileResult,
    allTitlesResult,
    userSkillIdsResult,
    allSkillsResult,
    donationsResult,
    volunteerResult,
    materialsResult,
    subsResult,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select(
        'id, full_name, avatar_url, birth_date, points, role, in_chronicle, title_id, titles(id, name, min_points)',
      )
      .eq('id', user.id)
      .maybeSingle() as Promise<{ data: any }>,

    supabase
      .from('titles')
      .select('id, name, min_points')
      .order('min_points', { ascending: true }) as Promise<{ data: any[] | null }>,

    supabase
      .from('user_skills')
      .select('skill_id')
      .eq('user_id', user.id) as Promise<{ data: any[] | null }>,

    supabase
      .from('skills')
      .select('id, name, category')
      .order('sort_order', { ascending: true }) as Promise<{ data: any[] | null }>,

    supabase
      .from('donations')
      .select('id, amount_kopecks, points_awarded, confirmed_at, objects(name, slug)')
      .eq('user_id', user.id)
      .eq('status', 'confirmed')
      .order('confirmed_at', { ascending: false })
      .limit(50) as Promise<{ data: any[] | null }>,

    supabase
      .from('volunteer_applications')
      .select(
        'id, status, days_worked, points_awarded, created_at, volunteer_camps(name, date_from, date_to)',
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50) as Promise<{ data: any[] | null }>,

    supabase
      .from('material_applications')
      .select('id, quantity, actual_qty, status, created_at, materials(name, unit)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50) as Promise<{ data: any[] | null }>,

    supabase
      .from('subscriptions')
      .select('id, amount_kopecks, status, next_payment_date, created_at, objects(name, slug)')
      .eq('user_id', user.id)
      .in('status', ['active', 'paused', 'payment_failed'])
      .order('created_at', { ascending: false }) as Promise<{ data: any[] | null }>,
  ]);

  const profile = profileResult.data ?? {
    id: user.id,
    full_name: 'Участник',
    avatar_url: null,
    birth_date: null,
    points: 0,
    role: 'user',
    in_chronicle: true,
    titles: null,
  };

  const currentTitle = profile.titles ?? null;
  const currentTitleMinPoints = currentTitle?.min_points ?? 0;
  const allTitles: any[] = allTitlesResult.data ?? [];
  const nextTitle = allTitles.find((t) => t.min_points > profile.points) ?? null;

  const userSkillIds = (userSkillIdsResult.data ?? []).map((r: any) => r.skill_id as string);
  const allSkills = allSkillsResult.data ?? [];

  const donations: DonationRow[] = (donationsResult.data ?? []).map((d: any) => ({
    id: d.id,
    amount_kopecks: d.amount_kopecks,
    points_awarded: d.points_awarded ?? 0,
    confirmed_at: d.confirmed_at,
    objectName: d.objects?.name ?? null,
    objectSlug: d.objects?.slug ?? null,
  }));

  const volunteerApps: VolunteerApplicationRow[] = (volunteerResult.data ?? []).map((a: any) => ({
    id: a.id,
    campName: a.volunteer_camps?.name ?? null,
    dateFrom: a.volunteer_camps?.date_from ?? null,
    dateTo: a.volunteer_camps?.date_to ?? null,
    days_worked: a.days_worked,
    points_awarded: a.points_awarded ?? 0,
    status: a.status,
    created_at: a.created_at,
  }));

  const materialApps: MaterialApplicationRow[] = (materialsResult.data ?? []).map((a: any) => ({
    id: a.id,
    materialName: a.materials?.name ?? null,
    unit: a.materials?.unit ?? null,
    quantity: a.quantity,
    actual_qty: a.actual_qty,
    status: a.status,
    created_at: a.created_at,
  }));

  const subscriptions: any[] = subsResult.data ?? [];

  const totalDonatedKopecks = donations.reduce((s, d) => s + d.amount_kopecks, 0);
  const totalVolunteerDays = volunteerApps.reduce((s, a) => s + (a.days_worked ?? 0), 0);
  const totalMaterialsReceived = materialApps.filter((a) => a.status === 'received').length;

  return (
    <>
      <Header />
      <main className="profile-page">
        <div className="profile-container">
          <nav
            style={{
              marginBottom: '24px',
              fontSize: '14px',
              fontFamily: 'var(--sans)',
              color: 'var(--olive-soft)',
            }}
          >
            <Link href="/" className="text-link" style={{ fontSize: '14px' }}>
              ← На главную
            </Link>
          </nav>

          {/* Hero: аватар, имя, титул, баллы, прогресс, статистика, сертификат */}
          <section className="profile-section panel">
            <ProfileHero
              fullName={profile.full_name}
              points={profile.points}
              titleName={currentTitle?.name ?? null}
              avatarSlot={
                <AvatarUploader
                  avatarUrl={profile.avatar_url}
                  userId={profile.id}
                  fullName={profile.full_name}
                />
              }
            />

            <TitleProgress
              points={profile.points}
              currentTitleMinPoints={currentTitleMinPoints}
              nextTitle={nextTitle}
            />

            <div className="profile-stats">
              <div className="profile-stat">
                <span className="profile-stat-value">{formatMoney(totalDonatedKopecks)}</span>
                <span className="profile-stat-label">пожертвовано</span>
              </div>
              <div className="profile-stat">
                <span className="profile-stat-value">{totalVolunteerDays}</span>
                <span className="profile-stat-label">дней волонтёрства</span>
              </div>
              <div className="profile-stat">
                <span className="profile-stat-value">{totalMaterialsReceived}</span>
                <span className="profile-stat-label">материалов доставлено</span>
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <CertificateButton />
            </div>
          </section>

          {/* История пожертвований */}
          <section className="profile-section panel">
            <h2 className="profile-section-title">История пожертвований</h2>
            <DonationsTable donations={donations} />
          </section>

          {/* Активные подписки */}
          <section className="profile-section panel">
            <h2 className="profile-section-title">Мои подписки</h2>
            {subscriptions.length === 0 ? (
              <p className="profile-empty">
                У вас нет активных подписок.{' '}
                <Link href="/" className="text-link">
                  Выберите объект
                </Link>
                , чтобы настроить ежемесячную поддержку.
              </p>
            ) : (
              <div className="history-table-wrap">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Объект</th>
                      <th>Сумма/мес</th>
                      <th>Следующий платёж</th>
                      <th>Статус</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map((sub: any) => (
                      <tr key={sub.id}>
                        <td>
                          {sub.objects ? (
                            <Link href={`/objects/${sub.objects.slug}`} className="text-link">
                              {sub.objects.name}
                            </Link>
                          ) : (
                            <span style={{ color: 'var(--olive-soft)' }}>Объект удалён</span>
                          )}
                        </td>
                        <td>{formatMoney(sub.amount_kopecks)}</td>
                        <td>
                          {sub.status === 'active' ? formatDate(sub.next_payment_date) : '—'}
                        </td>
                        <td>
                          <span className="sub-status-badge" data-status={sub.status}>
                            {SUB_STATUS_LABELS[sub.status] ?? sub.status}
                          </span>
                        </td>
                        <td>
                          {sub.status !== 'cancelled' && (
                            <CancelSubscriptionButton subscriptionId={sub.id} />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Волонтёрские заявки */}
          <section className="profile-section panel">
            <h2 className="profile-section-title">Волонтёрство</h2>
            <VolunteerTable applications={volunteerApps} />
          </section>

          {/* Заявки на материалы */}
          <section className="profile-section panel">
            <h2 className="profile-section-title">Материальные взносы</h2>
            <MaterialsDonationsTable applications={materialApps} />
          </section>

          {/* Редактирование профиля */}
          <section className="profile-section panel">
            <h2 className="profile-section-title">Настройки профиля</h2>
            <ProfileEditForm
              profile={{
                full_name: profile.full_name,
                birth_date: profile.birth_date,
                in_chronicle: profile.in_chronicle,
              }}
              skills={allSkills}
              userSkillIds={userSkillIds}
            />
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
