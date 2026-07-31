import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase-klienten. Uppgift 7.1.
 *
 * Returnerar null när miljövariablerna saknas. Det är inte ett fel — appen
 * SKA fungera fullt ut utan backend. Saknad konfiguration betyder "synk är
 * avstängd", inte "appen är trasig".
 *
 * Enbart publishable-nyckeln får finnas här. Den är publik by design och
 * skyddas av RLS. Secret-nyckeln kringgår RLS helt och får aldrig i en
 * VITE_-variabel — allt med det prefixet bakas in i det publika bygget.
 */

let cached: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached;

  const url = import.meta.env['VITE_SUPABASE_URL'];
  const key = import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'];

  if (typeof url !== 'string' || typeof key !== 'string' || url === '' || key === '') {
    console.info('[sync] Supabase är inte konfigurerat — appen körs helt lokalt.');
    cached = null;
    return null;
  }

  cached = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // Vi har inga OAuth-återhopp; att leta i URL:en ger bara brus.
      detectSessionInUrl: false,
    },
  });
  return cached;
}

export function isSyncConfigured(): boolean {
  return getSupabase() !== null;
}
