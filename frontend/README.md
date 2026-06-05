# Bihar Rozgar Frontend

This folder contains the Next.js frontend for the Bihar Rozgar portal.

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

Copy `.env.local` and add your Supabase and Razorpay credentials.

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_key_id
```

3. Setup Supabase:

- Create a new Supabase project.
- Run `frontend/supabase/schema.sql` in the SQL Editor.
- This creates tables, RLS policies, triggers, and seed data.

4. Run the development server:

```bash
npm run dev
```

5. Visit `http://localhost:3000`.

## Authentication

Authentication is handled by the FastAPI backend using email, phone OTP, and
password credentials. Direct social login and account linking are intentionally
not part of the authentication flow.

## Project Structure

```text
frontend/
|-- app/                # Next.js 14 App Router pages
|-- components/         # React components
|-- constants/          # Static data
|-- lib/                # Utilities and Supabase helpers
|-- public/             # Public assets and manifest
|-- supabase/           # SQL schema and Supabase assets
`-- types/              # TypeScript types
```

## Deployment

```bash
npm run build
npm start
```

Deploy to Vercel for the simplest setup.
