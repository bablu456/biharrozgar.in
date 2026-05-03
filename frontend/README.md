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

## Google Login Setup

To enable Google sign-in and Google account linking:

1. In Google Cloud Console, create an OAuth 2.0 Web Application.
2. Add your app origins, for example:
   - `http://localhost:3000`
   - `https://biharrozgar.in`
3. Add the Supabase redirect URI:
   - `https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`
4. In Supabase Dashboard:
   - Go to `Authentication -> Providers -> Google`
   - Enable Google
   - Paste the Google client ID and secret
5. In `Authentication -> URL Configuration`, add your app callback URLs:
   - `http://localhost:3000/auth/callback`
   - `https://biharrozgar.in/auth/callback`
   - add any extra local dev ports you use, such as `http://localhost:3003/auth/callback`
6. For account linking, also enable `Manual Linking` in Supabase Auth settings.

The app now supports:

- Google login from `frontend/app/(auth)/login/page.tsx`
- Google signup plus first-time profile completion from `frontend/app/(auth)/register/page.tsx`
- Safe Google account linking for signed-in users from the dashboard pages

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
