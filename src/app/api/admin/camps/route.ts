import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin/requireAdmin';

type AnyClient = ReturnType<typeof import('@/lib/supabase/server')['createServerSupabaseClient']> extends Promise<infer T> ? T : never;

type CampRow = {
  id: string;
  name: string;
  date_from: string;
  date_to: string;
  max_volunteers: number;
  description: string | null;
  is_open: boolean;
  created_at: string | null;
};

type AppCountRow = { camp_id: string };

const createSchema = z.object({
  name: z.string().min(2).max(120),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  max_volunteers: z.number().int().min(1).default(20),
  description: z.string().max(2000).optional(),
});

export async function GET() {
  const ctx = await requireAdmin(['admin', 'moderator']);
  if (ctx instanceof NextResponse) return ctx;
  const { supabase } = ctx;

  const { data: rawCamps, error } = await (supabase as unknown as AnyClient)
    .from('volunteer_camps')
    .select('id, name, date_from, date_to, max_volunteers, description, is_open, created_at')
    .order('date_from', { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: 'Ошибка загрузки заездов' } },
      { status: 500 },
    );
  }

  const camps = (rawCamps ?? []) as CampRow[];

  if (camps.length === 0) {
    return NextResponse.json({ data: [] });
  }

  const campIds = camps.map((c) => c.id);

  const { data: rawApps } = await (supabase as unknown as AnyClient)
    .from('volunteer_applications')
    .select('camp_id, status')
    .in('camp_id', campIds)
    .in('status', ['pending', 'approved', 'completed']);

  type AppRow = { camp_id: string; status: string };
  const apps = (rawApps ?? []) as AppRow[];

  const pendingMap: Record<string, number> = {};
  const approvedMap: Record<string, number> = {};
  for (const a of apps) {
    if (a.status === 'pending') pendingMap[a.camp_id] = (pendingMap[a.camp_id] ?? 0) + 1;
    if (a.status === 'approved') approvedMap[a.camp_id] = (approvedMap[a.camp_id] ?? 0) + 1;
  }

  const data = camps.map((camp) => ({
    ...camp,
    pending_count: pendingMap[camp.id] ?? 0,
    approved_count: approvedMap[camp.id] ?? 0,
  }));

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const ctx = await requireAdmin(['admin', 'moderator']);
  if (ctx instanceof NextResponse) return ctx;
  const { supabase } = ctx;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Некорректный запрос' } },
      { status: 400 },
    );
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Ошибка валидации' } },
      { status: 400 },
    );
  }

  const { name, date_from, date_to, max_volunteers, description } = parsed.data;

  if (date_to < date_from) {
    return NextResponse.json(
      { error: { code: 'INVALID_DATES', message: 'Дата окончания должна быть не раньше даты начала' } },
      { status: 400 },
    );
  }

  const { data: camp, error } = await (supabase as unknown as AnyClient)
    .from('volunteer_camps')
    .insert({ name, date_from, date_to, max_volunteers, description: description ?? null })
    .select('id')
    .single();

  if (error || !camp) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: 'Не удалось создать заезд' } },
      { status: 500 },
    );
  }

  return NextResponse.json({ data: { id: (camp as { id: string }).id } }, { status: 201 });
}
