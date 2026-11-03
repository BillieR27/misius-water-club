import { useEffect, useMemo, useState } from 'react';
import { deviceTz, validTz } from '../utils.js';

const COMMON_TZ = [
  'Europe/Warsaw', 'Europe/London', 'Europe/Berlin', 'Europe/Paris', 'Europe/Madrid', 'Europe/Rome', 'Europe/Kyiv',
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Asia/Bangkok', 'Asia/Singapore', 'Asia/Tokyo', 'Asia/Dubai', 'Australia/Sydney', 'Pacific/Auckland', 'UTC',
];
const INTERVALS = [60, 90, 120, 180, 240];

const toDraft = (s) => ({
  goal: String(s.daily_goal_ml),
  tz: s.timezone,
  qs: String(s.quiet_start).slice(0, 5),
  qe: String(s.quiet_end).slice(0, 5),
  on: !!s.reminders_enabled,
  interval: String(s.reminder_interval_min),
  wa: s.billie_whatsapp || '',
});

function deviceStatus() {
  if (typeof window === 'undefined') return { supported: false, standalone: false, ios: false, permission: 'unsupported' };
  const ua = navigator.userAgent || '';
  const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
  const supported = 'Notification' in window;
  return { supported, standalone, ios, permission: supported ? Notification.permission : 'unsupported' };
}

