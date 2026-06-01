'use client';

import { useState, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Trash2, Plus, CheckCircle2, Upload, X } from 'lucide-react';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';
import { StaticPagesEditor } from './StaticPagesEditor';
import { MaterialsManager } from './MaterialsManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';

type Title = {
  id: string;
  name: string;
  min_points: number;
  description: string | null;
  privileges: string | null;
  sort_order: number;
};

type Skill = {
  id: string;
  name: string;
  category: string;
  sort_order: number;
};

type Settings = {
  points_per_ruble: number;
  points_per_day: number;
  social_vk: string;
  social_telegram: string;
  social_youtube: string;
  social_vk_icon: string;
  social_telegram_icon: string;
  social_youtube_icon: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  craft: 'Ремёсла',
  building: 'Строительство',
  farming: 'Хозяйство',
  cooking: 'Кулинария',
  other: 'Прочее',
  general: 'Общее',
};

// Sortable row для титула
function SortableTitleRow({
  title,
  onEdit,
  onDelete,
}: {
  title: Title;
  onEdit: (t: Title) => void;
  onDelete: (t: Title) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: title.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 py-2.5 px-3 border-b border-border last:border-0 bg-background hover:bg-muted/30"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-muted-foreground hover:text-foreground"
        aria-label="Перетащить"
      >
        <GripVertical size={16} />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{title.name}</span>
          <Badge variant="outline" className="text-xs">от {title.min_points} б</Badge>
        </div>
        {title.privileges && (
          <p className="text-xs text-muted-foreground truncate">{title.privileges}</p>
        )}
      </div>
      <div className="flex gap-1 shrink-0">
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => onEdit(title)}>
          <Pencil size={13} />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
          onClick={() => onDelete(title)}
        >
          <Trash2 size={13} />
        </Button>
      </div>
    </div>
  );
}

