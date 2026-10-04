export type Unit = "km" | "mi";

export interface Bike {
  id: string;
  name: string;
  make: string;
  model: string;
  year?: number;
  /** Odometer reading when the bike was added to MotoLog. */
  startOdometer: number;
  createdAt: string;
}

export interface MileageEntry {
  id: string;
  bikeId: string;
  date: string; // YYYY-MM-DD
  odometer: number;
  note?: string;
  tripId?: string;
}

export interface ServiceItem {
  id: string;
  bikeId: string;
  name: string;
  /** Repeat every N distance units. */
  intervalDistance?: number;
  /** Repeat every N months. */
  intervalMonths?: number;
  lastDoneOdometer: number;
  lastDoneDate: string; // YYYY-MM-DD
}

export interface ServiceRecord {
  id: string;
  bikeId: string;
  serviceId: string;
  serviceName: string;
  date: string;
  odometer: number;
  cost?: number;
  notes?: string;
}

export type TripStatus = "planned" | "completed";

export interface Trip {
  id: string;
  bikeId: string;
  title: string;
  from: string;
  to: string;
  startDate: string;
  endDate?: string;
  plannedDistance?: number;
  startOdometer?: number;
  endOdometer?: number;
  notes?: string;
  status: TripStatus;
}

export interface Settings {
  unit: Unit;
  /** Distance before a service counts as "due soon". */
  dueSoonDistance: number;
  /** Days before a service counts as "due soon". */
  dueSoonDays: number;
}

export interface AppData {
  version: 1;
  settings: Settings;
  bikes: Bike[];
  mileage: MileageEntry[];
  services: ServiceItem[];
  serviceRecords: ServiceRecord[];
  trips: Trip[];
}
