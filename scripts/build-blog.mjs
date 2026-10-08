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
const featured = posts[0];
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
        </div>
      </section>

      <div class="filters-bar">
        <div class="container">
          <div class="filters" role="group" aria-label="Filter articles by topic">
            ${categories.map((c, i) => `<button type="button" class="filter${i === 0 ? " active" : ""}" data-filter="${esc(c)}" aria-pressed="${i === 0}">${esc(c)}</button>`).join("\n            ")}
          </div>
        </div>
      </div>

      <section class="blog-feature" id="blog-feature">
        <div class="container">
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
          <h2 id="blog-heading">Latest insights and trends</h2>
          <div class="post-grid" id="post-grid">${posts
            .map((p, i) => {
              const html = card(p);
              // The featured post lives in the hero on "All"; later posts wait behind "Load more" (still in the HTML for crawlers)
              if (i === 0) return html.replace('<a class="post-card"', '<a class="post-card" data-featured hidden');
              return i > 8 ? html.replace('<a class="post-card"', '<a class="post-card" hidden') : html;
            })
            .join("")}
          </div>
          <p class="blog-empty" id="blog-empty" hidden>No articles in this topic yet.</p>
          <div class="load-more"><button type="button" class="btn btn-ghost" id="load-more" hidden>Load more articles</button></div>
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
    inLanguage: "en",
    articleSection: p.category,
    wordCount: p.body.map((b) => b.p ?? b.h ?? (b.ul ? b.ul.join(" ") : "")).join(" ").split(/\s+/).length,
    author: { "@type": "Organization", name: "MotoLog", url: SITE + "/" },
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

// Sitemap, robots, RSS and llms.txt
const pageDates = Object.fromEntries(posts.map((p) => [url(p), p.date]));
const latest = posts[0].date;
const urls = ["/", "/features", "/how-it-works", "/blog", "/faq", ...posts.map(url)];
writeFileSync(
  "public/sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${SITE}${u}</loc><lastmod>${pageDates[u] ?? latest}</lastmod></url>`).join("\n")}\n</urlset>\n`,
);

// Search and AI crawlers are welcome on the public pages; /login stays out
const bots = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-User", "Claude-SearchBot", "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot", "Applebot-Extended", "Bingbot", "DuckDuckBot", "CCBot", "Amazonbot", "Meta-ExternalAgent"];
writeFileSync(
  "public/robots.txt",
  `User-agent: *\nAllow: /\nDisallow: /login\nDisallow: /dashboard\n\n${bots.map((b) => `User-agent: ${b}\nAllow: /\nDisallow: /login\nDisallow: /dashboard\n`).join("\n")}\nSitemap: ${SITE}/sitemap.xml\n`,
);

const rfc = (d) => new Date(d + "T09:00:00Z").toUTCString();
writeFileSync(
  "public/rss.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n<channel>\n  <title>MotoLog blog</title>\n  <link>${SITE}/blog</link>\n  <description>Practical guides for riders: service intervals, mileage tracking and trip planning.</description>\n  <language>en</language>\n  <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml" />\n${posts
    .map((p) => `  <item>\n    <title>${esc(p.title)}</title>\n    <link>${SITE}${url(p)}</link>\n    <guid>${SITE}${url(p)}</guid>\n    <pubDate>${rfc(p.date)}</pubDate>\n    <description>${esc(p.excerpt)}</description>\n  </item>`)
    .join("\n")}\n</channel>\n</rss>\n`,
);

writeFileSync(
  "public/llms.txt",
  `# MotoLog

> MotoLog is a mobile app that helps motorcycle riders keep track of due services, log mileage and record trips, so nothing gets missed and the service history stays in one place.

## Pages

- [Home](${SITE}/): what MotoLog does and how to get the app
- [Features](${SITE}/features): service reminders, mileage logging and trip tracking
- [How it works](${SITE}/how-it-works): from adding a bike to staying on top of maintenance
- [FAQ](${SITE}/faq): common questions about the app
- [Blog](${SITE}/blog): guides for riders on maintenance, mileage and trips

## Blog articles

${posts.map((p) => `- [${p.title}](${SITE}${url(p)}): ${p.excerpt}`).join("\n")}

## Optional

- [Sitemap](${SITE}/sitemap.xml)
- [RSS feed](${SITE}/rss.xml)
`,
);
console.log(`blog: ${posts.length} articles`);
