// Builds the app landing pages, the free tools and the 404 page.
// The pages are listed in EXTRA_PAGES (scripts/layout.mjs) so the sitemap and llms.txt include them.
// Runs before `npm run dev` and `npm run build`, after build-blog.mjs.
import { readFileSync, writeFileSync } from "node:fs";
import { SITE, esc, head, nav, footer, postCard, pageTitle, EXTRA_PAGES } from "./layout.mjs";

const home = readFileSync("index.html", "utf8");
const posts = JSON.parse(readFileSync("content/posts.json", "utf8"));
const cta = home.match(/<section class="cta"[\s\S]*?<\/section>/)[0];

// Body copy: [text](/path) becomes a site link, as in the blog posts
const inline = (t) => esc(t).replace(/\[([^\]]+)\]\((\/[^\s)]*)\)/g, '<a href="$2">$1</a>');
const prose = (blocks) =>
  blocks
    .map((b) => {
      if (b.h) return `<h2>${esc(b.h)}</h2>`;
      if (b.ul) return `<ul>${b.ul.map((li) => `<li>${inline(li)}</li>`).join("")}</ul>`;
      return `<p>${inline(b.p)}</p>`;
    })
    .join("\n          ");

const related = (slugs) => {
  const list = slugs.map((s) => posts.find((p) => p.slug === s)).filter(Boolean);
  if (!list.length) return "";
  return `<section class="blog-list related">
        <div class="container">
          <p class="label">From the blog</p>
          <h2>Keep reading</h2>
          <div class="post-grid">${list.map(postCard).join("")}
          </div>
        </div>
      </section>`;
};

const faqLd = (faqs) =>
  `\n    <script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  })}</script>`;
const faqHtml = (faqs) => `<h2>Questions</h2>
          ${faqs.map(([q, a]) => `<h3>${esc(q)}</h3>\n          <p>${esc(a)}</p>`).join("\n          ")}`;

const toolLd = (name, path, description) =>
  `\n    <script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name,
    url: SITE + path,
    description,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    publisher: { "@type": "Organization", name: "MotoLog", url: SITE + "/" },
  })}</script>`;

const page = ({ path, title, description, label, h1, lede, widget = "", body, faqs, extra = "", relatedSlugs = [], script = false }) => {
  const html =
    head({ title: pageTitle(title), description, path, image: "/images/og.jpg", extra: extra + (faqs ? faqLd(faqs) : "") }) +
    nav("") +
    `

    <main class="article">
      <div class="container article-inner">
        <p class="label">${esc(label)}</p>
        <h1>${esc(h1)}</h1>
        <p class="article-lede">${esc(lede)}</p>${widget ? `\n        ${widget}` : ""}
        <div class="prose">
          ${prose(body)}${faqs ? `\n          ${faqHtml(faqs)}` : ""}
        </div>
      </div>
      ${related(relatedSlugs)}

      ${cta}
    </main>
` +
    (script ? footer.replace("</body>", `    <script type="module" src="/src/tools.js"></script>\n  </body>`) : footer);
  writeFileSync(path.slice(1) + ".html", html);
};

