# MotoLog

MotoLog helps riders track due services, log mileage and plan trips.

## Features

- **Garage**: add one or more bikes, switch between them, set km or miles.
- **Services**: a maintenance schedule per bike (oil, chain, tyres, brake fluid…) with distance and/or time intervals. Each item shows **OK**, **Due soon** or **Overdue**, whichever limit comes first. Marking a service done records it in the history (with optional cost and notes) and restarts its interval.
- **Mileage**: log odometer readings and see distance ridden per month.
- **Trips**: plan trips (from, to, dates, planned distance, notes) and mark them ridden. The end odometer of a ridden trip is added to the mileage log automatically.
- **Dashboard**: odometer, distance this month, what needs attention, a 6‑month chart and upcoming trips.
- **Backup**: data is stored in the browser (localStorage); export and import a JSON backup from the Garage page.

## Stack

React 18 + TypeScript, built with Vite. No backend yet. Tests use Vitest.

## Development

```sh
npm install
npm run dev        # start the dev server
npm test           # run unit tests
npm run build      # typecheck and build to dist/
```
