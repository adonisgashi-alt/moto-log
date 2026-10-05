// Generates the blog pages (blog/index.html and one page per article) from content/posts.json.
// Runs automatically before `npm run dev` and `npm run build`.
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";

import { SITE, esc, head, nav, footer, postCard } from "./layout.mjs";
const posts = JSON.parse(readFileSync("content/posts.json", "utf8")).sort((a, b) => b.date.localeCompare(a.date));

const fmtDate = (d) =>
  new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const img = (p) => `/images/blog/${p.slug}.jpg`;
const url = (p) => `/blog/${p.slug}`;

const card = postCard;

// Blog index
const [featured, ...rest] = posts;
const categories = ["All", ...new Set(posts.map((p) => p.category))];
const indexHtml =
  head({
    title: "MotoLog blog: motorcycle maintenance, mileage and trip tips",
    description:
      "Practical guides for riders: service intervals, chain care, mileage tracking, pre-ride checks and trip planning, from the MotoLog team.",
    path: "/blog",
    image: img(featured),
  }) +
  nav("blog") +
  `

    <main class="blog">
      <section class="blog-top">
        <div class="container">
          <h1>Blog &amp; articles</h1>
          <div class="filters" role="group" aria-label="Filter articles by topic">
            ${categories.map((c, i) => `<button type="button" class="filter${i === 0 ? " active" : ""}" data-filter="${esc(c)}" aria-pressed="${i === 0}">${esc(c)}</button>`).join("\n            ")}
          </div>
          <a class="featured" href="${url(featured)}">
            <figure class="featured-media"><img src="${img(featured)}" alt="${esc(featured.alt)}" width="1400" height="933" /></figure>
            <div class="featured-body">
              <span class="post-tag">${esc(featured.category)}</span>
              <h2>${esc(featured.title)}</h2>
              <p>${esc(featured.excerpt)}</p>
              <span class="btn btn-dark">Read more</span>
            </div>
          </a>
        </div>
      </section>

      <section class="blog-list">
        <div class="container">
          <p class="label">Blog and articles</p>
          <h2>Latest insights and trends</h2>
          <div class="post-grid" id="post-grid">${rest.map(card).join("")}
          </div>
          <p class="blog-empty" id="blog-empty" hidden>No articles in this topic yet.</p>
        </div>
      </section>
    </main>
` +
  footer.replace("</body>", `    <script type="module" src="/src/blog.js"></script>\n  </body>`);

rmSync("blog", { recursive: true, force: true });
mkdirSync("blog", { recursive: true });
writeFileSync("blog/index.html", indexHtml);

// Article pages
const block = (b) => {
  if (b.h) return `<h2>${esc(b.h)}</h2>`;
  if (b.p) return `<p>${esc(b.p)}</p>`;
  if (b.ul) return `<ul>${b.ul.map((li) => `<li>${esc(li)}</li>`).join("")}</ul>`;
  return "";
};

for (const p of posts) {
  const related = posts.filter((o) => o.slug !== p.slug).slice(0, 3);
  const ld = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: p.title,
    description: p.excerpt,
    image: SITE + img(p),
    datePublished: p.date,
    dateModified: p.date,
    author: { "@type": "Organization", name: "MotoLog" },
    publisher: { "@type": "Organization", name: "MotoLog", logo: { "@type": "ImageObject", url: SITE + "/motolog-icon.png" } },
    mainEntityOfPage: SITE + url(p),
  };
  const html =
    head({
      title: `${p.title} | MotoLog`,
      description: p.excerpt,
      path: url(p),
      image: img(p),
      type: "article",
      extra: `\n    <script type="application/ld+json">${JSON.stringify(ld)}</script>`,
    }) +
    nav("blog") +
    `

    <main class="article">
      <div class="container article-inner">
        <a class="back" href="/blog">← All articles</a>
        <p class="post-meta"><span class="post-tag">${esc(p.category)}</span> <span>${fmtDate(p.date)}</span> <span>${p.read} min read</span></p>
        <h1>${esc(p.title)}</h1>
        <p class="article-lede">${esc(p.excerpt)}</p>
        <figure class="article-hero"><img src="${img(p)}" alt="${esc(p.alt)}" width="1400" height="933" /></figure>
        <div class="prose">
          ${p.body.map(block).join("\n          ")}
        </div>
        <aside class="article-cta">
          <h2>Never miss a service</h2>
          <p>MotoLog tracks your due services, mileage and trips in one place.</p>
          <a href="/#download" class="btn btn-dark">Get the app</a>
        </aside>
      </div>
      <section class="blog-list related">
        <div class="container">
          <h2>Keep reading</h2>
          <div class="post-grid">${related.map(card).join("")}
          </div>
        </div>
      </section>
    </main>
` +
    footer;
  writeFileSync(`blog/${p.slug}.html`, html);
}

// Sitemap and robots
const urls = ["/", "/features", "/how-it-works", "/blog", "/faq", ...posts.map(url)];
writeFileSync(
  "public/sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${SITE}${u}</loc></url>`).join("\n")}\n</urlset>\n`,
);
writeFileSync("public/robots.txt", `User-agent: *\nAllow: /\nDisallow: /login\n\nSitemap: ${SITE}/sitemap.xml\n`);
console.log(`blog: ${posts.length} articles`);
