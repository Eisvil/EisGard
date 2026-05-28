import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin/requireAdmin';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

const patchSchema = z.object({
  status: z.enum(['contacted', 'approved', 'rejected']),
  publish_partner: z.boolean().optional(),
  logo_url: z.string().url().optional().or(z.literal('')),
  admin_note: z.string().max(500).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireAdmin(['admin', 'moderator']);
  if (ctx instanceof NextResponse) return ctx;
  const { supabase } = ctx as { supabase: AnyClient };

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Некорректный запрос' } },
      { status: 400 },
    );
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Ошибка валидации' } },
      { status: 400 },
    );
  }

  const { status, publish_partner, logo_url, admin_note } = parsed.data;

  // Загружаем заявку
  const { data: app, error: appErr } = await supabase
    .from('partner_applications')
    .select('id, status, org_name, support_type, object_id, logo_url')
    .eq('id', id)
    .maybeSingle() as {
    data: {
      id: string;
      status: string;
      org_name: string;
      support_type: string;
      object_id: string | null;
      logo_url: string | null;
    } | null;
    error: unknown;
  };

  if (appErr || !app) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Заявка не найдена' } },
      { status: 404 },
    );
  }

  const finalLogoUrl = logo_url || app.logo_url || null;

  // Обновляем статус заявки
  await supabase
    .from('partner_applications')
    .update({
      status,
      logo_url: finalLogoUrl,
      admin_note: admin_note ?? null,
    })
    .eq('id', id);

  // Публикуем партнёра при одобрении
  let partnerPublished = false;
  if (status === 'approved' && publish_partner) {
    await supabase.from('object_partners').insert({
      object_id: app.object_id ?? null,
      org_name: app.org_name,
      logo_url: finalLogoUrl,
      support_type: app.support_type,
    });
    partnerPublished = true;
  }

  return NextResponse.json({ data: { updated: true, partner_published: partnerPublished } });
}
