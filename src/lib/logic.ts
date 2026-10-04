import type { AppData, Bike, ServiceItem, Trip } from "./types";

export const DAY_MS = 24 * 60 * 60 * 1000;

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function today(): string {
  return toISODate(new Date());
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Adds calendar months, clamping to the end of shorter months (Jan 31 + 1 → Feb 28/29). */
export function addMonths(date: string, months: number): string {
  const d = parseISODate(date);
  const target = new Date(d.getFullYear(), d.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(d.getDate(), lastDay));
  return toISODate(target);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((parseISODate(to).getTime() - parseISODate(from).getTime()) / DAY_MS);
}

/** Current odometer: the highest reading logged for the bike, or its starting reading. */
export function currentOdometer(data: AppData, bikeId: string): number {
  const bike = data.bikes.find((b) => b.id === bikeId);
  let odo = bike?.startOdometer ?? 0;
  for (const e of data.mileage) if (e.bikeId === bikeId && e.odometer > odo) odo = e.odometer;
  for (const r of data.serviceRecords) if (r.bikeId === bikeId && r.odometer > odo) odo = r.odometer;
  return odo;
}

export type DueState = "overdue" | "due-soon" | "ok";

export interface ServiceStatus {
  service: ServiceItem;
  state: DueState;
  dueOdometer?: number;
  dueDate?: string;
  /** Negative when overdue. */
  distanceLeft?: number;
  daysLeft?: number;
}

export function serviceStatus(
  service: ServiceItem,
  odometer: number,
  onDate: string,
  dueSoonDistance: number,
  dueSoonDays: number,
): ServiceStatus {
  const status: ServiceStatus = { service, state: "ok" };
  const states: DueState[] = [];

  if (service.intervalDistance) {
    status.dueOdometer = service.lastDoneOdometer + service.intervalDistance;
    status.distanceLeft = status.dueOdometer - odometer;
    states.push(
      status.distanceLeft <= 0 ? "overdue" : status.distanceLeft <= dueSoonDistance ? "due-soon" : "ok",
    );
  }
  if (service.intervalMonths) {
    status.dueDate = addMonths(service.lastDoneDate, service.intervalMonths);
    status.daysLeft = daysBetween(onDate, status.dueDate);
    states.push(status.daysLeft <= 0 ? "overdue" : status.daysLeft <= dueSoonDays ? "due-soon" : "ok");
  }

  status.state = states.includes("overdue") ? "overdue" : states.includes("due-soon") ? "due-soon" : "ok";
  return status;
}

const STATE_ORDER: Record<DueState, number> = { overdue: 0, "due-soon": 1, ok: 2 };

/** Urgency score used for sorting: lower is more urgent. */
function urgency(s: ServiceStatus, dueSoonDistance: number, dueSoonDays: number): number {
  const parts: number[] = [];
  if (s.distanceLeft !== undefined) parts.push(s.distanceLeft / Math.max(dueSoonDistance, 1));
  if (s.daysLeft !== undefined) parts.push(s.daysLeft / Math.max(dueSoonDays, 1));
  return parts.length ? Math.min(...parts) : Infinity;
}

export function statusesForBike(data: AppData, bikeId: string, onDate = today()): ServiceStatus[] {
  const odo = currentOdometer(data, bikeId);
  const { dueSoonDistance, dueSoonDays } = data.settings;
  return data.services
    .filter((s) => s.bikeId === bikeId)
    .map((s) => serviceStatus(s, odo, onDate, dueSoonDistance, dueSoonDays))
    .sort(
      (a, b) =>
        STATE_ORDER[a.state] - STATE_ORDER[b.state] ||
        urgency(a, dueSoonDistance, dueSoonDays) - urgency(b, dueSoonDistance, dueSoonDays),
    );
}

export function tripDistance(trip: Trip): number | undefined {
  if (trip.startOdometer !== undefined && trip.endOdometer !== undefined) {
    return Math.max(0, trip.endOdometer - trip.startOdometer);
  }
  return undefined;
}

/** Distance ridden per month over the last `months` months, from odometer readings. */
export function monthlyDistance(
  data: AppData,
  bikeId: string | "all",
  months: number,
  onDate = today(),
): { month: string; distance: number }[] {
  const end = parseISODate(onDate);
  const keys: string[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(end.getFullYear(), end.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  const totals = new Map(keys.map((k) => [k, 0]));
  const bikeIds = bikeId === "all" ? data.bikes.map((b) => b.id) : [bikeId];

  for (const id of bikeIds) {
    const bike = data.bikes.find((b) => b.id === id);
    const readings = [
      ...data.mileage.filter((e) => e.bikeId === id).map((e) => ({ date: e.date, odo: e.odometer })),
      ...data.serviceRecords.filter((r) => r.bikeId === id).map((r) => ({ date: r.date, odo: r.odometer })),
    ].sort((a, b) => a.date.localeCompare(b.date) || a.odo - b.odo);

    let prev = bike?.startOdometer ?? 0;
    for (const r of readings) {
      const delta = r.odo - prev;
      if (delta > 0) {
        const key = r.date.slice(0, 7);
        if (totals.has(key)) totals.set(key, totals.get(key)! + delta);
        prev = r.odo;
      }
    }
  }
  return keys.map((month) => ({ month, distance: totals.get(month)! }));
}

export interface ServiceTemplate {
  name: string;
  intervalKm?: number;
  intervalMonths?: number;
}

/** Common motorcycle maintenance intervals; riders can edit them per bike. */
export const DEFAULT_SERVICES: ServiceTemplate[] = [
  { name: "Engine oil & filter", intervalKm: 6000, intervalMonths: 12 },
  { name: "Chain clean & lube", intervalKm: 800 },
  { name: "Chain & sprockets inspection", intervalKm: 5000 },
  { name: "Tyre pressure & tread check", intervalKm: 1000, intervalMonths: 1 },
  { name: "Air filter", intervalKm: 12000, intervalMonths: 24 },
  { name: "Spark plugs", intervalKm: 12000 },
  { name: "Brake fluid", intervalMonths: 24 },
  { name: "Coolant", intervalMonths: 24 },
  { name: "Valve clearance check", intervalKm: 24000 },
];

const KM_PER_MI = 1.609344;

export function templateDistance(t: ServiceTemplate, unit: "km" | "mi"): number | undefined {
  if (!t.intervalKm) return undefined;
  if (unit === "km") return t.intervalKm;
  // Round to a friendly figure in miles.
  const mi = t.intervalKm / KM_PER_MI;
  const step = mi < 1000 ? 50 : 500;
  return Math.max(step, Math.round(mi / step) * step);
}

export function bikeLabel(bike: Bike): string {
  const detail = [bike.year, bike.make, bike.model].filter(Boolean).join(" ");
  return bike.name && detail ? `${bike.name} (${detail})` : bike.name || detail;
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat().format(Math.round(n));
}

export function formatDate(s: string): string {
  return parseISODate(s).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

/** Formats a "YYYY-MM" key, e.g. "Oct" or "October 2026". */
export function formatMonth(key: string, style: "short" | "long"): string {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return style === "short"
    ? d.toLocaleDateString(undefined, { month: "short" })
    : d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}
