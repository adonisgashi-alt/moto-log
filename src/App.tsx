import { useEffect, useState } from "react";
import { BikeForm } from "./components/BikeForm";
import { useStore } from "./lib/store";
import { Dashboard } from "./pages/Dashboard";
import { Garage } from "./pages/Garage";
import { Mileage } from "./pages/Mileage";
import { Services } from "./pages/Services";
import { Trips } from "./pages/Trips";

const ROUTES = [
  { id: "dashboard", label: "Dashboard", icon: "◎" },
  { id: "services", label: "Services", icon: "🔧" },
  { id: "mileage", label: "Mileage", icon: "⏱" },
  { id: "trips", label: "Trips", icon: "🗺" },
  { id: "garage", label: "Garage", icon: "🏍" },
] as const;

type Route = (typeof ROUTES)[number]["id"];

function readRoute(): Route {
  const h = window.location.hash.replace(/^#\/?/, "");
  return (ROUTES.find((r) => r.id === h)?.id ?? "dashboard") as Route;
}

const BIKE_KEY = "motolog:selectedBike";

export default function App() {
  const { data } = useStore();
  const [route, setRoute] = useState<Route>(readRoute);
  const [bikeId, setBikeId] = useState<string>(() => {
    try {
      return localStorage.getItem(BIKE_KEY) ?? "";
    } catch {
      return "";
    }
  });

  useEffect(() => {
    const onHash = () => setRoute(readRoute());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // Keep a valid bike selected as bikes are added or removed.
  const selected = data.bikes.find((b) => b.id === bikeId) ?? data.bikes[0];
  useEffect(() => {
    try {
      if (selected) localStorage.setItem(BIKE_KEY, selected.id);
    } catch {
      /* ignore */
    }
  }, [selected]);

  const go = (r: Route) => {
    window.location.hash = `/${r}`;
  };

  if (data.bikes.length === 0) {
    return (
      <div className="onboarding">
        <div className="brand big">
          <Logo /> MotoLog
        </div>
        <p className="lead">Track due services, log your mileage and plan trips. Start by adding your bike.</p>
        <div className="card">
          <BikeForm
            onDone={(id) => {
              setBikeId(id);
              go("dashboard");
            }}
          />
        </div>
        <p className="muted small">Your data is stored in this browser. Export a backup any time from the Garage.</p>
      </div>
    );
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <Logo /> MotoLog
        </div>
        <nav className="nav">
          {ROUTES.map((r) => (
            <a key={r.id} href={`#/${r.id}`} className={route === r.id ? "active" : ""}>
              <span className="nav-icon" aria-hidden>
                {r.icon}
              </span>
              {r.label}
            </a>
          ))}
        </nav>
      </aside>
      <div className="main">
        <header className="topbar">
          <div className="brand mobile-only">
            <Logo /> MotoLog
          </div>
          {data.bikes.length > 0 && (
            <label className="bike-picker">
              <span className="sr-only">Bike</span>
              <select value={selected?.id} onChange={(e) => setBikeId(e.target.value)}>
                {data.bikes.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </header>
        <main className="content">
          {route === "dashboard" && selected && <Dashboard bikeId={selected.id} go={go} />}
          {route === "services" && selected && <Services bikeId={selected.id} />}
          {route === "mileage" && selected && <Mileage bikeId={selected.id} />}
          {route === "trips" && selected && <Trips bikeId={selected.id} />}
          {route === "garage" && <Garage selectedId={selected?.id} onSelect={setBikeId} />}
        </main>
      </div>
      <nav className="tabbar">
        {ROUTES.map((r) => (
          <a key={r.id} href={`#/${r.id}`} className={route === r.id ? "active" : ""}>
            <span aria-hidden>{r.icon}</span>
            <span>{r.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}

function Logo() {
  return (
    <svg className="logo" viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="8" fill="var(--accent)" />
      <circle cx="10" cy="20" r="5" fill="none" stroke="#fff" strokeWidth="2.5" />
      <circle cx="22" cy="20" r="5" fill="none" stroke="#fff" strokeWidth="2.5" />
      <path d="M10 20l5-8h5l2 8" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}
