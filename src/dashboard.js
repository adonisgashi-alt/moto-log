import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { auth } from "./firebase.js";
import { db } from "./db.js";
import { status, worst, milesRemaining, daysRemaining } from "./status.js";

const stateEl = document.getElementById("dash-state");
const garage = document.getElementById("garage");

const nf = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const fmtDate = (ts) =>
  ts?.toDate ? ts.toDate().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";
const num = (v) => (Number.isFinite(v) ? v : null);

const TYPE_LABELS = {
  oilChange: "Oil change",
  chain: "Chain",
  belt: "Belt",
  shaft: "Shaft drive",
  brakes: "Brakes",
  tires: "Tires",
};
const STATUS_LABELS = { ok: "On track", dueSoon: "Due soon", overdue: "Overdue" };
const itemName = (it) => (it.type === "custom" ? it.customName || "Custom service" : (TYPE_LABELS[it.type] ?? it.type ?? "Service"));

// Small DOM helper. Everything is set with textContent, never innerHTML, so data can't inject markup.
function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else el.setAttribute(k, v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid);
  return el;
}

const badge = (st) => h("span", { class: `badge badge-${st}` }, STATUS_LABELS[st]);

function dueText(it, mileage) {
  const parts = [];
  const miles = milesRemaining(it, mileage);
  if (num(miles) !== null) parts.push(miles > 0 ? `${nf.format(miles)} mi left` : `${nf.format(-miles)} mi over`);
  const days = daysRemaining(it);
  if (num(days) !== null) parts.push(days > 0 ? `${nf.format(days)} days left` : `${nf.format(-days)} days over`);
  return parts.join(" · ");
}

function itemRow(it, mileage) {
  const st = status(it, mileage);
  const last = [];
  if (num(it.lastServiceMileage) !== null) last.push(`${nf.format(it.lastServiceMileage)} mi`);
  const d = fmtDate(it.lastServiceDate);
  if (d) last.push(d);
  return h(
    "li",
    { class: "svc-row" },
    h("div", {}, h("p", { class: "svc-name" }, itemName(it)), h("p", { class: "svc-meta" }, dueText(it, mileage)), last.length ? h("p", { class: "svc-meta" }, `Last done: ${last.join(", ")}`) : null),
    badge(st),
  );
}

function tripRow(t) {
  const bits = [];
  if (num(t.distanceMiles) !== null) bits.push(`${nf.format(t.distanceMiles)} mi`);
  if (num(t.durationMinutes) !== null) {
    const m = Math.round(t.durationMinutes);
    bits.push(m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`);
  }
  return h(
    "li",
    { class: "trip-row" },
    h("div", {}, h("p", { class: "svc-name" }, fmtDate(t.date) || "Trip"), t.notes ? h("p", { class: "svc-meta" }, t.notes) : null),
    h("span", { class: "trip-dist" }, bits.join(" · ")),
  );
}

function bikeCard(bike, items, trips) {
  const mileage = num(bike.currentMileage) ?? 0;
  const statuses = items.map((it) => status(it, mileage));
  const overall = worst(statuses);
  const name = bike.nickname || [bike.make, bike.model].filter(Boolean).join(" ") || "Motorcycle";
  const sub = [bike.year, bike.make, bike.model].filter(Boolean).join(" ");
  const totalMiles = trips.reduce((s, t) => s + (num(t.distanceMiles) ?? 0), 0);
  const photoOk = typeof bike.photoURL === "string" && bike.photoURL.startsWith("https://");

  const sortedItems = [...items].sort((a, b) => ["overdue", "dueSoon", "ok"].indexOf(status(a, mileage)) - ["overdue", "dueSoon", "ok"].indexOf(status(b, mileage)));
  const recent = [...trips].sort((a, b) => (b.date?.toMillis?.() ?? 0) - (a.date?.toMillis?.() ?? 0)).slice(0, 5);

  return h(
    "article",
    { class: "bike" },
    photoOk
      ? h(
          "figure",
          { class: "bike-photo" },
          h("img", { src: bike.photoURL, alt: `${name}`, loading: "lazy", referrerpolicy: "no-referrer" }),
          bike.photoAttribution ? h("figcaption", {}, bike.photoAttribution) : null,
        )
      : null,
    h(
      "div",
      { class: "bike-body" },
      h("div", { class: "bike-head" }, h("div", {}, h("h2", {}, name), sub && sub !== name ? h("p", { class: "svc-meta" }, sub) : null), items.length ? badge(overall) : null),
      h(
        "dl",
        { class: "bike-stats" },
        h("div", {}, h("dt", {}, "Odometer"), h("dd", {}, `${nf.format(mileage)} mi`)),
        h("div", {}, h("dt", {}, "Trips"), h("dd", {}, String(trips.length))),
        h("div", {}, h("dt", {}, "Distance"), h("dd", {}, `${nf.format(totalMiles)} mi`)),
      ),
      h("h3", {}, "Services"),
      items.length ? h("ul", { class: "svc-list" }, sortedItems.map((it) => itemRow(it, mileage))) : h("p", { class: "svc-meta" }, "No services added for this bike yet."),
      h("h3", {}, "Recent trips"),
      recent.length ? h("ul", { class: "svc-list" }, recent.map(tripRow)) : h("p", { class: "svc-meta" }, "No trips logged yet."),
    ),
  );
}

async function load(user) {
  const read = async (name) => {
    const snap = await getDocs(collection(db, "users", user.uid, name));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  };
  const [bikes, items, trips] = await Promise.all([read("motorcycles"), read("maintenanceItems"), read("trips")]);

  garage.replaceChildren();
  if (!bikes.length) {
    stateEl.textContent = "No bikes yet. Add your first motorcycle in the MotoLog app and it will show up here.";
    return;
  }
  stateEl.hidden = true;
  bikes.sort((a, b) => (a.dateAdded?.toMillis?.() ?? 0) - (b.dateAdded?.toMillis?.() ?? 0));
  for (const bike of bikes) {
    garage.append(
      bikeCard(
        bike,
        items.filter((i) => i.motorcycleId === bike.id),
        trips.filter((t) => t.motorcycleId === bike.id),
      ),
    );
  }
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.replace("/login");
    return;
  }
  try {
    await load(user);
  } catch (err) {
    console.error(err);
    stateEl.hidden = false;
    stateEl.classList.add("is-error");
    stateEl.textContent =
      err?.code === "permission-denied"
        ? "You don't have access to this data. Try signing out and back in."
        : "Couldn't load your garage. Check your connection and refresh.";
  }
});
