
import { fmt, pctOf, shortDate, timeIn } from './utils.js';

export const BILLIE_SIGNOFF = "I'm happy you're taking care of yourself, handsome. Keep it up. Sending you a little kiss from me. NO MORE HEADACHE😘";


export function statusFor(pct) {
  if (pct >= 100) return 'Goal reached! 🎉';
  if (pct >= 75) return 'Almost there!';
  if (pct >= 50) return 'Halfway and more!';
  if (pct >= 1) return 'A good start!';
  return 'A fresh start tomorrow';
}

const NUDGES = {
  almost: [
    "So close, Misiu! A little more water tomorrow and you've got this. 💧",
    "You were nearly there! Let's get that last little bit tomorrow. 🐻",
    "Almost a hydration champion. One more push tomorrow! 💪",
  ],
  halfway: [
    "Not quite there today, but that's okay. Tomorrow is another chance! ❤️",
    "Halfway is still progress. Let's aim a little higher tomorrow.",
    "A little more water tomorrow, handsome. I believe in you!",
  ],
  low: [
    "Looks like we need to work on that hydration, handsome. Be kind to yourself and try again tomorrow. 🐻",
    "A small start today. Let's give your water bottle a little more attention tomorrow. 💧",
    "Tomorrow's mission: drink a little more water. You've got this, Misiu!",
  ],
  none: [
    "Misiu, your water bottle misses you. Let's give it some attention tomorrow. 😂",
    "Your water bottle would like to see you more often. Just saying. 🥺",
    "A fresh start tomorrow, Misiu. Let's get those first sips in!",
  ],
};

export function nudgeFor(pct, date) {
  if (pct >= 100) return '';

  const group =
    pct >= 75 ? NUDGES.almost :
    pct >= 50 ? NUDGES.halfway :
    pct >= 1 ? NUDGES.low :
    NUDGES.none;

  const day = Number(String(date).slice(-2)) || 1;
  return group[(day - 1) % group.length];
}


export function buildReport({ date, total, goal, logs, tz, bearMessage = '' }) {
  const pct = pctOf(total, goal);
  const sorted = [...logs].sort((a, b) => a.logged_at.localeCompare(b.logged_at));
  return {
    date,
    dateLabel: shortDate(date),
    total,
    goal,
    pct,
    drinks: logs.length,
    status: statusFor(pct),
    nudge: nudgeFor(pct, date),
    bear: bearMessage,
    billie: BILLIE_SIGNOFF,
    timeline: sorted.map((l) => ({ time: timeIn(l.logged_at, tz), ml: l.amount_ml })),
  };
}

export function buildReportText(r) {
  const lines = [
    "MIŚIU'S DAILY REPORT 🐻",
    '',
    `Date: ${r.dateLabel}`,
    '',
    `Water consumed: ${fmt(r.total)} ml`,
    `Daily target: ${fmt(r.goal)} ml`,
    `Achievement: ${r.pct}%`,
    `Drinks logged: ${r.drinks}`,
    '',
    `Status: ${r.status}`,
  ];

  if (r.timeline.length) {
    lines.push('', 'Timeline:', ...r.timeline.map((t) => `${t.time} · ${t.ml} ml`));
  }

  lines.push(
    '',
    'A MESSAGE FROM MY BEAR 🐻',
    r.bear || 'Your message will appear here...',
    '',
    'A LITTLE MESSAGE FROM BILLIE 💌',
    r.billie
  );

  if (r.nudge) {
    lines.push('', 'A LITTLE NUDGE FROM BILLIE 💧', r.nudge);
  }
   return lines.join('\n');
}
export function whatsappUrl(text, number) {
  const to = number ? String(number).replace(/\D/g, '') : '';
  return `https://wa.me/${to}?text=${encodeURIComponent(text)}`;
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    document.body.removeChild(ta);
    return ok;
  }
}

function roundRect(x, px, py, w, h, r) {
  x.beginPath();
  x.moveTo(px + r, py);
  x.arcTo(px + w, py, px + w, py + h, r);
  x.arcTo(px + w, py + h, px, py + h, r);
  x.arcTo(px, py + h, px, py, r);
  x.arcTo(px, py, px + w, py, r);
  x.closePath();
}

function glow(x, cx, cy, r, color) {
  const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g;
  x.fillRect(cx - r, cy - r, r * 2, r * 2);
}

