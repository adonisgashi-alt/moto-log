import { useState } from "react";
import { CompleteServiceForm, DueText, ServiceForm, StateBadge } from "../components/ServiceBits";
import { Empty, Modal, PageHeader } from "../components/ui";
import { formatDate, formatNumber, statusesForBike } from "../lib/logic";
import { useStore } from "../lib/store";
import type { ServiceItem } from "../lib/types";

type Dialog = { kind: "add" } | { kind: "edit"; service: ServiceItem } | { kind: "complete"; service: ServiceItem };

export function Services({ bikeId }: { bikeId: string }) {
  const { data, actions } = useStore();
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const unit = data.settings.unit;
  const statuses = statusesForBike(data, bikeId);
  const history = data.serviceRecords
    .filter((r) => r.bikeId === bikeId)
    .sort((a, b) => b.date.localeCompare(a.date) || b.odometer - a.odometer);
  const totalCost = history.reduce((sum, r) => sum + (r.cost ?? 0), 0);
  const close = () => setDialog(null);

  return (
    <>
      <PageHeader
        title="Services"
        subtitle="Your maintenance schedule, sorted by what's due first."
        action={
          <button className="btn primary" onClick={() => setDialog({ kind: "add" })}>
            + Add service
          </button>
        }
      />

      <section className="card">
        {statuses.length === 0 ? (
          <Empty title="No services tracked">Add the jobs you want reminders for, like oil changes or chain lube.</Empty>
        ) : (
          <ul className="list">
            {statuses.map((s) => (
              <li key={s.service.id} className="list-row">
                <div>
                  <div className="row-title">
                    {s.service.name} <StateBadge state={s.state} />
                  </div>
                  <div className="muted small">
                    Due <DueText status={s} unit={unit} />
                  </div>
                  <div className="muted small">
                    Every {[s.service.intervalDistance && `${formatNumber(s.service.intervalDistance)} ${unit}`, s.service.intervalMonths && `${s.service.intervalMonths} mo`].filter(Boolean).join(" or ") || "—"}
                    {" · "}last done {formatDate(s.service.lastDoneDate)} at {formatNumber(s.service.lastDoneOdometer)} {unit}
                  </div>
                </div>
                <div className="row-actions">
                  <button className="btn small primary" onClick={() => setDialog({ kind: "complete", service: s.service })}>
                    Done
                  </button>
                  <button className="btn small ghost" onClick={() => setDialog({ kind: "edit", service: s.service })}>
                    Edit
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Service history</h2>
          {totalCost > 0 && <span className="muted small">Total spent: {totalCost.toFixed(2)}</span>}
        </div>
        {history.length === 0 ? (
          <Empty title="Nothing logged yet">Hit “Done” on a service to record it here.</Empty>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Service</th>
                <th className="num">Odometer</th>
                <th className="num">Cost</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {history.map((r) => (
                <tr key={r.id}>
                  <td>{formatDate(r.date)}</td>
                  <td>
                    {r.serviceName}
                    {r.notes && <div className="muted small">{r.notes}</div>}
                  </td>
                  <td className="num">{formatNumber(r.odometer)}</td>
                  <td className="num">{r.cost !== undefined ? r.cost.toFixed(2) : "—"}</td>
                  <td className="num">
                    <button
                      className="icon-btn"
                      aria-label="Delete record"
                      onClick={() => confirm("Delete this service record?") && actions.deleteServiceRecord(r.id)}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <Modal title="Add service" open={dialog?.kind === "add"} onClose={close}>
        <ServiceForm bikeId={bikeId} onDone={close} />
      </Modal>
      <Modal title="Edit service" open={dialog?.kind === "edit"} onClose={close}>
        {dialog?.kind === "edit" && (
          <>
            <ServiceForm bikeId={bikeId} service={dialog.service} onDone={close} />
            <button
              className="btn danger ghost full"
              onClick={() => {
                if (confirm(`Stop tracking “${dialog.service.name}”?`)) {
                  actions.deleteService(dialog.service.id);
                  close();
                }
              }}
            >
              Delete service
            </button>
          </>
        )}
      </Modal>
      <Modal title="Log completed service" open={dialog?.kind === "complete"} onClose={close}>
        {dialog?.kind === "complete" && <CompleteServiceForm service={dialog.service} onDone={close} />}
      </Modal>
    </>
  );
}
