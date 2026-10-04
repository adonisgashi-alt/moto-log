import { useState } from "react";
import { MileageForm } from "../components/MileageForm";
import { CompleteServiceForm, DueText, StateBadge } from "../components/ServiceBits";
import { Empty, Modal, PageHeader } from "../components/ui";
import {
  currentOdometer,
  formatDate,
  formatMonth,
  formatNumber,
  monthlyDistance,
  statusesForBike,
  today,
} from "../lib/logic";
import { useStore } from "../lib/store";
import type { ServiceItem } from "../lib/types";

type Go = (r: "services" | "mileage" | "trips" | "garage") => void;

export function Dashboard({ bikeId, go }: { bikeId: string; go: Go }) {
  const { data } = useStore();
  const [completing, setCompleting] = useState<ServiceItem | null>(null);
  const bike = data.bikes.find((b) => b.id === bikeId)!;
  const unit = data.settings.unit;
  const odo = currentOdometer(data, bikeId);
  const statuses = statusesForBike(data, bikeId);
  const overdue = statuses.filter((s) => s.state === "overdue").length;
  const dueSoon = statuses.filter((s) => s.state === "due-soon").length;
  const attention = statuses.filter((s) => s.state !== "ok").slice(0, 6);
  const nextUp = attention.length ? attention : statuses.slice(0, 3);
  const months = monthlyDistance(data, bikeId, 6);
  const thisMonth = months[months.length - 1].distance;
  const maxMonth = Math.max(...months.map((m) => m.distance), 1);
  const upcomingTrips = data.trips
    .filter((t) => t.bikeId === bikeId && t.status === "planned" && t.startDate >= today())
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, 3);

  return (
    <>
      <PageHeader title={bike.name} subtitle={[bike.year, bike.make, bike.model].filter(Boolean).join(" ") || undefined} />

      <section className="stats">
        <Stat label="Odometer" value={`${formatNumber(odo)} ${unit}`} />
        <Stat label="This month" value={`${formatNumber(thisMonth)} ${unit}`} />
        <Stat label="Overdue" value={String(overdue)} tone={overdue ? "overdue" : undefined} />
        <Stat label="Due soon" value={String(dueSoon)} tone={dueSoon ? "due-soon" : undefined} />
      </section>

      <div className="grid-2">
        <section className="card">
          <div className="card-head">
            <h2>{attention.length ? "Needs attention" : "Next up"}</h2>
            <button className="link" onClick={() => go("services")}>
              All services →
            </button>
          </div>
          {nextUp.length === 0 ? (
            <Empty title="No services yet">Add your maintenance schedule on the Services page.</Empty>
          ) : (
            <ul className="list">
              {nextUp.map((s) => (
                <li key={s.service.id} className="list-row">
                  <div>
                    <div className="row-title">
                      {s.service.name} <StateBadge state={s.state} />
                    </div>
                    <div className="muted small">
                      <DueText status={s} unit={unit} />
                    </div>
                  </div>
                  <button className="btn small" onClick={() => setCompleting(s.service)}>
                    Done
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <div className="card-head">
            <h2>Log mileage</h2>
            <button className="link" onClick={() => go("mileage")}>
              History →
            </button>
          </div>
          <MileageForm bikeId={bikeId} compact />
          <h3 className="sub">Last 6 months</h3>
          <div className="bars" role="img" aria-label="Distance ridden per month">
            {months.map((m) => (
              <div key={m.month} className="bar-col" title={`${formatNumber(m.distance)} ${unit}`}>
                <span className="bar-value">{m.distance ? formatNumber(m.distance) : ""}</span>
                <div className="bar" style={{ height: `${(m.distance / maxMonth) * 100}%` }} />
                <span className="bar-label">{formatMonth(m.month, "short")}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="card">
        <div className="card-head">
          <h2>Upcoming trips</h2>
          <button className="link" onClick={() => go("trips")}>
            All trips →
          </button>
        </div>
        {upcomingTrips.length === 0 ? (
          <Empty title="No trips planned" action={<button className="btn" onClick={() => go("trips")}>Plan a trip</button>} />
        ) : (
          <ul className="list">
            {upcomingTrips.map((t) => (
              <li key={t.id} className="list-row">
                <div>
                  <div className="row-title">{t.title}</div>
                  <div className="muted small">
                    {t.from} → {t.to} · {formatDate(t.startDate)}
                    {t.plannedDistance ? ` · ~${formatNumber(t.plannedDistance)} ${unit}` : ""}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Modal title="Log completed service" open={!!completing} onClose={() => setCompleting(null)}>
        {completing && <CompleteServiceForm service={completing} onDone={() => setCompleting(null)} />}
      </Modal>
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className={`stat ${tone ?? ""}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}
