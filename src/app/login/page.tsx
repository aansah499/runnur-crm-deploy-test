'use client';

import { useState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { login, verifyMfa } from './actions';
import { Shield, Loader2, AlertCircle, KeyRound } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

function SubmitButton({ label, loadingLabel }: { label: string, loadingLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3 px-4 bg-brand text-black font-semibold rounded-lg hover:bg-brand-hover transition-colors shadow-lg shadow-brand/10 disabled:opacity-50 flex justify-center items-center gap-2"
    >
      {pending ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          {loadingLabel}
        </>
      ) : (
        label
      )}
    </button>
  );
}

export default function LoginPage() {
  const [errorMessage, setErrorMessage] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);
  const [checkingMfa, setCheckingMfa] = useState(true);

  useEffect(() => {
    const checkMfaStatus = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aalData?.nextLevel === 'aal2' && aalData?.currentLevel === 'aal1') {
          setMfaRequired(true);
        }
      }
      setCheckingMfa(false);
    };
    checkMfaStatus();
  }, []);

  async function handleLogin(formData: FormData) {
    setErrorMessage('');
    const res = await login(formData);
    if (res?.error) {
      setErrorMessage(res.error);
    } else if (res?.mfaRequired) {
      setMfaRequired(true);
    }
  }

  async function handleMfa(formData: FormData) {
    setErrorMessage('');
    const res = await verifyMfa(formData);
    if (res?.error) {
      setErrorMessage(res.error);
    }
  }

  if (checkingMfa) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      {/* Background decorations matching the app style */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand/10 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-brand/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 mb-6 relative group">
            <div className="absolute inset-0 bg-brand/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
            {mfaRequired ? (
              <KeyRound className="w-8 h-8 text-brand relative z-10" />
            ) : (
              <Shield className="w-8 h-8 text-brand relative z-10" />
            )}
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-3">
            {mfaRequired ? 'Two-Factor Authentication' : 'Runnur CRM'}
          </h1>
          <p className="text-zinc-400">
            {mfaRequired ? 'Enter the code from your authenticator app' : 'Sign in to access your dashboard'}
          </p>
        </div>

        <div className="glass-panel rounded-3xl p-8 backdrop-blur-xl bg-zinc-900/50 border border-zinc-800/50 shadow-2xl">
          {mfaRequired ? (
            <form action={handleMfa} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300 block" htmlFor="code">
                  6-Digit Code
                </label>
                <input
                  id="code"
                  name="code"
                  type="text"
                  autoComplete="one-time-code"
                  required
                  placeholder="000000"
                  pattern="\d{6}"
                  maxLength={6}
                  className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all tracking-[0.5em] text-center text-lg"
                />
              </div>

              {errorMessage && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-sm">{errorMessage}</p>
                </div>
              )}

              <SubmitButton label="Verify & Sign In" loadingLabel="Verifying..." />
            </form>
          ) : (
            <form action={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300 block" htmlFor="email">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="admin@example.com"
                  className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-zinc-300" htmlFor="password">
                    Password
                  </label>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
                />
              </div>

              {errorMessage && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-sm">{errorMessage}</p>
                </div>
              )}

              <SubmitButton label="Sign In" loadingLabel="Signing in..." />
            </form>
          )}
        </div>
        
        <p className="text-center text-sm text-zinc-500 mt-8">
          Protected by Supabase Authentication
        </p>
      </div>
    </div>
  );
}
