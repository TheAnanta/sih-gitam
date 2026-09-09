#!/usr/bin/env node
/**
 * Local-only analytics dashboard generator for SIH Navigator.
 *
 * Pulls every document out of the `sih_nav_analytics_events` Firestore
 * collection using the current machine's gcloud credentials (no service
 * account key needed — run `gcloud auth login` once if you haven't), joins
 * it against the bundled problems.json for enrichment, and writes a
 * self-contained dashboard.html you open locally. Nothing is hosted.
 *
 * Usage: node analytics-dashboard/generate.js
 */

const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const PROJECT_ID = "sih-connect";
const COLLECTION = "sih_nav_analytics_events";
const PAGE_SIZE = 300;

function getAccessToken() {
  try {
    return execSync("gcloud auth print-access-token", { encoding: "utf8" }).trim();
  } catch {
    console.error(
      "Couldn't get a gcloud access token. Run `gcloud auth login` first, " +
        "then re-run this script."
    );
    process.exit(1);
  }
}

// Firestore REST API returns typed field values, e.g. {"stringValue": "x"}.
// Flatten those into plain JS values.
function decodeValue(value) {
  if (value == null) return null;
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("timestampValue" in value) return new Date(value.timestampValue);
  if ("nullValue" in value) return null;
  if ("mapValue" in value) return decodeFields(value.mapValue.fields ?? {});
  if ("arrayValue" in value) return (value.arrayValue.values ?? []).map(decodeValue);
  return null;
}

function decodeFields(fields) {
  const out = {};
  for (const [key, value] of Object.entries(fields)) {
    out[key] = decodeValue(value);
  }
  return out;
}

