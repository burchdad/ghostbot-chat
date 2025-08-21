import fetch from 'node-fetch';

export default async function handler(req, res) {
  const { name, email, interest, summary } = req.body;

  try {
    // 1. Send to Google Sheets webhook
    const webhookUrl = process.env.LEADS_SHEET_WEBHOOK_URL;

    const sheetsRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, interest, summary })
    });

    const sheetsData = await sheetsRes.text();

    // 2. Send Slack notification
    const slackWebhook = process.env.SLACK_WEBHOOK_URL;
    const slackPayload = {
      text: `🚀 *New Lead via Ghostbot:*
• Name: ${name || 'N/A'}
• Email: ${email || 'N/A'}
• Interest: ${interest || 'N/A'}
• Summary: ${summary || ''}`
    };

    await fetch(slackWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackPayload)
    });

    // 3. Return success
    res.status(200).json({ status: 'Lead captured and Slack notified', sheetsResponse: sheetsData });
  } catch (err) {
    console.error('Lead capture error:', err);
    res.status(500).json({ error: err.message });
  }
}
