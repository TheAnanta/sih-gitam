const SOURCE_URL = "https://www.sih.gov.in/sih2026PS";
const ROW_PATTERN = /<td>(SIH26\d+)<\/td>\s*<td>\s*(\d+)\s*\/\s*\d+\s*<\/td>/g;

export async function GET() {
  try {
    const res = await fetch(SOURCE_URL, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; sih-gitam-nav/1.0)" },
      cache: "no-store",
    });

    if (!res.ok) {
      return Response.json({ error: "upstream request failed" }, { status: 502 });
    }

    const html = await res.text();
    const counts: Record<string, number> = {};

    for (const match of html.matchAll(ROW_PATTERN)) {
      const [, psId, count] = match;
      counts[psId] = Number(count);
    }

    if (Object.keys(counts).length === 0) {
      return Response.json({ error: "no submission data found" }, { status: 502 });
    }

    return Response.json({ counts, fetchedAt: new Date().toISOString() });
  } catch {
    return Response.json({ error: "failed to fetch live submissions" }, { status: 502 });
  }
}
