export default async function handler(req, res) {
  const apiKey = process.env.OPENAI_API_KEY;
  const { messages } = req.body;

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages,
        temperature: 0.7,
      }),
    });

    const data = await openaiRes.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    res.status(200).json({ reply: data.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: "Server error: " + err.message });
  }
}
