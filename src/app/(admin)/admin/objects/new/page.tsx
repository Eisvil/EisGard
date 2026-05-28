import { ObjectForm } from '@/components/features/admin/ObjectForm';

export default function NewObjectPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Создать объект</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Новый объект будет сохранён как черновик.</p>
      </div>
      <ObjectForm mode="create" />
    </div>
  );
}
