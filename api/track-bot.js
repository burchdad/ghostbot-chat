// Logs Ghostbot activity to Google Sheets
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { page, triggeredAt } = req.body;

  try {
    const webhookUrl = process.env.LEADS_SHEET_WEBHOOK_URL;
    const payload = {
      name: 'Ghostbot Page Tracker',
      email: 'noreply@ghostai.solutions',
      interest: `Bot triggered on ${page}`,
      summary: `Ghostbot opened at ${triggeredAt} on page: ${page}`
    };

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    res.status(200).json({ status: 'Logged' });
  } catch (err) {
    console.error('Tracking error:', err);
    res.status(500).json({ error: 'Failed to track bot event' });
  }
}