// App landing pages: aimed at people searching for an app, not for a how-to
page({
  path: "/motorcycle-maintenance-app",
  title: "Motorcycle maintenance app that tracks every service",
  description:
    "MotoLog is a motorcycle maintenance app that tracks due services by distance or time, flags what is overdue and keeps a full service history for every bike.",
  label: "Motorcycle maintenance app",
  h1: "The motorcycle maintenance app that remembers for you",
  lede: "MotoLog tracks every service your bike needs, by distance or by time, and tells you what is due soon and what is overdue. No notebook, no spreadsheet, no guessing.",
  body: [
    { h: "Why riders use a maintenance app" },
    {
      p: "Every motorcycle has a list of jobs that come round on a schedule: engine oil and filter, chain care, brake fluid, coolant, valve clearances, spark plugs, air filter, tyres. Some are measured in miles or kilometres, some in months, and most in whichever comes first. Keeping that straight across a riding season is hard, and the jobs that slip are usually the ones that cost the most when they go wrong.",
    },
    {
      p: "A maintenance app does the remembering. You log your mileage, and it works out what is coming up. For the intervals themselves, see our [motorcycle service intervals cheat sheet](/blog/motorcycle-service-intervals-cheat-sheet) and [maintenance schedule](/blog/motorcycle-maintenance-schedule).",
    },
    { h: "What MotoLog does" },
    {
      ul: [
        "Service reminders by distance, time or both. Each job shows as due soon, then overdue, whichever limit comes first.",
        "Your own schedule. Start from common jobs and change every interval to match your owner's manual, or add your own.",
        "A service history. Every job is saved with its date, odometer reading, cost and notes.",
        "A mileage log. Add your odometer after a ride and see your distance per month and per year, in kilometres or miles.",
        "Trip planning. Map out a ride with a start, a destination, dates and notes, and the distance goes into your log when you ride it.",
        "Every bike in your garage, each with its own services, mileage and trips.",
      ],
    },
    { h: "How it works" },
    {
      p: "Add your bike and its current mileage. MotoLog suggests common jobs, and you set each interval to match your manual. After a ride, log the odometer reading; it takes a few seconds. When a job is getting close, it shows as due soon, so you have time to order parts or book the shop. When it is done, log the date, odometer and cost, and the interval starts again. Read more on [how MotoLog works](/how-it-works).",
    },
    { h: "A service history that adds value" },
    {
      p: "A clear record of what was done and when is one of the easiest ways to get more for a bike when you sell it, because buyers pay more for a motorcycle they can trust. Here is [how a service history helps your motorcycle sell for more](/blog/service-history-motorcycle-resale-value).",
    },
    { h: "Not ready for an app?" },
    {
      p: "Try our free [service due calculator](/service-due-calculator) to see when your next job is due, or print a [paper maintenance log](/printable-motorcycle-maintenance-log) to keep in the garage.",
    },
  ],
  faqs: [
    ["Does MotoLog work with any motorcycle?", "Yes. You set the intervals yourself, so MotoLog works with any make and model, from a scooter to a tourer."],
    ["Can I track services by time as well as distance?", "Yes. Each job can have a distance interval, a time interval or both, and MotoLog flags it at whichever comes first."],
    ["Does it support kilometres and miles?", "Yes. You can log distance in kilometres or miles."],
    ["Can I track more than one bike?", "Yes. Each bike in your garage has its own services, mileage and trips."],
  ],
  relatedSlugs: ["motorcycle-service-intervals-cheat-sheet", "how-often-change-motorcycle-oil", "service-history-motorcycle-resale-value"],
});

page({
  path: "/motorcycle-mileage-log",
  title: "Motorcycle mileage log: track your odometer and trips",
  description:
    "Keep a motorcycle mileage log without the paperwork. MotoLog records odometer readings, distance per month and year, and trips, in kilometres or miles.",
  label: "Motorcycle mileage log",
  h1: "A motorcycle mileage log that keeps itself",
  lede: "Log your odometer after a ride and MotoLog shows your distance per month and per year, ties it to your service reminders and adds your trips.",
  body: [
    { h: "Why keep a mileage log?" },
    {
      ul: [
        "Servicing. Most jobs are due by distance, so an up-to-date odometer reading is what tells you a service is coming.",
        "Running costs. Distance per month and per year shows how much you really ride, which helps you budget for tyres, chains and services.",
        "Fuel economy. Mileage between fill-ups is how you [work out your fuel consumption](/blog/how-to-work-out-motorcycle-fuel-consumption), and a sudden drop is an early sign of a problem.",
        "Resale. A steady, documented mileage history backs up the number on the odometer when you sell.",
      ],
    },
    {
      p: "More on this in [why you should track your motorcycle's mileage](/blog/why-track-motorcycle-mileage) and [what counts as high mileage for a motorcycle](/blog/what-counts-as-high-mileage-for-a-motorcycle).",
    },
    { h: "Paper, spreadsheet or app" },
    {
      p: "A notebook in the tank bag works until it gets wet or lost. A spreadsheet works if you remember to open it. An app on your phone is with you at the end of every ride, and it can do the sums: distance per month, distance since the last oil change, and what is due next. If you prefer paper, our [printable maintenance log](/printable-motorcycle-maintenance-log) has a column for the odometer reading at every job.",
    },
    { h: "How MotoLog logs mileage" },
    {
      ul: [
        "Add your odometer reading after a ride. It takes a few seconds.",
        "See your distance per month and per year, in kilometres or miles.",
        "Plan trips with a start, a destination, dates and notes. When you mark a trip as ridden, its distance goes into your log.",
        "Your mileage drives your service reminders, so jobs show as due soon and then overdue at the right time.",
      ],
    },
  ],
  faqs: [
    ["How often should I log my mileage?", "After every ride is best, but once a week or at every fill-up is enough to keep service reminders accurate."],
    ["Can I log mileage for more than one bike?", "Yes. Each bike in MotoLog has its own mileage log, services and trips."],
  ],
  relatedSlugs: ["why-track-motorcycle-mileage", "how-to-work-out-motorcycle-fuel-consumption", "what-counts-as-high-mileage-for-a-motorcycle"],
});

