import fetch from 'node-fetch';

export default async function handler(req, res) {
  const { name, email, interest, summary } = req.body;

  try {
    // Send to Google Sheets webhook
    const webhookUrl = process.env.LEADS_SHEET_WEBHOOK_URL;

    const sheetsRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, interest, summary })
    });

    const sheetsData = await sheetsRes.text();

    // Optional: send email notification via Buttondown or fallback (placeholder)
    // Note: Buttondown's API does not currently support transactional email; you may need Resend or SMTP service

    // Respond with success
    res.status(200).json({ status: 'Lead captured', sheetsResponse: sheetsData });
  } catch (err) {
    console.error('Lead capture error:', err);
    res.status(500).json({ error: err.message });
  }
}
