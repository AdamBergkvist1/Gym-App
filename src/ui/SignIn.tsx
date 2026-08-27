import { useEffect, useState } from 'react';
import { getAuthState, onAuthChange, signIn, signOut, type AuthState } from '../sync/auth';
import { syncNow } from '../sync/engine';

/**
 * Inloggning. Uppgift 7.2.
 *
 * Ligger under Inställningar och ingen annanstans. Den får aldrig hamna i
 * loggningsvägen: appen ska fungera fullt ut utloggad, och en utgången token
 * ska påverka exakt en sak — att kön inte töms förrän nätet är tillbaka.
 */
export function SignIn() {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    const uppdatera = () => {
      void getAuthState().then((s) => {
        if (alive) setAuth(s);
      });
    };
    uppdatera();
    const av = onAuthChange(uppdatera);
    return () => {
      alive = false;
      av();
    };
  }, []);

  if (auth === null) return null;

  if (!auth.configured) {
    return (
      <p className="text-sm text-[var(--color-dim)]">
        Ingen backend är konfigurerad i den här versionen. Appen sparar allt lokalt.
      </p>
    );
  }

  if (auth.signedIn) {
    return (
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0 truncate text-sm">{auth.email}</span>
        <button
          type="button"
          onClick={() => void signOut()}
          className="min-h-0 rounded-md border border-[var(--color-line-strong)] px-3 py-1 text-sm text-[var(--color-dim)]"
        >
          Logga ut
        </button>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const fel = await signIn(email.trim(), password);
    setBusy(false);
    if (fel) {
      setError(fel);
      return;
    }
    setPassword('');
    void syncNow();
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="E-post"
        autoComplete="username"
        inputMode="email"
        className="w-full rounded-lg border border-[var(--color-line-strong)] bg-[var(--color-bg)] px-3"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Lösenord"
        autoComplete="current-password"
        className="w-full rounded-lg border border-[var(--color-line-strong)] bg-[var(--color-bg)] px-3"
      />
      <button
        type="submit"
        disabled={busy || email === '' || password === ''}
        className="w-full rounded-lg bg-[var(--color-fg)] font-semibold text-[var(--color-bg)] disabled:opacity-40"
      >
        {busy ? 'Loggar in…' : 'Logga in'}
      </button>
      {error !== null && <p className="text-sm text-[var(--color-warn-text)]">{error}</p>}
      <p className="text-xs text-[var(--color-dim)]">
        Inloggning behövs bara för synk. Loggningen fungerar utan.
      </p>
    </form>
  );
}
