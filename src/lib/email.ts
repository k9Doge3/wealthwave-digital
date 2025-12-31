import nodemailer from "nodemailer";

type EmailOptions = {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
};

function getSmtpConfig() {
  const smtpEmail = process.env.SMTP_EMAIL;
  const smtpPassword = process.env.SMTP_PASSWORD;
  if (!smtpEmail || !smtpPassword) return null;

  return { smtpEmail, smtpPassword };
}

async function sendEmail(options: EmailOptions) {
  const cfg = getSmtpConfig();
  if (!cfg) return { ok: false as const, reason: "missing_smtp_env" as const };

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: cfg.smtpEmail,
      pass: cfg.smtpPassword,
    },
  });

  await transporter.sendMail({
    from: `WealthWave Digital <${cfg.smtpEmail}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    replyTo: options.replyTo,
  });

  return { ok: true as const };
}

export async function sendWelcomeEmail(toEmail: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const text = [
    "Welcome to WealthWave Digital!",
    "",
    "Your account is ready.",
    "",
    `Browse products: ${baseUrl}/products`,
    "Your account: ",
    `${baseUrl}/account`,
    "",
    "— WealthWave Digital",
  ].join("\n");

  return sendEmail({
    to: toEmail,
    subject: "Welcome to WealthWave Digital",
    text,
  });
}

export async function sendAdminPurchaseEmail(params: {
  adminEmail: string;
  orderId: string;
  orderStatus: string;
  total: string;
  userId: string;
  userEmail?: string | null;
  stripeSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  customerEmail?: string | null;
  customerName?: string | null;
  lineItems: Array<{ name: string; quantity: number; unit: string }>
}) {
  const text = [
    "New purchase (WealthWave Digital)",
    "",
    `Order: ${params.orderId}`,
    `Status: ${params.orderStatus}`,
    `Total: ${params.total}`,
    "",
    `User ID: ${params.userId}`,
    `User email: ${params.userEmail ?? "(unknown)"}`,
    `Customer name: ${params.customerName ?? "(unknown)"}`,
    `Stripe customer email: ${params.customerEmail ?? "(unknown)"}`,
    `Stripe session: ${params.stripeSessionId ?? "(unknown)"}`,
    `Stripe payment intent: ${params.stripePaymentIntentId ?? "(unknown)"}`,
    "",
    "Items:",
    ...params.lineItems.map((li) => `- ${li.quantity}× ${li.name} @ ${li.unit}`),
  ].join("\n");

  return sendEmail({
    to: params.adminEmail,
    subject: `New order: ${params.total}`,
    text,
    replyTo: params.customerEmail ?? undefined,
  });
}
