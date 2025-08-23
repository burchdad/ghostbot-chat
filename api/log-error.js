// /api/log-error - passive error logger for Ghostbot backend
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { source = 'unknown', message = 'No message', context = {} } = req.body;

  try {
    const slackPayload = {
      text: `⚠️ *Ghostbot Error Logged*
• Source: ${source}
• Message: ${message}
• Context: ${JSON.stringify(context, null, 2)}`
    };

    const webhook = process.env.SLACK_WEBHOOK_URL;
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackPayload)
    });

    res.status(200).json({ status: 'logged' });
  } catch (err) {
    console.error('Failed to log error:', err);
    res.status(500).json({ error: 'Logging failed' });
  }
}