function wrap(x, text, maxW) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (x.measureText(t).width > maxW && line) {
      lines.push(line);
      line = w;
    } else {
      line = t;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function drawReportImage(r) {
  try {
    await Promise.all([
      document.fonts.load('700 40px Fraunces'),
      document.fonts.load('400 30px Nunito'),
      document.fonts.load('700 30px Nunito'),
    ]);
  } catch {}

  const W = 1080;
  const H = 1350;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d');
  const serif = 'Fraunces, Georgia, serif';
  const sans = 'Nunito, system-ui, sans-serif';

  const bg = x.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#0f1b3d');
  bg.addColorStop(1, '#2b2a72');
  x.fillStyle = bg;
  x.fillRect(0, 0, W, H);
  glow(x, 150, 140, 380, 'rgba(205,184,255,0.35)');
  glow(x, 960, 1200, 420, 'rgba(255,194,214,0.30)');

  x.fillStyle = 'rgba(255,255,255,0.09)';
  roundRect(x, 50, 50, W - 100, H - 100, 56);
  x.fill();
  x.strokeStyle = 'rgba(255,255,255,0.25)';
  x.lineWidth = 2;
  x.stroke();

  x.textAlign = 'center';
  x.fillStyle = '#fff6e9';
  x.font = `700 54px ${serif}`;
  x.fillText("MIŚIU'S DAILY REPORT 🐻", W / 2, 150);
  x.fillStyle = '#a9d4ff';
  x.font = `700 34px ${sans}`;
  x.fillText(r.dateLabel, W / 2, 205);

  x.fillStyle = '#ffc2d6';
  x.font = `700 150px ${serif}`;
  x.fillText(`${r.pct}%`, W / 2, 360);

  const bx = 140;
  const bw = W - 280;
  x.fillStyle = 'rgba(255,255,255,0.15)';
  roundRect(x, bx, 395, bw, 28, 14);
  x.fill();

  const fillW = Math.max(0, Math.min(1, r.pct / 100)) * bw;
  if (fillW > 0) {
    const bg2 = x.createLinearGradient(bx, 0, bx + bw, 0);
    bg2.addColorStop(0, '#ffc2d6');
    bg2.addColorStop(1, '#cdb8ff');
    x.fillStyle = bg2;
    roundRect(x, bx, 395, Math.max(fillW, 28), 28, 14);
    x.fill();
  }

  const rows = [
    ['Water consumed', `${fmt(r.total)} ml`],
    ['Daily target', `${fmt(r.goal)} ml`],
    ['Drinks logged', String(r.drinks)],
    ['Status', r.status],
  ];

  rows.forEach(([k, v], i) => {
    const y = 495 + i * 52;
    x.textAlign = 'left';
    x.fillStyle = 'rgba(255,246,233,0.75)';
    x.font = `400 32px ${sans}`;
    x.fillText(k, 150, y);
    x.textAlign = 'right';
    x.fillStyle = '#fff6e9';
    x.font = `700 32px ${sans}`;
    x.fillText(v, W - 150, y);
  });

  x.textAlign = 'left';
  x.fillStyle = '#a9d4ff';
  x.font = `700 30px ${sans}`;
  x.fillText('Timeline', 150, 735);
  x.fillStyle = '#fff6e9';
  x.font = `400 30px ${sans}`;

  if (!r.timeline.length) {
    x.fillText('No drinks logged yet', 150, 782);
  } else {
    let shown = r.timeline;
    let extra = 0;
    if (shown.length > 8) {
      extra = shown.length - 7;
      shown = shown.slice(0, 7);
    }
    const items = shown.map((t) => `${t.time}  ·  ${t.ml} ml`);
    if (extra) items.push(`+${extra} more`);
    items.forEach((s, i) => x.fillText(s, i % 2 ? 580 : 150, 782 + Math.floor(i / 2) * 42));
  }


  x.textAlign = 'center';

  // Bear's message
  x.fillStyle = '#ffc2d6';
  x.font = `700 28px ${sans}`;
  x.fillText('A MESSAGE FROM MY BEAR 🐻', W / 2, 960);

  x.fillStyle = '#fff6e9';
  x.font = `400 28px ${sans}`;
  wrap(x, r.bear || 'Your message will appear here...', 800)
    .slice(0, 2)
    .forEach((l, i) => x.fillText(l, W / 2, 1000 + i * 34));

  // Billie's message
  x.fillStyle = '#cdb8ff';
  x.font = `700 28px ${sans}`;
  x.fillText('A LITTLE MESSAGE FROM BILLIE 💌', W / 2, 1080);

  x.fillStyle = '#fff6e9';
  x.font = `400 26px ${sans}`;
  wrap(x, r.billie, 800)
    .slice(0, 2)
    .forEach((l, i) => x.fillText(l, W / 2, 1120 + i * 32));

  // Gentle nudge, only when the goal isn't reached
  if (r.nudge) {
    x.fillStyle = '#a9d4ff';
    x.font = `700 26px ${sans}`;
    x.fillText('A LITTLE NUDGE FROM BILLIE 💧', W / 2, 1195);

    x.fillStyle = '#fff6e9';
    x.font = `400 25px ${sans}`;
    wrap(x, r.nudge, 800)
      .slice(0, 2)
      .forEach((l, i) => x.fillText(l, W / 2, 1230 + i * 30));
  }

  x.fillStyle = 'rgba(255,246,233,0.6)';
  x.font = `400 20px ${sans}`;
  x.fillText('Made with ❤️ w Tajlandii dla Polaka · ทำด้วยความรัก', W / 2, 1300);

  return new Promise((res) => c.toBlob(res, 'image/png'));
}
