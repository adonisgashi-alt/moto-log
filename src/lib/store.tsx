import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_SERVICES, templateDistance, today, uid } from "./logic";
import type { AppData, Bike, MileageEntry, ServiceItem, ServiceRecord, Settings, Trip } from "./types";

const STORAGE_KEY = "motolog:data:v1";

export function emptyData(): AppData {
  return {
    version: 1,
    settings: { unit: "km", dueSoonDistance: 500, dueSoonDays: 30 },
    bikes: [],
    mileage: [],
    services: [],
    serviceRecords: [],
    trips: [],
  };
}

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData();
    const parsed = JSON.parse(raw) as AppData;
    return { ...emptyData(), ...parsed, settings: { ...emptyData().settings, ...parsed.settings } };
  } catch {
    return emptyData();
  }
}

export interface NewBike {
  name: string;
  make: string;
  model: string;
  year?: number;
  startOdometer: number;
  addDefaultServices: boolean;
}

function createActions(set: (fn: (d: AppData) => AppData) => void) {
  return {
    updateSettings: (patch: Partial<Settings>) =>
      set((d) => ({ ...d, settings: { ...d.settings, ...patch } })),

    addBike: (input: NewBike): string => {
      const id = uid();
      set((d) => {
        const bike: Bike = {
          id,
          name: input.name,
          make: input.make,
          model: input.model,
          year: input.year,
          startOdometer: input.startOdometer,
          createdAt: today(),
        };
        const services: ServiceItem[] = input.addDefaultServices
          ? DEFAULT_SERVICES.map((t) => ({
              id: uid(),
              bikeId: id,
              name: t.name,
              intervalDistance: templateDistance(t, d.settings.unit),
              intervalMonths: t.intervalMonths,
              lastDoneOdometer: input.startOdometer,
              lastDoneDate: today(),
            }))
          : [];
        return { ...d, bikes: [...d.bikes, bike], services: [...d.services, ...services] };
      });
      return id;
    },
    updateBike: (id: string, patch: Partial<Omit<Bike, "id">>) =>
      set((d) => ({ ...d, bikes: d.bikes.map((b) => (b.id === id ? { ...b, ...patch } : b)) })),
    deleteBike: (id: string) =>
      set((d) => ({
        ...d,
        bikes: d.bikes.filter((b) => b.id !== id),
        mileage: d.mileage.filter((x) => x.bikeId !== id),
        services: d.services.filter((x) => x.bikeId !== id),
        serviceRecords: d.serviceRecords.filter((x) => x.bikeId !== id),
        trips: d.trips.filter((x) => x.bikeId !== id),
      })),

    addMileage: (entry: Omit<MileageEntry, "id">) =>
      set((d) => ({ ...d, mileage: [...d.mileage, { ...entry, id: uid() }] })),
    deleteMileage: (id: string) => set((d) => ({ ...d, mileage: d.mileage.filter((m) => m.id !== id) })),

    addService: (service: Omit<ServiceItem, "id">) =>
      set((d) => ({ ...d, services: [...d.services, { ...service, id: uid() }] })),
    updateService: (id: string, patch: Partial<Omit<ServiceItem, "id">>) =>
      set((d) => ({ ...d, services: d.services.map((s) => (s.id === id ? { ...s, ...patch } : s)) })),
    deleteService: (id: string) => set((d) => ({ ...d, services: d.services.filter((s) => s.id !== id) })),
    /** Records a completed service and resets its interval from that point. */
    completeService: (serviceId: string, record: { date: string; odometer: number; cost?: number; notes?: string }) =>
      set((d) => {
        const service = d.services.find((s) => s.id === serviceId);
        if (!service) return d;
        const entry: ServiceRecord = {
          id: uid(),
          bikeId: service.bikeId,
          serviceId,
          serviceName: service.name,
          ...record,
        };
        return {
          ...d,
          services: d.services.map((s) =>
            s.id === serviceId ? { ...s, lastDoneDate: record.date, lastDoneOdometer: record.odometer } : s,
          ),
          serviceRecords: [...d.serviceRecords, entry],
        };
      }),
    deleteServiceRecord: (id: string) =>
      set((d) => ({ ...d, serviceRecords: d.serviceRecords.filter((r) => r.id !== id) })),

    addTrip: (trip: Omit<Trip, "id">) => set((d) => ({ ...d, trips: [...d.trips, { ...trip, id: uid() }] })),
    updateTrip: (id: string, patch: Partial<Omit<Trip, "id">>) =>
      set((d) => ({ ...d, trips: d.trips.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
    /** Marks a trip ridden and logs its end odometer as a mileage reading. */
    completeTrip: (id: string, done: { endDate: string; startOdometer: number; endOdometer: number }) =>
      set((d) => {
        const trip = d.trips.find((t) => t.id === id);
        if (!trip) return d;
        const mileage = d.mileage.filter((m) => m.tripId !== id);
        mileage.push({
          id: uid(),
          bikeId: trip.bikeId,
          date: done.endDate,
          odometer: done.endOdometer,
          note: `Trip: ${trip.title}`,
          tripId: id,
        });
        return {
          ...d,
          mileage,
          trips: d.trips.map((t) => (t.id === id ? { ...t, ...done, status: "completed" } : t)),
        };
      }),
    deleteTrip: (id: string) =>
      set((d) => ({
        ...d,
        trips: d.trips.filter((t) => t.id !== id),
        mileage: d.mileage.filter((m) => m.tripId !== id),
      })),

    replaceAll: (data: AppData) => set(() => ({ ...emptyData(), ...data })),
  };
}

export type Actions = ReturnType<typeof createActions>;

const StoreContext = createContext<{ data: AppData; actions: Actions } | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Storage full or unavailable; data stays in memory for this session.
    }
  }, [data]);

  const set = useCallback((fn: (d: AppData) => AppData) => setData(fn), []);
  const actions = useMemo(() => createActions(set), [set]);
  const value = useMemo(() => ({ data, actions }), [data, actions]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export { createActions as _createActionsForTests };
