import nodemailer from "nodemailer";

function getSmtpConfig() {
  const smtpEmail = process.env.SMTP_EMAIL;
  const smtpPassword = process.env.SMTP_PASSWORD;
  if (!smtpEmail || !smtpPassword) return null;
  return { smtpEmail, smtpPassword };
}

export async function sendEmail(subscriberEmail: string) {
  const cfg = getSmtpConfig();
  if (!cfg) return;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: cfg.smtpEmail,
      pass: cfg.smtpPassword,
    },
  });

  await transporter.sendMail({
    from: `WealthWave Digital <${cfg.smtpEmail}>`,
    to: cfg.smtpEmail,
    subject: "New newsletter subscriber",
    text: `New subscriber: ${subscriberEmail}`,
    replyTo: subscriberEmail,
  });
}
