// Secure and enhanced Ghostbot client logic
let lead = { email: '', industry: '', timeline: '', budget: '' };
let stage = 0;

async function sendMessage() {
  const input = document.getElementById("userInput");
  const chatbox = document.getElementById("chatbox");
  const msg = input.value.trim();
  if (!msg) return;

  chatbox.innerHTML += `<div class='message user'>${msg}</div>`;
  input.value = "";
  input.focus();

  // Lead capture flow with user prompts
  if (stage === 0 && validateEmail(msg)) {
    lead.email = msg;
    stage++;
    return chatbox.innerHTML += `<div class='message bot'>Thanks! What industry are you in?</div>`;
  } else if (stage === 1) {
    lead.industry = msg;
    stage++;
    return chatbox.innerHTML += `<div class='message bot'>Great. What's your project timeline?</div>`;
  } else if (stage === 2) {
    lead.timeline = msg;
    stage++;
    return chatbox.innerHTML += `<div class='message bot'>And lastly, what's your budget?</div>`;
  } else if (stage === 3) {
    lead.budget = msg;
    stage++;
    const summary = `Email: ${lead.email}, Industry: ${lead.industry}, Timeline: ${lead.timeline}, Budget: ${lead.budget}`;
    chatbox.innerHTML += `<div class='message bot'>✅ Just to confirm:<br>${summary}<br><br>Looks good? Submitting now...</div>`;

    await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...lead, summary })
    });
    return;
  }

  // General OpenAI call fallback
  const messages = [
    { role: "system", content: "You are Ghostbot, assistant at Ghost AI Solutions. Help users understand services, or collect info if they want a quote." },
    { role: "user", content: msg }
  ];

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages })
    });
    const data = await res.json();

    if (!data.choices || !data.choices[0]) {
      chatbox.innerHTML += `<div class='message bot'>Hmm... that didn't go through. Try again?</div>`;
      return;
    }

    const reply = data.reply || data.choices[0].message.content;
    chatbox.innerHTML += `<div class='message bot'>${reply}</div>`;
    chatbox.scrollTop = chatbox.scrollHeight;
  } catch (err) {
    console.error("Error:", err);
    chatbox.innerHTML += `<div class='message bot'>⚠️ Something went wrong. Try again later.</div>`;
  }
}

function validateEmail(email) {
  return /\S+@\S+\.\S+/.test(email) && !/(mailinator|tempmail|guerrillamail)/i.test(email);
}
