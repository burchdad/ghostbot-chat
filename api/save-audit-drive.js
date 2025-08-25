// /api/save-audit-drive - save audit PDF to Google Drive (Apps Script endpoint)
export default async function handler(req, res) {
  const { domain, markdown } = req.body;
  if (!domain || !markdown) return res.status(400).json({ error: 'Missing domain or markdown' });

  try {
    const response = await fetch(process.env.GDRIVE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain, markdown })
    });

    const result = await response.json();
    res.status(200).json({ status: 'PDF saved to Drive', result });
  } catch (err) {
    console.error("Drive save error:", err);
    res.status(500).json({ error: 'Failed to save to Google Drive' });
  }
}
