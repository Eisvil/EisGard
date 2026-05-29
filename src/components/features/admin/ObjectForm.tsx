'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OBJECT_STATUS } from '@/lib/constants/objectStatus';
import { ZONE_LABELS } from '@/lib/constants/zones';
import { OBJECT_ICONS } from '@/lib/constants/objectIcons';
import { slugify } from '@/lib/utils/slugify';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';
import { Upload, X } from 'lucide-react';
import { TiptapEditor } from '@/components/features/admin/TiptapEditor';

type ZoneKey = 'craft' | 'public' | 'farming' | 'military' | 'residential';
type StatusKey = 'draft' | 'planned' | 'building' | 'done' | 'working';

type ObjectRow = {
  id?: string;
  name: string;
  slug: string;
  short_name: string | null;
  zone: ZoneKey;
  status: StatusKey;
  description: string | null;
  cover_url: string | null;
  icon_key: string | null;
  map_position_x: number | null;
  map_position_y: number | null;
  sort_order: number;
  allow_comments: boolean;
  historical_note: Record<string, unknown> | null;
  slots?: Array<{ id: string }>;
};

type Props = {
  object?: ObjectRow;
  mode: 'create' | 'edit';
};

export function ObjectForm({ object, mode }: Props) {
  const router = useRouter();

  const [name, setName]         = useState(object?.name ?? '');
  const [slug, setSlug]         = useState(object?.slug ?? '');
  const [slugEdited, setSlugEdited] = useState(false);
  const [shortName, setShortName]   = useState(object?.short_name ?? '');
  const [zone, setZone]         = useState<ZoneKey>(object?.zone ?? 'craft');
  const [status, setStatus]     = useState<StatusKey>(object?.status ?? 'draft');
  const [description, setDescription] = useState(
    typeof object?.description === 'string' ? object.description : '',
  );
  const [coverUrl, setCoverUrl] = useState(object?.cover_url ?? '');
  const [iconKey, setIconKey]   = useState(object?.icon_key || 'none');
  const [posX, setPosX]         = useState<string>(object?.map_position_x?.toString() ?? '');
  const [posY, setPosY]         = useState<string>(object?.map_position_y?.toString() ?? '');
  const [sortOrder, setSortOrder] = useState<string>(object?.sort_order?.toString() ?? '0');
  const [allowComments, setAllowComments] = useState(object?.allow_comments ?? false);
  const [historicalNote, setHistoricalNote] = useState<Record<string, unknown> | null>(object?.historical_note ?? null);
  const [loading, setLoading]   = useState(false);
  const [serverError, setServerError] = useState('');
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverError, setCoverError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setCoverError('Файл слишком большой (максимум 5 МБ)'); return; }
    setCoverUploading(true);
    setCoverError('');
    try {
      const supabase = createBrowserSupabaseClient();
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `objects/${object?.id ?? 'new'}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('covers').upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) { setCoverError('Ошибка загрузки: ' + uploadError.message); return; }
      const { data: { publicUrl } } = supabase.storage.from('covers').getPublicUrl(path);
      setCoverUrl(publicUrl);
      e.target.value = '';
    } catch (err) {
      setCoverError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setCoverUploading(false);
    }
  }

  // Автогенерация slug из name при создании
  useEffect(() => {
    if (!slugEdited && mode === 'create') {
      setSlug(slugify(name));
    }
  }, [name, slugEdited, mode]);

  const slotsCount = object?.slots?.length ?? 0;
  const showNoSlotsWarning = mode === 'edit' && slotsCount === 0 && status !== 'draft';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError('');
    setLoading(true);

    const payload = {
      name,
      slug,
      zone,
      status,
      description: description || null,
      cover_url:   coverUrl || null,
      icon_key:    (iconKey && iconKey !== 'none') ? iconKey : null,
      short_name:  shortName || null,
      map_position_x: posX ? parseFloat(posX) : null,
      map_position_y: posY ? parseFloat(posY) : null,
      sort_order:  parseInt(sortOrder, 10) || 0,
      allow_comments: allowComments,
      historical_note: historicalNote ?? null,
    };

    try {
      const url    = mode === 'create' ? '/api/admin/objects' : `/api/admin/objects/${object!.id}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        setServerError(json.error?.message ?? 'Ошибка сервера');
        return;
      }

      if (mode === 'create') {
        router.push(`/admin/objects/${json.data.id}`);
      } else {
        router.refresh();
      }
    } catch {
      setServerError('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      {serverError && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {serverError}
        </div>
      )}

      {showNoSlotsWarning && (
        <div className="rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          Добавьте хотя бы один слот перед публикацией.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="name">Название *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Кузница"
            required
          />
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="slug">
            Слаг (URL)
            <span className="ml-2 text-xs text-muted-foreground">только a-z, 0-9, дефис</span>
          </Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => { setSlug(e.target.value); setSlugEdited(true); }}
            placeholder="kuznitsa"
            pattern="^[a-z0-9-]+$"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="shortName">Короткое название (для карты)</Label>
          <Input
            id="shortName"
            value={shortName}
            onChange={(e) => setShortName(e.target.value)}
            placeholder="Кузница"
            maxLength={30}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Зона</Label>
          <Select value={zone} onValueChange={(v) => setZone(v as ZoneKey)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(ZONE_LABELS) as [ZoneKey, string][]).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Статус</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as StatusKey)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(OBJECT_STATUS) as [StatusKey, { label: string }][]).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label>Иконка</Label>
          <div className="flex flex-wrap gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => setIconKey('none')}
              className={`w-10 h-10 rounded border flex items-center justify-center text-xs text-muted-foreground transition-colors ${
                iconKey === 'none' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/50'
              }`}
            >—</button>
            {Object.keys(OBJECT_ICONS).map((key) => (
              <button
                key={key}
                type="button"
                title={key}
                onClick={() => setIconKey(key)}
                className={`w-10 h-10 rounded border flex items-center justify-center transition-colors ${
                  iconKey === key
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={OBJECT_ICONS[key]} alt={key} className="w-8 h-8 object-contain" />
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label>Обложка</Label>
          {coverUrl && (
            <div className="relative mb-2 w-full max-w-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverUrl} alt="Обложка" className="rounded-md h-36 w-full object-cover border border-border" />
              <Button
                type="button" size="icon" variant="ghost"
                className="absolute top-1 right-1 h-7 w-7 bg-background/80 hover:bg-background"
                onClick={() => { setCoverUrl(''); setCoverError(''); }}
              ><X size={13} /></Button>
            </div>
          )}
          <div className="flex gap-2 items-center">
            <input
              ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }} onChange={handleCoverUpload}
            />
            <Button type="button" variant="outline" size="sm"
              onClick={() => fileInputRef.current?.click()} disabled={coverUploading}
            >
              <Upload size={13} className="mr-1.5" />
              {coverUploading ? 'Загружается...' : 'Загрузить фото'}
            </Button>
          </div>
          {coverError && <p className="text-xs text-destructive mt-1">{coverError}</p>}
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="description">Описание</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Описание объекта..."
            rows={5}
          />
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label>Историческая справка</Label>
          <p className="text-xs text-muted-foreground -mt-1">Показывается на странице объекта в виде раскрывающегося блока</p>
          <div className="border border-border rounded-md overflow-hidden">
            <TiptapEditor
              value={historicalNote ?? { type: 'doc', content: [] }}
              onChange={(json) => setHistoricalNote(json)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="posX">
            Позиция X на карте (%)
            <span className="ml-1 text-xs text-muted-foreground">задаётся в редакторе карты</span>
          </Label>
          <Input
            id="posX"
            type="number"
            value={posX}
            onChange={(e) => setPosX(e.target.value)}
            placeholder="50"
            min={0}
            max={100}
            step={0.01}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="posY">Позиция Y на карте (%)</Label>
          <Input
            id="posY"
            type="number"
            value={posY}
            onChange={(e) => setPosY(e.target.value)}
            placeholder="50"
            min={0}
            max={100}
            step={0.01}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sortOrder">Порядок сортировки</Label>
          <Input
            id="sortOrder"
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            min={0}
          />
        </div>

        <div className="col-span-2 flex items-center gap-3 pt-1">
          <input
            id="allowComments"
            type="checkbox"
            checked={allowComments}
            onChange={(e) => setAllowComments(e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          <Label htmlFor="allowComments" className="cursor-pointer font-normal">
            Разрешить комментарии на странице объекта
          </Label>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Сохранение…' : mode === 'create' ? 'Создать объект' : 'Сохранить'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/objects')}
        >
          Отмена
        </Button>
      </div>
    </form>
  );
}
