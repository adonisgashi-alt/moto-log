// Builds the Features, How it works and FAQ pages from the matching sections of index.html,
// so the homepage stays the single source of copy. Runs before `npm run dev` and `npm run build`.
import { readFileSync, writeFileSync } from "node:fs";
import { SITE, esc, head, nav, footer } from "./layout.mjs";

const home = readFileSync("index.html", "utf8");
const section = (cls) => {
  const m = home.match(new RegExp(`<section class="${cls}"[\\s\\S]*?</section>`));
  if (!m) throw new Error(`index.html has no <section class="${cls}">`);
  return m[0];
};
// The standalone page owns the h1: promote the section's heading and drop the repeated anchor id
const asPage = (html) => html.replace("<h2>", "<h1>").replace("</h2>", "</h1>").replace(/ id="(features|how|faq)"/, "");

const faqs = [...section("faq").matchAll(/<summary>([\s\S]*?)<\/summary>\s*<p>([\s\S]*?)<\/p>/g)].map((m) => ({
  q: m[1].trim(),
  a: m[2].trim(),
}));

const pages = [
  {
    file: "features.html",
    current: "features",
    title: "MotoLog features: service reminders, mileage log and trip planning",
    description:
      "See what MotoLog does: due-service reminders, a mileage log, trip planning and a full service history for every bike in your garage.",
    image: "/images/card-1.jpg",
    body: [asPage(section("features")), section("showcase")],
  },
  {
    file: "how-it-works.html",
    current: "how",
    title: "How MotoLog works: set up in a minute | MotoLog",
    description:
      "Add your bike, log your rides and stay ahead of every service. Here is how MotoLog keeps your motorcycle maintenance on track.",
    image: "/images/hero.jpg",
    body: [asPage(section("how")), section("band")],
  },
  {
    file: "faq.html",
    current: "faq",
    title: "MotoLog FAQ: questions riders ask",
    description: "Answers to common questions about MotoLog: supported bikes, service intervals, miles or kilometres and more.",
    image: "/images/hero.jpg",
    body: [asPage(section("faq"))],
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
    head({ title: p.title, description: p.description, path: "/" + p.file, image: p.image, extra: p.extra ?? "" }) +
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