// Free tools
const tools = EXTRA_PAGES.filter((p) => ["/fuel-consumption-calculator", "/service-due-calculator", "/printable-motorcycle-maintenance-log"].includes(p.path));
page({
  path: "/tools",
  title: "Free motorcycle tools and calculators",
  description: "Free tools for riders: a motorcycle fuel consumption calculator, a service due calculator and a printable maintenance log.",
  label: "Free tools",
  h1: "Free tools for riders",
  lede: "Quick calculators and a printable log for the jobs every rider does. No sign-up needed.",
  widget: `<div class="tool-list">${tools
    .map((t) => `\n          <a class="tool-card" href="${t.path}"><h2>${esc(t.name)}</h2><p>${esc(t.about[0].toUpperCase() + t.about.slice(1))}.</p></a>`)
    .join("")}
        </div>`,
  body: [
    {
      p: "Want reminders without the sums? The [MotoLog app](/motorcycle-maintenance-app) tracks your services and mileage for you and flags what is due soon.",
    },
  ],
});

const field = (id, label, attrs = "") =>
  `<label for="${id}">${esc(label)}</label><input id="${id}" name="${id}" type="number" inputmode="decimal" min="0" step="any" ${attrs} />`;

page({
  path: "/fuel-consumption-calculator",
  title: "Motorcycle fuel consumption calculator (mpg, L/100 km)",
  description:
    "Work out your motorcycle's real fuel consumption from one fill-up. Get mpg (UK and US), litres per 100 km and km per litre, free.",
  label: "Free tool",
  h1: "Motorcycle fuel consumption calculator",
  lede: "Fill the tank, ride, fill it again, and enter the distance and the fuel it took. You get mpg (UK and US), L/100 km and km/L.",
  widget: `<form class="tool" id="fuel-calc" novalidate>
          <fieldset class="tool-units">
            <legend>Units</legend>
            <label><input type="radio" name="units" value="metric" checked /> Kilometres and litres</label>
            <label><input type="radio" name="units" value="uk" /> Miles and UK gallons</label>
            <label><input type="radio" name="units" value="us" /> Miles and US gallons</label>
          </fieldset>
          <div class="tool-fields">
            <div>${field("distance", "Distance ridden")}</div>
            <div>${field("fuel", "Fuel to refill")}</div>
          </div>
          <output class="tool-result" id="fuel-result" for="distance fuel" aria-live="polite">Enter a distance and the fuel it took.</output>
        </form>`,
  body: [
    { h: "How to measure it" },
    {
      ul: [
        "Fill the tank to the brim, or to the same point every time, and reset the trip meter.",
        "Ride as normal. A full tank gives a more accurate result than a short ride.",
        "Fill up again at the same pump if you can, and note the fuel it took and the trip distance.",
        "Enter both numbers above. Repeat over a few tanks and take the average.",
      ],
    },
    { h: "The formulas" },
    {
      ul: [
        "L/100 km = litres ÷ kilometres × 100",
        "km/L = kilometres ÷ litres",
        "mpg = miles ÷ gallons (a UK gallon is 4.546 litres, a US gallon is 3.785 litres, so UK mpg reads about 20% higher)",
      ],
    },
    { h: "What is normal?" },
    {
      p: "It depends on the engine and how you ride. Small commuters often manage 2 to 3.5 L/100 km (80 to 140 UK mpg), mid-size bikes around 4 to 5.5 L/100 km (50 to 70 UK mpg), and big sports bikes and tourers 6 L/100 km or more. What matters most is your own baseline: if a bike that used to do 5 L/100 km now needs 6, something has changed. Our guide on [how to work out your motorcycle's fuel consumption](/blog/how-to-work-out-motorcycle-fuel-consumption) covers the common causes, from tyre pressure to a [clogged air filter](/blog/motorcycle-air-filter-when-to-clean-or-replace).",
    },
  ],
  extra: toolLd(
    "Motorcycle fuel consumption calculator",
    "/fuel-consumption-calculator",
    "Work out a motorcycle's fuel consumption in mpg, L/100 km and km/L from one fill-up.",
  ),
  relatedSlugs: ["how-to-work-out-motorcycle-fuel-consumption", "motorcycle-air-filter-when-to-clean-or-replace", "motorcycle-tyre-care-pressure-tread-and-age"],
  script: true,
});

