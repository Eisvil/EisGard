'use client';

import { useCallback, useRef, useState } from 'react';
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  convertToPixelCrop,
  type Crop,
  type PixelCrop,
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';

interface Props {
  portraitUrl: string | null;
  npcId: string | null;
  onUpload: (url: string) => void;
}

function centerSquareCrop(width: number, height: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 80 }, 1, width, height),
    width,
    height,
  );
}

async function getCroppedBlob(image: HTMLImageElement, crop: PixelCrop): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const size = 256;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  ctx.drawImage(
    image,
    Math.round(crop.x * scaleX),
    Math.round(crop.y * scaleY),
    Math.round(crop.width * scaleX),
    Math.round(crop.height * scaleY),
    0, 0, size, size,
  );
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
      'image/jpeg',
      0.92,
    );
  });
}

export function NpcPortraitUploader({ portraitUrl, npcId, onUpload }: Props) {
  // Файловый инпут — живёт вне любого Dialog чтобы Radix не перехватил open-событие
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Файл слишком большой (максимум 5 МБ)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImgSrc(reader.result as string);
      setCrop(undefined);
      setCompletedCrop(undefined);
      setError(null);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const c = centerSquareCrop(width, height);
    setCrop(c);
    // Выставляем сразу — кнопка активна без необходимости тянуть выделение
    setCompletedCrop(convertToPixelCrop(c, width, height));
  }, []);

  async function handleConfirm() {
    if (!imgRef.current || !completedCrop) return;
    setUploading(true);
    setError(null);
    try {
      const blob = await getCroppedBlob(imgRef.current, completedCrop);
      const supabase = createBrowserSupabaseClient();
      const path = `npcs/${npcId ?? 'new'}_${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('covers')
        .upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
      if (uploadError) { setError('Ошибка загрузки: ' + uploadError.message); return; }
      const { data: { publicUrl } } = supabase.storage.from('covers').getPublicUrl(path);
      onUpload(publicUrl);
      setImgSrc(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setUploading(false);
    }
  }

  function handleCancel() {
    setImgSrc(null);
    setError(null);
  }

  return (
    <>
      {/* Превью + кнопка загрузки */}
      <div className="flex items-center gap-3">
        {portraitUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={portraitUrl}
            alt=""
            className="w-16 h-16 rounded-full object-cover border border-border flex-none"
          />
        ) : (
          <div className="w-16 h-16 rounded-full border-2 border-dashed border-border flex items-center justify-center text-2xl flex-none">
            👤
          </div>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={openFilePicker}
        >
          <Upload size={13} className="mr-1.5" />
          {uploading ? 'Загружается…' : 'Загрузить'}
        </Button>
      </div>

      {/* Файловый инпут вне Dialog — иначе Radix закрывает Dialog при открытии нативного пикера */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={onFileChange}
      />

      {/* Кроп — вложенный shadcn Dialog поверх родительского NPC-Dialog.
          Radix управляет стекингом корректно: drag работает, NPC-Dialog не закрывается. */}
      <Dialog open={!!imgSrc} onOpenChange={(open) => { if (!open) handleCancel(); }}>
        <DialogContent
          className="max-w-140 max-h-[90vh] overflow-auto"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Выбрать область портрета</DialogTitle>
            <DialogDescription>
              Перетащите и измените размер квадрата. Результат: 256×256 px.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-center overflow-auto" style={{ maxHeight: '60vh' }}>
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1}
              circularCrop={false}
              keepSelection
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={imgSrc ?? ''}
                alt="Кроп портрета"
                onLoad={onImageLoad}
                style={{ maxHeight: '60vh', maxWidth: '100%', display: 'block' }}
              />
            </ReactCrop>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel} disabled={uploading}>
              Отмена
            </Button>
            <Button onClick={handleConfirm} disabled={uploading || !completedCrop}>
              {uploading ? 'Загружается…' : 'Сохранить портрет'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
