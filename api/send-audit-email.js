// /api/send-audit-email - email the audit PDF to user
export default async function handler(req, res) {
  const { to, markdown, domain } = req.body;
  if (!to || !markdown || !domain) return res.status(400).json({ error: 'Missing to, domain, or markdown' });

  try {
    const html = `<html><body><h2>Audit for ${domain}</h2><pre>${markdown}</pre></body></html>`;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Ghostbot <noreply@ghostai.solutions>",
        to,
        subject: `Your Ghostbot Audit for ${domain}`,
        html
      })
    });

    const result = await emailRes.json();
    res.status(200).json({ status: 'email sent', result });
  } catch (err) {
    console.error("Email send error:", err);
    res.status(500).json({ error: 'Failed to send email' });
  }
}
