import type { FormEvent } from "react";
import { currentOdometer, formatDate, formatNumber, today, type DueState, type ServiceStatus } from "../lib/logic";
import { useStore } from "../lib/store";
import type { ServiceItem } from "../lib/types";
import { Field, num, str } from "./ui";

const LABEL: Record<DueState, string> = { overdue: "Overdue", "due-soon": "Due soon", ok: "OK" };

export function StateBadge({ state }: { state: DueState }) {
  return <span className={`badge ${state}`}>{LABEL[state]}</span>;
}

/** "in 420 km · in 12 days" / "300 km over · 5 days over" */
export function DueText({ status, unit }: { status: ServiceStatus; unit: string }) {
  const parts: string[] = [];
  if (status.distanceLeft !== undefined) {
    parts.push(
      status.distanceLeft > 0
        ? `in ${formatNumber(status.distanceLeft)} ${unit}`
        : `${formatNumber(-status.distanceLeft)} ${unit} over`,
    );
  }
  if (status.daysLeft !== undefined && status.dueDate) {
    const d = status.daysLeft;
    parts.push(
      d > 0 ? `${formatDate(status.dueDate)} (${d} day${d === 1 ? "" : "s"})` : `${-d} day${d === -1 ? "" : "s"} over`,
    );
  }
  return <span>{parts.join(" · ") || "No interval set"}</span>;
}

export function CompleteServiceForm({ service, onDone }: { service: ServiceItem; onDone: () => void }) {
  const { data, actions } = useStore();
  const unit = data.settings.unit;
  const odo = currentOdometer(data, service.bikeId);

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    actions.completeService(service.id, {
      date: str(f.get("date")) ?? today(),
      odometer: num(f.get("odometer")) ?? odo,
      cost: num(f.get("cost")),
      notes: str(f.get("notes")),
    });
    onDone();
  }

  return (
    <form className="form" onSubmit={submit}>
      <p className="muted">Logging “{service.name}” resets its schedule from this date and odometer.</p>
      <div className="row">
        <Field label="Date">
          <input name="date" type="date" required defaultValue={today()} max={today()} />
        </Field>
        <Field label={`Odometer (${unit})`}>
          <input name="odometer" type="number" min={0} required defaultValue={odo} />
        </Field>
      </div>
      <Field label="Cost (optional)">
        <input name="cost" type="number" min={0} step="0.01" />
      </Field>
      <Field label="Notes (optional)">
        <textarea name="notes" rows={2} placeholder="Parts used, shop, etc." />
      </Field>
      <div className="form-actions">
        <button className="btn primary">Mark as done</button>
      </div>
    </form>
  );
}

export function ServiceForm({
  bikeId,
  service,
  onDone,
}: {
  bikeId: string;
  service?: ServiceItem;
  onDone: () => void;
}) {
  const { data, actions } = useStore();
  const unit = data.settings.unit;
  const odo = currentOdometer(data, bikeId);

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const fields = {
      name: str(f.get("name")) ?? "Service",
      intervalDistance: num(f.get("intervalDistance")),
      intervalMonths: num(f.get("intervalMonths")),
      lastDoneOdometer: num(f.get("lastDoneOdometer")) ?? odo,
      lastDoneDate: str(f.get("lastDoneDate")) ?? today(),
    };
    if (service) actions.updateService(service.id, fields);
    else actions.addService({ ...fields, bikeId });
    onDone();
  }

  return (
    <form className="form" onSubmit={submit}>
      <Field label="Service name">
        <input name="name" required defaultValue={service?.name} placeholder="e.g. Fork oil" />
      </Field>
      <div className="row">
        <Field label={`Every … ${unit}`} hint="Leave blank if time-based only">
          <input name="intervalDistance" type="number" min={1} defaultValue={service?.intervalDistance} />
        </Field>
        <Field label="Every … months" hint="Leave blank if distance-based only">
          <input name="intervalMonths" type="number" min={1} defaultValue={service?.intervalMonths} />
        </Field>
      </div>
      <div className="row">
        <Field label="Last done on">
          <input name="lastDoneDate" type="date" required defaultValue={service?.lastDoneDate ?? today()} />
        </Field>
        <Field label={`Last done at (${unit})`}>
          <input name="lastDoneOdometer" type="number" min={0} required defaultValue={service?.lastDoneOdometer ?? odo} />
        </Field>
      </div>
      <div className="form-actions">
        <button className="btn primary">{service ? "Save" : "Add service"}</button>
      </div>
    </form>
  );
}
