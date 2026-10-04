import type { FormEvent } from "react";
import { currentOdometer, formatNumber, today } from "../lib/logic";
import { useStore } from "../lib/store";
import { Field, num, str } from "./ui";

export function MileageForm({ bikeId, compact, onDone }: { bikeId: string; compact?: boolean; onDone?: () => void }) {
  const { data, actions } = useStore();
  const unit = data.settings.unit;
  const odo = currentOdometer(data, bikeId);

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const reading = num(f.get("odometer"));
    if (reading === undefined) return;
    if (reading < odo && !window.confirm(`That's lower than the current ${formatNumber(odo)} ${unit}. Log it anyway?`)) {
      return;
    }
    actions.addMileage({ bikeId, date: str(f.get("date")) ?? today(), odometer: reading, note: str(f.get("note")) });
    form.reset();
    onDone?.();
  }

  return (
    <form className={compact ? "form inline-form" : "form"} onSubmit={submit}>
      <div className="row">
        <Field label={`Odometer (${unit})`}>
          <input name="odometer" type="number" min={0} required placeholder={formatNumber(odo)} />
        </Field>
        <Field label="Date">
          <input name="date" type="date" required defaultValue={today()} max={today()} />
        </Field>
      </div>
      {!compact && (
        <Field label="Note (optional)">
          <input name="note" placeholder="e.g. Weekend ride" />
        </Field>
      )}
      <div className="form-actions">
        <button className="btn primary">Log reading</button>
      </div>
    </form>
  );
}
