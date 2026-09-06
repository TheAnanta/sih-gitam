const SOURCE_URL = "https://www.sih.gov.in/sih2026PS";
const ROW_PATTERN = /<td>(SIH26\d+)<\/td>\s*<td>\s*(\d+)\s*\/\s*\d+\s*<\/td>/g;

export const maxDuration = 30;

async function fetchSource() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    return await fetch(SOURCE_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://www.sih.gov.in/",
      },
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET() {
  let res: Response;
  try {
    res = await fetchSource();
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown fetch error";
    console.error("sih2026-submissions: fetch to upstream failed:", message);
    return Response.json({ error: "failed to reach sih.gov.in", detail: message }, { status: 502 });
  }

  if (!res.ok) {
    console.error("sih2026-submissions: upstream returned", res.status, res.statusText);
    return Response.json(
      { error: "upstream request failed", status: res.status },
      { status: 502 }
    );
  }

  const html = await res.text();
  const counts: Record<string, number> = {};

  for (const match of html.matchAll(ROW_PATTERN)) {
    const [, psId, count] = match;
    counts[psId] = Number(count);
  }

  if (Object.keys(counts).length === 0) {
    console.error("sih2026-submissions: parsed 0 rows from a", html.length, "char response");
    return Response.json({ error: "no submission data found in upstream page" }, { status: 502 });
  }

  return Response.json({ counts, fetchedAt: new Date().toISOString() });
}
