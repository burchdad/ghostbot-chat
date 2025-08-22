// Enhanced lead capture handler with disposable email detection, scoring, and UTM attribution
import fetch from 'node-fetch';
import { isDisposableEmail } from '../emailCheck.js';

export default async function handler(req, res) {
  const { name, email, interest, summary, utm_source, utm_medium, utm_campaign } = req.body;

  const leadScore = scoreLead(email, summary, interest);

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

function scoreLead(email = '', summary = '', interest = '') {
  let score = 0;

  if (isDisposableEmail(email)) score -= 50;
  else if (!email.endsWith('@gmail.com') && !email.endsWith('@yahoo.com')) score += 20;

  if (/urgent|asap|right away|immediate|priority/i.test(summary)) score += 30;
  if (/enterprise|large team|scale/i.test(interest)) score += 20;
  if (/low|under/i.test(interest)) score -= 10;

  return Math.max(0, score); // Clamp score to non-negative
}
