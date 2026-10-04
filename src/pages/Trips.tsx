import { useState, type FormEvent } from "react";
import { Empty, Field, Modal, PageHeader, num, str } from "../components/ui";
import { currentOdometer, formatDate, formatNumber, today, tripDistance } from "../lib/logic";
import { useStore } from "../lib/store";
import type { Trip } from "../lib/types";

type Dialog = { kind: "new" } | { kind: "edit"; trip: Trip } | { kind: "complete"; trip: Trip };

export function Trips({ bikeId }: { bikeId: string }) {
  const { data, actions } = useStore();
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const unit = data.settings.unit;
  const trips = data.trips.filter((t) => t.bikeId === bikeId);
  const planned = trips.filter((t) => t.status === "planned").sort((a, b) => a.startDate.localeCompare(b.startDate));
  const done = trips.filter((t) => t.status === "completed").sort((a, b) => b.startDate.localeCompare(a.startDate));
  const totalRidden = done.reduce((s, t) => s + (tripDistance(t) ?? 0), 0);
  const close = () => setDialog(null);

  return (
    <>
      <PageHeader
        title="Trips"
        subtitle={
          done.length
            ? `${done.length} trip${done.length === 1 ? "" : "s"} ridden · ${formatNumber(totalRidden)} ${unit}`
            : "Plan rides and record them when you're back."
        }
        action={
          <button className="btn primary" onClick={() => setDialog({ kind: "new" })}>
            + New trip
          </button>
        }
      />

      <section className="card">
        <h2>Planned</h2>
        {planned.length === 0 ? (
          <Empty title="No trips planned">Create a trip with a start, destination and date.</Empty>
        ) : (
          <ul className="trip-grid">
            {planned.map((t) => (
              <li key={t.id} className="trip">
                <div className="trip-route">
                  <span>{t.from}</span>
                  <span className="arrow">→</span>
                  <span>{t.to}</span>
                </div>
                <div className="row-title">{t.title}</div>
                <div className="muted small">
                  {formatDate(t.startDate)}
                  {t.endDate && t.endDate !== t.startDate ? ` – ${formatDate(t.endDate)}` : ""}
                  {t.plannedDistance ? ` · ~${formatNumber(t.plannedDistance)} ${unit}` : ""}
                  {t.startDate < today() && <span className="badge due-soon">Past date</span>}
                </div>
                {t.notes && <p className="small">{t.notes}</p>}
                <div className="row-actions">
                  <button className="btn small primary" onClick={() => setDialog({ kind: "complete", trip: t })}>
                    Mark ridden
                  </button>
                  <button className="btn small ghost" onClick={() => setDialog({ kind: "edit", trip: t })}>
                    Edit
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2>Ridden</h2>
        {done.length === 0 ? (
          <Empty title="No trips ridden yet" />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Trip</th>
                <th className="num">Distance</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {done.map((t) => (
                <tr key={t.id}>
                  <td>{formatDate(t.startDate)}</td>
                  <td>
                    {t.title}
                    <div className="muted small">
                      {t.from} → {t.to}
                    </div>
                  </td>
                  <td className="num">
                    {tripDistance(t) !== undefined ? `${formatNumber(tripDistance(t)!)} ${unit}` : "—"}
                  </td>
                  <td className="num">
                    <button className="btn small ghost" onClick={() => setDialog({ kind: "edit", trip: t })}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <Modal title="New trip" open={dialog?.kind === "new"} onClose={close}>
        <TripForm bikeId={bikeId} onDone={close} />
      </Modal>
      <Modal title="Edit trip" open={dialog?.kind === "edit"} onClose={close}>
        {dialog?.kind === "edit" && (
          <>
            <TripForm bikeId={bikeId} trip={dialog.trip} onDone={close} />
            <button
              className="btn danger ghost full"
              onClick={() => {
                if (confirm(`Delete “${dialog.trip.title}”?`)) {
                  actions.deleteTrip(dialog.trip.id);
                  close();
                }
              }}
            >
              Delete trip
            </button>
          </>
        )}
      </Modal>
      <Modal title="Trip ridden" open={dialog?.kind === "complete"} onClose={close}>
        {dialog?.kind === "complete" && <CompleteTripForm trip={dialog.trip} onDone={close} />}
      </Modal>
    </>
  );
}

function TripForm({ bikeId, trip, onDone }: { bikeId: string; trip?: Trip; onDone: () => void }) {
  const { data, actions } = useStore();
  const unit = data.settings.unit;

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const fields = {
      title: str(f.get("title")) ?? "Ride",
      from: str(f.get("from")) ?? "",
      to: str(f.get("to")) ?? "",
      startDate: str(f.get("startDate")) ?? today(),
      endDate: str(f.get("endDate")),
      plannedDistance: num(f.get("plannedDistance")),
      notes: str(f.get("notes")),
    };
    if (trip) actions.updateTrip(trip.id, fields);
    else actions.addTrip({ ...fields, bikeId, status: "planned" });
    onDone();
  }

  return (
    <form className="form" onSubmit={submit}>
      <Field label="Trip name">
        <input name="title" required defaultValue={trip?.title} placeholder="e.g. Alps loop" />
      </Field>
      <div className="row">
        <Field label="From">
          <input name="from" required defaultValue={trip?.from} />
        </Field>
        <Field label="To">
          <input name="to" required defaultValue={trip?.to} />
        </Field>
      </div>
      <div className="row">
        <Field label="Start date">
          <input name="startDate" type="date" required defaultValue={trip?.startDate ?? today()} />
        </Field>
        <Field label="End date (optional)">
          <input name="endDate" type="date" defaultValue={trip?.endDate} />
        </Field>
      </div>
      <Field label={`Planned distance (${unit}, optional)`}>
        <input name="plannedDistance" type="number" min={0} defaultValue={trip?.plannedDistance} />
      </Field>
      <Field label="Notes">
        <textarea name="notes" rows={3} defaultValue={trip?.notes} placeholder="Stops, fuel, who's coming…" />
      </Field>
      <div className="form-actions">
        <button className="btn primary">{trip ? "Save trip" : "Create trip"}</button>
      </div>
    </form>
  );
}

function CompleteTripForm({ trip, onDone }: { trip: Trip; onDone: () => void }) {
  const { data, actions } = useStore();
  const unit = data.settings.unit;
  const odo = currentOdometer(data, trip.bikeId);
  const [start, setStart] = useState<number | undefined>(trip.startOdometer ?? odo);
  const [end, setEnd] = useState<number | undefined>(
    trip.endOdometer ?? (trip.plannedDistance ? odo + trip.plannedDistance : undefined),
  );

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (start === undefined || end === undefined || end < start) return;
    actions.completeTrip(trip.id, {
      endDate: str(f.get("endDate")) ?? today(),
      startOdometer: start,
      endOdometer: end,
    });
    onDone();
  }

  const invalid = start !== undefined && end !== undefined && end < start;
  return (
    <form className="form" onSubmit={submit}>
      <p className="muted">The end reading is added to your mileage log.</p>
      <div className="row">
        <Field label={`Start odometer (${unit})`}>
          <input type="number" min={0} required value={start ?? ""} onChange={(e) => setStart(num(e.target.value))} />
        </Field>
        <Field label={`End odometer (${unit})`}>
          <input type="number" min={0} required value={end ?? ""} onChange={(e) => setEnd(num(e.target.value))} />
        </Field>
      </div>
      {invalid ? (
        <p className="error">End reading must be at least the start reading.</p>
      ) : (
        start !== undefined &&
        end !== undefined && (
          <p className="muted">
            Distance: {formatNumber(end - start)} {unit}
          </p>
        )
      )}
      <Field label="Finished on">
        <input name="endDate" type="date" required defaultValue={trip.endDate ?? today()} max={today()} />
      </Field>
      <div className="form-actions">
        <button className="btn primary" disabled={invalid}>
          Save ride
        </button>
      </div>
    </form>
  );
}
