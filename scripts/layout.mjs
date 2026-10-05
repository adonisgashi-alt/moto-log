// Shared page shell (head, nav, footer) for the generated pages.
export const SITE = "https://www.moto-log.app";
export const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const img = (p) => `/images/blog/${p.slug}.jpg`;
const url = (p) => `/blog/${p.slug}`;

const crumbs = (path, title) => {
  if (path === "/") return "";
  const parts = path.split("/").filter(Boolean);
  const names = { features: "Features", "how-it-works": "How it works", blog: "Blog", faq: "FAQ" };
  const items = [{ name: "Home", url: SITE + "/" }];
  parts.forEach((seg, i) => {
    const last = i === parts.length - 1;
    items.push({ name: last && i > 0 ? title.replace(/ \| MotoLog$/, "") : (names[seg] ?? seg), url: SITE + "/" + parts.slice(0, i + 1).join("/") });
  });
  const ld = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: it.url })),
  };
  return `\n    <script type="application/ld+json">${JSON.stringify(ld)}</script>`;
};

export const head = ({ title, description, path, image, type = "website", extra = "" }) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <link rel="canonical" href="${SITE}${path}" />
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
    <meta name="theme-color" content="#ffffff" />
    <meta property="og:site_name" content="MotoLog" />
    <meta property="og:locale" content="en_US" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:type" content="${type}" />
    <meta property="og:url" content="${SITE}${path}" />
    <meta property="og:image" content="${SITE}${image}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(description)}" />
    <meta name="twitter:image" content="${SITE}${image}" />
    <link rel="alternate" type="application/rss+xml" title="MotoLog blog" href="/rss.xml" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="preload" href="/fonts/dm-sans-latin-opsz-normal.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="stylesheet" href="/src/styles.css" />${crumbs(path, title)}${extra}
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-RE1MMLZFS4"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-RE1MMLZFS4');
    </script>
  </head>
  <body>`;

export const nav = (current = "") => `
    <header class="nav scrolled" id="top">
      <div class="container nav-inner">
        <a href="/" class="brand" aria-label="MotoLog home">
          <img src="/motolog-icon.png" alt="" width="32" height="32" />
          <span>MotoLog</span>
        </a>
        <nav class="nav-links" id="nav-links">
          <a href="/features"${current === "features" ? ' aria-current="page"' : ""}>Features</a>
          <a href="/how-it-works"${current === "how" ? ' aria-current="page"' : ""}>How it works</a>
          <a href="/blog"${current === "blog" ? ' aria-current="page"' : ""}>Blog</a>
          <a href="/faq"${current === "faq" ? ' aria-current="page"' : ""}>FAQ</a>
          <a href="/#download" class="btn btn-dark mobile-only">Get the app</a>
          <a href="/login" class="btn btn-ghost mobile-only">Log in</a>
        </nav>
        <div class="nav-actions desktop-only">
          <a href="/#download" class="btn btn-dark">Get the app</a>
          <a href="/login" class="btn btn-ghost">Log in</a>
        </div>
        <button class="nav-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="nav-links">
          <span></span><span></span>
        </button>
      </div>
    </header>`;

export const footer = `
    <footer class="footer">
      <div class="container">
        <div class="footer-top">
          <nav>
            <a href="/features">Features</a>
            <a href="/how-it-works">How it works</a>
            <a href="/blog">Blog</a>
            <a href="/faq">FAQ</a>
            <a href="/#download">Download</a>
          </nav>
          <p>© <span id="year">2026</span> MotoLog</p>
        </div>
      </div>
    </footer>

    <script type="module" src="/src/main.js"></script>
  </body>
</html>
`;


export const postCard = (p) => `
          <a class="post-card" href="${url(p)}" data-category="${esc(p.category)}">
            <figure class="post-media"><img src="${img(p)}" alt="${esc(p.alt)}" loading="lazy" width="1400" height="933" /></figure>
            <span class="post-tag">${esc(p.category)}</span>
            <h3>${esc(p.title)}</h3>
            <p>${esc(p.excerpt)}</p>
          </a>`;
