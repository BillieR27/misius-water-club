import { useEffect, useState } from 'react';
import { supabase, configured } from './supabase.js';
import AuthScreen from './AuthScreen.jsx';
import Home from './Home.jsx';

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading

  useEffect(() => {
    if (!configured) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!configured) {
    return (
      <main className="screen center">
        <div className="card">
          <h1>Almost ready 🐻</h1>
          <p>Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to your environment variables, then reload.</p>
        </div>
      </main>
    );
  }
  if (session === undefined) return <main className="screen center"><div className="drop pulse">💧</div></main>;
  return session ? <Home session={session} /> : <AuthScreen />;
}
