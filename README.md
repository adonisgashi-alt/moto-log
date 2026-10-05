# MotoLog

Marketing website for MotoLog, the app that helps riders track due services, log mileage and plan trips.

A single static page: hero, features (services, mileage, trips), how it works, FAQ and a download call to action.

## Development

```sh
npm install
npm run dev       # local dev server
npm run build     # static build to dist/
```

The `dist/` folder can be hosted on any static host (Vercel, Netlify, GitHub Pages, Cloudflare Pages).

## Photos

The photos are free [Unsplash](https://unsplash.com/license) images loaded from Unsplash and shown in greyscale. To use your own, put files in `public/images/` and point the `<img src>` in `index.html` at them (e.g. `/images/hero.jpg`).

## To fill in

- App Store and Google Play links: the store buttons in `index.html` currently point to `#download`.
