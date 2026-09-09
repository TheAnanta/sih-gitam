# SIH Navigator analytics dashboard

A local-only report generator. Reads every event out of the
`sih_nav_analytics_events` Firestore collection, joins it against the
bundled problem data, and writes a self-contained `dashboard.html` you open
in a browser. Nothing here is hosted or deployed — it's a script you run on
your own machine whenever you want a fresh look.

## Setup (one-time)

You need `gcloud` installed and logged in as an account with access to the
`sih-connect` Firebase project:

```bash
gcloud auth login
```

## Usage

From the repo root:

```bash
node analytics-dashboard/generate.js
```

Or via the npm script:

```bash
npm run analytics
```

This writes `analytics-dashboard/dashboard.html` (git-ignored — it contains
real visitor data, never commit it) and prints the path to open. Re-run it
any time for fresh numbers; it always pulls live from Firestore.

## What it shows

- Overview stats: total events, unique/anonymous/signed-in visitor counts,
  average time spent viewing a problem statement, overall bookmark rate
- Top viewed and top bookmarked problem statements
- Engagement by organization and by theme (clicks + average dialog time)
- Difficulty breakdown: clicks, bookmark rate per Easy/Medium/Hard
- Most active visitors (by display name where signed in, or a uid prefix
  for anonymous visitors)
- Activity over time

## Note on the shared Firebase project

`sih-connect` is also used by another app (the SIH Team Formation
Platform). This script only ever reads `sih_nav_analytics_events`, which is
namespaced specifically for SIH Navigator and has nothing to do with that
other app's data.
