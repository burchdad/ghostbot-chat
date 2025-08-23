// Secure and enhanced Ghostbot client logic with soft lead capture and enhancements
let lead = { name: '', email: '', phone: '', interest: '', industry: '', budget: '' };
let stage = 0;
let userIntent = '';
let chat_history = [];

async function sendMessage() {
  const input = document.getElementById("userInput");
  const chatbox = document.getElementById("chatbox");
  const msg = input.value.trim();
  if (!msg) return;

  append("user", msg);
  input.value = "";
  input.focus();

  if (/demo|schedule|walkthrough|book/i.test(msg)) {
    userIntent = 'demo';
    append("bot", "Awesome! Let’s start with your name so we can personalize the invite.");
    return;
  }

  if (userIntent === 'demo') {
    if (!lead.name) {
      lead.name = msg;
      append("bot", "Thanks, " + lead.name + ". What's your email or phone number?");
      return;
    }

    if (!lead.email && !lead.phone) {
      if (validateEmail(msg)) lead.email = msg;
      else if (validatePhone(msg)) lead.phone = msg;
      else {
        append("bot", "Hmm, that doesn't look like an email or phone. Can you retype it?");
        return;
      }
      append("bot", "What industry is your business in? (e.g., retail, SaaS, real estate)");
      return;
    }

    if (!lead.industry) {
      lead.industry = msg;
      append("bot", "Thanks! What's your estimated budget for this project?");
      return;
    }

    if (!lead.budget) {
      lead.budget = msg;
      lead.interest = extractInterest(chat_history);
      const summary = chat_history.map(m => m.text).join("\n");

      await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: lead.name,
          email: lead.email || undefined,
          phone: lead.phone || undefined,
          interest: lead.interest || "Requested a demo",
          industry: lead.industry,
          budget: lead.budget,
          summary
        })
      });

      append("bot", `Perfect — we'll be in touch shortly with your demo details. 📅\nMeanwhile, feel free to book directly here: https://calendly.com/stephen-burch-ghostdefenses/demo-call`);
      userIntent = '';
      return;
    }
  }

  const messages = [
    { role: "system", content: "You are Ghostbot, an AI concierge for Ghost AI Solutions. Help users with questions and capture contact info when interested." },
    { role: "user", content: msg }
  ];

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages })
    });

    const data = await res.json();
    append("bot", data.reply);
  } catch (err) {
    console.error("Chat error:", err);
    append("bot", "⚠️ Something went wrong. Try again later.");
  }
}

function append(role, text) {
  const chatbox = document.getElementById("chatbox");
  const msg = document.createElement("div");
  msg.className = "message " + role;
  msg.textContent = text;
  chatbox.appendChild(msg);
  chatbox.scrollTop = chatbox.scrollHeight;
  chat_history.push({ role, text });
}

function validateEmail(email) {
  return /\S+@\S+\.\S+/.test(email);
}

function validatePhone(phone) {
  return /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(phone);
}

function extractInterest(history) {
  const joined = history.map(m => m.text.toLowerCase()).join(" ");
  if (/custom|chatbot/.test(joined)) return "Custom Chatbot";
  if (/automation/.test(joined)) return "Workflow Automation";
  if (/data|pipeline/.test(joined)) return "Data Pipeline";
  if (/lead/.test(joined)) return "Lead Scoring";
  return "General Inquiry";
}