page({
  path: "/service-due-calculator",
  title: "Motorcycle service due calculator",
  description:
    "Find out when your motorcycle's next service is due. Enter the last service and the interval by distance and time, and see which comes first.",
  label: "Free tool",
  h1: "When is my next service due?",
  lede: "Enter when the job was last done and its interval from your owner's manual. The calculator shows the mileage and date it is due, and which comes first.",
  widget: `<form class="tool" id="service-calc" novalidate>
          <div class="tool-fields">
            <div>${field("last-odo", "Odometer at last service")}</div>
            <div>${field("now-odo", "Odometer now")}</div>
            <div>${field("int-dist", "Interval (distance)", 'placeholder="e.g. 6000"')}</div>
            <div><label for="last-date">Date of last service</label><input id="last-date" name="last-date" type="date" /></div>
            <div>${field("int-months", "Interval (months)", 'placeholder="e.g. 12" step="1"')}</div>
            <div>${field("per-month", "Distance you ride a month (optional)")}</div>
          </div>
          <output class="tool-result" id="service-result" aria-live="polite">Enter the last service and an interval by distance, time or both.</output>
        </form>`,
  body: [
    { h: "Distance or time, whichever comes first" },
    {
      p: "Most service intervals are written as \"every 6,000 miles or 12 months, whichever comes first\". If you ride a lot, the distance limit arrives first. If the bike sits in the garage, time catches up: oil ages, brake fluid absorbs water and rubber hardens even when the bike is not moving. That is why both limits matter, and why a low-mileage bike still needs servicing.",
    },
    { h: "Typical intervals" },
    {
      ul: [
        "Engine oil and filter: every 3,000 to 7,500 miles (5,000 to 12,000 km) or 12 months. See [how often to change your motorcycle's oil](/blog/how-often-change-motorcycle-oil).",
        "Chain clean and lube: every 300 to 600 miles (500 to 1,000 km), and after riding in the rain. See [chain maintenance](/blog/motorcycle-chain-maintenance).",
        "Brake fluid: every 2 years. See [when to replace brake pads and fluid](/blog/motorcycle-brake-pads-and-fluid-when-to-replace).",
        "Coolant: every 2 to 3 years.",
        "Air filter: check every 6,000 miles (10,000 km), sooner on dusty roads.",
      ],
    },
    {
      p: "These are rough guides; your owner's manual always has the last word. For the full list, see our [service intervals cheat sheet](/blog/motorcycle-service-intervals-cheat-sheet). The [MotoLog app](/motorcycle-maintenance-app) does this sum for every job on every bike, and flags each one as due soon or overdue.",
    },
  ],
  extra: toolLd(
    "Motorcycle service due calculator",
    "/service-due-calculator",
    "Work out when a motorcycle service is next due by distance and time, whichever comes first.",
  ),
  relatedSlugs: ["motorcycle-service-intervals-cheat-sheet", "motorcycle-maintenance-schedule", "how-often-change-motorcycle-oil"],
  script: true,
});

