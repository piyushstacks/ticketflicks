import nodemailer from 'nodemailer';
import 'dotenv/config';

// Quick test of Gmail SMTP directly
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER || process.env.SENDER_EMAIL,
    pass: process.env.GMAIL_PASS,
  },
});

(async () => {
  try {
    console.log('Testing transporter.verify()...');
    const ok = await transporter.verify();
    console.log('Verify result:', ok);

    console.log('\nSending test email...');
    const response = await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to: process.env.SENDER_EMAIL, // send to self for testing
      subject: 'Test OTP Email',
      html: '<p>This is a test OTP: <strong>123456</strong></p>',
    });

    console.log('Email sent successfully!');
    console.log('Response:', response);
  } catch (err) {
    console.error('Error:', err && err.message ? err.message : err);
    console.error('Full error:', err);
  }
})();
