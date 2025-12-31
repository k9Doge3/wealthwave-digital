# WealthWave Digital

Next.js app with:
- Sign up + login (NextAuth credentials)
- Digital product catalog
- Stripe Checkout + webhook fulfillment
- Access granted after payment (enrollments)
- Email notifications (SMTP)

## Local development

1) Create env file

Copy `.env.example` to `.env` and fill in values.

2) Set up database (Supabase Postgres)

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
- `DATABASE_URL` (Supabase "Connection pooling" string)
- `PRISMA_ACCELERATE_URL` (optional alternative)

Notes:
- With Prisma v7 + Vercel, use Supabase connection pooling for `DATABASE_URL`.
- For migrations, use `DIRECT_URL` as the Supabase "Direct connection" string (Prisma will use `directUrl` automatically for migrations).
- After deploying, create a Stripe webhook endpoint pointing to `https://<your-domain>/api/stripe/webhook`.

If you see Prisma error `P1001` (can't reach database server) on Vercel:
- Ensure `DATABASE_URL` is the Supabase **pooler** URL (host like `*.pooler.supabase.com`, usually port `6543`).
- Ensure the URL includes `sslmode=require` (or allow SSL via your environment).
- In Supabase: Project Settings → Database → **Network restrictions**. If enabled, Vercel may be blocked. Temporarily disable restrictions (or allow Vercel egress) to confirm.

## Supabase connection strings

In Supabase: Project Settings → Database → Connection string.

- Use the "Connection pooling" URI for `DATABASE_URL` during runtime (Vercel).
- Use the "Direct connection" URI for `DIRECT_URL` when running migrations locally.
