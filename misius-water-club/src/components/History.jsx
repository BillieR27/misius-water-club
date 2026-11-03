import { useMemo } from 'react';
import { addDays, dayOfMonth, fmt, litres, mondayIndex, pctOf, shortDate, weekdayShort } from '../utils.js';

function dotClass(d, goal) {
  if (!d.count) return '';
  const p = pctOf(d.total, goal);
  return p >= 100 ? 'full' : p >= 50 ? 'mid' : 'low';
}

export default function History({ logs, settings, today }) {
  const goal = settings.daily_goal_ml;

  const days = useMemo(() => {
    const map = {};
    logs.forEach((l) => {
      if (!map[l.local_date]) map[l.local_date] = { total: 0, count: 0 };
      map[l.local_date].total += l.amount_ml;
      map[l.local_date].count += 1;
    });
    return Array.from({ length: 30 }, (_, i) => {
      const date = addDays(today, i - 29);
      const m = map[date] || { total: 0, count: 0 };
      return { date, total: m.total, count: m.count };
    });
  }, [logs, today]);

  const week = days.slice(-7);
  const logged = days.filter((d) => d.count > 0);
  const reached = logged.filter((d) => d.total >= goal).length;
  const avg = logged.length ? Math.round(logged.reduce((s, d) => s + d.total, 0) / logged.length) : 0;
  const rate = logged.length ? Math.round((reached / logged.length) * 100) : 0;

  let best = 0;
  let run = 0;
  days.forEach((d) => {
    run = d.total >= goal ? run + 1 : 0;
    best = Math.max(best, run);
  });

  const max = Math.max(goal, ...week.map((d) => d.total)) * 1.1;
  const goalBottom = (goal / max) * 100;
  const offset = mondayIndex(days[0].date);

  return (
    <>
      <header className="hello">
        <p className="date">Your journey</p>
        <h1>History 📊</h1>
        <p className="pl">Every sip counts, even on slow days. ❤️</p>
      </header>

      <section className="panel">
        <h2>This week</h2>
        <div className="bars">
          <div className="goal-line" style={{ bottom: `${goalBottom}%` }}><span>goal</span></div>
          {week.map((d) => (
            <div className="col" key={d.date}>
              <i className={`b ${d.total >= goal ? 'hit' : ''} ${d.date === today ? 'now' : ''}`} style={{ height: `${Math.max(2, (d.total / max) * 100)}%` }} />
            </div>
          ))}
        </div>
        <div className="labels">
          {week.map((d) => (
            <div key={d.date}>
              <b>{weekdayShort(d.date)}</b>
              <small>{d.count ? `${litres(d.total)}L` : '–'}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Last 30 days</h2>
        <div className="chips three">
          <div><b>{fmt(avg)}</b><small>avg ml / day</small></div>
          <div><b>{rate}%</b><small>goal reached</small></div>
          <div><b>{best}</b><small>best streak 🔥</small></div>
        </div>
        <div className="cal head">{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((l, i) => <span key={i}>{l}</span>)}</div>
        <div className="cal">
          {Array.from({ length: offset }, (_, i) => <span key={`e${i}`} />)}
          {days.map((d) => (
            <span key={d.date} className={`dot ${dotClass(d, goal)} ${d.date === today ? 'today' : ''}`} title={`${shortDate(d.date)}: ${d.total} ml`}>
              {dayOfMonth(d.date)}
            </span>
          ))}
        </div>
        <p className="legend"><i className="dot low" /> some <i className="dot mid" /> over half <i className="dot full" /> goal reached</p>
        <p className="fine">Streaks and goal rates use your current daily goal.</p>
      </section>

      <section className="panel">
        <h2>Day by day</h2>
        {logged.length === 0 ? (
          <p className="empty">Your first day will show up here. 🐻</p>
        ) : (
          <ul className="days">
            {[...logged].reverse().map((d) => (
              <li key={d.date}>
                <span>{shortDate(d.date)}</span>
                <b>{fmt(d.total)} ml</b>
                <small>{pctOf(d.total, goal)}% · {d.count} {d.count === 1 ? 'drink' : 'drinks'}</small>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
