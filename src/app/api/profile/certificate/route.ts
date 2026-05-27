import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export async function POST() {
  const supabase = (await createServerSupabaseClient()) as AnyClient;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Требуется авторизация' } },
      { status: 401 },
    );
  }

  const pdfServiceUrl = process.env.PDF_SERVICE_URL;
  if (!pdfServiceUrl) {
    return NextResponse.json(
      { error: { code: 'PDF_SERVICE_UNAVAILABLE', message: 'Сервис сертификатов временно недоступен' } },
      { status: 503 },
    );
  }

  const { data: profile } = (await supabase
    .from('profiles')
    .select('full_name, points, titles(name)')
    .eq('id', user.id)
    .maybeSingle()) as { data: any };

  if (!profile) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Профиль не найден' } },
      { status: 404 },
    );
  }

  try {
    const response = await fetch(`${pdfServiceUrl}/certificate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        full_name: profile.full_name,
        title: profile.titles?.name ?? null,
        points: profile.points,
      }),
      signal: AbortSignal.timeout(4500),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: { code: 'PDF_SERVICE_UNAVAILABLE', message: 'Сервис сертификатов временно недоступен' } },
        { status: 503 },
      );
    }

    const pdfBuffer = await response.arrayBuffer();
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificate-${user.id}.pdf"`,
      },
    });
  } catch {
    return NextResponse.json(
      { error: { code: 'PDF_SERVICE_UNAVAILABLE', message: 'Сервис сертификатов временно недоступен' } },
      { status: 503 },
    );
  }
}
