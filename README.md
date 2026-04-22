# Shortie — Good Girl Points

Private points totaliser. Dark/sexy Next.js + Supabase app, deployed to Vercel.

**Completely isolated** from any other project: its own git repo, its own Supabase project (`hbmffokwhewrzkbdouxk`), its own Vercel project.

## One-time setup

### 1. Run the DB migration
Open the Supabase dashboard for the `shortie` project → **SQL Editor** → paste the contents of `supabase/migrations/0001_init.sql` → **Run**.

This creates all tables, views, RLS policies, the auto-profile trigger, and seeds your email (`bobbygallacher@hotmail.com`) as an admin invite.

### 2. Local env
Copy `.env.local.example` to `.env.local` and fill in the three values from the Supabase dashboard → Settings → API:

```
NEXT_PUBLIC_SUPABASE_URL=https://hbmffokwhewrzkbdouxk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service_role key>
```

### 3. Install & run locally
```bash
npm install
npm run dev
```
Go to http://localhost:3000 → sign in with `bobbygallacher@hotmail.com` → magic link → you're admin.

### 4. Configure Supabase Auth redirect URLs
Supabase dashboard → Authentication → URL Configuration:
- **Site URL:** your Vercel URL (e.g. `https://shortie.vercel.app`)
- **Additional redirect URLs:** `http://localhost:3000/auth/callback`, `https://shortie.vercel.app/auth/callback`

### 5. Deploy to Vercel
```bash
npm i -g vercel        # if not installed
vercel login           # use whichever account you want for this
vercel                 # link / create new project; name it 'shortie'
```
When prompted:
- **Set up and deploy?** yes
- **Scope?** your personal account
- **Link to existing?** no — **create new**
- **Project name?** `shortie`
- **Directory?** `./`

Then add the three env vars in the Vercel dashboard (Settings → Environment Variables) and redeploy:
```bash
vercel --prod
```

### 6. Invite Shortie
Sign in as admin → **Invites** → enter her email → role: Submitter → Send. She'll get a magic-link email; on first sign-in her profile is auto-created with the submitter role.

## How it works

- **`submissions`** — she submits a request (points + reason). You approve / decline / amend in the queue.
- **`rewards`** — you add items to the catalogue (name + cost). She can redeem any she can afford.
- **`redemptions`** — logged when she spends.
- **`point_balances`** view = approved/amended points earned – redeemed costs.
- **`daily_points`** view powers the 30-day chart.

RLS policies: she only ever sees her own rows; you see all.

## Pushing to a new GitHub repo (optional, recommended for Vercel auto-deploy)
```bash
gh repo create shortie --private --source=. --remote=origin --push
```
Or manually create a new private repo on GitHub and `git remote add origin ... && git push -u origin master`.
