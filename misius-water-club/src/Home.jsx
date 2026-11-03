import { supabase } from './supabase.js';

export default function Home({ session }) {
  return (
    <main className="screen center">
      <div className="card">
        <div className="drop big">🐻</div>
        <h1>Cześć, Misiu!</h1>
        <p>You're signed in as {session.user.email}. The dashboard arrives in stage 2.</p>
        <button className="btn" onClick={() => supabase.auth.signOut()}>Sign out</button>
        <p className="sig">Made with ❤️ w Tajlandii dla Polaka · ทำด้วยความรัก</p>
      </div>
    </main>
  );
}
