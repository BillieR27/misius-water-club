import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from './supabase.js';
import { addLog, deleteLog, fetchBillieMessages, fetchLogs, fetchSettings, saveSettings } from './data.js';
import { addDays, deviceTz, todayIn, validTz } from './utils.js';
import Today from './components/Today.jsx';
import History from './components/History.jsx';
import Report from './components/Report.jsx';
import Settings from './components/Settings.jsx';

const TABS = [
  { id: 'today', icon: '💧', label: 'Today' },
  { id: 'history', icon: '📊', label: 'History' },
  { id: 'report', icon: '💌', label: 'Report' },
  { id: 'settings', icon: '⚙️', label: 'Settings' },
];

const store = {
  get: (k) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k, v) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* private mode */
    }
  },
};

export default function Home({ session }) {
  const userId = session.user.id;
  const [tab, setTab] = useState('today');
  const [settings, setSettings] = useState(null);
  const [billie, setBillie] = useState([]);
  const [logs, setLogs] = useState([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [tzDismissed, setTzDismissed] = useState(() => store.get('tz_dismissed'));

  const tz = settings && validTz(settings.timezone) ? settings.timezone : deviceTz();
  // "today" is recalculated every 30s, so the day rolls over at midnight in the chosen timezone.
  const today = useMemo(() => todayIn(tz), [tz, now]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load settings + Billie's messages once.
  useEffect(() => {
    let alive = true;
    setError('');
    (async () => {
      try {
        const [s, b] = await Promise.all([fetchSettings(userId), fetchBillieMessages()]);
        if (alive) {
          setSettings(s);
          setBillie(b);
        }
      } catch (e) {
        if (alive) setError(e.message || 'Could not load your data.');
      }
    })();
    return () => {
      alive = false;
    };
  }, [userId, attempt]);

  const loadLogs = useCallback(async () => {
    try {
      setLogs(await fetchLogs(addDays(today, -29)));
      setReady(true);
    } catch (e) {
      setError(e.message || 'Could not load your water log.');
    }
  }, [today]);

  const loadRef = useRef(loadLogs);
  loadRef.current = loadLogs;

  const haveSettings = settings !== null;
  useEffect(() => {
    if (haveSettings) loadLogs();
  }, [haveSettings, loadLogs]);

  // Tick the clock and re-sync when the app comes back to the foreground (also picks up other devices).
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        setNow(Date.now());
        loadRef.current();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  const todayLogs = useMemo(() => logs.filter((l) => l.local_date === today), [logs, today]);

  async function add(amount) {
    const tempId = `tmp-${Math.random().toString(36).slice(2)}`;
    const temp = { id: tempId, amount_ml: amount, logged_at: new Date().toISOString(), local_date: today };
    setLogs((l) => [...l, temp]);
    try {
      const row = await addLog(userId, amount);
      setLogs((l) => l.map((x) => (x.id === tempId ? row : x)));
    } catch (e) {
      setLogs((l) => l.filter((x) => x.id !== tempId));
      throw e;
    }
  }

  async function remove(id) {
    const prev = logs;
    setLogs((l) => l.filter((x) => x.id !== id));
    try {
      if (!String(id).startsWith('tmp-')) await deleteLog(id);
    } catch (e) {
      setLogs(prev);
      throw e;
    }
  }

  async function save(patch) {
    setSettings(await saveSettings(userId, patch));
  }

  if (error && !settings) {
    return (
      <main className="screen center">
        <div className="card">
          <div className="drop big">🐻</div>
          <h1>Oops, little hiccup</h1>
          <p className="msg">{error}</p>
          <p className="fine">If you just updated the app, make sure the Stage 2 SQL migration was run in Supabase.</p>
          <button className="btn" onClick={() => setAttempt((a) => a + 1)}>Try again</button>
        </div>
      </main>
    );
  }
  if (!settings || !ready) {
    return (
      <main className="screen center">
        <div className="drop pulse">💧</div>
      </main>
    );
  }

  const dev = deviceTz();
  const tzBanner =
    validTz(dev) && dev !== settings.timezone && tzDismissed !== dev ? (
      <div className="panel tzbanner">
        <p>
          Your phone says <b>{dev.replace(/_/g, ' ')}</b>, but your day resets in <b>{settings.timezone.replace(/_/g, ' ')}</b>. Switch?
        </p>
        <div className="row">
          <button className="btn small" onClick={() => save({ timezone: dev })}>Switch</button>
          <button
            className="link"
            onClick={() => {
              store.set('tz_dismissed', dev);
              setTzDismissed(dev);
            }}
          >
            Keep
          </button>
        </div>
      </div>
    ) : null;

  return (
    <>
      <main className="app">
        {error && <p className="msg center-text">{error}</p>}
        {tab === 'today' && (
          <Today settings={settings} tz={tz} today={today} logs={todayLogs} billieMsgs={billie} onAdd={add} onDelete={remove} tzBanner={tzBanner} />
        )}
        {tab === 'history' && <History logs={logs} settings={settings} today={today} />}
        {tab === 'report' && <Report settings={settings} tz={tz} today={today} logs={todayLogs} userId={userId} />}
        {tab === 'settings' && <Settings settings={settings} email={session.user.email} onSave={save} onSignOut={() => supabase.auth.signOut()} />}
      </main>
      <div className="tabbar">
        <nav aria-label="Main">
          {TABS.map((t) => (
            <button key={t.id} type="button" className={`tab ${tab === t.id ? 'on' : ''}`} onClick={() => { setTab(t.id); window.scrollTo(0, 0); }} aria-current={tab === t.id ? 'page' : undefined}>
              <span aria-hidden="true">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}
