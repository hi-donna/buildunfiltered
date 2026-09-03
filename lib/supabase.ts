import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Browser-side Supabase client. The site is a static export, so there is no
// server of ours: the anon key is public by design and every table is
// protected by row-level security (supabase/schema.sql). Both values are
// inlined at build time from NEXT_PUBLIC_* env vars; when they are absent the
// account page says so instead of failing.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const authConfigured = Boolean(url && anon);

let client: SupabaseClient | null = null;
export function supabase(): SupabaseClient | null {
  if (!authConfigured) return null;
  if (!client) client = createClient(url!, anon!, { auth: { persistSession: true, autoRefreshToken: true } });
  return client;
}

export interface Profile { id: string; codename: string; phone: string | null; email: string | null }

// E.164: a plus, then 8 to 15 digits, no leading zero.
export const normalisePhone = (raw: string) => raw.replace(/[\s\-().]/g, "");
export const isE164 = (p: string) => /^\+[1-9]\d{7,14}$/.test(p);
export const isEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
export const maskPhone = (p: string) => p.replace(/^(\+\d{2})\d+(\d{3})$/, "$1 ••• $2");
