// Ghostbot Config API with email notification and implicit lead capture
let configs = {};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const config = req.body;
      const id = config.businessName?.toLowerCase().replace(/\s+/g, '-') || Date.now().toString();
      configs[id] = { ...config, createdAt: new Date().toISOString() };

      // Send welcome email
      await sendWelcomeEmail(config.contactEmail, config.businessName);

      return res.status(200).json({ status: 'saved', id });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to save config' });
    }
  } else if (req.method === 'GET') {
    const { id } = req.query;
    if (id && configs[id]) {
      return res.status(200).json(configs[id]);
    } else {
      return res.status(200).json(configs);
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function sendWelcomeEmail(to, company) {
  if (!to || !company) return;
  const msg = {
    to,
    from: 'noreply@ghostai.solutions',
    subject: `Welcome to Ghostbot, ${company}!`,
    text: `Hi ${company},\n\nThanks for joining Ghostbot. Your AI assistant is now ready to go. You can preview your bot here: https://ghostai.solutions/demo?configId=${company.toLowerCase().replace(/\s+/g, '-')}`,
  };

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(msg)
    });
  } catch (err) {
    console.error('Email failed:', err);
  }
}
