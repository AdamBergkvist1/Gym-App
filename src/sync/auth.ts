/**
 * Inloggning. Uppgift 7.2–7.3.
 *
 * DEN VIKTIGASTE REGELN I HELA FILEN: ingenting här får någonsin blockera
 * loggningsvägen. JWT:n går ut efter en timme och kan bara förnyas med nät. En
 * app som visar inloggningsskärm när token gått ut är obrukbar i en källare.
 *
 * Därför: `getSupabase()` returnerar null utan konfiguration, sessionen läses
 * bara av synkmotorn, och `TodayPage` frågar aldrig efter den. En utgången
 * token påverkar exakt en sak — att kön inte töms förrän nätet är tillbaka.
 */

import { getSupabase } from './supabase';

export interface AuthState {
  configured: boolean;
  signedIn: boolean;
  email: string | null;
}

export async function getAuthState(): Promise<AuthState> {
  const client = getSupabase();
  if (!client) return { configured: false, signedIn: false, email: null };

  const { data } = await client.auth.getSession();
  return {
    configured: true,
    signedIn: data.session !== null,
    email: data.session?.user.email ?? null,
  };
}

export async function signIn(email: string, password: string): Promise<string | null> {
  const client = getSupabase();
  if (!client) return 'Synk är inte konfigurerad i den här versionen.';

  const { error } = await client.auth.signInWithPassword({ email, password });
  return error ? error.message : null;
}

export async function signOut(): Promise<void> {
  const client = getSupabase();
  if (!client) return;
  await client.auth.signOut();
}

export function onAuthChange(fn: () => void): () => void {
  const client = getSupabase();
  if (!client) return () => undefined;
  const { data } = client.auth.onAuthStateChange(() => fn());
  return () => data.subscription.unsubscribe();
}
