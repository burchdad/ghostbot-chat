// /api/export-bot - generate downloadable ZIP with Ghostbot config + embed
import JSZip from "jszip";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { configId = "demo", branding = {}, greeting = "Hey there!" } = req.body;

  try {
    const zip = new JSZip();
    const html = `<!DOCTYPE html><html><head><title>Ghostbot</title>
    <script src="ghostbot-embed.js" defer></script></head>
    <body><h1>Ghostbot Embed Preview</h1></body></html>`;

    const config = {
      configId,
      greeting,
      branding: branding || {}
    };

    zip.file("index.html", html);
    zip.file("ghostbot-embed.js", `// embed launcher\n(function(){ const i=document.createElement('iframe'); i.src='https://ghostai.solutions/demo?configId=${configId}'; i.style=\"position:fixed;bottom:90px;right:20px;width:360px;height:540px;border:none;border-radius:12px;z-index:9998\"; const l=document.createElement('div'); l.innerText='💬'; l.style=\"position:fixed;bottom:20px;right:20px;width:60px;height:60px;background:#1db954;color:white;font-size:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:9999\"; l.onclick=()=>{i.style.display=i.style.display==='block'?'none':'block'};document.body.appendChild(i);document.body.appendChild(l);})();`);
    zip.file("config.json", JSON.stringify(config, null, 2));

    const blob = await zip.generateAsync({ type: "nodebuffer" });
    res.setHeader("Content-Disposition", `attachment; filename=ghostbot-${configId}.zip`);
    res.setHeader("Content-Type", "application/zip");
    res.status(200).send(blob);
  } catch (err) {
    console.error("ZIP export error:", err);
    res.status(500).json({ error: 'Failed to create ZIP' });
  }
}
