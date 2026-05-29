'use client';

import { useEffect, useRef, useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';
import { Button } from '@/components/ui/button';
import { ObjectIcon } from '@/lib/constants/objectIcons';
import { Upload, MapPin } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

type ObjRow = {
  id: string;
  name: string;
  icon_key: string | null;
  status: string;
  map_position_x: number | null;
  map_position_y: number | null;
};

type Position = { x: number; y: number };

export function MapConstructor() {
  const [objects, setObjects] = useState<ObjRow[]>([]);
  const [mapUrl, setMapUrl] = useState('/map/settlement.png');
  const [positions, setPositions] = useState<Record<string, Position>>({});
  const [dragging, setDragging] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient() as AnyClient;

    async function load() {
      const [objRes, settingsRes] = await Promise.all([
        supabase
          .from('objects')
          .select('id, name, icon_key, status, map_position_x, map_position_y')
          .neq('status', 'draft')
          .order('sort_order'),
        supabase
          .from('settings')
          .select('value')
          .eq('key', 'map_image_url')
          .maybeSingle(),
      ]);

      if (objRes.data) {
        setObjects(objRes.data as ObjRow[]);
        const pos: Record<string, Position> = {};
        (objRes.data as ObjRow[]).forEach((o) => {
          if (o.map_position_x != null && o.map_position_y != null) {
            pos[o.id] = { x: o.map_position_x, y: o.map_position_y };
          }
        });
        setPositions(pos);
      }

      if (settingsRes.data?.value) {
        try { setMapUrl(JSON.parse(settingsRes.data.value as string) as string); } catch { /* ignore */ }
      }
    }

    void load();
  }, []);

  async function savePosition(id: string, pos: Position) {
    await fetch(`/api/admin/objects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        map_position_x: Math.round(pos.x * 100) / 100,
        map_position_y: Math.round(pos.y * 100) / 100,
      }),
    });
  }

  function handleMouseDown(e: React.MouseEvent, id: string) {
    e.preventDefault();
    const map = mapRef.current;
    if (!map) return;
    const rect = map.getBoundingClientRect();
    const curX = ((e.clientX - rect.left) / rect.width) * 100;
    const curY = ((e.clientY - rect.top) / rect.height) * 100;
    const pos = positions[id] ?? { x: 50, y: 50 };
    dragOffset.current = { x: curX - pos.x, y: curY - pos.y };
    setDragging(id);
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!dragging) return;
    const map = mapRef.current;
    if (!map) return;
    const rect = map.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100 - dragOffset.current.x));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100 - dragOffset.current.y));
    setPositions((prev) => ({ ...prev, [dragging]: { x, y } }));
  }

  function handleMouseUp() {
    if (!dragging) return;
    const pos = positions[dragging];
    if (pos) void savePosition(dragging, pos);
    setDragging(null);
  }

  async function handleAddToMap(id: string) {
    const pos = { x: 50, y: 50 };
    setPositions((prev) => ({ ...prev, [id]: pos }));
    await savePosition(id, pos);
  }

  async function handleMapImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/admin/map/image', { method: 'POST', body: formData });
    if (res.ok) {
      const json = await res.json() as { data: { url: string } };
      setMapUrl(json.data.url);
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const onMap = objects.filter((o) => positions[o.id] != null);
  const offMap = objects.filter((o) => positions[o.id] == null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Конструктор карты</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Перетащите иконки объектов на карту.</p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload size={14} className="mr-1.5" />
            {uploading ? 'Загрузка…' : 'Сменить фон'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void handleMapImageUpload(e)}
          />
        </div>
      </div>

      {/* Map — full width */}
      <div
        ref={mapRef}
        className="relative w-full rounded-md border overflow-hidden bg-muted select-none"
        style={{ aspectRatio: '16/9', cursor: dragging ? 'grabbing' : 'default' }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mapUrl}
          alt="Карта поселения"
          className="w-full h-full object-cover pointer-events-none"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        {onMap.map((obj) => {
          const pos = positions[obj.id]!;
          return (
            <div
              key={obj.id}
              style={{
                position: 'absolute',
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: 'translate(-50%, -50%)',
                cursor: dragging === obj.id ? 'grabbing' : 'grab',
                pointerEvents: dragging && dragging !== obj.id ? 'none' : 'auto',
                zIndex: dragging === obj.id ? 10 : 1,
              }}
              onMouseDown={(e) => handleMouseDown(e, obj.id)}
            >
              <div className="flex flex-col items-center gap-0.5">
                <ObjectIcon slug={obj.icon_key ?? 'huts'} size={40} className="rounded-full shadow" />
                <span className="text-xs font-medium text-white bg-black/50 rounded px-1 whitespace-nowrap max-w-24 truncate">
                  {obj.name}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Off-map objects — strip below the map */}
      {offMap.length > 0 && (
        <div className="rounded-md border bg-background p-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Не на карте</p>
          <div className="flex flex-wrap gap-2">
            {offMap.map((obj) => (
              <button
                key={obj.id}
                onClick={() => void handleAddToMap(obj.id)}
                title="Добавить на карту"
                className="flex items-center gap-1.5 rounded-full border bg-muted/50 hover:bg-muted px-3 py-1 text-sm transition-colors"
              >
                <ObjectIcon slug={obj.icon_key ?? 'huts'} size={20} className="rounded-full" />
                {obj.name}
                <MapPin size={12} className="text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      )}

      {objects.length === 0 && (
        <p className="text-sm text-muted-foreground italic">
          Нет опубликованных объектов. Создайте объект и смените статус с «Черновик».
        </p>
      )}
    </div>
  );
}
