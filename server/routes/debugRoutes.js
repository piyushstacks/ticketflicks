import express from "express";
import sendEmail from "../configs/nodeMailer.js";

const debugRouter = express.Router();

// Protected test endpoint to send a debug email. Requires either:
// - NODE_ENV !== 'production' (allowed locally), OR
// - provide correct secret in body 'secret' that matches DEBUG_EMAIL_SECRET
// This prevents accidental exposure in production.
debugRouter.post("/send-test-email", async (req, res) => {
  try {
    const { to, subject, body, secret } = req.body || {};

    // In production enforce a secret
    if (process.env.NODE_ENV === "production") {
      if (!process.env.DEBUG_EMAIL_SECRET || secret !== process.env.DEBUG_EMAIL_SECRET) {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }
    }

    const target = to || process.env.DEBUG_EMAIL_TARGET || process.env.SENDER_EMAIL;
    if (!target) return res.status(400).json({ success: false, message: "No 'to' address provided and no DEBUG_EMAIL_TARGET configured" });

    const resp = await sendEmail({
      to: target,
      subject: subject || "TicketFlicks test email",
      body: body || `<p>This is a test email from TicketFlicks at ${new Date().toISOString()}</p>`,
    });

    return res.json({ success: true, message: "Sent (see logs for provider response)", providerResponse: resp });
  } catch (err) {
    console.error("[debugRoutes] send-test-email error:", err && err.message ? err.message : err);
    return res.status(500).json({ success: false, message: err && err.message ? err.message : "Unknown error" });
  }
});

export default debugRouter;
