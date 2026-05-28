'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2 } from 'lucide-react';

type ObjectOption = { id: string; name: string };
type SlotOption = { id: string; name: string; unit: string };

const SOURCE_LABELS: Record<string, string> = {
  tbank: 'Т-Банк',
  sber: 'Сбербанк',
  manual: 'Наличные',
};

export default function ManualDonationDialog({
  open,
  onOpenChange,
  objects,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  objects: ObjectOption[];
  onCreated: () => void;
}) {
  const [source, setSource] = useState<'tbank' | 'sber' | 'manual'>('tbank');
  const [amountRub, setAmountRub] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [objectId, setObjectId] = useState('');
  const [slotId, setSlotId] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ pointsAwarded: number; userFound: boolean } | null>(null);

  // Загружаем слоты при выборе объекта
  useEffect(() => {
    if (!objectId) {
      setSlots([]);
      setSlotId('');
      return;
    }
    setSlotId('');
    fetch(`/api/admin/objects/${objectId}/slots`)
      .then((r) => r.json())
      .then((j) => {
        const data = (j?.data ?? []) as SlotOption[];
        setSlots(data.filter((s) => s.unit === 'RUB'));
      })
      .catch(() => setSlots([]));
  }, [objectId]);

  function reset() {
    setSource('tbank');
    setAmountRub('');
    setDisplayName('');
    setDonorEmail('');
    setObjectId('');
    setSlotId('');
    setIsAnonymous(false);
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setSlots([]);
    setError('');
    setSuccess(null);
  }

  async function handleSubmit() {
    const amount = parseFloat(amountRub) * 100;
    if (!amountRub || isNaN(amount) || amount < 10000) {
      setError('Минимальная сумма — 100 ₽');
      return;
    }
    if (!displayName.trim() || displayName.trim().length < 2) {
      setError('Укажите имя дарителя (минимум 2 символа)');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/donations/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source,
          amount_kopecks: Math.round(amount),
          display_name: displayName.trim(),
          donor_email: donorEmail.trim() || null,
          object_id: objectId || null,
          slot_id: slotId || null,
          is_anonymous: isAnonymous,
          payment_date: paymentDate,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setError(j?.error?.message ?? 'Ошибка сохранения');
        return;
      }
      setSuccess({ pointsAwarded: j.data.points_awarded, userFound: j.data.user_found });
      onCreated();
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Добавить ручной донат</DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="py-6 text-center space-y-3">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
            <p className="font-medium">Пожертвование зарегистрировано</p>
            {success.userFound ? (
              <p className="text-sm text-muted-foreground">
                Профиль найден — начислено {success.pointsAwarded} баллов
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Профиль не найден — баллы не начислены
              </p>
            )}
            <Button onClick={handleClose} className="mt-2">Закрыть</Button>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-2">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Источник *</Label>
                  <Select value={source} onValueChange={(v) => setSource(v as typeof source)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SOURCE_LABELS).map(([val, label]) => (
                        <SelectItem key={val} value={val}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="md-amount">Сумма (₽) *</Label>
                  <Input
                    id="md-amount"
                    type="number"
                    min={100}
                    step={100}
                    value={amountRub}
                    onChange={(e) => setAmountRub(e.target.value)}
                    placeholder="1000"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="md-date">Дата платежа</Label>
                <Input
                  id="md-date"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="md-name">Имя в летописи *</Label>
                <Input
                  id="md-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Иван Петров"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="md-email">Email (для начисления баллов)</Label>
                <Input
                  id="md-email"
                  type="email"
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                  placeholder="ivan@example.com"
                />
              </div>

              <div className="space-y-1">
                <Label>Объект</Label>
                <Select value={objectId} onValueChange={setObjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Не выбран" />
                  </SelectTrigger>
                  <SelectContent>
                    {objects.map((o) => (
                      <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {slots.length > 0 && (
                <div className="space-y-1">
                  <Label>Слот (денежный)</Label>
                  <Select value={slotId} onValueChange={setSlotId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Не выбран" />
                    </SelectTrigger>
                    <SelectContent>
                      {slots.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="h-4 w-4"
                />
                Анонимно (не показывать имя в летописи)
              </label>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Отмена</Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? 'Сохранение...' : 'Подтвердить'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
