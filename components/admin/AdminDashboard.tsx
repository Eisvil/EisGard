import { Clock, HeartHandshake, Landmark, MapPinned, UsersRound } from "lucide-react";
import { getSettlementStats, getBuildings, getChronicleEntries } from "@/lib/data";
import { formatCurrency, formatPercent, getProgress } from "@/lib/format";
import { statusLabels } from "@/lib/seed";

export async function AdminDashboard() {
  const [stats, buildings, chronicle] = await Promise.all([
    getSettlementStats(),
    getBuildings(),
    getChronicleEntries({ limit: 5 })
  ]);

  return (
    <div className="admin-grid">
      <section className="admin-kpis">
        <article>
          <HeartHandshake size={22} />
          <span>Собрано</span>
          <strong>{formatCurrency(stats.totalCollected)}</strong>
        </article>
        <article>
          <UsersRound size={22} />
          <span>Участников</span>
          <strong>{stats.participants.toLocaleString("ru-RU")}</strong>
        </article>
        <article>
          <Clock size={22} />
          <span>Волонтерских часов</span>
          <strong>{stats.volunteerHours.toLocaleString("ru-RU")}</strong>
        </article>
        <article>
          <MapPinned size={22} />
          <span>Объектов в MVP</span>
          <strong>{stats.activeObjects}</strong>
        </article>
      </section>

      <section className="admin-panel">
        <div className="admin-panel__head">
          <h3>Сборы по объектам</h3>
          <Landmark size={20} />
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Объект</th>
                <th>Статус</th>
                <th>Прогресс</th>
                <th>Собрано</th>
              </tr>
            </thead>
            <tbody>
              {buildings.map((building) => {
                const progress = getProgress(building.collected, building.budget);

                return (
                  <tr key={building.slug}>
                    <td>{building.title}</td>
                    <td>{statusLabels[building.status]}</td>
                    <td>{formatPercent(progress)}</td>
                    <td>{formatCurrency(building.collected)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel__head">
          <h3>Последние события</h3>
          <Clock size={20} />
        </div>
        <div className="admin-events">
          {chronicle.map((entry) => (
            <article key={entry.id}>
              <strong>{entry.name}</strong>
              <span>{entry.action}</span>
              <small>{entry.time}</small>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

