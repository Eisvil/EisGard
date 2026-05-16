import { ChronicleList } from "@/components/ChronicleList";

export const metadata = {
  title: "Летопись | Живое Городище",
  description: "Хроника вкладов, волонтерских часов и событий строительства."
};

export default function ChroniclePage() {
  return (
    <main className="shell simple-page">
      <section className="parchment info-panel">
        <p className="eyebrow">Цифровая летопись</p>
        <h1>Все, кто помогает городищу расти</h1>
        <p>
          Здесь появляются подтвержденные вклады, волонтерские часы и важные события строительства. В следующем этапе записи будут
          загружаться из Supabase и модерироваться в админке.
        </p>
        <ChronicleList />
      </section>
    </main>
  );
}

