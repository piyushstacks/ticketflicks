import nodemailer from "nodemailer";

// Use Gmail SMTP by default. Requires a Gmail address and an App Password.
// Set these in your environment:
// GMAIL_USER - your Gmail address
// GMAIL_PASS - App password generated from your Google account
// SENDER_EMAIL - same as GMAIL_USER (recommended)
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER || process.env.SENDER_EMAIL,
    pass: process.env.GMAIL_PASS,
  },
});

// Verify transporter on startup and log helpful info
transporter
  .verify()
  .then(() => {
    console.log("[nodeMailer] Gmail transporter verified (smtp.gmail.com:587)");
  })
  .catch((err) => {
    console.error("[nodeMailer] Gmail transporter verify failed:", err && err.message ? err.message : err);
  });

const sendEmail = async ({ to, subject, body }) => {
  if (!transporter) {
    const msg = "[nodeMailer] transporter not ready yet";
    console.warn(msg);
    throw new Error(msg);
  }

  try {
    const response = await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to,
      subject,
      html: body,
    });

    // Log provider response id for debugging
    console.log("[nodeMailer] message sent, id:", response && response.messageId ? response.messageId : "n/a");

    // If running with Ethereal (test account), nodemailer provides a preview URL
    if (nodemailer.getTestMessageUrl) {
      const preview = nodemailer.getTestMessageUrl(response);
      if (preview) console.log("[nodeMailer] preview URL:", preview);
    }

    return response;
  } catch (err) {
    console.error("[nodeMailer] sendMail error:", err && err.message ? err.message : err);
    throw err;
  }
};

export default sendEmail;