export default function Settings({ settings, email, onSave, onSignOut }) {
  const [d, setD] = useState(() => toDraft(settings));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [dev, setDev] = useState(deviceStatus);

  useEffect(() => setD(toDraft(settings)), [settings]);

  const set = (k, v) => {
    setD((p) => ({ ...p, [k]: v }));
    setMsg('');
  };
  const dirty = JSON.stringify(d) !== JSON.stringify(toDraft(settings));
  const hasWa = 'billie_whatsapp' in settings;
  const tzOptions = useMemo(() => {
    const zones = new Set([...COMMON_TZ.filter(validTz), settings.timezone, deviceTz(), d.tz]);
    return [...zones].filter(Boolean).sort();
  }, [settings.timezone, d.tz]);

  const step = (delta) => {
    const n = Math.max(500, Math.min(6000, (Number(d.goal) || 2500) + delta));
    set('goal', String(n));
  };

  async function save(e) {
    e.preventDefault();
    setErr('');
    const goal = Number(d.goal);
    if (!Number.isInteger(goal) || goal < 500 || goal > 6000) return setErr('Pick a daily goal between 500 and 6,000 ml.');
    if (!validTz(d.tz)) return setErr('That timezone is not recognised.');
    const wa = d.wa.replace(/\D/g, '');
    if (wa && (wa.length < 6 || wa.length > 15)) return setErr('WhatsApp number: digits only, with country code (6–15 digits).');
    const patch = {
      daily_goal_ml: goal,
      timezone: d.tz,
      quiet_start: d.qs,
      quiet_end: d.qe,
      reminders_enabled: d.on,
      reminder_interval_min: Number(d.interval),
    };
    if (hasWa) patch.billie_whatsapp = wa || null;
    setBusy(true);
    try {
      await onSave(patch);
      setMsg('Saved ✓ 💙');
    } catch (ex) {
      setErr(ex.message || "Couldn't save. Try again.");
    }
    setBusy(false);
  }

  async function ask() {
    try {
      await Notification.requestPermission();
    } catch {
      /* ignore */
    }
    setDev(deviceStatus());
  }

  let notifLine;
  if (dev.ios && !dev.standalone)
    notifLine = 'On iPhone, notifications only work after you add this app to your Home Screen (Share → Add to Home Screen), then open it from there. Needs iOS 16.4 or newer.';
  else if (!dev.supported) notifLine = "This browser doesn't support notifications.";
  else if (dev.permission === 'granted') notifLine = 'Notifications are allowed on this device ✓';
  else if (dev.permission === 'denied') notifLine = "Notifications are blocked. Turn them back on in your device's settings for this app.";
  else notifLine = 'Allow notifications so reminders can reach this device.';

  return (
    <form onSubmit={save}>
      <header className="hello">
        <p className="date">Make it yours</p>
        <h1>Settings ⚙️</h1>
        <p className="pl">{email}</p>
      </header>

      <section className="panel">
        <h2>Daily goal</h2>
        <div className="stepper">
          <button type="button" className="btn small" onClick={() => step(-250)} aria-label="Decrease goal">−</button>
          <input type="number" inputMode="numeric" min="500" max="6000" step="50" value={d.goal} onChange={(e) => set('goal', e.target.value)} aria-label="Daily goal in millilitres" />
          <span>ml</span>
          <button type="button" className="btn small" onClick={() => step(250)} aria-label="Increase goal">+</button>
        </div>
        <p className="fine">Pick what suits you. Needs differ from person to person, so ask a doctor if you're unsure.</p>

        <div className="field">
          <label htmlFor="tz">Timezone (your day resets at midnight here)</label>
          <select id="tz" value={d.tz} onChange={(e) => set('tz', e.target.value)}>
            {tzOptions.map((z) => <option key={z} value={z}>{z.replace(/_/g, ' ')}</option>)}
          </select>
          {deviceTz() !== d.tz && validTz(deviceTz()) && (
            <button type="button" className="link" onClick={() => set('tz', deviceTz())}>Use this device ({deviceTz().replace(/_/g, ' ')})</button>
          )}
        </div>
      </section>

      <section className="panel">
        <h2>Reminders 🔔</h2>
        <label className="switch">
          <span>Hydration reminders</span>
          <input type="checkbox" checked={d.on} onChange={(e) => set('on', e.target.checked)} />
        </label>
        <div className="field">
          <label htmlFor="iv">How often</label>
          <select id="iv" value={d.interval} onChange={(e) => set('interval', e.target.value)}>
            {INTERVALS.map((m) => <option key={m} value={m}>{m < 120 ? `Every ${m} min` : `Every ${m / 60} hours`}</option>)}
            {!INTERVALS.includes(Number(d.interval)) && <option value={d.interval}>Every {d.interval} min</option>}
          </select>
        </div>
        <div className="two">
          <div className="field">
            <label htmlFor="qs">Quiet from</label>
            <input id="qs" type="time" value={d.qs} onChange={(e) => set('qs', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="qe">Quiet until</label>
            <input id="qe" type="time" value={d.qe} onChange={(e) => set('qe', e.target.value)} />
          </div>
        </div>
        <p className="fine">{notifLine}</p>
        {dev.supported && dev.permission === 'default' && !(dev.ios && !dev.standalone) && (
          <button type="button" className="btn small" onClick={ask}>Allow notifications</button>
        )}
        <p className="fine">Your reminder choices are saved now. Sending the actual reminders arrives in the next update, and delivery is never 100% guaranteed (phones can delay or silence notifications).</p>
      </section>

      {hasWa && (
        <section className="panel">
          <h2>Billie's WhatsApp (optional)</h2>
          <div className="field">
            <input type="tel" inputMode="numeric" placeholder="Digits with country code" value={d.wa} onChange={(e) => set('wa', e.target.value)} aria-label="Billie's WhatsApp number" />
          </div>
          <p className="fine">Only used to open WhatsApp straight to her chat. Leave empty to pick the chat yourself. For iMessage, use the Share button on the report.</p>
        </section>
      )}

      {err && <p className="msg center-text">{err}</p>}
      {msg && <p className="ok center-text">{msg}</p>}
      <button className="btn big-btn" type="submit" disabled={busy || !dirty}>{busy ? 'Saving…' : 'Save changes'}</button>
      <button type="button" className="link center-text signout" onClick={onSignOut}>Sign out</button>
      <p className="sig center-text">Made with ❤️ w Tajlandii dla Polaka · ทำด้วยความรัก</p>
    </form>
  );
}
