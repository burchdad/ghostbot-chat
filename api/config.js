// Ghostbot Config API (in-memory proof of concept)
let configs = {};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const config = req.body;
      const id = config.businessName?.toLowerCase().replace(/\s+/g, '-') || Date.now().toString();
      configs[id] = { ...config, createdAt: new Date().toISOString() };
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
