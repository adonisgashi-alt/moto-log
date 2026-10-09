// Maintenance status logic. Must match the MotoLog iOS app exactly.
const DAY = 86400000;

export function milesRemaining(item, currentMileage) {
  return item.lastServiceMileage + item.intervalMiles - currentMileage;
}

export function daysRemaining(item, now = new Date()) {
  const base = item.lastServiceDate?.toDate() ?? new Date(now);
  const due = new Date(base);
  due.setMonth(due.getMonth() + (item.intervalMonths ?? 12));
  return Math.floor((due - now) / DAY);
}

export function status(item, currentMileage, now = new Date()) {
  const milesLeft = milesRemaining(item, currentMileage);
  const daysLeft = daysRemaining(item, now);
  if (milesLeft <= 0 || daysLeft <= 0) return "overdue";
  if (milesLeft <= Math.max(Math.floor(item.intervalMiles * 0.1), 50) || daysLeft <= 14) return "dueSoon";
  return "ok";
}

const RANK = { ok: 0, dueSoon: 1, overdue: 2 };

// A bike's overall badge is the worst status among its items (overdue > dueSoon > ok)
export function worst(statuses) {
  return statuses.reduce((a, b) => (RANK[b] > RANK[a] ? b : a), "ok");
}
