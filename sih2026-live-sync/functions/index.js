const { onRequest } = require("firebase-functions/v2/https");

const SOURCE_URL = "https://www.sih.gov.in/sih2026PS";
const ROW_PATTERN = /<td>(SIH26\d+)<\/td>\s*<td>\s*(\d+)\s*\/\s*\d+\s*<\/td>/g;

exports.sih2026Submissions = onRequest(
  { region: "asia-south1", timeoutSeconds: 30, invoker: "public", cors: true },
  async (req, res) => {
    try {
      const upstream = await fetch(SOURCE_URL, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });

      if (!upstream.ok) {
        res.status(502).json({ error: "upstream request failed", status: upstream.status });
        return;
      }

      const html = await upstream.text();
      const counts = {};
      for (const match of html.matchAll(ROW_PATTERN)) {
        const [, psId, count] = match;
        counts[psId] = Number(count);
      }

      if (Object.keys(counts).length === 0) {
        res.status(502).json({ error: "no submission data found in upstream page" });
        return;
      }

      res.set("Cache-Control", "public, max-age=120, s-maxage=120");
      res.status(200).json({ counts, fetchedAt: new Date().toISOString() });
    } catch (err) {
      res.status(502).json({
        error: "failed to reach sih.gov.in",
        detail: String(err && err.message ? err.message : err),
      });
    }
  }
);
