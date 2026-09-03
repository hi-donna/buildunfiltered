"use client";
import { useEffect, useRef, useState } from "react";
import { supabase, authConfigured, normalisePhone, isE164, isEmail, maskPhone, type Profile } from "@/lib/supabase";

// Sign in and sign up are one flow: phone → 6-digit code by SMS. No password.
// A phone that has not been seen before becomes an account on the first
// successful code; the database hands it the next codename. First time in, we
// ask for an email and store it on the profile. After that, phone + code only.

type Step = "loading" | "phone" | "code" | "email" | "done" | "unconfigured";

export default function AccountFlow() {
  const [step, setStep] = useState<Step>("loading");
  const [phone, setPhone] = useState("+91 ");
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

  const sb = supabase();
  // Supabase's messages are fine to show as they are; the one we rewrite is
  // the browser's bare network failure.
  const said = (e: { message: string }) =>
    /failed to fetch|networkerror|load failed/i.test(e.message) ? "Could not reach the sign-in service. Check your connection and try again." : e.message;

  // Resume a session if there is one.
  useEffect(() => {
    if (!sb) { setStep("unconfigured"); return; }
    let live = true;
    (async () => {
      const { data } = await sb.auth.getSession();
      if (!live) return;
      if (data.session) await loadProfile();
      else setStep("phone");
    })();
    const { data: sub } = sb.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") { setProfile(null); setStep("phone"); }
    });
    return () => { live = false; sub.subscription.unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function loadProfile() {
    if (!sb) return;
    const { data: u } = await sb.auth.getUser();
    if (!u.user) { setStep("phone"); return; }
    // The profile row is created by a database trigger on sign-up; give it a
    // moment on a brand-new account.
    for (let i = 0; i < 5; i++) {
      const { data } = await sb.from("profiles").select("id, codename, phone, email").eq("id", u.user.id).maybeSingle();
      if (data) {
        setProfile(data as Profile);
        setStep(data.email ? "done" : "email");
        return;
      }
      await new Promise((r) => setTimeout(r, 400));
    }
    setError("Your account was created but its profile has not appeared yet. Reload in a moment.");
    setStep("phone");
  }

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    if (!sb) return;
    const p = normalisePhone(phone);
    if (!isE164(p)) { setError("Enter the number with its country code, like +91 98765 43210."); return; }
    setBusy(true); setError(null);
    const { error } = await sb.auth.signInWithOtp({ phone: p });
    setBusy(false);
    if (error) { setError(said(error)); return; }
    setPhone(p);
    setStep("code");
    setCooldown(30);
    setTimeout(() => codeRef.current?.focus(), 0);
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (!sb) return;
    if (!/^\d{6}$/.test(code)) { setError("The code is six digits."); return; }
    setBusy(true); setError(null);
    const { error } = await sb.auth.verifyOtp({ phone, token: code, type: "sms" });
    setBusy(false);
    if (error) { setError(said(error)); return; }
    setCode("");
    await loadProfile();
  }

  async function saveEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!sb || !profile) return;
    const em = email.trim().toLowerCase();
    if (!isEmail(em)) { setError("That does not look like an email address."); return; }
    setBusy(true); setError(null);
    const { error } = await sb.from("profiles").update({ email: em }).eq("id", profile.id);
    setBusy(false);
    if (error) { setError(said(error)); return; }
    setProfile({ ...profile, email: em });
    setStep("done");
  }

  async function signOut() {
    if (!sb) return;
    setBusy(true);
    await sb.auth.signOut();
    setBusy(false);
    setPhone("+91 "); setCode(""); setEmail(""); setError(null);
  }

  if (step === "loading") return <p className="auth-note">Checking for a session…</p>;

  if (step === "unconfigured") {
    return (
      <div className="auth-card">
        <p className="eyebrow">Not switched on</p>
        <p>Sign-in needs the Supabase project keys at build time. See <code>supabase/README.md</code>.</p>
      </div>
    );
  }

  if (step === "done" && profile) {
    return (
      <div className="auth-card">
        <p className="eyebrow">Signed in</p>
        <h2 className="auth-codename">{profile.codename}</h2>
        <p className="auth-note">Your name here. It was the next one on the list; it is yours now.</p>
        <dl className="meta auth-meta">
          <div><dt>Phone</dt><dd>{profile.phone ? maskPhone(profile.phone) : "—"}</dd></div>
          <div><dt>Email</dt><dd>{profile.email ?? "—"}</dd></div>
        </dl>
        <button type="button" className="auth-button auth-button-quiet" onClick={signOut} disabled={busy}>Sign out</button>
      </div>
    );
  }

  return (
    <div className="auth-card">
      {step === "phone" && (
        <form onSubmit={sendCode} className="auth-form">
          <p className="eyebrow">Sign in or sign up</p>
          <label className="auth-label" htmlFor="auth-phone">Phone number</label>
          <input
            id="auth-phone" className="auth-input" type="tel" inputMode="tel" autoComplete="tel"
            value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" required
          />
          <p className="auth-hint">We text you a six-digit code. No password, ever. New number, new account.</p>
          <button type="submit" className="auth-button" disabled={busy}>{busy ? "Sending…" : "Send code"}</button>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={verify} className="auth-form">
          <p className="eyebrow">Check your phone</p>
          <p className="auth-note">Code sent to <span className="mono">{maskPhone(phone)}</span>.</p>
          <label className="auth-label" htmlFor="auth-code">Six-digit code</label>
          <input
            ref={codeRef} id="auth-code" className="auth-input auth-input-code" type="text" inputMode="numeric"
            autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6}
            value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} required
          />
          <div className="auth-row">
            <button type="submit" className="auth-button" disabled={busy}>{busy ? "Checking…" : "Confirm"}</button>
            <button type="button" className="auth-button auth-button-quiet" disabled={busy || cooldown > 0} onClick={() => sendCode()}>
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
            </button>
            <button type="button" className="auth-link" onClick={() => { setStep("phone"); setCode(""); setError(null); }}>
              Wrong number
            </button>
          </div>
        </form>
      )}

      {step === "email" && profile && (
        <form onSubmit={saveEmail} className="auth-form">
          <p className="eyebrow">Welcome, {profile.codename}</p>
          <p className="auth-note">One more thing for a new account: an email we can reach you on.</p>
          <label className="auth-label" htmlFor="auth-email">Email</label>
          <input
            id="auth-email" className="auth-input" type="email" inputMode="email" autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required
          />
          <button type="submit" className="auth-button" disabled={busy}>{busy ? "Saving…" : "Save and finish"}</button>
        </form>
      )}

      {error && <p className="auth-error" role="alert">{error}</p>}
    </div>
  );
}
