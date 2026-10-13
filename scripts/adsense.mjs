// Google AdSense publisher ID (AdSense > Account > Account information).
export const ADSENSE_CLIENT = "ca-pub-4060599703929477";

const ready = /^ca-pub-\d{16}$/.test(ADSENSE_CLIENT);

// Adds the verification meta tag and the Auto ads script to every public page (not login or the garage), and publishes /ads.txt
export const adsense = () => ({
  name: "adsense",
  transformIndexHtml(html) {
    if (!ready || html.includes('content="noindex')) return html;
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
