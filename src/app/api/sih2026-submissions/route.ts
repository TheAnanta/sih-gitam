// sih.gov.in blocks Vercel's outbound IP ranges (confirmed 403), so the actual
// scrape+parse happens in a Cloud Function running on Google Cloud, which is
// not blocked. This route just proxies that response to the client.
const PROXY_URL =
  "https://asia-south1-projectk-theananta.cloudfunctions.net/sih2026Submissions";

export const maxDuration = 30;

export async function GET() {
  let res: Response;
  try {
    res = await fetch(PROXY_URL, { cache: "no-store" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown fetch error";
    console.error("sih2026-submissions: proxy request failed:", message);
    return Response.json({ error: "failed to reach proxy", detail: message }, { status: 502 });
  }

  const body = await res.json();

  if (!res.ok) {
    console.error("sih2026-submissions: proxy returned", res.status, body);
    return Response.json(body, { status: 502 });
  }

  return Response.json(body);
}
