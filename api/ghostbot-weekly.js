// /api/ghostbot-weekly - send Slack summary of top scans + leads
export default async function handler(req, res) {
if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });


try {
const now = new Date();
const weekAgo = new Date(now);
weekAgo.setDate(now.getDate() - 7);


const response = await fetch(process.env.LEADS_SHEET_WEBHOOK_URL);
const json = await response.json();
const rows = json.data || [];


const weekly = rows.filter(row => {
const date = new Date(row[0]);
return date >= weekAgo && date <= now;
});


const summary = weekly.map(r => `• *${r[1] || "N/A"}* (${r[2]}) – _${r[3]}_`).join('\n');


await fetch(process.env.SLACK_WEBHOOK_URL, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({
text: `📊 *Weekly Ghostbot Summary*
Total leads: ${weekly.length}


${summary}`
})
});


res.status(200).json({ status: 'summary sent' });
} catch (err) {
console.error("Weekly summary error:", err);
res.status(500).json({ error: 'Failed to send summary' });
}
}