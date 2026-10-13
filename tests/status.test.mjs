import assert from "node:assert/strict";
import { status, worst, milesRemaining, daysRemaining } from "../src/status.js";

const now = new Date("2026-10-07T12:00:00Z");
const ts = (d) => ({ toDate: () => new Date(d) });
const item = (o) => ({ intervalMiles: 3000, intervalMonths: 6, lastServiceMileage: 10000, lastServiceDate: ts("2026-09-01T00:00:00Z"), ...o });

assert.equal(milesRemaining(item(), 11000), 2000);
assert.equal(status(item(), 11000, now), "ok");
assert.equal(status(item(), 13000, now), "overdue"); // 0 miles left
assert.equal(status(item(), 12700, now), "dueSoon"); // 300 left = 10% of 3000
assert.equal(status(item(), 12699, now), "ok");
assert.equal(status(item({ intervalMiles: 200, lastServiceMileage: 0 }), 150, now), "dueSoon"); // 50 left, floor is 50 miles
assert.equal(status(item({ intervalMiles: 200, lastServiceMileage: 0 }), 149, now), "ok"); // 51 left
assert.equal(status(item({ lastServiceDate: ts("2026-03-01T00:00:00Z") }), 11000, now), "overdue"); // 6 months elapsed
assert.equal(status(item({ lastServiceDate: ts("2026-04-20T00:00:00Z") }), 11000, now), "dueSoon"); // ~13 days left
assert.equal(status(item({ lastServiceDate: null, intervalMonths: null }), 11000, now), "ok"); // base = now, 12 months
assert.equal(daysRemaining(item({ lastServiceDate: null, intervalMonths: null }), now) >= 364, true);
assert.equal(worst(["ok", "dueSoon", "ok"]), "dueSoon");
assert.equal(worst(["dueSoon", "overdue", "ok"]), "overdue");
assert.equal(worst([]), "ok");
console.log("status tests passed");
