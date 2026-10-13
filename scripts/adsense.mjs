// Google AdSense. Paste your publisher ID (AdSense > Account > Account information) to switch ads on.
// While it is the placeholder, nothing is added to the pages and no ads.txt is published.
export const ADSENSE_CLIENT = "ca-pub-XXXXXXXXXXXXXXXX";

const ready = /^ca-pub-\d{16}$/.test(ADSENSE_CLIENT);

// Adds the verification meta tag and the Auto ads script to every page, and publishes /ads.txt
export const adsense = () => ({
  name: "adsense",
  transformIndexHtml(html) {
    if (!ready) return html;
    const tags = `  <meta name="google-adsense-account" content="${ADSENSE_CLIENT}" />
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}" crossorigin="anonymous"></script>
  </head>`;
    return html.replace("</head>", tags);
  },
  generateBundle() {
    if (!ready) return;
    this.emitFile({
      type: "asset",
      fileName: "ads.txt",
      source: `google.com, ${ADSENSE_CLIENT.replace("ca-", "")}, DIRECT, f08c47fec0942fa0\n`,
    });
  },
});
