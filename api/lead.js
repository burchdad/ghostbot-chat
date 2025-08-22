// Full implementation of the upgraded Ghostbot lead handling serverless function
import fetch from 'node-fetch';

export default async function handler(req, res) {
  const { name, email, interest, summary, utm_source, utm_medium, utm_campaign } = req.body;

  const leadScore = scoreLead(email, summary);

  try {
    // 1. Log to Google Sheets
    const sheetsRes = await fetch(process.env.LEADS_SHEET_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, interest, summary, utm_source, utm_medium, utm_campaign, leadScore })
    });
    const sheetsText = await sheetsRes.text();

    // 2. Send Slack notification
    const slackPayload = {
      text: `📥 *New Ghostbot Lead*\n*Name:* ${name}\n*Email:* ${email}\n*Interest:* ${interest}\n*Score:* ${leadScore}\n*Summary:* ${summary}`
    };
    const slackRes = await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackPayload)
    });

    // 3. Forward to Zapier (if defined)
    if (process.env.ZAPIER_WEBHOOK_URL) {
      await fetch(process.env.ZAPIER_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, interest, summary, score: leadScore, utm_source, utm_medium, utm_campaign })
      });
    }

    res.status(200).json({ status: 'Lead logged, notified, and forwarded', score: leadScore });
  } catch (err) {
    console.error('Lead handler error:', err);
    res.status(500).json({ error: err.message });
  }
}

function scoreLead(email, summary = '') {
  let score = 0;
  if (email && !email.endsWith('@gmail.com') && !email.endsWith('@yahoo.com')) score += 20;
  if (/urgent|asap|right away|enterprise/i.test(summary)) score += 30;
  return score;
}
