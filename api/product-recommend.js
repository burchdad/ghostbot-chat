// /api/product-recommend - suggest products based on user behavior
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { productName = '', behavior = '', context = '' } = req.body;

  const prompt = `You are a product engagement assistant.
The user showed interest in "${productName}" but didn't convert.
Behavior noted: ${behavior}.
Context: ${context}.

Suggest 2-3 helpful, personalized messages Ghostbot could say next.
Focus on offering value, insight, or alternatives without being pushy.`;

  try {
    const result = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.7,
      messages: [
        { role: 'system', content: 'You help recover hesitating shoppers with empathy and strategy.' },
        { role: 'user', content: prompt }
      ]
    });

    const reply = result.choices?.[0]?.message?.content;
    res.status(200).json({ suggestions: reply });
  } catch (err) {
    console.error('Product suggest error:', err);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
}
