import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { uuidSchema } from '@/lib/utils/zod';

const schema = z.object({
  org_name:      z.string().min(2).max(200),
  inn:           z.string().regex(/^\d{10}(\d{2})?$/).optional(),
  support_type:  z.enum(['money', 'materials', 'services', 'complex']),
  description:   z.string().min(10).max(2000),
  contact_name:  z.string().min(2).max(120),
  contact_email: z.string().email(),
  contact_phone: z.string().regex(/^\+?[0-9\s\-(]{7,20}$/).optional(),
  object_id:     uuidSchema.optional(),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Некорректный запрос' } },
      { status: 400 }
    );
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: issue?.message ?? 'Ошибка валидации' } },
      { status: 400 }
    );
  }

  const {
    org_name, inn, support_type, description,
    contact_name, contact_email, contact_phone, object_id,
  } = parsed.data;

  const supabase = await createServerSupabaseClient();

  const { data: rawApp, error: insertError } = await supabase
    .from('partner_applications')
    .insert({
      org_name,
      inn:           inn ?? null,
      support_type,
      description,
      contact_name,
      contact_email,
      contact_phone: contact_phone ?? null,
      object_id:     object_id ?? null,
      status:        'pending',
    })
    .select('id, status')
    .single();

  if (insertError) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: 'Не удалось создать заявку' } },
      { status: 500 }
    );
  }

  const app = rawApp as { id: string; status: string };
  return NextResponse.json({ data: { id: app.id, status: app.status } }, { status: 201 });
}
