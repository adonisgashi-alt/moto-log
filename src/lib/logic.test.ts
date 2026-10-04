import { describe, expect, it } from "vitest";
import { addMonths, currentOdometer, monthlyDistance, serviceStatus, statusesForBike, templateDistance } from "./logic";
import { _createActionsForTests, emptyData } from "./store";
import type { AppData, ServiceItem } from "./types";

const svc = (patch: Partial<ServiceItem>): ServiceItem => ({
  id: "s",
  bikeId: "b",
  name: "Oil",
  lastDoneOdometer: 10000,
  lastDoneDate: "2026-01-15",
  ...patch,
});

function withData(seed: (d: AppData) => AppData = (d) => d) {
  let data = seed(emptyData());
  const actions = _createActionsForTests((fn) => {
    data = fn(data);
  });
  return { get: () => data, actions };
}

describe("addMonths", () => {
  it("clamps to month end", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2024-01-31", 1)).toBe("2024-02-29");
    expect(addMonths("2026-11-15", 3)).toBe("2027-02-15");
  });
});

describe("serviceStatus", () => {
  it("is ok when far from both limits", () => {
    const s = serviceStatus(svc({ intervalDistance: 6000, intervalMonths: 12 }), 11000, "2026-03-01", 500, 30);
    expect(s.state).toBe("ok");
    expect(s.distanceLeft).toBe(5000);
    expect(s.dueDate).toBe("2027-01-15");
  });

  it("is due soon when within the distance window", () => {
    const s = serviceStatus(svc({ intervalDistance: 6000 }), 15600, "2026-03-01", 500, 30);
    expect(s.state).toBe("due-soon");
    expect(s.distanceLeft).toBe(400);
  });

  it("is overdue when either limit has passed, whichever comes first", () => {
    const s = serviceStatus(svc({ intervalDistance: 6000, intervalMonths: 12 }), 11000, "2027-02-01", 500, 30);
    expect(s.state).toBe("overdue");
    expect(s.daysLeft).toBeLessThan(0);
  });

  it("treats a service with no interval as ok", () => {
    expect(serviceStatus(svc({}), 99999, "2030-01-01", 500, 30).state).toBe("ok");
  });
});

describe("store actions", () => {
  it("adds a bike with the default schedule", () => {
    const s = withData();
    const id = s.actions.addBike({ name: "MT", make: "Yamaha", model: "MT-07", startOdometer: 12000, addDefaultServices: true });
    expect(s.get().bikes).toHaveLength(1);
    const services = s.get().services.filter((x) => x.bikeId === id);
    expect(services.length).toBeGreaterThan(5);
    expect(services.every((x) => x.lastDoneOdometer === 12000)).toBe(true);
  });

  it("completing a service resets its interval and records history", () => {
    const s = withData();
    const bikeId = s.actions.addBike({ name: "B", make: "", model: "", startOdometer: 0, addDefaultServices: false });
    s.actions.addService({ bikeId, name: "Oil", intervalDistance: 5000, lastDoneOdometer: 0, lastDoneDate: "2026-01-01" });
    s.actions.addMileage({ bikeId, date: "2026-06-01", odometer: 5200 });
    const oil = s.get().services[0];
    expect(statusesForBike(s.get(), bikeId, "2026-06-01")[0].state).toBe("overdue");

    s.actions.completeService(oil.id, { date: "2026-06-02", odometer: 5210, cost: 60 });
    const after = statusesForBike(s.get(), bikeId, "2026-06-02")[0];
    expect(after.state).toBe("ok");
    expect(after.dueOdometer).toBe(10210);
    expect(s.get().serviceRecords).toHaveLength(1);
    expect(currentOdometer(s.get(), bikeId)).toBe(5210);
  });

  it("completing a trip logs mileage and deleting it removes that reading", () => {
    const s = withData();
    const bikeId = s.actions.addBike({ name: "B", make: "", model: "", startOdometer: 1000, addDefaultServices: false });
    s.actions.addTrip({ bikeId, title: "Coast", from: "A", to: "B", startDate: "2026-05-01", status: "planned" });
    const trip = s.get().trips[0];
    s.actions.completeTrip(trip.id, { endDate: "2026-05-02", startOdometer: 1000, endOdometer: 1450 });
    expect(s.get().trips[0].status).toBe("completed");
    expect(currentOdometer(s.get(), bikeId)).toBe(1450);

    // Re-completing replaces the reading instead of duplicating it.
    s.actions.completeTrip(trip.id, { endDate: "2026-05-02", startOdometer: 1000, endOdometer: 1500 });
    expect(s.get().mileage).toHaveLength(1);

    s.actions.deleteTrip(trip.id);
    expect(s.get().mileage).toHaveLength(0);
    expect(currentOdometer(s.get(), bikeId)).toBe(1000);
  });
});

describe("monthlyDistance", () => {
  it("buckets distance between readings by month", () => {
    const s = withData();
    const bikeId = s.actions.addBike({ name: "B", make: "", model: "", startOdometer: 1000, addDefaultServices: false });
    s.actions.addMileage({ bikeId, date: "2026-08-10", odometer: 1300 });
    s.actions.addMileage({ bikeId, date: "2026-09-05", odometer: 1800 });
    s.actions.addMileage({ bikeId, date: "2026-10-01", odometer: 1850 });
    const months = monthlyDistance(s.get(), bikeId, 3, "2026-10-04");
    expect(months).toEqual([
      { month: "2026-08", distance: 300 },
      { month: "2026-09", distance: 500 },
      { month: "2026-10", distance: 50 },
    ]);
  });
});

describe("templateDistance", () => {
  it("converts km intervals to rounded miles", () => {
    expect(templateDistance({ name: "x", intervalKm: 6000 }, "km")).toBe(6000);
    expect(templateDistance({ name: "x", intervalKm: 6000 }, "mi")).toBe(3500);
    expect(templateDistance({ name: "x", intervalKm: 800 }, "mi")).toBe(500);
  });
});
