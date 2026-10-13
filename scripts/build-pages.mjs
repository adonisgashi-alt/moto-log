// Builds the Features, How it works and FAQ pages. The main sections come from index.html, so the
// homepage stays the single source of that copy; the extra sections below are written for these pages.
// Runs before `npm run dev` and `npm run build`.
import { readFileSync, writeFileSync } from "node:fs";
import { esc, head, nav, footer, postCard } from "./layout.mjs";

const home = readFileSync("index.html", "utf8");
const posts = JSON.parse(readFileSync("content/posts.json", "utf8"));
const section = (cls) => {
  const m = home.match(new RegExp(`<section class="${cls}"[\\s\\S]*?</section>`));
  if (!m) throw new Error(`index.html has no <section class="${cls}">`);
  return m[0];
};
// The standalone page owns the h1: promote the section's heading and drop the repeated anchor id
const asPage = (html) => html.replace("<h2>", "<h1>").replace("</h2>", "</h1>").replace(/ id="(features|how|faq)"/, "");

const info = (label, title, items) => `<section class="info">
        <div class="container">
          <div class="section-head">
            <p class="label">${esc(label)}</p>
            <h2>${esc(title)}</h2>
          </div>
          <div class="info-grid">
            ${items
              .map(
                ([h, p], i) => `<article class="info-card">
              <span class="num">${String(i + 1).padStart(2, "0")}</span>
              <h3>${esc(h)}</h3>
              <p>${esc(p)}</p>
            </article>`,
              )
              .join("\n            ")}
          </div>
        </div>
      </section>`;

const related = (slugs) => `<section class="blog-list related">
        <div class="container">
          <p class="label">From the blog</p>
          <h2>Keep reading</h2>
          <div class="post-grid">${slugs.map((s) => postCard(posts.find((p) => p.slug === s))).join("")}
          </div>
        </div>
      </section>`;

const baseFaqs = [...section("faq").matchAll(/<summary>([\s\S]*?)<\/summary>\s*<p>([\s\S]*?)<\/p>/g)].map((m) => ({
  q: m[1].trim(),
  a: m[2].trim(),
}));
const moreFaqs = [
  {
    q: "How do the reminders work?",
    a: "You set an interval for each job by distance, time or both. MotoLog tracks them together and flags a service as due soon and then overdue, whichever comes first.",
  },
  {
    q: "What is the difference between due soon and overdue?",
    a: "Due soon means a service is approaching its interval, so you have time to book it. Overdue means you have gone past it.",
  },
  {
    q: "What is saved when I log a service?",
    a: "The date, your odometer reading, the cost and any notes. Together they build a history for each bike.",
  },
  {
    q: "Can I plan trips in MotoLog?",
    a: "Yes. Map out a ride with a start, a destination, dates and notes. When you mark it as ridden, the distance goes into your mileage log.",
  },
  {
    q: "Where is my data stored?",
    a: "For now your data lives in the MotoLog app on your phone. Online accounts, so you can see your information on the website, are coming soon.",
  },
];
const faqs = [...baseFaqs, ...moreFaqs];
const withMoreFaqs = (html) => {
  const at = html.lastIndexOf("</details>") + "</details>".length;
  const extra = moreFaqs
    .map((f) => `\n            <details>\n              <summary>${esc(f.q)}</summary>\n              <p>${esc(f.a)}</p>\n            </details>`)
    .join("");
  return html.slice(0, at) + extra + html.slice(at);
};

const pages = [
  {
    file: "features.html",
    current: "features",
    title: "MotoLog features: service reminders, mileage log and trip planning",
    description:
      "See what MotoLog does: due-service reminders, a mileage log, trip planning and a full service history for every bike in your garage.",
    image: "/images/card-1.jpg",
    body: [
      asPage(section("features")),
      info("In the app", "Everything MotoLog keeps track of", [
        ["Service reminders", "Set an interval for any job by distance, time or both. MotoLog flags what is due soon and what is overdue."],
        ["Your own schedule", "Start from common jobs and edit every interval to match your owner's manual. Add your own jobs or remove the ones that do not apply."],
        ["Mileage log", "Log your odometer after a ride and see your distance per month and per year, in kilometres or miles."],
        ["Trip planning", "Map out a ride with a start, a destination, dates and notes. Mark it ridden and the distance goes straight into your log."],
        ["Service history", "Every job is saved with its date, odometer, cost and notes, so you always know what was done and when."],
        ["Every bike in your garage", "Each bike has its own services, mileage and trips, so nothing gets mixed up."],
      ]),
      section("showcase"),
      related(["why-track-motorcycle-mileage", "motorcycle-maintenance-schedule", "how-to-plan-a-motorcycle-trip"]),
    ],
  },
  {
    file: "how-it-works.html",
    current: "how",
    title: "How MotoLog works: set up in a minute | MotoLog",
    description:
      "Add your bike, log your rides and stay ahead of every service. Here is how MotoLog keeps your motorcycle maintenance on track.",
    image: "/images/hero.jpg",
    body: [
      asPage(section("how")),
      info("Step by step", "What happens along the way", [
        ["Start from a schedule", "MotoLog suggests common jobs for your bike. Keep them, change the intervals to match your manual, or add your own."],
        ["Log after each ride", "Add your odometer reading and any trips. It takes a few seconds, and your mileage stays accurate."],
        ["Watch the status", "Services show as due soon and then overdue, by distance or time, whichever comes first."],
        ["Record the job", "When a service is done, log its date, odometer, cost and notes. The interval starts again and the entry joins your history."],
      ]),
      section("band"),
      related(["how-often-change-motorcycle-oil", "five-minute-pre-ride-check", "service-history-motorcycle-resale-value"]),
    ],
  },
  {
    file: "faq.html",
    current: "faq",
    title: "MotoLog FAQ: questions riders ask",
    description: "Answers to common questions about MotoLog: supported bikes, service intervals, reminders, trips, miles or kilometres and more.",
    image: "/images/hero.jpg",
    body: [
      withMoreFaqs(asPage(section("faq"))),
      related(["motorcycle-chain-maintenance", "how-often-change-motorcycle-oil", "why-track-motorcycle-mileage"]),
    ],
    extra: `\n    <script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    })}</script>`,
  },
];

