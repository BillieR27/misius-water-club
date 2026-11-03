import { useState } from 'react';
import { supabase } from './supabase.js';

export default function AuthScreen() {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    const fn = mode === 'signin' ? 'signInWithPassword' : 'signUp';
    const { data, error } = await supabase.auth[fn]({ email, password });
    setBusy(false);
    if (error) return setMsg(error.message);
    if (mode === 'signup' && !data.session) setMsg('Check your email to confirm, then sign in. 💌');
  }

  return (
    <main className="screen center">
      <form className="card auth" onSubmit={submit}>
        <div className="drop big">🐻</div>
        <h1>Misiu's Water Club</h1>
        <p className="tagline">Drink water, handsome. Your favourite Thai girl says so.</p>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        <input type="password" placeholder="Password (min 8 characters)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} />
        <button className="btn" disabled={busy}>{busy ? '…' : mode === 'signin' ? 'Sign in' : 'Create account'}</button>
        {msg && <p className="msg">{msg}</p>}
        <button type="button" className="link" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
          {mode === 'signin' ? 'First time? Create account' : 'Have an account? Sign in'}
        </button>
        <p className="sig">Made with ❤️ w Tajlandii dla Polaka · ทำด้วยความรัก</p>
      </form>
    </main>
  );
}
