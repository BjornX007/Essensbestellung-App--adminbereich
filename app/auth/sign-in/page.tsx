"use client";

import { useState } from "react";
import { authClient } from "@/app/lib/auth/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "E-Mail oder Passwort ist falsch.",
  USER_NOT_FOUND: "Kein Konto mit dieser E-Mail gefunden.",
  INVALID_PASSWORD: "Das Passwort ist falsch.",
  TOO_MANY_REQUESTS: "Zu viele Versuche. Bitte warte kurz und versuche es erneut.",
  EMAIL_NOT_VERIFIED: "Bitte bestätige zuerst deine E-Mail-Adresse.",
  ACCOUNT_DISABLED: "Dieses Konto wurde deaktiviert.",
};

function friendlyError(message?: string): string {
  if (!message) return "Anmeldung fehlgeschlagen. Bitte versuche es erneut.";
  const upper = message.toUpperCase().replace(/\s+/g, "_");
  for (const key of Object.keys(ERROR_MESSAGES)) {
    if (upper.includes(key)) return ERROR_MESSAGES[key];
  }
  // Fallback — show the raw message if we don't recognise it
  return message;
}

function resolveRedirect(role: string, callbackUrl: string | null): string | null {
  const ADMIN_PREFIXES = ["/dashboard", "/orders", "/products", "/settings", "/users", "/lieferant"];
  const DRIVER_PREFIXES = ["/driver"];

  if (role === "admin") {
    if (callbackUrl && ADMIN_PREFIXES.some((p) => callbackUrl.startsWith(p))) {
      return callbackUrl;
    }
    return "/dashboard";
  }

  if (role === "driver") {
    if (callbackUrl && DRIVER_PREFIXES.some((p) => callbackUrl.startsWith(p))) {
      return callbackUrl;
    }
    return "/driver";
  }

  return null; // no access
}

export default function SignInPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    let data, signinError;
    try {
      ({ data, error: signinError } = await authClient.signIn.email({
        email: formData.get("email") as string,
        password: formData.get("password") as string,
      }));
    } catch {
      setError("Verbindungsfehler. Bitte überprüfe deine Internetverbindung.");
      setLoading(false);
      return;
    }

    if (signinError) {
      setError(friendlyError(signinError.message));
      setLoading(false);
      return;
    }

    const role = (data?.user as { role?: string } | undefined)?.role ?? "user";
    const redirect = resolveRedirect(role, callbackUrl);

    if (redirect) {
      router.push(redirect);
      return;
    }

    // Role has no access — sign them back out immediately
    await authClient.signOut();
    setError("Dein Konto hat keinen Zugriff auf diese Anwendung. Bitte wende dich an den Administrator.");
    setLoading(false);
  }

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .si-wrapper {
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          background: #f4f6f9;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .si-card {
          width: 100%;
          max-width: 380px;
          background: #fff;
          border: 1px solid #e8ecf0;
          border-radius: 16px;
          padding: 2rem 1.75rem;
          box-shadow: 0 4px 24px rgba(0,0,0,.06);
        }

        .si-logo {
          width: 40px;
          height: 40px;
          background: #111827;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.25rem;
        }

        .si-title {
          font-size: 1.4rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.5px;
          margin-bottom: 0.25rem;
        }

        .si-subtitle {
          font-size: 0.875rem;
          color: #94a3b8;
          margin-bottom: 1.75rem;
          font-weight: 500;
        }

        .si-field {
          margin-bottom: 1rem;
        }

        .si-label {
          display: block;
          font-size: 0.8rem;
          font-weight: 700;
          color: #374151;
          margin-bottom: 0.4rem;
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }

        .si-input {
          display: block;
          width: 100%;
          padding: 0.65rem 0.875rem;
          border: 1.5px solid #e2e8f0;
          border-radius: 9px;
          font-size: max(1rem, 16px);
          color: #0f172a;
          background: #f8fafc;
          transition: border-color .15s, background .15s, box-shadow .15s;
          -webkit-appearance: none;
          appearance: none;
          font-family: inherit;
        }

        .si-input:focus {
          outline: none;
          border-color: #6366f1;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(99,102,241,.12);
        }

        .si-input.error {
          border-color: #fca5a5;
          background: #fff;
        }

        .si-error {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 9px;
          padding: 0.75rem 0.875rem;
          margin-bottom: 1rem;
          color: #dc2626;
          font-size: 0.875rem;
          font-weight: 500;
          line-height: 1.45;
          animation: si-shake .3s ease;
        }

        .si-error-icon { flex-shrink: 0; margin-top: 1px; }

        @keyframes si-shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-4px); }
          40%      { transform: translateX(4px); }
          60%      { transform: translateX(-3px); }
          80%      { transform: translateX(3px); }
        }

        .si-button {
          width: 100%;
          padding: 0.75rem;
          background: #111827;
          color: #fff;
          border: none;
          border-radius: 9px;
          font-size: 0.9375rem;
          font-weight: 700;
          cursor: pointer;
          touch-action: manipulation;
          min-height: 46px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background .15s, opacity .15s;
          font-family: inherit;
          letter-spacing: -0.1px;
          margin-top: 0.25rem;
        }

        .si-button:disabled { opacity: 0.6; cursor: not-allowed; }
        .si-button:not(:disabled):hover { background: #1e293b; }
        .si-button:not(:disabled):active { background: #0f172a; }

        .si-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: si-spin .65s linear infinite;
          flex-shrink: 0;
        }

        @keyframes si-spin { to { transform: rotate(360deg); } }

        .si-footer {
          margin-top: 1.25rem;
          text-align: center;
          font-size: 0.875rem;
          color: #64748b;
        }

        .si-footer a {
          color: #6366f1;
          font-weight: 600;
          text-decoration: none;
        }

        .si-footer a:hover { text-decoration: underline; }
      `}</style>

      <div className="si-wrapper">
        <div className="si-card">
          <div className="si-logo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/><path d="M7 2v20"/>
              <path d="M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>
            </svg>
          </div>

          <h1 className="si-title">Willkommen zurück</h1>
          <p className="si-subtitle">Melde dich bei deinem Konto an</p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="si-field">
              <label className="si-label" htmlFor="signin-email">E-Mail</label>
              <input
                id="signin-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className={`si-input${error ? " error" : ""}`}
                placeholder="name@beispiel.de"
                suppressHydrationWarning
              />
            </div>

            <div className="si-field">
              <label className="si-label" htmlFor="signin-password">Passwort</label>
              <input
                id="signin-password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className={`si-input${error ? " error" : ""}`}
                placeholder="••••••••"
                suppressHydrationWarning
              />
            </div>

            {error && (
              <div className="si-error" role="alert">
                <svg className="si-error-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="si-button"
              suppressHydrationWarning
            >
              {loading ? (
                <>
                  <span className="si-spinner" />
                  Anmelden…
                </>
              ) : (
                "Anmelden"
              )}
            </button>
          </form>

          <p className="si-footer">
            Noch kein Konto?{" "}
            <Link href="/auth/sign-up">Registrieren</Link>
          </p>
        </div>
      </div>
    </>
  );
}