// Ghostbot integration with Site Scanner GPT + Sheets tab logging
import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { urls = [], goal = "improve engagement", max_pages = 20, early_stop = true } = req.body;
  if (!urls.length) return res.status(400).json({ error: 'No URLs provided' });

  const systemPrompt = `You are “Site Scanner”, a website analyzer that audits public pages for SEO, performance,
accessibility, UX, and security. Analyze user-provided URLs first, then auto-discover internal links
(recursive) on the same domain up to 20 pages, stopping early if coverage is sufficient. Respect robots.txt.
Never perform state-changing actions. Output two parts:
1. A clean Markdown audit with sections: Snapshot, Scorecard, Quick wins (Now/Next/Later), Detailed findings, Code/config samples, Monitoring plan.
2. A JSON block:
{"config":{"max_pages":${max_pages},"early_stop":${early_stop}},"findings":[{...}]}`;

  try {
    const result = await openai.chat.completions.create({
      model: "gpt-4",
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify({ urls, goal, max_pages, early_stop }) }
      ]
    });

    const raw = result.choices?.[0]?.message?.content || "";
    const jsonMatch = raw.match(/\{[\s\S]*\}\s*$/);
    let findingsJson = null;
    if (jsonMatch) {
      try { findingsJson = JSON.parse(jsonMatch[0]); } catch {}
    }
    const markdownAudit = jsonMatch ? raw.slice(0, jsonMatch.index).trim() : raw;

    // Send summary to Sheets with new tab per domain
    try {
      // Before using new URL(urls[0]), ensure it has a protocol
      let domain;
      try {
        let inputUrl = urls[0];
        if (!/^https?:\/\//i.test(inputUrl)) {
          inputUrl = 'https://' + inputUrl;
        }
        domain = new URL(inputUrl).hostname.replace(/^www\./, '').replace(/[^a-zA-Z0-9]/g, '-');
      } catch (err) {
        console.error("Invalid URL:", urls[0]);
        return res.status(400).json({ error: "Invalid URL provided" });
      }

      const summary = markdownAudit.slice(0, 500) + '...';

      await fetch(process.env.LEADS_SHEET_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: domain + '@ghostscan.ai',
          name: 'Site Audit Trigger',
          interest: `Audit of ${domain}`,
          summary
        })
      });
    } catch (sheetErr) {
      console.error("Sheets log error:", sheetErr);
    }

    res.status(200).json({ markdownAudit, findingsJson, raw });
  } catch (err) {
    console.error("Site Scanner error:", err);
    res.status(500).json({ error: "Failed to scan site" });
  }
}
