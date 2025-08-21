const apiKey = "YOUR_API_KEY_HERE"; // Insert your key securely
let lead = {};

async function sendMessage() {
  const inp = document.getElementById("userInput");
  const chat = document.getElementById("chatbox");
  const msg = inp.value.trim();
  if (!msg) return;
  chat.innerHTML += `<div class="message user">${msg}</div>`;
  inp.value = "";
  
  // Minimal state-based qualification logic
  if (!lead.email && validateEmail(msg)) { lead.email = msg; }
  else if (!lead.industry) { lead.industry = msg; }
  else if (!lead.timeline) { lead.timeline = msg; }
  else if (!lead.budget) { lead.budget = msg; }
  
  const summary = `Email: ${lead.email||"—"}, Industry: ${lead.industry||"—"}, Timeline: ${lead.timeline||"—"}, Budget: ${lead.budget||"—"}`;
  
  const messages = [
    { role: "system", content: "You are Ghostbot, friendly assistant of Ghost AI Solutions. Qualify user by collecting email, industry, timeline, budget, then offer to book a call." },
    { role: "user", content: msg }
  ];
  
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type":"application/json", Authorization:`Bearer ${apiKey}` },
    body: JSON.stringify({ model:"gpt-4", messages, temperature:0.7 })
  });
  const data = await res.json();
  const reply = data.choices[0].message.content;
  
  if (lead.email && lead.industry && lead.timeline && lead.budget) {
    chat.innerHTML += `<div class="message bot">Thanks! Here’s what you shared: ${summary}. Ready to book a strategy call?</div>`;
    // Post to Google Sheets
    fetch("YOUR_WEB_APP_URL", {
      method: "POST",
      body: JSON.stringify({ email: lead.email, industry: lead.industry, timeline: lead.timeline, budget: lead.budget, summary })
    });
  } else {
    chat.innerHTML += `<div class="message bot">${reply}</div>`;
  }
  chat.scrollTop = chat.scrollHeight;
}

function validateEmail(s){ return /\S+@\S+\.\S+/.test(s); }
