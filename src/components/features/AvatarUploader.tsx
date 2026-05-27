'use client';

import { useState, useRef, useCallback } from 'react';
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';

interface Props {
  avatarUrl: string | null;
  userId: string;
  fullName: string;
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

export function AvatarUploader({ avatarUrl, userId, fullName }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initial = fullName.charAt(0).toUpperCase();

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
    // Reset input so the same file can be re-selected
    e.target.value = '';
  }

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerSquareCrop(width, height));
  }, []);

  async function handleConfirm() {
    if (!imgRef.current || !completedCrop) return;
    setUploading(true);
    setError(null);

    try {
      const blob = await getCroppedBlob(imgRef.current, completedCrop);
      const supabase = createBrowserSupabaseClient();

      const path = `${userId}/avatar.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, blob, { upsert: true, contentType: 'image/jpeg' });

      if (uploadError) {
        setError('Ошибка загрузки: ' + uploadError.message);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);

      // Cache-bust so the browser reloads the new avatar
      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: urlWithCacheBust }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error?.message ?? 'Ошибка сохранения');
        return;
      }

      setImgSrc(null);
      router.refresh();
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
      {/* Avatar display with edit overlay */}
      <button
        type="button"
        className="avatar-uploader-trigger"
        onClick={openFilePicker}
        title="Изменить фото"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={fullName} className="profile-avatar" />
        ) : (
          <div className="profile-avatar-placeholder">{initial}</div>
        )}
        <span className="avatar-edit-overlay">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </span>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={onFileChange}
      />

      {/* Crop modal */}
      {imgSrc && (
        <div className="crop-modal-overlay" onClick={handleCancel}>
          <div
            className="crop-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="crop-modal-title">Выбрать область аватарки</h3>
            <p className="crop-modal-hint">Перетащите и измените размер квадрата</p>

            <div className="crop-modal-canvas">
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
                  src={imgSrc}
                  alt="Кроп"
                  onLoad={onImageLoad}
                  style={{ maxHeight: '60vh', maxWidth: '100%' }}
                />
              </ReactCrop>
            </div>

            {error && <p className="cert-error">{error}</p>}

            <div className="crop-modal-actions">
              <button
                className="primary-button"
                onClick={handleConfirm}
                disabled={uploading || !completedCrop}
              >
                {uploading ? 'Загружается...' : 'Сохранить'}
              </button>
              <button
                className="text-link"
                onClick={handleCancel}
                disabled={uploading}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