const rows = Array.from({ length: 18 }, () => `<tr>${"<td></td>".repeat(6)}</tr>`).join("");
page({
  path: "/printable-motorcycle-maintenance-log",
  title: "Printable motorcycle maintenance log (free)",
  description:
    "A free printable motorcycle maintenance log. Record the date, odometer, work done, parts, cost and who did it, and keep a service history for your bike.",
  label: "Free printable",
  h1: "Printable motorcycle maintenance log",
  lede: "A simple service record sheet for your bike. Print as many as you need and keep them with the bike's papers.",
  widget: `<p class="no-print"><button type="button" class="btn btn-dark" data-print>Print the log</button></p>
        <section class="print-log" aria-label="Maintenance log sheet">
          <div class="print-log-head">
            <img src="/logo.svg" alt="MotoLog" width="110" height="25" />
            <h2>Motorcycle maintenance log</h2>
          </div>
          <div class="print-log-bike">
            <span>Make and model</span><span>Year</span><span>Registration</span><span>VIN</span>
          </div>
          <table>
            <thead><tr><th>Date</th><th>Odometer</th><th>Work done</th><th>Parts and fluids</th><th>Cost</th><th>Done by</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <p class="print-log-foot">Free from moto-log.app</p>
        </section>`,
  body: [
    { h: "What to record" },
    {
      ul: [
        "Date and odometer reading, so you can work out when the next service is due by distance and time.",
        "Work done, as specifically as you can: \"oil and filter, 10W-40 semi-synthetic\" is more useful than \"service\".",
        "Parts and fluids, including brand and part number, so you can buy the same again.",
        "Cost, which adds up to the real cost of running the bike.",
        "Done by: you, or the name of the shop. Keep the receipts with the log.",
      ],
    },
    { h: "Why it is worth keeping" },
    {
      p: "A complete record makes it easy to see what is due next, helps a mechanic diagnose problems and is one of the best ways to [get more when you sell the bike](/blog/service-history-motorcycle-resale-value). For what to do and when, see our [simple motorcycle maintenance schedule](/blog/motorcycle-maintenance-schedule), or use the [service due calculator](/service-due-calculator).",
    },
    {
      p: "Paper is easy to lose and cannot remind you. The [MotoLog app](/motorcycle-maintenance-app) keeps the same history on your phone and tells you when each job is due soon.",
    },
  ],
  extra: toolLd(
    "Printable motorcycle maintenance log",
    "/printable-motorcycle-maintenance-log",
    "A free printable service record sheet for a motorcycle.",
  ),
  relatedSlugs: ["motorcycle-maintenance-schedule", "service-history-motorcycle-resale-value", "basic-motorcycle-toolkit-every-rider-should-own"],
  script: true,
});

// 404: Vercel serves dist/404.html for unknown paths. Not indexed and no canonical.
writeFileSync(
  "404.html",
  head({ title: "Page not found | MotoLog", description: "This page could not be found.", path: "/404", image: "/images/og.jpg", robots: "noindex, follow" })
    .replace(/\n\s*<link rel="canonical"[^>]*>/, "")
    .replace(/\n\s*<script type="application\/ld\+json">[^<]*<\/script>/, "") +
    nav("") +
    `

    <main class="article">
      <div class="container article-inner">
        <p class="label">404</p>
        <h1>That page took a wrong turn</h1>
        <p class="article-lede">The page you were looking for has moved or does not exist. These are good places to pick the road back up.</p>
        <div class="prose">
          <ul>
            <li><a href="/blog">Read the blog</a>: maintenance, mileage and trip guides</li>
            <li><a href="/tools">Free tools</a>: fuel and service calculators</li>
            <li><a href="/features">See what MotoLog does</a></li>
            <li><a href="/">Go to the homepage</a></li>
          </ul>
        </div>
      </div>
    </main>
` +
    footer,
);
console.log(`extra pages: ${EXTRA_PAGES.length} + 404`);
