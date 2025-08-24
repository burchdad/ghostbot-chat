// /api/generate-pdf - turns markdownAudit into PDF and sends via Slack/email
import puppeteer from 'puppeteer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { markdown = '', domain = '', sendTo = 'slack' } = req.body;
  if (!markdown || !domain) return res.status(400).json({ error: 'Missing markdown or domain' });

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Audit for ${domain}</title>
  <style>body{font-family:sans-serif;padding:20px;} pre{white-space:pre-wrap;word-wrap:break-word;}</style></head>
  <body><h2>Site Audit for ${domain}</h2><pre>${markdown}</pre></body></html>`;

  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(html);
    const pdf = await page.pdf({ format: 'A4' });
    await browser.close();

    if (sendTo === 'slack') {
      const slack = await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `📄 New audit PDF for ${domain} attached.`,
          attachments: [
            {
              fallback: `Audit for ${domain}`,
              text: `Audit complete.`,
              file: pdf.toString('base64')
            }
          ]
        })
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="audit-${domain}.pdf"`);
    res.status(200).send(pdf);
  } catch (err) {
    console.error("PDF generation error:", err);
    res.status(500).json({ error: 'PDF generation failed' });
  }
}
