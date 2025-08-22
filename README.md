# Ghostbot Install Kit

Welcome to the Ghostbot Install Kit — a plug-and-play AI assistant designed to generate leads, answer questions, and automate your user engagement.

---

## 🚀 Features

* GPT-4 powered AI chatbot (via secure proxy)
* Lead capture (name, email, interest, timeline, budget)
* UTM tracking + Slack + Google Sheets + Zapier logging
* Disposable email blocking + lead scoring
* Calendly integration for demo scheduling
* Fully embeddable or hostable anywhere

---

## 📁 File Structure

```
├── index.html           # Chatbot interface (can embed anywhere)
├── script.js            # Optional standalone logic (already merged into HTML in main build)
├── /api
│   ├── chat.js          # GPT-4 proxy endpoint (secure key handling)
│   ├── lead.js          # Lead processing + Slack + Sheets + Zapier
├── emailCheck.js        # Detects disposable email domains
├── README.md            # This file
```

---

## ⚙️ Setup Instructions

### 1. Deploy to Vercel (or clone repo)

* Clone this repo and push to GitHub
* Import into [Vercel](https://vercel.com)
* Choose a root folder with `index.html` + `/api` folder

### 2. Add Environment Variables

| Key                               | Description                                   |
| --------------------------------- | --------------------------------------------- |
| `OPENAI_API_KEY`                  | Your GPT-4 API key (from OpenAI)              |
| `LEADS_SHEET_WEBHOOK_URL`         | Your Google Sheets webhook (from Apps Script) |
| `SLACK_WEBHOOK_URL`               | Slack channel webhook to receive new leads    |
| `ZAPIER_WEBHOOK_URL` *(optional)* | Send data to Airtable/CRM/Zapier              |

### 3. Customize Branding

* Edit `index.html` to update greeting, styling, colors, and quick replies
* Update the lead flow logic in `/api/lead.js` to match your custom fields

### 4. Embed on Your Website

Add to any site with:

```html
<iframe src="https://your-vercel-app.vercel.app" style="width:100%;height:600px;border:none;"></iframe>
```

Or make it a full modal widget via JS

---

## 👨‍💼 Ready to Use for Clients?

* Create a copy of this folder for each business
* Update branding, webhook URLs, and Calendly links per install
* You can charge setup + monthly access, or host it white-label for them

---

## 💬 Questions or Feedback?

Connect with Ghost AI Solutions at [ghostai.solutions](https://www.ghostai.solutions) or drop into our Slack.

---

Let’s automate your business with Ghostbot 👻
