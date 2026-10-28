// Shared page shell (head, nav, footer) for the generated pages.
export const SITE = "https://www.moto-log.app";
export const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Google cuts titles at about 60 characters, so long titles go without the brand suffix
export const pageTitle = (t) => (t.length + " | MotoLog".length <= 60 ? `${t} | MotoLog` : t);

// Google cuts descriptions at about 155 characters: keep whole sentences that fit, or cut at a word
export const metaDescription = (text, max = 155) => {
  if (text.length <= max) return text;
  let out = "";
  for (const s of text.match(/[^.!?]+[.!?]+/g) ?? []) {
    if ((out + s).trim().length > max) break;
    out += s;
  }
  if (out.trim().length >= 70) return out.trim();
  return text.slice(0, text.lastIndexOf(" ", max - 1)).replace(/[,;:]$/, "") + "…";
};

// Blog topics: each category gets its own page at /blog/<slug>
export const TOPICS = {
  Maintenance: { slug: "maintenance", title: "Motorcycle maintenance guides", intro: "Oil, chains, tyres, brakes, batteries and storage: practical guides to the jobs that keep a motorcycle running well, and how often to do them." },
  Mileage: { slug: "mileage", title: "Motorcycle mileage and fuel guides", intro: "How to track your odometer, work out fuel consumption and read what a bike's mileage really tells you when you buy, sell or service it." },
  Safety: { slug: "safety", title: "Motorcycle safety checks", intro: "Pre-ride checks, brakes and the small habits that catch problems before they turn into a breakdown or a crash." },
  Trips: { slug: "trips", title: "Motorcycle trip planning guides", intro: "Planning routes, packing the bike, riding in a group and handling a breakdown far from home, so the trip is about the road." },
  "Buying & Selling": { slug: "buying-selling", title: "Buying and selling a motorcycle", intro: "What to check before you pay for a used bike, how to price and sell your own, and why a clear service history is worth real money." },
  Gear: { slug: "gear", title: "Motorcycle gear and tools guides", intro: "How to choose a helmet, jacket, gloves and boots that fit and protect you, plus the basic toolkit every rider should own." },
  "Riding Skills": { slug: "riding-skills", title: "Motorcycle riding skills", intro: "Practical drills and techniques to ride more smoothly and safely, from slow-speed control to wet roads." },
  Guides: { slug: "guides", title: "Motorcycle guides", intro: "Plain-English explainers for riders: service intervals, warning lights, tyre markings, fluids and more." },
};
export const topic = (category) => TOPICS[category] ?? { slug: category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), title: category, intro: "" };

// Free tools and app pages built by scripts/build-pages.mjs, listed here so the sitemap and llms.txt include them
export const EXTRA_PAGES = [
  { path: "/motorcycle-maintenance-app", name: "Motorcycle maintenance app", about: "how MotoLog tracks due services for every bike" },
  { path: "/motorcycle-mileage-log", name: "Motorcycle mileage log", about: "logging odometer readings, distance per month and trips" },
  { path: "/tools", name: "Free tools", about: "free calculators and a printable log for riders" },
  { path: "/fuel-consumption-calculator", name: "Fuel consumption calculator", about: "work out mpg, L/100 km and km/L from a fill-up" },
  { path: "/service-due-calculator", name: "Service due calculator", about: "find when the next service is due by distance or time" },
  { path: "/printable-motorcycle-maintenance-log", name: "Printable maintenance log", about: "a free service record sheet to print" },
];

const img = (p) => `/images/blog/${p.slug}.jpg`;
const url = (p) => `/blog/${p.slug}`;

