'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { login } from './actions';
import { Shield, Loader2, AlertCircle } from 'lucide-react';

function SubmitButton() {
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
          Signing in...
        </>
      ) : (
        'Sign In'
      )}
    </button>
  );
}

export default function LoginPage() {
  const [errorMessage, setErrorMessage] = useState('');

  async function handleLogin(formData: FormData) {
    setErrorMessage('');
    const res = await login(formData);
    if (res?.error) {
      setErrorMessage(res.error);
    }
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
            <Shield className="w-8 h-8 text-brand relative z-10" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-3">Runnur CRM</h1>
          <p className="text-zinc-400">Sign in to access your dashboard</p>
        </div>

        <div className="glass-panel rounded-3xl p-8 backdrop-blur-xl bg-zinc-900/50 border border-zinc-800/50 shadow-2xl">
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

            <SubmitButton />
          </form>
        </div>
        
        <p className="text-center text-sm text-zinc-500 mt-8">
          Protected by Supabase Authentication
        </p>
      </div>
    </div>
  );
}