async function fetchAllEvents(token) {
  const events = [];
  let pageToken;
  do {
    const url = new URL(
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION}`
    );
    url.searchParams.set("pageSize", String(PAGE_SIZE));
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "x-goog-user-project": PROJECT_ID,
      },
    });
    if (!res.ok) {
      throw new Error(`Firestore fetch failed: ${res.status} ${await res.text()}`);
    }
    const body = await res.json();
    for (const doc of body.documents ?? []) {
      const id = doc.name.split("/").pop();
      events.push({ id, ...decodeFields(doc.fields ?? {}) });
    }
    pageToken = body.nextPageToken;
  } while (pageToken);
  return events;
}

async function resolveDisplayNames(token, uids) {
  const names = new Map();
  const unique = [...new Set(uids)];
  const BATCH = 100;
  for (let i = 0; i < unique.length; i += BATCH) {
    const batch = unique.slice(i, i + BATCH);
    try {
      const res = await fetch(
        `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:lookup`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "x-goog-user-project": PROJECT_ID,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ localId: batch }),
        }
      );
      if (!res.ok) continue;
      const body = await res.json();
      for (const u of body.users ?? []) {
        names.set(u.localId, u.displayName || u.email || null);
      }
    } catch {
      // best-effort; fall back to showing uid prefixes for anyone missing
    }
  }
  return names;
}

function loadProblemIndex() {
  const problemsPath = path.join(__dirname, "..", "src", "data", "problems.json");
  const problems = JSON.parse(fs.readFileSync(problemsPath, "utf8"));
  const index = new Map();
  for (const p of problems) {
    const difficulty = Array.isArray(p.difficulty) ? p.difficulty[0] : p.difficulty;
    index.set(`${p.year}-${p.ps_id}`, {
      difficulty: difficulty === "Med" ? "Medium" : difficulty,
      category: p.category,
    });
  }
  return index;
}

function avg(nums) {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function topN(counts, n) {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

function buildReport(events, problemIndex, displayNames) {
  const clicks = events.filter((e) => e.eventType === "click");
  const closes = events.filter((e) => e.eventType === "dialog_close");

  const uniqueUsers = new Set(events.map((e) => e.userId));
  const anonymousUsers = new Set(events.filter((e) => e.isAnonymous).map((e) => e.userId));
  const identifiedUsers = new Set([...uniqueUsers].filter((u) => !anonymousUsers.has(u)));

  const bookmarkedCloses = closes.filter((e) => e.bookmarked);
  const bookmarkRate = closes.length ? bookmarkedCloses.length / closes.length : 0;

  const avgDurationBookmarked = avg(bookmarkedCloses.map((e) => e.durationMs ?? 0));
  const avgDurationNotBookmarked = avg(
    closes.filter((e) => !e.bookmarked).map((e) => e.durationMs ?? 0)
  );

  const clicksByProblem = new Map();
  const closesByProblem = new Map();
  const bookmarksByProblem = new Map();
  const titleByProblem = new Map();
  for (const e of clicks) {
    const key = `${e.year}-${e.ps_id}`;
    clicksByProblem.set(key, (clicksByProblem.get(key) ?? 0) + 1);
    titleByProblem.set(key, e.title);
  }
  for (const e of closes) {
    const key = `${e.year}-${e.ps_id}`;
    closesByProblem.set(key, (closesByProblem.get(key) ?? 0) + 1);
    titleByProblem.set(key, e.title);
    if (e.bookmarked) bookmarksByProblem.set(key, (bookmarksByProblem.get(key) ?? 0) + 1);
  }

  const clicksByOrg = new Map();
  const durationsByOrg = new Map();
  const clicksByTheme = new Map();
  const durationsByTheme = new Map();
  const clicksByDifficulty = new Map();
  const closesByDifficulty = new Map();
  const bookmarksByDifficulty = new Map();

  for (const e of clicks) {
    clicksByOrg.set(e.organization, (clicksByOrg.get(e.organization) ?? 0) + 1);
    const themes = Array.isArray(e.theme) ? e.theme : [e.theme].filter(Boolean);
    for (const t of themes) clicksByTheme.set(t, (clicksByTheme.get(t) ?? 0) + 1);
    const meta = problemIndex.get(`${e.year}-${e.ps_id}`);
    if (meta?.difficulty) {
      clicksByDifficulty.set(meta.difficulty, (clicksByDifficulty.get(meta.difficulty) ?? 0) + 1);
    }
  }
  for (const e of closes) {
    if (typeof e.durationMs === "number") {
      durationsByOrg.set(e.organization, [
        ...(durationsByOrg.get(e.organization) ?? []),
        e.durationMs,
      ]);
      const themes = Array.isArray(e.theme) ? e.theme : [e.theme].filter(Boolean);
      for (const t of themes) {
        durationsByTheme.set(t, [...(durationsByTheme.get(t) ?? []), e.durationMs]);
      }
    }
    const meta = problemIndex.get(`${e.year}-${e.ps_id}`);
    if (meta?.difficulty) {
      closesByDifficulty.set(meta.difficulty, (closesByDifficulty.get(meta.difficulty) ?? 0) + 1);
      if (e.bookmarked) {
        bookmarksByDifficulty.set(
          meta.difficulty,
          (bookmarksByDifficulty.get(meta.difficulty) ?? 0) + 1
        );
      }
    }
  }

  const activityByDay = new Map();
  for (const e of events) {
    if (!(e.timestamp instanceof Date)) continue;
    const day = e.timestamp.toISOString().slice(0, 10);
    activityByDay.set(day, (activityByDay.get(day) ?? 0) + 1);
  }
  const activitySeries = [...activityByDay.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  const eventsByUser = new Map();
  for (const e of events) {
    eventsByUser.set(e.userId, (eventsByUser.get(e.userId) ?? 0) + 1);
  }
  const topUsers = topN(eventsByUser, 10).map(([uid, count]) => ({
    label: displayNames.get(uid) || `${uid.slice(0, 8)}…`,
    count,
    anonymous: anonymousUsers.has(uid),
  }));

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      events: events.length,
      clicks: clicks.length,
      closes: closes.length,
      uniqueUsers: uniqueUsers.size,
      anonymousUsers: anonymousUsers.size,
      identifiedUsers: identifiedUsers.size,
      avgDurationMs: avg(closes.map((e) => e.durationMs ?? 0)),
      bookmarkRate,
      avgDurationBookmarkedMs: avgDurationBookmarked,
      avgDurationNotBookmarkedMs: avgDurationNotBookmarked,
    },
    topViewed: topN(clicksByProblem, 15).map(([key, count]) => ({
      key,
      title: titleByProblem.get(key) ?? key,
      count,
    })),
    topBookmarked: topN(bookmarksByProblem, 15).map(([key, count]) => ({
      key,
      title: titleByProblem.get(key) ?? key,
      count,
    })),
    byOrganization: topN(clicksByOrg, 12).map(([org, count]) => ({
      label: org,
      count,
      avgDurationMs: avg(durationsByOrg.get(org) ?? []),
    })),
    byTheme: topN(clicksByTheme, 12).map(([theme, count]) => ({
      label: theme,
      count,
      avgDurationMs: avg(durationsByTheme.get(theme) ?? []),
    })),
    byDifficulty: ["Easy", "Medium", "Hard"].map((d) => ({
      label: d,
      clicks: clicksByDifficulty.get(d) ?? 0,
      closes: closesByDifficulty.get(d) ?? 0,
      bookmarks: bookmarksByDifficulty.get(d) ?? 0,
      bookmarkRate: closesByDifficulty.get(d)
        ? (bookmarksByDifficulty.get(d) ?? 0) / closesByDifficulty.get(d)
        : 0,
    })),
    activitySeries,
    topUsers,
  };
}

function renderHtml(report) {
  const data = JSON.stringify(report);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>SIH Navigator — Analytics</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js"></script>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 2rem; background: #0a0a0a; color: #e5e5e5;
    font: 14px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
  h1 { font-size: 1.5rem; margin: 0 0 0.25rem; }
  .meta { color: #888; margin-bottom: 2rem; font-size: 0.8rem; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
  .stat { background: #171717; border: 1px solid #262626; border-radius: 12px; padding: 1rem; }
  .stat .value { font-size: 1.6rem; font-weight: 700; }
  .stat .label { color: #999; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; }
  .panels { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem; }
  @media (max-width: 900px) { .panels { grid-template-columns: 1fr; } }
  .panel { background: #171717; border: 1px solid #262626; border-radius: 12px; padding: 1.25rem; }
  .panel h2 { margin: 0 0 1rem; font-size: 1rem; }
  table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
  th, td { text-align: left; padding: 0.4rem 0.5rem; border-bottom: 1px solid #262626; }
  th { color: #999; font-weight: 500; }
  .full { grid-column: 1 / -1; }
  canvas { max-height: 320px; }
  .badge { display: inline-block; padding: 0.1rem 0.4rem; border-radius: 999px; font-size: 0.7rem; }
  .badge.anon { background: #3f2d00; color: #f5c518; }
  .badge.real { background: #0d3a1f; color: #4ade80; }
</style>
</head>
<body>
  <h1>SIH Navigator — Analytics</h1>
  <p class="meta" id="meta"></p>

  <div class="grid" id="stats"></div>

  <div class="panels">
    <div class="panel"><h2>Top viewed problem statements</h2><table id="topViewed"></table></div>
    <div class="panel"><h2>Most bookmarked problem statements</h2><table id="topBookmarked"></table></div>
    <div class="panel"><h2>By organization (clicks, avg time on dialog)</h2><canvas id="orgChart"></canvas></div>
    <div class="panel"><h2>By theme (clicks, avg time on dialog)</h2><canvas id="themeChart"></canvas></div>
    <div class="panel"><h2>Difficulty: engagement & bookmark rate</h2><canvas id="difficultyChart"></canvas></div>
    <div class="panel"><h2>Most active visitors</h2><table id="topUsers"></table></div>
    <div class="panel full"><h2>Activity over time</h2><canvas id="activityChart"></canvas></div>
  </div>

<script>
const report = ${data};
document.getElementById('meta').textContent =
  'Generated ' + new Date(report.generatedAt).toLocaleString() +
  ' · ' + report.totals.events + ' events · ' + report.totals.uniqueUsers + ' visitors';

const fmt = (ms) => ms >= 1000 ? (ms/1000).toFixed(1) + 's' : Math.round(ms) + 'ms';
const pct = (n) => (n * 100).toFixed(0) + '%';

const stats = [
  ['Total events', report.totals.events],
  ['Unique visitors', report.totals.uniqueUsers],
  ['Signed-in visitors', report.totals.identifiedUsers],
  ['Anonymous visitors', report.totals.anonymousUsers],
  ['Problem clicks', report.totals.clicks],
  ['Dialogs closed', report.totals.closes],
  ['Avg. time viewing a problem', fmt(report.totals.avgDurationMs)],
  ['Overall bookmark rate', pct(report.totals.bookmarkRate)],
  ['Avg. time — bookmarked', fmt(report.totals.avgDurationBookmarkedMs)],
  ['Avg. time — not bookmarked', fmt(report.totals.avgDurationNotBookmarkedMs)],
];
document.getElementById('stats').innerHTML = stats.map(([label, value]) =>
  \`<div class="stat"><div class="value">\${value}</div><div class="label">\${label}</div></div>\`
).join('');

function fillTable(id, rows, cols) {
  const table = document.getElementById(id);
  table.innerHTML =
    '<thead><tr>' + cols.map(c => \`<th>\${c[0]}</th>\`).join('') + '</tr></thead>' +
    '<tbody>' + rows.map(r =>
      '<tr>' + cols.map(c => \`<td>\${c[1](r)}</td>\`).join('') + '</tr>'
    ).join('') + '</tbody>';
}

fillTable('topViewed', report.topViewed, [
  ['Title', r => r.title],
  ['Clicks', r => r.count],
]);
fillTable('topBookmarked', report.topBookmarked, [
  ['Title', r => r.title],
  ['Bookmarks', r => r.count],
]);
fillTable('topUsers', report.topUsers, [
  ['Visitor', r => r.label],
  ['Type', r => r.anonymous ? '<span class="badge anon">anonymous</span>' : '<span class="badge real">signed in</span>'],
  ['Events', r => r.count],
]);

const chartDefaults = {
  color: '#e5e5e5',
  borderColor: '#262626',
};
Chart.defaults.color = chartDefaults.color;
Chart.defaults.borderColor = chartDefaults.borderColor;

new Chart(document.getElementById('orgChart'), {
  type: 'bar',
  data: {
    labels: report.byOrganization.map(o => o.label),
    datasets: [{ label: 'Clicks', data: report.byOrganization.map(o => o.count), backgroundColor: '#60a5fa' }],
  },
  options: { indexAxis: 'y', plugins: { legend: { display: false } } },
});

new Chart(document.getElementById('themeChart'), {
  type: 'bar',
  data: {
    labels: report.byTheme.map(t => t.label),
    datasets: [{ label: 'Clicks', data: report.byTheme.map(t => t.count), backgroundColor: '#c084fc' }],
  },
  options: { indexAxis: 'y', plugins: { legend: { display: false } } },
});

new Chart(document.getElementById('difficultyChart'), {
  type: 'bar',
  data: {
    labels: report.byDifficulty.map(d => d.label),
    datasets: [
      { label: 'Clicks', data: report.byDifficulty.map(d => d.clicks), backgroundColor: '#60a5fa' },
      { label: 'Bookmark rate (%)', data: report.byDifficulty.map(d => Math.round(d.bookmarkRate * 100)), backgroundColor: '#4ade80', yAxisID: 'y1' },
    ],
  },
  options: {
    scales: {
      y1: { position: 'right', grid: { drawOnChartArea: false }, suggestedMax: 100 },
    },
  },
});

new Chart(document.getElementById('activityChart'), {
  type: 'line',
  data: {
    labels: report.activitySeries.map(([day]) => day),
    datasets: [{ label: 'Events', data: report.activitySeries.map(([, count]) => count), borderColor: '#f472b6', tension: 0.3 }],
  },
});
</script>
</body>
</html>
`;
}

async function main() {
  const token = getAccessToken();
  console.log(`Fetching events from ${COLLECTION}...`);
  const events = await fetchAllEvents(token);
  console.log(`Fetched ${events.length} events.`);

  const problemIndex = loadProblemIndex();

  const identifiedUids = [...new Set(events.filter((e) => !e.isAnonymous).map((e) => e.userId))];
  console.log(`Resolving display names for ${identifiedUids.length} signed-in visitors...`);
  const displayNames = await resolveDisplayNames(token, identifiedUids);

  const report = buildReport(events, problemIndex, displayNames);
  const html = renderHtml(report);

  const outPath = path.join(__dirname, "dashboard.html");
  fs.writeFileSync(outPath, html);
  console.log(`\nDashboard written to ${outPath}`);
  console.log(`Open it with: open "${outPath}"`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
