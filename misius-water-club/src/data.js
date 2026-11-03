// All Supabase reads/writes. Row-level security means every query only ever sees the signed-in user's rows.
import { supabase } from './supabase.js';

export async function fetchSettings(userId) {
  const { data, error } = await supabase.from('settings').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  if (data) return data;
  // Safety net for accounts created before the signup trigger existed.
  const created = await supabase.from('settings').insert({ user_id: userId }).select('*').single();
  if (created.error) throw created.error;
  return created.data;
}

export async function saveSettings(userId, patch) {
  const { data, error } = await supabase
    .from('settings')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function fetchBillieMessages() {
  const { data, error } = await supabase.from('billie_messages').select('id, body, milestone').order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function fetchLogs(fromDate) {
  const { data, error } = await supabase
    .from('water_logs')
    .select('id, amount_ml, logged_at, local_date')
    .gte('local_date', fromDate)
    .order('logged_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addLog(userId, amountMl) {
  // local_date is filled in by a database trigger using the user's timezone.
  const { data, error } = await supabase
    .from('water_logs')
    .insert({ user_id: userId, amount_ml: amountMl })
    .select('id, amount_ml, logged_at, local_date')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteLog(id) {
  const { error } = await supabase.from('water_logs').delete().eq('id', id);
  if (error) throw error;
}

export async function saveReport(userId, r) {
  const base = { user_id: userId, report_date: r.date, total_ml: r.total, goal_ml: r.goal, drinks: r.drinks };
  const full = {
    ...base,
    payload: { pct: r.pct, status: r.status, bear: r.bear, timeline: r.timeline },
    shared_at: new Date().toISOString(),
  };
  const opts = { onConflict: 'user_id,report_date' };
  let { error } = await supabase.from('reports').upsert(full, opts);
  if (error) {
    // Older schema (migration 002 not run yet): still save the essentials.
    const retry = await supabase.from('reports').upsert(base, opts);
    error = retry.error;
  }
  if (error) throw error;
}
