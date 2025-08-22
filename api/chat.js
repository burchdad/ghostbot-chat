export default async function handler(req, res) {
  const apiKey = process.env.OPENAI_API_KEY;
  const { messages } = req.body;

  if (!Array.isArray(messages) || !messages.length) {
    return res.status(400).json({ error: "Invalid or missing 'messages' array." });
  }

  const systemPrompt = {
    role: "system",
    content: "You are Ghostbot, the official AI concierge of Ghost AI Solutions — a legitimate tech company that builds AI-powered agents to streamline operations, qualify leads, and automate workflows. Always represent Ghost AI Solutions confidently and accurately."
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [systemPrompt, ...messages],
        temperature: 0.7,
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!openaiRes.ok) {
      const errorData = await openaiRes.json();
      return res.status(openaiRes.status).json({ error: errorData?.error?.message || "OpenAI request failed." });
    }

    const data = await openaiRes.json();
    res.status(200).json({ reply: data.choices[0].message.content });

  } catch (err) {
    clearTimeout(timeout);
    const isAbort = err.name === "AbortError";
    res.status(500).json({ error: isAbort ? "Request timed out" : "Server error: " + err.message });
  }
}
