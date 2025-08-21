import fetch from 'node-fetch';

export default async function handler(req, res) {
  console.log("Lead endpoint triggered with body:", req.body);

  const { name, email, interest, summary } = req.body;
  try {
    // Log to Sheets
    console.log("Sending to Sheets webhook...");
    const sheetsRes = await fetch(process.env.LEADS_SHEET_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, interest, summary })
    });
    const sheetsText = await sheetsRes.text();
    console.log("Sheets webhook response:", sheetsText);

    // Send Slack notification
    console.log("Sending Slack notification...");
    const slackRes = await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `*New Lead via Ghostbot*\nName: ${name}\nEmail: ${email}\nInterest: ${interest}\nSummary: ${summary}`
      })
    });
    console.log("Slack response status:", slackRes.status);

    res.status(200).json({ status: 'lead logged and notified' });
  } catch (err) {
    console.error("Error in lead handler:", err);
    res.status(500).json({ error: err.message });
  }
}
