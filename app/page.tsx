import { BuildingGrid } from "@/components/building/BuildingGrid";
import { ChronicleList } from "@/components/ChronicleList";
import { SettlementMap } from "@/components/map/SettlementMap";
import { formatCurrency } from "@/lib/format";
import { Hammer, HeartHandshake, House, Users } from "lucide-react";
import { getBuildings, getSettlementStats } from "@/lib/data";

export default async function HomePage() {
  const buildings = await getBuildings();
  const stats = await getSettlementStats();

  return (
    <main>
      <SettlementMap buildings={buildings} />

      <section className="shell stats-band" aria-label="Статистика проекта">
        <article>
          <Users size={24} />
          <strong>{stats.participants.toLocaleString("ru-RU")}</strong>
          <span>участников</span>
        </article>
        <article>
          <HeartHandshake size={24} />
          <strong>{formatCurrency(stats.totalCollected)}</strong>
          <span>собрано</span>
        </article>
        <article>
          <Hammer size={24} />
          <strong>{stats.volunteerHours.toLocaleString("ru-RU")} ч</strong>
          <span>волонтерских часов</span>
        </article>
        <article>
          <House size={24} />
          <strong>{stats.activeObjects}</strong>
          <span>объекта в MVP</span>
        </article>
      </section>

      <section className="shell section-block" id="objects">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Объекты поселения</p>
            <h2>Первые постройки городища</h2>
          </div>
          <p>Каждый объект связан с конкретными слотами поддержки, прогрессом и будущей записью в летописи.</p>
        </div>
        <BuildingGrid buildings={buildings} />
      </section>

      <section className="shell section-block two-column" id="about">
        <div className="parchment info-panel">
          <p className="eyebrow">О проекте</p>
          <h2>Платформа для строительства живой истории</h2>
          <p>
            Здесь вклад привязан к конкретному месту на карте: горну кузницы, грядке, кровле или хозяйственной постройке. После
            подтверждения вклада имя участника появляется в цифровой летописи, а прогресс объекта обновляется.
          </p>
        </div>

        <div className="parchment info-panel">
          <p className="eyebrow">Последние вклады</p>
          <h2>Летопись растет</h2>
          <ChronicleList limit={3} />
        </div>
      </section>
    </main>
  );
}
