# Sharma Eye Hospital

Next.js 16 app for Sharma Eye Hospital's public website and internal operations dashboard.

## Architecture

This repository currently deploys one Next.js app from the repo root. Hostname guards in `src/proxy.ts` separate the public website from the internal app:

- `sharmaeye.com` and `www.sharmaeye.com` serve the public route allowlist.
- `internal.sharmaeye.com` serves the staff login, dashboard, invoices, and auth routes.
- Public-domain requests to non-public paths redirect back to `/` on the public domain. Staff should use the internal hostname directly.

## Local Development

```bash
npm install
npm run dev
```

The app reads environment variables from root `.env*` files. Do not place env files inside `src/`.

Required local variables:

```txt
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=
```

## Vercel Projects

Use two Vercel projects pointing to this same Git repository.

Public project:

```txt
Root Directory: ./
Domains: sharmaeye.com, www.sharmaeye.com
NEXT_PUBLIC_SITE_URL=https://sharmaeye.com
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Internal project:

```txt
Root Directory: ./
Domain: internal.sharmaeye.com
NEXT_PUBLIC_SITE_URL=https://internal.sharmaeye.com
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Keep `SUPABASE_SERVICE_ROLE_KEY` out of the public Vercel project.

## Cloudflare DNS

Cloudflare can manage the single `sharmaeye.com` zone:

```txt
@         A/CNAME   Vercel target for the public project
www       CNAME     Vercel target for the public project
internal  CNAME     Vercel target for the internal project
```

Use DNS-only records while Vercel verifies domains and provisions SSL.

## Supabase

Linked project:

```txt
Hospital Website
Project ref: uijhvndsebxscoijfqdl
```

Auth URL configuration should include:

```txt
Site URL: https://internal.sharmaeye.com

Redirect URLs:
https://internal.sharmaeye.com/**
http://localhost:3000/**
```

For Google OAuth, configure the Google Cloud OAuth client with Supabase's provider callback URL from Supabase Dashboard -> Authentication -> Providers -> Google. The app redirects staff auth through:

```txt
https://internal.sharmaeye.com/auth/callback
http://localhost:3000/auth/callback
```

Migration workflow:

```bash
supabase migration list
supabase db push
supabase db lint --linked
```

Do not run `supabase db push` when local and remote migration history are out of sync. Repair or inspect drift first.

## Quality Gates

```bash
npm run lint
npm run build
npm run test:domain
supabase migration list
supabase db lint --linked
```

`npm run test:domain` starts a temporary local Next dev server and verifies the hostname separation contract.