for (const p of pages) {
  const html =
    head({ title: p.title, description: p.description, path: "/" + p.file.replace(".html", ""), image: p.image, extra: p.extra ?? "" }) +
    nav(p.current) +
    `

    <main class="subpage">
      ${p.body.join("\n\n      ")}

      ${section("cta")}
    </main>
` +
    footer;
  writeFileSync(p.file, html);
}
console.log(`pages: ${pages.length}`);

// Account pages: same header and footer as the rest of the site, but private (noindex, no analytics on the garage)
const account = [
  {
    file: "login.html",
    path: "/login",
    title: "Log in to MotoLog",
    description: "Log in to see the services, mileage and trips you have logged in the MotoLog app.",
    analytics: true,
    script: "/src/login.js",
    main: `<main class="login">
      <div class="container login-inner">
        <p class="label">Rider account</p>
        <h1>Log in</h1>
        <p class="login-intro">See the services, mileage and trips you have logged in the MotoLog app.</p>

        <form class="login-form" id="login-form" novalidate>
          <label for="email">Email</label>
          <input id="email" name="email" type="email" autocomplete="email" required />
          <label for="password">Password</label>
          <input id="password" name="password" type="password" autocomplete="current-password" required />
          <button type="submit" class="btn btn-dark" id="login-submit">Log in</button>
          <p class="login-or" aria-hidden="true"><span>or</span></p>
          <button type="button" class="btn btn-ghost" id="google-btn">
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.8c-.5 2.7-2.1 5-4.4 6.5v5.4h7.1c4.2-3.8 6.6-9.5 6.6-15.9z"/><path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.3l-7.1-5.4c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9H4.5v5.6C8.1 41.1 15.5 46 24 46z"/><path fill="#FBBC05" d="M11.8 28.4c-.4-1.3-.7-2.7-.7-4.4s.3-3 .7-4.4v-5.6H4.5C3 17 2 20.4 2 24s1 7 2.5 10l7.3-5.6z"/><path fill="#EA4335" d="M24 10.6c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 4.1 29.9 2 24 2 15.5 2 8.1 6.9 4.5 14l7.3 5.6c1.7-5.2 6.500-9 12.2-9z"/></svg>
            Continue with Google
          </button>
          <p class="login-note" id="login-note" role="status" aria-live="polite">
            Accounts are created in the MotoLog app. Log in here with the same email or Google account.
          </p>
        </form>
      </div>
    </main>`,
  },
  {
    file: "dashboard.html",
    path: "/dashboard",
    title: "Your garage | MotoLog",
    description: "Your bikes, services and trips from the MotoLog app.",
    analytics: false,
    script: "/src/dashboard.js",
    main: `<main class="dashboard">
      <div class="container">
        <p class="label">Your garage</p>
        <h1>Your bikes</h1>
        <p class="dash-intro">The services, mileage and trips you have logged in the MotoLog app.</p>
        <p class="dash-state" id="dash-state" role="status" aria-live="polite">Loading your garage…</p>
        <div class="garage" id="garage"></div>
      </div>
    </main>`,
  },
];

for (const p of account) {
  const html =
    head({ title: p.title, description: p.description, path: p.path, image: "/images/hero.jpg", robots: "noindex, nofollow", analytics: p.analytics }) +
    nav("") +
    `

    ${p.main}
` +
    footer.replace("</body>", `    <script type="module" src="${p.script}"></script>\n  </body>`);
  writeFileSync(p.file, html);
}
console.log(`account pages: ${account.length}`);
