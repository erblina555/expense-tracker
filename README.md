# Expense Tracker

A simple personal expense tracker built with Next.js and Supabase.

## Features

- Login and register with Supabase Auth
- Add personal expenses
- Edit and delete personal expenses
- Categorize expenses
- View expense list
- Set monthly budget
- Store budget alert history in Supabase
- Browser push alerts for budget warnings
- Optional email alerts through Resend
- Admin dashboard for viewing users and deleting accounts
- Show budget warning when spending reaches 90%
- Show budget warning when spending passes the limit

## Run locally

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Supabase setup

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_EMAIL=erblinakalludra5@gmail.com
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
RESEND_API_KEY=optional_resend_api_key_for_email_alerts
ALERT_FROM_EMAIL=alerts@yourdomain.com
```

You can use `env.example` as the guide for the variable names.

Then restart the dev server:

```bash
npm run dev
```

## Database setup

Open Supabase SQL Editor and run the SQL from:

```text
supabase-schema.sql
```

This creates:

- `profiles`
- `expenses`
- `budget_alerts`
- Row Level Security policies

If the main schema was already executed before the edit feature was added, run:

```text
supabase-add-edit-policy.sql
```

If the main schema was already executed before alerts were added, run:

```text
supabase-alerts.sql
```

## Budget alerts

The dashboard checks the current month's expenses against the user's monthly
budget. It triggers alerts when:

- monthly spending reaches 90% of the budget
- monthly spending passes the budget limit

Browser push alerts work after the user clicks `Enable push` in the dashboard.

Email alerts use the API route:

```text
/api/send-budget-alert
```

To send real emails, add a Resend API key to `.env.local`:

```env
RESEND_API_KEY=your_resend_api_key
ALERT_FROM_EMAIL=alerts@yourdomain.com
```

Without `RESEND_API_KEY`, the app still logs budget alerts in Supabase and shows
browser push alerts.

## Safer registration

For registration, the app checks:

- password has at least 6 characters
- password and confirm password match
- user must verify email after register

In Supabase, enable email verification here:

```text
Authentication -> Providers -> Email -> Confirm email
```

With email confirmation enabled, Supabase sends a verification email after
register.

For redirect after email confirmation, add:

```text
http://localhost:3000/auth/confirm
https://expense-tracker-topaz-xi-52.vercel.app/auth/confirm
```

## Admin

Admin pages:

- `/admin/login`
- `/admin`

Admin email:

```text
erblinakalludra5@gmail.com
```

Create this user in Supabase Authentication with the password you want to use.
For deleting user accounts from the admin dashboard, add
`SUPABASE_SERVICE_ROLE_KEY` to Vercel Environment Variables. Never expose this
key in frontend code.

## Main pages

- `/` landing page
- `/login` login/register page
- `/dashboard` expense dashboard
- `/share` QR code page

## Vercel hosting

Deploy the project on Vercel and add these environment variables in Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=https://expense-tracker-topaz-xi-52.vercel.app
ADMIN_EMAIL=erblinakalludra5@gmail.com
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
RESEND_API_KEY=optional_resend_api_key_for_email_alerts
ALERT_FROM_EMAIL=alerts@yourdomain.com
```

In Supabase, add the Vercel URL here:

```text
Authentication -> URL Configuration
```

Set:

```text
Site URL: https://expense-tracker-topaz-xi-52.vercel.app
Redirect URLs:
https://expense-tracker-topaz-xi-52.vercel.app/login
https://expense-tracker-topaz-xi-52.vercel.app/auth/confirm
http://localhost:3000/login
http://localhost:3000/auth/confirm
```

After this, users can scan the QR code from `/share`, open the hosted app on
their phone, register, verify email, and log in.

## Build check

```bash
npm run lint
npm run build
```
