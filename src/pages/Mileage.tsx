import { MileageForm } from "../components/MileageForm";
import { Empty, PageHeader } from "../components/ui";
import { currentOdometer, formatDate, formatMonth, formatNumber, monthlyDistance } from "../lib/logic";
import { useStore } from "../lib/store";

export function Mileage({ bikeId }: { bikeId: string }) {
  const { data, actions } = useStore();
  const unit = data.settings.unit;
  const bike = data.bikes.find((b) => b.id === bikeId)!;
  const odo = currentOdometer(data, bikeId);
  const entries = data.mileage
    .filter((m) => m.bikeId === bikeId)
    .sort((a, b) => b.date.localeCompare(a.date) || b.odometer - a.odometer);
  // Distance since the previous (older) reading, for each row.
  const ascending = [...entries].reverse();
  const deltas = new Map<string, number>();
  let prev = bike.startOdometer;
  for (const e of ascending) {
    deltas.set(e.id, e.odometer - prev);
    prev = Math.max(prev, e.odometer);
  }
  const year = monthlyDistance(data, bikeId, 12);
  const yearTotal = year.reduce((s, m) => s + m.distance, 0);

  return (
    <>
      <PageHeader
        title="Mileage"
        subtitle={`Odometer ${formatNumber(odo)} ${unit} · ${formatNumber(odo - bike.startOdometer)} ${unit} logged since you added this bike`}
      />
      <div className="grid-2">
        <section className="card">
          <h2>New reading</h2>
          <MileageForm bikeId={bikeId} />
        </section>
        <section className="card">
          <div className="card-head">
            <h2>Last 12 months</h2>
            <span className="muted small">
              {formatNumber(yearTotal)} {unit}
            </span>
          </div>
          <ul className="month-list">
            {year
              .slice()
              .reverse()
              .map((m) => (
                <li key={m.month}>
                  <span>{formatMonth(m.month, "long")}</span>
                  <span className="meter">
                    <span style={{ width: `${(m.distance / Math.max(...year.map((y) => y.distance), 1)) * 100}%` }} />
                  </span>
                  <span className="num">
                    {formatNumber(m.distance)} {unit}
                  </span>
                </li>
              ))}
          </ul>
        </section>
      </div>
      <section className="card">
        <h2>Readings</h2>
        {entries.length === 0 ? (
          <Empty title="No readings yet">Log your odometer after rides to keep service reminders accurate.</Empty>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th className="num">Odometer</th>
                <th className="num">+ Distance</th>
                <th>Note</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td>{formatDate(e.date)}</td>
                  <td className="num">{formatNumber(e.odometer)}</td>
                  <td className="num">{(deltas.get(e.id) ?? 0) > 0 ? `+${formatNumber(deltas.get(e.id)!)}` : "—"}</td>
                  <td className="muted">{e.note}</td>
                  <td className="num">
                    {!e.tripId && (
                      <button
                        className="icon-btn"
                        aria-label="Delete reading"
                        onClick={() => confirm("Delete this reading?") && actions.deleteMileage(e.id)}
                      >
                        ×
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
