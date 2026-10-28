// The free tools: fuel consumption calculator, service due calculator and the printable log's print button.
const num = (id) => {
  const v = parseFloat(document.getElementById(id)?.value);
  return Number.isFinite(v) && v > 0 ? v : null;
};
const odo = (id) => {
  const v = parseFloat(document.getElementById(id)?.value);
  return Number.isFinite(v) && v >= 0 ? v : null;
};
const fmt = (n, d = 1) => n.toLocaleString("en-GB", { maximumFractionDigits: d, minimumFractionDigits: d });

const fuel = document.getElementById("fuel-calc");
if (fuel) {
  const out = document.getElementById("fuel-result");
  const KM_PER_MILE = 1.609344;
  const LITRES = { uk: 4.54609, us: 3.785411784 };
  const labels = { metric: ["km", "litres"], uk: ["miles", "UK gallons"], us: ["miles", "US gallons"] };
  const update = () => {
    const units = fuel.querySelector('input[name="units"]:checked').value;
    const [dist, vol] = labels[units];
    document.querySelector('label[for="distance"]').textContent = `Distance ridden (${dist})`;
    document.querySelector('label[for="fuel"]').textContent = `Fuel to refill (${vol})`;
    const d = num("distance");
    const f = num("fuel");
    if (!d || !f) {
      out.textContent = "Enter a distance and the fuel it took.";
      return;
    }
    const km = units === "metric" ? d : d * KM_PER_MILE;
    const litres = units === "metric" ? f : f * LITRES[units];
    const miles = km / KM_PER_MILE;
    out.innerHTML = `<span><b>${fmt((litres / km) * 100)}</b> L/100 km</span><span><b>${fmt(km / litres)}</b> km/L</span><span><b>${fmt(miles / (litres / LITRES.uk))}</b> mpg (UK)</span><span><b>${fmt(miles / (litres / LITRES.us))}</b> mpg (US)</span>`;
  };
  fuel.addEventListener("input", update);
  update();
}

const service = document.getElementById("service-calc");
if (service) {
  const out = document.getElementById("service-result");
  const DAY = 86400000;
  const update = () => {
    const lastOdo = odo("last-odo");
    const nowOdo = odo("now-odo");
    const intDist = num("int-dist");
    const intMonths = num("int-months");
    const perMonth = num("per-month");
    const lastDate = document.getElementById("last-date").value;
    const lines = [];
    let dueByDist = null;
    let dueByTime = null;

    if (lastOdo !== null && intDist) {
      const dueAt = lastOdo + intDist;
      lines.push(`Due by distance at <b>${dueAt.toLocaleString("en-GB")}</b> on the odometer.`);
      if (nowOdo !== null) {
        const left = dueAt - nowOdo;
        lines.push(left >= 0 ? `That is <b>${left.toLocaleString("en-GB")}</b> to go.` : `That was <b>${(-left).toLocaleString("en-GB")}</b> ago.`);
        if (perMonth && left > 0) dueByDist = new Date(Date.now() + (left / perMonth) * 30.44 * DAY);
        if (left <= 0) dueByDist = new Date();
      }
    }
    if (lastDate && intMonths) {
      dueByTime = new Date(lastDate + "T00:00:00");
      dueByTime.setMonth(dueByTime.getMonth() + Math.round(intMonths));
      lines.push(`Due by time on <b>${dueByTime.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</b>.`);
    }
    if (!lines.length) {
      out.textContent = "Enter the last service and an interval by distance, time or both.";
      return;
    }

    // Due soon within 10% of the distance interval or 30 days, as a rule of thumb
    const now = Date.now();
    const overdue = (nowOdo !== null && lastOdo !== null && intDist && nowOdo >= lastOdo + intDist) || (dueByTime && dueByTime <= now);
    const soon =
      !overdue &&
      ((nowOdo !== null && lastOdo !== null && intDist && lastOdo + intDist - nowOdo <= intDist * 0.1) || (dueByTime && dueByTime - now <= 30 * DAY));
    if (dueByDist && dueByTime) {
      lines.push(dueByDist < dueByTime ? "At the rate you ride, the distance limit comes first." : "At the rate you ride, the time limit comes first.");
    }
    const status = overdue ? ["overdue", "Overdue"] : soon ? ["soon", "Due soon"] : ["ok", "Not due yet"];
    out.innerHTML = `<span class="status status-${status[0]}">${status[1]}</span>${lines.map((l) => `<span>${l}</span>`).join("")}`;
  };
  service.addEventListener("input", update);
  update();
}

document.querySelector("[data-print]")?.addEventListener("click", () => window.print());
