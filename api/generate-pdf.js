// /api/generate-pdf - turns markdownAudit into PDF and sends via Slack/email
import puppeteer from 'puppeteer';
import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import fs from 'fs/promises';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { markdown = '', findingsJson = {}, domain = '', email = '' } = req.body;
  if (!markdown || !domain || !email) return res.status(400).json({ error: 'Missing markdown, domain, or email' });

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Audit for ${domain}</title>
  <style>body{font-family:sans-serif;padding:20px;} pre{white-space:pre-wrap;word-wrap:break-word;}</style></head>
  <body><h2>Site Audit for ${domain}</h2><pre>${markdown}</pre></body></html>`;

  // Temporary file paths
  const pdfPath = path.join('/tmp', `audit-${domain}.pdf`);
  const jsonPath = path.join('/tmp', `audit-${domain}.json`);

  try {
    // Generate PDF
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(html);
    await page.pdf({ path: pdfPath, format: 'A4' });
    await browser.close();

    // Save JSON findings
    await fs.writeFile(jsonPath, JSON.stringify(findingsJson, null, 2));

    // Google Drive setup
    const auth = new google.auth.JWT(
      process.env.GDRIVE_CLIENT_EMAIL,
      null,
      process.env.GDRIVE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      ['https://www.googleapis.com/auth/drive']
    );
    const drive = google.drive({ version: 'v3', auth });

    // Create folder for this domain
    const folderRes = await drive.files.create({
      resource: {
        name: domain,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [process.env.GDRIVE_PARENT_FOLDER_ID]
      },
      fields: 'id'
    });
    const folderId = folderRes.data.id;

    // Upload PDF
    const pdfDriveRes = await drive.files.create({
      resource: {
        name: `audit-${domain}.pdf`,
        parents: [folderId]
      },
      media: {
        mimeType: 'application/pdf',
        body: await fs.readFile(pdfPath)
      },
      fields: 'id, webViewLink'
    });

    // Upload JSON
    const jsonDriveRes = await drive.files.create({
      resource: {
        name: `audit-${domain}.json`,
        parents: [folderId]
      },
      media: {
        mimeType: 'application/json',
        body: await fs.readFile(jsonPath)
      },
      fields: 'id, webViewLink'
    });

    // Send files to your Google Drive webhook
    let driveFolderUrl = '';
    let pdfUrl = '';
    let jsonUrl = '';
    if (process.env.GDRIVE_WEBHOOK_URL) {
      const formData = new FormData();
      formData.append('domain', domain);
      formData.append('email', email);
      formData.append('pdf', await fs.readFile(pdfPath), `audit-${domain}.pdf`);
      formData.append('json', await fs.readFile(jsonPath), `audit-${domain}.json`);

      const webhookRes = await fetch(process.env.GDRIVE_WEBHOOK_URL, {
        method: 'POST',
        body: formData
      });
      const webhookData = await webhookRes.json();
      driveFolderUrl = webhookData.driveFolderUrl || '';
      pdfUrl = webhookData.pdfUrl || '';
      jsonUrl = webhookData.jsonUrl || '';
    }

    // Email setup
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"Ghost AI Solutions" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Your Site Audit for ${domain}`,
      html: `
        <p>Hi,</p>
        <p>Your audit for <b>${domain}</b> is ready.</p>
        <p>
          <a href="${pdfDriveRes.data.webViewLink}">Download PDF Audit</a><br>
          <a href="${jsonDriveRes.data.webViewLink}">Download JSON Findings</a><br>
          <a href="https://drive.google.com/drive/folders/${folderId}">View all files in Google Drive</a>
        </p>
      `,
      attachments: [
        { filename: `audit-${domain}.pdf`, path: pdfPath },
        { filename: `audit-${domain}.json`, path: jsonPath }
      ]
    });

    // Clean up temp files
    await fs.unlink(pdfPath);
    await fs.unlink(jsonPath);

    // Send Slack notification
    if (process.env.SLACK_WEBHOOK_URL) {
      const slackPayload = {
        text: `:ghost: *New Site Audit Completed!*\n
*Domain:* ${domain}
*Client Email:* ${email}
*PDF:* ${pdfDriveRes.data.webViewLink}
*JSON:* ${jsonDriveRes.data.webViewLink}
*Drive Folder:* https://drive.google.com/drive/folders/${folderId}`
      };
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackPayload)
      });
    }

    res.status(200).json({
      pdfUrl,
      jsonUrl,
      emailSent: true,
      driveFolderUrl
    });
  } catch (err) {
    console.error("PDF/Drive/Email error:", err);
    res.status(500).json({ error: 'PDF generation or upload/email failed' });
  }
}
