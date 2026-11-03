// All of the bear's and Billie's words live here. Polish phrases are written for Billie speaking to Karol.

export function greetingFor(hour) {
  if (hour >= 5 && hour < 12) return { en: 'Good morning, Misiu! ☀️', pl: 'Dzień dobry, Misiaczku!', tr: 'Good morning, little bear' };
  if (hour >= 12 && hour < 17) return { en: 'Hello, handsome! 🌤️', pl: 'Miłego popołudnia, Misiu!', tr: 'Have a lovely afternoon, Misiu' };
  if (hour >= 17 && hour < 21) return { en: 'Good evening, Misiu 🌙', pl: 'Dobry wieczór, Misiu!', tr: 'Good evening, Misiu' };
  return { en: 'Still up, Misiu? 🌟', pl: 'Dobranoc, Misiu!', tr: 'Good night, Misiu' };
}

const LOW = [
  { en: 'Misiuuu, drink some water!', pl: 'Misiuuu, napij się wody!' },
  { en: 'Your bear is getting thirsty.', pl: 'Twój miś robi się spragniony.' },
  { en: 'Stop being busy for two seconds and drink some water, handsome. ❤️', pl: 'Przestań być zajęty na dwie sekundy i napij się wody. ❤️' },
  { en: "Don't forget to drink water! ❤️", pl: 'Nie zapomnij pić wody! ❤️' },
  { en: 'Drink water, darling!', pl: 'Pij wodę, kochanie!' },
];
const MID = [
  { en: 'Good boy! Keep going!', pl: 'Tak trzymaj!' },
  { en: "I'm proud of you!", pl: 'Jestem z Ciebie dumna!' },
  { en: 'Your Thai girl is proud of you.', pl: 'Twoja tajska dziewczyna jest z Ciebie dumna.' },
  { en: 'Just a little more, handsome!', pl: 'Jeszcze troszkę, przystojniaku!' },
  { en: "You're doing so well, Misiu!", pl: 'Świetnie Ci idzie, Misiu!' },
];
const DONE = [
  { en: 'Champion bear approves. 🏆', pl: 'Miś-mistrz jest zachwycony!' },
  { en: 'You did it, handsome!', pl: 'Udało się, kochanie!' },
  { en: 'Your bear is doing a happy dance!', pl: 'Miś tańczy z radości!' },
];
const ANY = [
  { en: 'Take care of yourself!', pl: 'Dbaj o siebie!' },
  { en: 'Kisses from Thailand. 😘', pl: 'Buziaki z Tajlandii! 😘' },
  { en: 'You are my favourite notification.', pl: null },
];

export function pickDifferent(list, prev) {
  if (!list.length) return null;
  if (list.length === 1) return list[0];
  let next;
  do {
    next = list[Math.floor(Math.random() * list.length)];
  } while (next === prev);
  return next;
}

export function pickTap(pct, prev) {
  const pool = [...ANY, ...(pct >= 100 ? DONE : pct >= 50 ? MID : LOW)];
  return pickDifferent(pool, prev);
}

export const MILESTONES = {
  first: { key: 'first_sip', title: 'First sip! 💧', en: "Your first sip of the day. I'm already proud of you!", pl: 'Pierwszy łyk! Już jestem z Ciebie dumna!' },
  25: { key: 'p25', title: 'Little bear is waking up 🐻', en: 'A quarter of the way there!', pl: 'Już ćwierć drogi za Tobą!' },
  50: { key: 'p50', title: 'Halfway hero! 🌟', en: 'Halfway there, handsome!', pl: 'Połowa za Tobą, Misiu!' },
  75: { key: 'p75', title: 'Almost there! 💕', en: 'Just a little more!', pl: 'Jeszcze troszkę!' },
  100: { key: 'p100', title: 'Hydration Champion! 🏆', en: 'Goal reached! Your bear is celebrating.', pl: 'Cel osiągnięty! Brawo, Misiu!' },
};

// Used only if the database has no messages yet. Stage 3 adds editing.
export const DEFAULT_BILLIE = [
  'I wish I could bring you a glass of water right now.',
  "If I were there, I'd be personally supervising your hydration.",
  'Your favourite Thai girl is thinking about you.',
  'Drink water, eat properly and take care of yourself for me.',
  "Even when I'm not there, I'm still looking after you.",
  'You are my favourite notification.',
  'A little reminder that someone in Thailand loves you.',
];
