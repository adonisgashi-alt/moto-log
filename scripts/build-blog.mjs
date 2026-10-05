// Generates the blog pages (blog/index.html and one page per article) from content/posts.json.
// Runs automatically before `npm run dev` and `npm run build`.
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";

const SITE = "https://www.moto-log.app";
const posts = JSON.parse(readFileSync("content/posts.json", "utf8")).sort((a, b) => b.date.localeCompare(a.date));

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const fmtDate = (d) =>
  new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const img = (p) => `/images/blog/${p.slug}.jpg`;
const url = (p) => `/blog/${p.slug}.html`;

const head = ({ title, description, path, image, type = "website", extra = "" }) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <link rel="canonical" href="${SITE}${path}" />
    <meta name="theme-color" content="#ffffff" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:type" content="${type}" />
    <meta property="og:url" content="${SITE}${path}" />
    <meta property="og:image" content="${SITE}${image}" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="preload" href="/fonts/dm-sans-latin-opsz-normal.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="stylesheet" href="/src/styles.css" />${extra}
  </head>
  <body>`;

const nav = `
    <header class="nav scrolled" id="top">
      <div class="container nav-inner">
        <a href="/" class="brand" aria-label="MotoLog home">
          <img src="/motolog-icon.png" alt="" width="32" height="32" />
          <span>MotoLog</span>
        </a>
        <nav class="nav-links" id="nav-links">
          <a href="/#features">Features</a>
          <a href="/#how">How it works</a>
          <a href="/blog/" aria-current="page">Blog</a>
          <a href="/#faq">FAQ</a>
          <a href="/#download" class="btn btn-dark mobile-only">Get the app</a>
          <a href="/login.html" class="btn btn-ghost mobile-only">Log in</a>
        </nav>
        <div class="nav-actions desktop-only">
          <a href="/#download" class="btn btn-dark">Get the app</a>
          <a href="/login.html" class="btn btn-ghost">Log in</a>
        </div>
        <button class="nav-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="nav-links">
          <span></span><span></span>
        </button>
      </div>
    </header>`;

const footer = `
    <footer class="footer">
      <div class="container">
        <div class="footer-top">
          <nav>
            <a href="/#features">Features</a>
            <a href="/#how">How it works</a>
            <a href="/blog/">Blog</a>
            <a href="/#faq">FAQ</a>
            <a href="/#download">Download</a>
          </nav>
          <p>© <span id="year">2026</span> MotoLog</p>
        </div>
        <p class="wordmark" aria-hidden="true">MotoLog</p>
      </div>
    </footer>

    <script type="module" src="/src/main.js"></script>
  </body>
</html>
`;

const card = (p) => `
          <a class="post-card" href="${url(p)}" data-category="${esc(p.category)}">
            <figure class="post-media"><img src="${img(p)}" alt="${esc(p.alt)}" loading="lazy" width="1400" height="933" /></figure>
            <span class="post-tag">${esc(p.category)}</span>
            <h3>${esc(p.title)}</h3>
            <p>${esc(p.excerpt)}</p>
          </a>`;

// Blog index
const [featured, ...rest] = posts;
const categories = ["All", ...new Set(posts.map((p) => p.category))];
const indexHtml =
  head({
    title: "MotoLog blog: motorcycle maintenance, mileage and trip tips",
    description:
      "Practical guides for riders: service intervals, chain care, mileage tracking, pre-ride checks and trip planning, from the MotoLog team.",
    path: "/blog/",
    image: img(featured),
  }) +
  nav +
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
    nav +
    `

    <main class="article">
      <div class="container article-inner">
        <a class="back" href="/blog/">← All articles</a>
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
const urls = ["/", "/blog/", ...posts.map(url)];
writeFileSync(
  "public/sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${SITE}${u}</loc></url>`).join("\n")}\n</urlset>\n`,
);
writeFileSync("public/robots.txt", `User-agent: *\nAllow: /\nDisallow: /login.html\n\nSitemap: ${SITE}/sitemap.xml\n`);
console.log(`blog: ${posts.length} articles`);
