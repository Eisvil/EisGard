import { CalendarDays, Hammer, HeartHandshake } from "lucide-react";
import { getBuildings } from "@/lib/data";
import { VolunteerApplicationForm } from "@/components/VolunteerApplicationForm";

export const metadata = {
  title: "Волонтерам | Живое Городище",
  description: "Заявка на участие в строительстве исторического поселения."
};

export default async function VolunteersPage() {
  const buildings = await getBuildings();

  return (
    <main className="shell simple-page">
      <section className="volunteer-layout">
        <article className="parchment info-panel">
          <p className="eyebrow">Волонтерам</p>
          <h1>Приезжайте строить городище руками</h1>
          <p>
            Укажите контакты, навыки и удобные даты. После подтверждения организатором часы будут зачтены в личную историю участника и
            появятся в летописи проекта.
          </p>
          <div className="feature-list">
            <span>
              <Hammer size={19} />
              Плотницкие, кузнечные и хозяйственные задачи
            </span>
            <span>
              <CalendarDays size={19} />
              Заезды по согласованным датам
            </span>
            <span>
              <HeartHandshake size={19} />
              Баллы и публичная благодарность
            </span>
          </div>
        </article>

        <VolunteerApplicationForm buildings={buildings} />
      </section>
    </main>
  );
}
