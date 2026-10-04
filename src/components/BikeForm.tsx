import type { FormEvent } from "react";
import { useStore } from "../lib/store";
import type { Bike } from "../lib/types";
import { Field, num, str } from "./ui";

export function BikeForm({ bike, onDone }: { bike?: Bike; onDone: (id: string) => void }) {
  const { data, actions } = useStore();
  const unit = data.settings.unit;

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const fields = {
      name: str(f.get("name")) ?? "",
      make: str(f.get("make")) ?? "",
      model: str(f.get("model")) ?? "",
      year: num(f.get("year")),
      startOdometer: num(f.get("startOdometer")) ?? 0,
    };
    if (bike) {
      actions.updateBike(bike.id, fields);
      onDone(bike.id);
    } else {
      onDone(actions.addBike({ ...fields, addDefaultServices: f.get("defaults") === "on" }));
    }
  }

  return (
    <form className="form" onSubmit={submit}>
      <Field label="Nickname">
        <input name="name" required defaultValue={bike?.name} placeholder="e.g. The Beast" />
      </Field>
      <div className="row">
        <Field label="Make">
          <input name="make" defaultValue={bike?.make} placeholder="Yamaha" />
        </Field>
        <Field label="Model">
          <input name="model" defaultValue={bike?.model} placeholder="MT-07" />
        </Field>
      </div>
      <div className="row">
        <Field label="Year">
          <input name="year" type="number" min={1900} max={2100} defaultValue={bike?.year} />
        </Field>
        <Field label={`Odometer when added (${unit})`}>
          <input name="startOdometer" type="number" min={0} required defaultValue={bike?.startOdometer ?? ""} />
        </Field>
      </div>
      {!bike && (
        <label className="check">
          <input type="checkbox" name="defaults" defaultChecked />
          <span>Add a standard service schedule (oil, chain, tyres, brakes…). You can edit intervals later.</span>
        </label>
      )}
      <div className="form-actions">
        <button className="btn primary">{bike ? "Save bike" : "Add bike"}</button>
      </div>
    </form>
  );
}
