import { useMemo, useState } from 'react';
import { saveReport } from '../data.js';
import { BILLIE_SIGNOFF, buildReport, buildReportText, copyText, drawReportImage, whatsappUrl } from '../reportTools.js';
import { fmt, sumMl } from '../utils.js';

export default function Report({ settings, tz, today, logs, userId }) {
  const total = sumMl(logs);
  const report = useMemo(
    () => buildReport({ date: today, total, goal: settings.daily_goal_ml, logs, tz }),
    [today, total, settings.daily_goal_ml, logs, tz]
  );
  const text = useMemo(() => buildReportText(report), [report]);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const number = settings.billie_whatsapp || '';

  async function send() {
    setBusy(true);
    setNote('');
    try {
      await saveReport(userId, report);
    } catch {
      setNote("Couldn't save this report to the cloud, but you can still send it below.");
    }
    setBusy(false);
    setSent(true);
  }

  async function nativeShare() {
    try {
      await navigator.share({ title: "Misiu's Daily Report", text });
    } catch (e) {
      if (e.name !== 'AbortError') setNote("Couldn't open the share sheet. Try Copy instead.");
    }
  }

  async function copy() {
    setNote((await copyText(text)) ? 'Copied! Paste it into iMessage 📋' : "Couldn't copy. Long-press the preview to select it.");
  }

  async function image() {
    setNote('');
    try {
      const blob = await drawReportImage(report);
      const file = new File([blob], `misiu-report-${report.date}.png`, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "Misiu's Daily Report" });
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch (e) {
      if (e.name !== 'AbortError') setNote("Couldn't make the image on this device. Try Copy instead.");
    }
  }

  return (
    <>
      <header className="hello">
        <p className="date">{report.dateLabel}</p>
        <h1>Daily report 💌</h1>
        <p className="pl">Send Billie a little update, any time today.</p>
      </header>

      <section className="panel rcard">
        <h2>MIŚIU'S DAILY REPORT 🐻</h2>
        <div className="rbig">{report.pct}%</div>
        <div className="bar"><i style={{ width: `${Math.min(report.pct, 100)}%` }} /></div>
        <dl>
          <div><dt>Water consumed</dt><dd>{fmt(report.total)} ml</dd></div>
          <div><dt>Daily target</dt><dd>{fmt(report.goal)} ml</dd></div>
          <div><dt>Drinks logged</dt><dd>{report.drinks}</dd></div>
          <div><dt>Status</dt><dd>{report.status}</dd></div>
        </dl>
        {report.timeline.length > 0 && (
          <div className="rtime">
            {report.timeline.map((t, i) => <span key={i}>{t.time} · {t.ml} ml</span>)}
          </div>
        )}
        <p className="rlabel">Message from your bear</p>
        <p className="rquote">“{report.bear}”</p>
        <p className="rlabel">A little message from Billie</p>
        <p className="rquote">“{BILLIE_SIGNOFF}”</p>
      </section>

      {!sent ? (
        <button type="button" className="btn big-btn" onClick={send} disabled={busy}>
          {busy ? 'Saving…' : 'SEND MY REPORT TO BILLIE ❤️'}
        </button>
      ) : (
        <section className="panel">
          <h2>Choose how to send 💌</h2>
          <div className="share">
            {canShare && <button type="button" className="btn" onClick={nativeShare}>📤 Share (iMessage, etc.)</button>}
            <a className="btn" href={whatsappUrl(text, number)} target="_blank" rel="noopener noreferrer">💬 WhatsApp</a>
            <button type="button" className="btn" onClick={copy}>📋 Copy text</button>
            <button type="button" className="btn" onClick={image}>🖼️ Image</button>
          </div>
          {!number && <p className="fine">WhatsApp will let you pick the chat. Add Billie's number in Settings to open it directly.</p>}
        </section>
      )}
      {note && <p className="msg center-text">{note}</p>}
      <p className="sig center-text">Made with ❤️ w Tajlandii dla Polaka · ทำด้วยความรัก</p>
    </>
  );
}
