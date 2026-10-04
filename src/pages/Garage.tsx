import { useRef, useState, type ChangeEvent } from "react";
import { BikeForm } from "../components/BikeForm";
import { Field, Modal, PageHeader } from "../components/ui";
import { bikeLabel, currentOdometer, formatNumber, statusesForBike, today } from "../lib/logic";
import { useStore } from "../lib/store";
import type { AppData, Bike, Unit } from "../lib/types";

export function Garage({ selectedId, onSelect }: { selectedId?: string; onSelect: (id: string) => void }) {
  const { data, actions } = useStore();
  const [dialog, setDialog] = useState<{ kind: "add" } | { kind: "edit"; bike: Bike } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const unit = data.settings.unit;
  const close = () => setDialog(null);

  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `motolog-backup-${today()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function importData(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as AppData;
      if (!Array.isArray(parsed.bikes)) throw new Error("Not a MotoLog backup");
      if (confirm("Replace all current data with this backup?")) actions.replaceAll(parsed);
    } catch {
      alert("That file doesn't look like a MotoLog backup.");
    }
  }

  return (
    <>
      <PageHeader
        title="Garage"
        subtitle="Your bikes and app settings."
        action={
          <button className="btn primary" onClick={() => setDialog({ kind: "add" })}>
            + Add bike
          </button>
        }
      />

      <ul className="bike-grid">
        {data.bikes.map((b) => {
          const statuses = statusesForBike(data, b.id);
          const overdue = statuses.filter((s) => s.state === "overdue").length;
          const soon = statuses.filter((s) => s.state === "due-soon").length;
          return (
            <li key={b.id} className={`card bike ${b.id === selectedId ? "selected" : ""}`}>
              <div className="row-title">{b.name}</div>
              <div className="muted small">{bikeLabel(b)}</div>
              <div className="bike-odo">
                {formatNumber(currentOdometer(data, b.id))} <span className="muted">{unit}</span>
              </div>
              <div className="small">
                {overdue > 0 && <span className="badge overdue">{overdue} overdue</span>}
                {soon > 0 && <span className="badge due-soon">{soon} due soon</span>}
                {overdue + soon === 0 && <span className="badge ok">All good</span>}
              </div>
              <div className="row-actions">
                {b.id !== selectedId && (
                  <button className="btn small" onClick={() => onSelect(b.id)}>
                    Select
                  </button>
                )}
                <button className="btn small ghost" onClick={() => setDialog({ kind: "edit", bike: b })}>
                  Edit
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <section className="card">
        <h2>Settings</h2>
        <div className="form">
          <div className="row">
            <Field label="Distance unit" hint="Changes labels only; existing numbers are not converted.">
              <select value={unit} onChange={(e) => actions.updateSettings({ unit: e.target.value as Unit })}>
                <option value="km">Kilometres</option>
                <option value="mi">Miles</option>
              </select>
            </Field>
            <Field label={`"Due soon" within (${unit})`}>
              <input
                type="number"
                min={0}
                value={data.settings.dueSoonDistance}
                onChange={(e) => actions.updateSettings({ dueSoonDistance: Number(e.target.value) || 0 })}
              />
            </Field>
            <Field label={`"Due soon" within (days)`}>
              <input
                type="number"
                min={0}
                value={data.settings.dueSoonDays}
                onChange={(e) => actions.updateSettings({ dueSoonDays: Number(e.target.value) || 0 })}
              />
            </Field>
          </div>
        </div>
        <h3 className="sub">Backup</h3>
        <p className="muted small">Data lives in this browser. Export a backup to move it to another device.</p>
        <div className="row-actions">
          <button className="btn" onClick={exportData}>
            Export data
          </button>
          <button className="btn ghost" onClick={() => fileRef.current?.click()}>
            Import backup
          </button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={importData} />
        </div>
      </section>

      <Modal title="Add bike" open={dialog?.kind === "add"} onClose={close}>
        <BikeForm
          onDone={(id) => {
            onSelect(id);
            close();
          }}
        />
      </Modal>
      <Modal title="Edit bike" open={dialog?.kind === "edit"} onClose={close}>
        {dialog?.kind === "edit" && (
          <>
            <BikeForm bike={dialog.bike} onDone={close} />
            <button
              className="btn danger ghost full"
              onClick={() => {
                if (confirm(`Delete ${dialog.bike.name} and all its services, mileage and trips?`)) {
                  actions.deleteBike(dialog.bike.id);
                  close();
                }
              }}
            >
              Delete bike
            </button>
          </>
        )}
      </Modal>
    </>
  );
}
