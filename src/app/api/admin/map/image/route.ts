import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { createServiceSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const ctx = await requireAdmin(['admin', 'moderator']);
  if (ctx instanceof NextResponse) return ctx;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_FORM', message: 'Некорректный запрос' } },
      { status: 400 },
    );
  }

  const file = formData.get('file');
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json(
      { error: { code: 'NO_FILE', message: 'Файл не передан' } },
      { status: 400 },
    );
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json(
      { error: { code: 'FILE_TOO_LARGE', message: 'Максимальный размер 10 МБ' } },
      { status: 413 },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createServiceSupabaseClient()) as any;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from('covers')
    .upload('map/settlement.png', buffer, {
      upsert: true,
      contentType: file.type || 'image/png',
    });

  if (uploadError) {
    return NextResponse.json(
      { error: { code: 'UPLOAD_ERROR', message: 'Ошибка загрузки файла' } },
      { status: 500 },
    );
  }

  const { data: urlData } = supabase.storage
    .from('covers')
    .getPublicUrl('map/settlement.png');

  const publicUrl = urlData?.publicUrl ?? '';

  await supabase
    .from('settings')
    .upsert({ key: 'map_image_url', value: JSON.stringify(publicUrl) });

  revalidatePath('/');

  return NextResponse.json({ data: { url: publicUrl } });
}