export function SettingsManager({
  initialTitles,
  initialSkills,
  initialSettings,
}: {
  initialTitles: Title[];
  initialSkills: Skill[];
  initialSettings: Settings;
}) {
  // --- Коэффициенты ---
  const [ppr, setPpr] = useState(String(initialSettings.points_per_ruble));
  const [ppd, setPpd] = useState(String(initialSettings.points_per_day));
  const [savingCoeff, setSavingCoeff] = useState(false);
  const [coeffSaved, setCoeffSaved] = useState(false);
  const [coeffError, setCoeffError] = useState('');

  // --- Соцсети ---
  const [vk, setVk] = useState(initialSettings.social_vk);
  const [telegram, setTelegram] = useState(initialSettings.social_telegram);
  const [youtube, setYoutube] = useState(initialSettings.social_youtube);
  const [vkIcon, setVkIcon] = useState(initialSettings.social_vk_icon);
  const [telegramIcon, setTelegramIcon] = useState(initialSettings.social_telegram_icon);
  const [youtubeIcon, setYoutubeIcon] = useState(initialSettings.social_youtube_icon);
  const [uploadingIcon, setUploadingIcon] = useState<'vk' | 'telegram' | 'youtube' | null>(null);
  const [iconError, setIconError] = useState('');
  const [savingSocial, setSavingSocial] = useState(false);
  const [socialSaved, setSocialSaved] = useState(false);
  const [socialError, setSocialError] = useState('');
  const vkIconRef = useRef<HTMLInputElement>(null);
  const telegramIconRef = useRef<HTMLInputElement>(null);
  const youtubeIconRef = useRef<HTMLInputElement>(null);

  async function uploadSocialIcon(network: 'vk' | 'telegram' | 'youtube', file: File) {
    if (file.size > 2 * 1024 * 1024) { setIconError('Файл слишком большой (макс. 2 МБ)'); return; }
    setUploadingIcon(network);
    setIconError('');
    try {
      const supabase = createBrowserSupabaseClient();
      const ext = file.name.split('.').pop() ?? 'png';
      const path = `settings/social_${network}_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('covers').upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) { setIconError('Ошибка загрузки: ' + uploadError.message); return; }
      const { data: { publicUrl } } = supabase.storage.from('covers').getPublicUrl(path);
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [`social_${network}_icon`]: publicUrl }),
      });
      if (!res.ok) { setIconError('Ошибка сохранения URL'); return; }
      if (network === 'vk') setVkIcon(publicUrl);
      if (network === 'telegram') setTelegramIcon(publicUrl);
      if (network === 'youtube') setYoutubeIcon(publicUrl);
    } catch (e) {
      setIconError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setUploadingIcon(null);
    }
  }

  async function clearSocialIcon(network: 'vk' | 'telegram' | 'youtube') {
    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [`social_${network}_icon`]: '' }),
    });
    if (res.ok) {
      if (network === 'vk') setVkIcon('');
      if (network === 'telegram') setTelegramIcon('');
      if (network === 'youtube') setYoutubeIcon('');
    }
  }

  async function saveSocial() {
    setSavingSocial(true);
    setSocialError('');
    setSocialSaved(false);
    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ social_vk: vk, social_telegram: telegram, social_youtube: youtube }),
    });
    setSavingSocial(false);
    if (!res.ok) {
      const json = await res.json();
      setSocialError(json.error?.message ?? 'Ошибка сохранения');
      return;
    }
    setSocialSaved(true);
    setTimeout(() => setSocialSaved(false), 2500);
  }

  async function saveCoefficients() {
    setSavingCoeff(true);
    setCoeffError('');
    setCoeffSaved(false);
    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ points_per_ruble: Number(ppr), points_per_day: Number(ppd) }),
    });
    setSavingCoeff(false);
    if (!res.ok) {
      const json = await res.json();
      setCoeffError(json.error?.message ?? 'Ошибка сохранения');
      return;
    }
    setCoeffSaved(true);
    setTimeout(() => setCoeffSaved(false), 2500);
  }

  // --- Титулы ---
  const [titles, setTitles] = useState<Title[]>(initialTitles);
  const [titleDialog, setTitleDialog] = useState(false);
  const [editingTitle, setEditingTitle] = useState<Title | null>(null);
  const [titleForm, setTitleForm] = useState({ name: '', min_points: '', description: '', privileges: '', sort_order: '' });
  const [savingTitle, setSavingTitle] = useState(false);
  const [titleError, setTitleError] = useState('');
  const [deleteTitle, setDeleteTitle] = useState<Title | null>(null);
  const [deleteTitleError, setDeleteTitleError] = useState('');
  const [deletingTitle, setDeletingTitle] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function openCreateTitle() {
    setEditingTitle(null);
    setTitleForm({ name: '', min_points: '', description: '', privileges: '', sort_order: String(titles.length) });
    setTitleError('');
    setTitleDialog(true);
  }

  function openEditTitle(t: Title) {
    setEditingTitle(t);
    setTitleForm({
      name: t.name,
      min_points: String(t.min_points),
      description: t.description ?? '',
      privileges: t.privileges ?? '',
      sort_order: String(t.sort_order),
    });
    setTitleError('');
    setTitleDialog(true);
  }

  async function saveTitleForm() {
    setSavingTitle(true);
    setTitleError('');
    const payload = {
      name: titleForm.name,
      min_points: parseInt(titleForm.min_points, 10) || 0,
      description: titleForm.description || undefined,
      privileges: titleForm.privileges || undefined,
      sort_order: parseInt(titleForm.sort_order, 10) || 0,
    };
    const url = editingTitle ? `/api/admin/titles/${editingTitle.id}` : '/api/admin/titles';
    const method = editingTitle ? 'PATCH' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setSavingTitle(false);
    if (!res.ok) { setTitleError(json.error?.message ?? 'Ошибка'); return; }
    // Reload titles
    const titlesRes = await fetch('/api/admin/titles');
    const titlesJson = await titlesRes.json();
    setTitles(titlesJson.data ?? []);
    setTitleDialog(false);
  }

  async function confirmDeleteTitle() {
    if (!deleteTitle) return;
    setDeletingTitle(true);
    setDeleteTitleError('');
    const res = await fetch(`/api/admin/titles/${deleteTitle.id}`, { method: 'DELETE' });
    const json = await res.json();
    setDeletingTitle(false);
    if (!res.ok) {
      setDeleteTitleError(json.error?.message ?? 'Ошибка');
      return;
    }
    setTitles((prev) => prev.filter((t) => t.id !== deleteTitle.id));
    setDeleteTitle(null);
    setDeleteTitleError('');
  }

  async function handleTitleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = titles.findIndex((t) => t.id === active.id);
    const newIndex = titles.findIndex((t) => t.id === over.id);
    const reordered = arrayMove(titles, oldIndex, newIndex).map((t, i) => ({ ...t, sort_order: i }));
    setTitles(reordered);
    // Persist new sort_order для изменённых
    await Promise.all(
      reordered
        .filter((t, i) => t.sort_order !== titles[i]?.sort_order)
        .map((t) =>
          fetch(`/api/admin/titles/${t.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sort_order: t.sort_order }),
          }),
        ),
    );
  }

  // --- Навыки ---
  const [skills, setSkills] = useState<Skill[]>(initialSkills);
  const [skillName, setSkillName] = useState('');
  const [skillCategory, setSkillCategory] = useState('general');
  const [addingSkill, setAddingSkill] = useState(false);
  const [skillError, setSkillError] = useState('');
  const [deleteSkill, setDeleteSkill] = useState<Skill | null>(null);
  const [deleteSkillError, setDeleteSkillError] = useState('');
  const [deletingSkill, setDeletingSkill] = useState(false);

  async function handleAddSkill() {
    if (!skillName.trim()) { setSkillError('Введите название навыка'); return; }
    setAddingSkill(true);
    setSkillError('');
    const res = await fetch('/api/admin/skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: skillName.trim(), category: skillCategory, sort_order: skills.length }),
    });
    const json = await res.json();
    setAddingSkill(false);
    if (!res.ok) { setSkillError(json.error?.message ?? 'Ошибка'); return; }
    const skillsRes = await fetch('/api/admin/skills');
    const skillsJson = await skillsRes.json();
    setSkills(skillsJson.data ?? []);
    setSkillName('');
    setSkillCategory('general');
  }

  async function confirmDeleteSkill() {
    if (!deleteSkill) return;
    setDeletingSkill(true);
    setDeleteSkillError('');
    const res = await fetch(`/api/admin/skills/${deleteSkill.id}`, { method: 'DELETE' });
    const json = await res.json();
    setDeletingSkill(false);
    if (!res.ok) {
      setDeleteSkillError(json.error?.message ?? 'Ошибка');
      return;
    }
    setSkills((prev) => prev.filter((s) => s.id !== deleteSkill.id));
    setDeleteSkill(null);
    setDeleteSkillError('');
  }

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-semibold text-slate-800 mb-6">Настройки</h1>

      <Tabs defaultValue="coefficients">
        <TabsList className="mb-6">
          <TabsTrigger value="coefficients">Коэффициенты</TabsTrigger>
          <TabsTrigger value="social">Соцсети</TabsTrigger>
          <TabsTrigger value="titles">Титулы</TabsTrigger>
          <TabsTrigger value="skills">Навыки</TabsTrigger>
          <TabsTrigger value="materials">Материалы</TabsTrigger>
          <TabsTrigger value="pages">Страницы</TabsTrigger>
        </TabsList>

        {/* === КОЭФФИЦИЕНТЫ === */}
        <TabsContent value="coefficients">
          <div className="space-y-4 max-w-sm">
            <div>
              <Label htmlFor="ppr" className="text-sm">Баллов за 1 ₽ пожертвования</Label>
              <Input
                id="ppr"
                type="number"
                min="0"
                value={ppr}
                onChange={(e) => setPpr(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="ppd" className="text-sm">Баллов за 1 день волонтёрства</Label>
              <Input
                id="ppd"
                type="number"
                min="0"
                value={ppd}
                onChange={(e) => setPpd(e.target.value)}
                className="mt-1"
              />
            </div>
            {coeffError && (
              <Alert variant="destructive">
                <AlertDescription>{coeffError}</AlertDescription>
              </Alert>
            )}
            <div className="flex items-center gap-3">
              <Button disabled={savingCoeff} onClick={saveCoefficients}>
                {savingCoeff ? 'Сохраняем…' : 'Сохранить'}
              </Button>
              {coeffSaved && (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle2 size={14} /> Сохранено
                </span>
              )}
            </div>
          </div>
        </TabsContent>

        {/* === СОЦСЕТИ === */}
        <TabsContent value="social">
          <div className="space-y-6 max-w-lg">
            <p className="text-sm text-muted-foreground">Ссылки и иконки отображаются в футере сайта. Иконка загружается отдельно — сохраняется сразу при загрузке.</p>

            {iconError && (
              <Alert variant="destructive">
                <AlertDescription>{iconError}</AlertDescription>
              </Alert>
            )}

            {(['vk', 'telegram', 'youtube'] as const).map((network) => {
              const labelMap = { vk: 'ВКонтакте', telegram: 'Телеграм', youtube: 'YouTube' };
              const placeholderMap = { vk: 'https://vk.com/...', telegram: 'https://t.me/...', youtube: 'https://youtube.com/...' };
              const urlValue = network === 'vk' ? vk : network === 'telegram' ? telegram : youtube;
              const setUrl = network === 'vk' ? setVk : network === 'telegram' ? setTelegram : setYoutube;
              const iconUrl = network === 'vk' ? vkIcon : network === 'telegram' ? telegramIcon : youtubeIcon;
              const fileRef = network === 'vk' ? vkIconRef : network === 'telegram' ? telegramIconRef : youtubeIconRef;

              return (
                <div key={network} className="rounded-md border p-4 space-y-3">
                  <p className="text-sm font-medium">{labelMap[network]}</p>
                  <div>
                    <Label className="text-xs text-muted-foreground">Ссылка</Label>
                    <Input
                      type="url"
                      placeholder={placeholderMap[network]}
                      value={urlValue}
                      onChange={(e) => setUrl(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">Иконка (PNG / SVG / WebP, до 2 МБ)</Label>
                    <div className="flex items-center gap-3">
                      {iconUrl ? (
                        <div className="relative flex-none">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={iconUrl} alt="" className="w-10 h-10 rounded object-contain border border-border bg-muted/20" />
                          <button
                            type="button"
                            onClick={() => clearSocialIcon(network)}
                            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive text-white flex items-center justify-center"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded border border-dashed border-border bg-muted/20 flex items-center justify-center text-muted-foreground text-xs">
                          —
                        </div>
                      )}
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/png,image/svg+xml,image/webp,image/jpeg"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) { uploadSocialIcon(network, f); e.target.value = ''; }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploadingIcon === network}
                        onClick={() => fileRef.current?.click()}
                      >
                        <Upload size={13} className="mr-1.5" />
                        {uploadingIcon === network ? 'Загружается…' : 'Загрузить'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}

            {socialError && (
              <Alert variant="destructive">
                <AlertDescription>{socialError}</AlertDescription>
              </Alert>
            )}
            <div className="flex items-center gap-3">
              <Button disabled={savingSocial} onClick={saveSocial}>
                {savingSocial ? 'Сохраняем…' : 'Сохранить ссылки'}
              </Button>
              {socialSaved && (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle2 size={14} /> Сохранено
                </span>
              )}
            </div>
          </div>
        </TabsContent>

        {/* === ТИТУЛЫ === */}
        <TabsContent value="titles">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">
              Перетащите строки, чтобы изменить порядок. При изменении порога баллов —<br />
              пересчёт титулов всех участников запускается автоматически.
            </p>
            <Button size="sm" onClick={openCreateTitle}>
              <Plus size={14} className="mr-1" /> Добавить
            </Button>
          </div>

          {titles.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Нет титулов</p>
          ) : (
            <div className="rounded-md border">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleTitleDragEnd}
              >
                <SortableContext
                  items={titles.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {titles.map((title) => (
                    <SortableTitleRow
                      key={title.id}
                      title={title}
                      onEdit={openEditTitle}
                      onDelete={(t) => { setDeleteTitle(t); setDeleteTitleError(''); }}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          )}
        </TabsContent>

        {/* === НАВЫКИ === */}
        <TabsContent value="skills">
          <div className="space-y-4">
            {/* Форма добавления */}
            <div className="flex flex-wrap gap-2 items-end p-3 rounded-md border bg-muted/20">
              <div className="flex-1 min-w-40">
                <Label className="text-sm">Название</Label>
                <Input
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  placeholder="Название навыка"
                  className="mt-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                />
              </div>
              <div>
                <Label className="text-sm">Категория</Label>
                <Select value={skillCategory} onValueChange={setSkillCategory}>
                  <SelectTrigger className="mt-1 w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button disabled={addingSkill} onClick={handleAddSkill} className="self-end">
                <Plus size={14} className="mr-1" />
                {addingSkill ? 'Добавляем…' : 'Добавить'}
              </Button>
            </div>
            {skillError && (
              <Alert variant="destructive">
                <AlertDescription>{skillError}</AlertDescription>
              </Alert>
            )}

            {/* Список навыков */}
            {skills.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Нет навыков</p>
            ) : (
              <div className="rounded-md border divide-y">
                {skills.map((skill) => (
                  <div key={skill.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/20">
                    <div className="flex-1">
                      <span className="text-sm font-medium">{skill.name}</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {CATEGORY_LABELS[skill.category] ?? skill.category}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => { setDeleteSkill(skill); setDeleteSkillError(''); }}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* === МАТЕРИАЛЫ === */}
        <TabsContent value="materials">
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-medium mb-1">Справочник материалов</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Список нужных материалов, отображаемых на публичной странице /materials.
              </p>
            </div>
            <MaterialsManager />
          </div>
        </TabsContent>

        {/* === СТРАНИЦЫ === */}
        <TabsContent value="pages">
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-medium mb-1">Статичные страницы сайта</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Редактируйте содержимое публичных страниц. Изменения публикуются немедленно.
              </p>
            </div>
            <StaticPagesEditor />
          </div>
        </TabsContent>

      </Tabs>

      {/* Dialog создания/редактирования титула */}
      <Dialog open={titleDialog} onOpenChange={(o) => !o && setTitleDialog(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTitle ? 'Редактировать титул' : 'Новый титул'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-sm">Название</Label>
              <Input
                value={titleForm.name}
                onChange={(e) => setTitleForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Порог баллов</Label>
                <Input
                  type="number"
                  min="0"
                  value={titleForm.min_points}
                  onChange={(e) => setTitleForm((f) => ({ ...f, min_points: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm">Порядок</Label>
                <Input
                  type="number"
                  min="0"
                  value={titleForm.sort_order}
                  onChange={(e) => setTitleForm((f) => ({ ...f, sort_order: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm">Привилегии</Label>
              <Input
                value={titleForm.privileges}
                onChange={(e) => setTitleForm((f) => ({ ...f, privileges: e.target.value }))}
                className="mt-1"
                placeholder="Бесплатный вход раз в год…"
              />
            </div>
            <div>
              <Label className="text-sm">Описание</Label>
              <Textarea
                value={titleForm.description}
                onChange={(e) => setTitleForm((f) => ({ ...f, description: e.target.value }))}
                className="mt-1 resize-none"
                rows={2}
              />
            </div>
            {titleError && (
              <Alert variant="destructive">
                <AlertDescription>{titleError}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTitleDialog(false)}>Отмена</Button>
            <Button disabled={savingTitle} onClick={saveTitleForm}>
              {savingTitle ? 'Сохраняем…' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog удаления титула */}
      <AlertDialog open={!!deleteTitle} onOpenChange={(o) => !o && setDeleteTitle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить титул «{deleteTitle?.name}»?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить.
              {deleteTitleError && (
                <span className="block mt-2 text-destructive">{deleteTitleError}</span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              disabled={deletingTitle}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDeleteTitle}
            >
              {deletingTitle ? 'Удаляем…' : 'Удалить'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog удаления навыка */}
      <AlertDialog open={!!deleteSkill} onOpenChange={(o) => !o && setDeleteSkill(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить навык «{deleteSkill?.name}»?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить.
              {deleteSkillError && (
                <span className="block mt-2 text-destructive">{deleteSkillError}</span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              disabled={deletingSkill}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDeleteSkill}
            >
              {deletingSkill ? 'Удаляем…' : 'Удалить'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
