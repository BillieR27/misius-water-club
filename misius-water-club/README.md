# Misiu's Water Club 🐻💧
Made with ❤️ w Tajlandii dla Polaka · ทำด้วยความรัก

## Stage 1 setup
1. **Supabase**: create a free project. SQL Editor → paste `supabase/migrations/001_init.sql` → Run.
2. Supabase → Project Settings → API: copy the Project URL and the `anon` key.
3. `cp .env.example .env` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. `npm install && npm run dev`
5. Create the account (Karol's email), sign in.

Tip: for personal use, turn off "Confirm email" in Supabase → Authentication → Providers → Email so sign-up works instantly.
