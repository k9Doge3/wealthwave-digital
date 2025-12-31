# Guides Store

Next.js app with:
- Sign up + login (NextAuth credentials)
- Product catalog (guides/courses)
- Stripe Checkout + webhook fulfillment
- Course access granted after payment
- Email notifications (SMTP)

## Local development

1) Create env file

Copy `.env.example` to `.env` and fill in values.

2) Set up database (SQLite by default)

```bash
npm run prisma:migrate
npm run db:seed
```

3) Run the dev server

```bash
npm run dev
```

Open http://localhost:3000

## Stripe webhook (local)

Point Stripe webhooks at the local endpoint:

- Endpoint: `http://localhost:3000/api/stripe/webhook`
- Event types: `checkout.session.completed`, `checkout.session.expired`

If you use the Stripe CLI, forward events to the endpoint and copy the printed webhook secret into `STRIPE_WEBHOOK_SECRET`.

## Email notifications (SMTP)

This project can send email notifications:
- Welcome email after signup
- Admin email when a purchase completes

Set these environment variables:
- `SMTP_EMAIL` (the Gmail address used to send emails)
- `SMTP_PASSWORD` (a Gmail App Password for that inbox)

Notes:
- For Gmail, create an App Password (recommended) instead of using your normal password.
- Do not commit secrets to git. Put real values in `.env` locally and in Vercel project settings.

## Deploy (GitHub + Vercel)

1) Push this repo to GitHub.

2) In Vercel, import the GitHub repo.

3) Configure environment variables in Vercel:

- `NEXTAUTH_URL` (your Vercel URL)
- `NEXTAUTH_SECRET` (random)
- `NEXT_PUBLIC_APP_URL` (same as your Vercel URL)
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SMTP_EMAIL`
- `SMTP_PASSWORD`
- `DATABASE_URL`
- `PRISMA_ACCELERATE_URL` (recommended on Vercel)

Notes:
- For production, use a hosted database. With Prisma v7, the easiest Vercel-friendly option is setting `PRISMA_ACCELERATE_URL`.
- After deploying, create a Stripe webhook endpoint pointing to `https://<your-domain>/api/stripe/webhook`.
