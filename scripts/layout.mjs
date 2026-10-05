// Shared page shell (head, nav, footer) for the generated pages.
export const SITE = "https://www.moto-log.app";
export const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const head = ({ title, description, path, image, type = "website", extra = "" }) => `<!doctype html>
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

export const nav = (current = "") => `
    <header class="nav scrolled" id="top">
      <div class="container nav-inner">
        <a href="/" class="brand" aria-label="MotoLog home">
          <img src="/motolog-icon.png" alt="" width="32" height="32" />
          <span>MotoLog</span>
        </a>
        <nav class="nav-links" id="nav-links">
          <a href="/features.html"${current === "features" ? ' aria-current="page"' : ""}>Features</a>
          <a href="/how-it-works.html"${current === "how" ? ' aria-current="page"' : ""}>How it works</a>
          <a href="/blog/"${current === "blog" ? ' aria-current="page"' : ""}>Blog</a>
          <a href="/faq.html"${current === "faq" ? ' aria-current="page"' : ""}>FAQ</a>
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

export const footer = `
    <footer class="footer">
      <div class="container">
        <div class="footer-top">
          <nav>
            <a href="/features.html">Features</a>
            <a href="/how-it-works.html">How it works</a>
            <a href="/blog/">Blog</a>
            <a href="/faq.html">FAQ</a>
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

