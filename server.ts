import express from "express";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Helper to format table
  const formatTable = (items: any[]) => {
    let table = `<table border="1" style="border-collapse: collapse; width: 100%;">
      <thead>
        <tr><th>Item</th><th>Qty</th><th>Rate</th></tr>
      </thead>
      <tbody>`;
    items.forEach(item => {
      table += `<tr><td>${item.product}</td><td>${item.qty}</td><td>${item.rate}</td></tr>`;
    });
    table += `</tbody></table>`;
    return table;
  };

  // Email sending route
  app.post("/api/send-email", async (req, res) => {
    const { toEmail, subject, message, items } = req.body;

    const tableHtml = items ? formatTable(items) : "";
    const fullBody = `${message}<br><br>${tableHtml}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    try {
      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: toEmail,
        subject,
        html: fullBody,
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Email Error:", error);
      res.status(500).json({ success: false, error: "Failed to send email" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