const crumbs = (path, title) => {
  if (path === "/") return "";
  const parts = path.split("/").filter(Boolean);
  const names = { features: "Features", "how-it-works": "How it works", blog: "Blog", faq: "FAQ", privacy: "Privacy policy", tools: "Free tools" };
  const items = [{ name: "Home", url: SITE + "/" }];
  parts.forEach((seg, i) => {
    const last = i === parts.length - 1;
    items.push({ name: last && (i > 0 || !names[seg]) ? title.replace(/ \| MotoLog$/, "") : (names[seg] ?? seg), url: SITE + "/" + parts.slice(0, i + 1).join("/") });
  });
  const ld = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: it.url })),
  };
  return `\n    <script type="application/ld+json">${JSON.stringify(ld)}</script>`;
};

// Sets the signed-in class before first paint so the nav doesn't flash the signed-out buttons
export const authHint = `<script>try{if(localStorage.getItem("motolog-user"))document.documentElement.classList.add("signed-in")}catch(e){}</script>`;

export const authLinks = (home = "/") => `
          <a href="${home}#download" class="btn btn-dark mobile-only auth-out">Get the app</a>
          <a href="/login" class="btn btn-ghost mobile-only auth-out">Log in</a>
          <a href="/dashboard" class="btn btn-dark mobile-only auth-in">Your garage</a>
          <button type="button" class="btn btn-ghost mobile-only auth-in" data-sign-out>Sign out</button>`;

export const authActions = (home = "/") => `
          <a href="/login" class="btn btn-ghost auth-out">Log in</a>
          <a href="${home}#download" class="btn btn-dark auth-out">Get the app</a>
          <div class="nav-user auth-in">
            <button type="button" class="nav-avatar" data-user-menu data-user-initial aria-haspopup="menu" aria-expanded="false" aria-label="Account menu"></button>
            <div class="nav-dropdown" role="menu" hidden>
              <p class="nav-dropdown-label">Signed in as<strong data-user-email></strong></p>
              <a href="/dashboard" role="menuitem">Your garage</a>
              <button type="button" role="menuitem" data-sign-out>Sign out</button>
            </div>
          </div>`;

export const head = ({ title, description, path, image, type = "website", extra = "", robots = "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1", analytics = true }) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <link rel="canonical" href="${SITE}${path}" />
    <meta name="robots" content="${robots}" />
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
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="preload" href="/fonts/dm-sans-latin-opsz-normal.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="stylesheet" href="/src/styles.css" />${crumbs(path, title)}${extra}
    ${authHint}
    ${analytics ? `    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-RE1MMLZFS4"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-RE1MMLZFS4');
    </script>
    ` : ""}
  </head>
  <body>`;

export const nav = (current = "") => `
    <header class="nav scrolled" id="top">
      <div class="container nav-inner">
        <a href="/" class="brand" aria-label="MotoLog home">
          <img src="/logo.svg" alt="MotoLog" width="128" height="29" />
        </a>
        <nav class="nav-links" id="nav-links">
          <a href="/features"${current === "features" ? ' aria-current="page"' : ""}>Features</a>
          <a href="/how-it-works"${current === "how" ? ' aria-current="page"' : ""}>How it works</a>
          <a href="/blog"${current === "blog" ? ' aria-current="page"' : ""}>Blog</a>
          <a href="/faq"${current === "faq" ? ' aria-current="page"' : ""}>FAQ</a>
${authLinks()}
        </nav>
        <div class="nav-actions desktop-only">
${authActions()}
        </div>
        <button class="nav-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="nav-links">
          <span></span><span></span>
        </button>
      </div>
    </header>`;

export const footer = `
    <footer class="footer">
      <div class="container">
        <a href="/" class="footer-brand" aria-label="MotoLog home"><img src="/logo.svg" alt="MotoLog" width="150" height="34" loading="lazy" /></a>
        <div class="footer-top">
          <nav>
            <a href="/features">Features</a>
            <a href="/how-it-works">How it works</a>
            <a href="/blog">Blog</a>
            <a href="/faq">FAQ</a>
            <a href="/tools">Free tools</a>
            <a href="/motorcycle-maintenance-app">Maintenance app</a>
            <a href="/#download">Download</a>
            <a href="/privacy">Privacy</a>
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
