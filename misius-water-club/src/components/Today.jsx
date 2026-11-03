import { useMemo, useRef, useState } from 'react';
import Bear from './Bear.jsx';
import { DEFAULT_BILLIE, MILESTONES, greetingFor, pickDifferent, pickTap } from '../messages.js';
import { fmt, glassesLabel, hourIn, longDate, pctOf, sumMl, timeIn } from '../utils.js';

const QUICK = [150, 250, 350, 500];
const BURST_EMOJI = ['💖', '💧', '⭐', '🐻', '💙', '✨'];

export default function Today({ settings, tz, today, logs, billieMsgs, onAdd, onDelete, tzBanner }) {
  const goal = settings.daily_goal_ml;
  const total = sumMl(logs);
  const pct = pctOf(total, goal);
  const remaining = Math.max(0, goal - total);
  const greeting = greetingFor(hourIn(tz));

  const [bubble, setBubble] = useState(null);
  const [bumpKey, setBumpKey] = useState(0);
  const [toast, setToast] = useState(null);
  const [burst, setBurst] = useState(0);
  const [custom, setCustom] = useState('');
  const [error, setError] = useState('');
  const toastTimer = useRef();
  const burstTimer = useRef();

  const billiePool = useMemo(() => {
    const any = billieMsgs.filter((m) => !m.milestone || m.milestone === 'any').map((m) => m.body);
    return any.length ? any : DEFAULT_BILLIE;
  }, [billieMsgs]);
  const [billieMsg, setBillieMsg] = useState(() => pickDifferent(billiePool, null));

  const sorted = useMemo(() => [...logs].sort((a, b) => b.logged_at.localeCompare(a.logged_at)), [logs]);
  const burstItems = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        e: BURST_EMOJI[i % BURST_EMOJI.length],
        x: Math.round(Math.random() * 100),
        d: (Math.random() * 0.6).toFixed(2),
        s: (1.1 + Math.random() * 1.1).toFixed(2),
      })),
    [burst]
  );

  function flash(t, ms = 5000) {
    setToast(t);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), ms);
  }
  function celebrate() {
    setBurst(Date.now());
    clearTimeout(burstTimer.current);
    burstTimer.current = setTimeout(() => setBurst(0), 3000);
  }

  async function add(ml) {
    setError('');
    const before = total;
    const beforePct = pctOf(before, goal);
    const afterPct = pctOf(before + ml, goal);
    setBumpKey((k) => k + 1);
    try {
      await onAdd(ml);
    } catch {
      setError("Couldn't save that sip. Check your connection and try again. 💙");
      return;
    }
    const crossed = [100, 75, 50, 25].find((t) => beforePct < t && afterPct >= t);
    const m = crossed ? MILESTONES[crossed] : before === 0 ? MILESTONES.first : null;
    if (m) {
      flash(m);
      setBubble(m);
      celebrate();
      const fromDb = billieMsgs.filter((b) => b.milestone === m.key).map((b) => b.body);
      setBillieMsg(fromDb.length ? pickDifferent(fromDb, billieMsg) : pickDifferent(billiePool, billieMsg));
    } else {
      setBubble(pickTap(afterPct, bubble));
      setBillieMsg(pickDifferent(billiePool, billieMsg));
    }
  }

  function submitCustom(e) {
    e.preventDefault();
    const n = Number(custom);
    if (!Number.isInteger(n) || n < 1 || n > 2000) {
      setError('Enter a whole number between 1 and 2,000 ml.');
      return;
    }
    setCustom('');
    add(n);
  }

  function tapBear() {
    setBumpKey((k) => k + 1);
    setBubble(pickTap(pct, bubble));
  }

  const undoTarget = sorted[0];

  return (
    <>
      {burst > 0 && (
        <div className="burst" aria-hidden="true">
          {burstItems.map((b, i) => (
            <span key={i} style={{ '--x': `${b.x}%`, '--d': `${b.d}s`, '--s': `${b.s}s` }}>{b.e}</span>
          ))}
        </div>
      )}
      {toast && (
        <div className="toast" role="status" onClick={() => setToast(null)}>
          <strong>{toast.title}</strong>
          <span>{toast.en}</span>
          <em>{toast.pl}</em>
        </div>
      )}

      <header className="hello">
        <p className="date">{longDate(today)}</p>
        <h1>{greeting.en}</h1>
        <p className="pl">🇵🇱 {greeting.pl} <small>· {greeting.tr}</small></p>
      </header>

      {tzBanner}

      <section className="bear-stage">
        <Bear pct={pct} bumpKey={bumpKey} onTap={tapBear} />
        {bubble ? (
          <div className="bubble" key={bubble.en}>
            {bubble.en}
            {bubble.pl && <span className="pl">{bubble.pl}</span>}
          </div>
        ) : (
          <p className="hint">Tap the bear 🐻</p>
        )}
      </section>

      <section className="panel">
        <div className="big-number">
          <strong>{fmt(total)}</strong>
          <span> / {fmt(goal)} ml</span>
        </div>
        <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(pct, 100)}>
          <i style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
        <div className="chips">
          <div><b>{pct}%</b><small>of goal</small></div>
          <div><b>{glassesLabel(total)}</b><small>glasses</small></div>
          <div><b>{remaining ? fmt(remaining) : '🎉'}</b><small>{remaining ? 'ml to go' : 'goal reached'}</small></div>
        </div>
      </section>

      <section className="panel">
        <h2>Add water</h2>
        <div className="quick">
          {QUICK.map((ml) => (
            <button key={ml} type="button" className="q" onClick={() => add(ml)}>
              <span aria-hidden="true">💧</span>
              <b>{ml}</b>
              <small>ml</small>
            </button>
          ))}
        </div>
        <form className="custom" onSubmit={submitCustom}>
          <input type="number" inputMode="numeric" min="1" max="2000" placeholder="Custom ml" value={custom} onChange={(e) => setCustom(e.target.value)} aria-label="Custom amount in millilitres" />
          <button className="btn" type="submit">Add</button>
        </form>
        {error && <p className="msg">{error}</p>}
        <button type="button" className="link undo" disabled={!undoTarget} onClick={() => undoTarget && onDelete(undoTarget.id).catch(() => setError("Couldn't undo that. Try again."))}>
          ↩ Undo last{undoTarget ? ` (${undoTarget.amount_ml} ml)` : ''}
        </button>
      </section>

      <section className="panel billie" onClick={() => setBillieMsg(pickDifferent(billiePool, billieMsg))}>
        <h2>A little message from Billie 💌</h2>
        <p className="quote">{billieMsg}</p>
        <small>tap for another</small>
      </section>

      <section className="panel">
        <h2>Today's sips</h2>
        {sorted.length === 0 ? (
          <p className="empty">Nothing yet. Your bear is waiting. 🐻💤</p>
        ) : (
          <ul className="timeline">
            {sorted.map((l) => (
              <li key={l.id}>
                <span className="t">{timeIn(l.logged_at, tz)}</span>
                <span className="ml">{l.amount_ml} ml</span>
                <button type="button" aria-label={`Remove ${l.amount_ml} ml at ${timeIn(l.logged_at, tz)}`} onClick={() => onDelete(l.id).catch(() => setError("Couldn't remove that. Try again."))}>✕</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="sig center-text">Made with ❤️ w Tajlandii dla Polaka · ทำด้วยความรัก</p>
    </>
  );
}
