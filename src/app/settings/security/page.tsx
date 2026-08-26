'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Shield, ShieldCheck, Loader2, KeyRound, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SecuritySettingsPage() {
  const [loading, setLoading] = useState(true);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [factorId, setFactorId] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [enrollCode, setEnrollCode] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  const checkMfaStatus = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error) {
      console.error(error);
      setError('Failed to load MFA status');
    } else {
      setMfaEnabled(data.nextLevel === 'aal2');
    }
    setLoading(false);
  }, [supabase.auth.mfa]);

  useEffect(() => {
    checkMfaStatus();
  }, [checkMfaStatus]);

  async function startEnrollment() {
    setProcessing(true);
    setError('');
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
    });
    if (error) {
      setError(error.message);
    } else {
      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setEnrolling(true);
    }
    setProcessing(false);
  }

  async function verifyEnrollment(e: React.FormEvent) {
    e.preventDefault();
    setProcessing(true);
    setError('');
    
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId,
    });
    
    if (challengeError) {
      setError(challengeError.message);
      setProcessing(false);
      return;
    }
    
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code: enrollCode,
    });
    
    if (verifyError) {
      setError(verifyError.message);
    } else {
      setEnrolling(false);
      setMfaEnabled(true);
      setFactorId('');
      setQrCode('');
      setEnrollCode('');
      // Refresh to update server session if necessary
      router.refresh();
    }
    setProcessing(false);
  }

  async function disableMfa() {
    if (!confirm('Are you sure you want to disable Multi-Factor Authentication? This will make your account less secure.')) {
      return;
    }
    setProcessing(true);
    setError('');
    
    const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
    if (factorsError) {
      setError(factorsError.message);
      setProcessing(false);
      return;
    }
    
    const totpFactor = factors.totp[0];
    if (totpFactor) {
      const { error: unenrollError } = await supabase.auth.mfa.unenroll({
        factorId: totpFactor.id,
      });
      if (unenrollError) {
        setError(unenrollError.message);
      } else {
        setMfaEnabled(false);
        router.refresh();
      }
    }
    setProcessing(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Security Settings</h1>
          <p className="text-zinc-400">Manage your account security and authentication methods.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="glass-panel p-6 rounded-2xl border border-zinc-800/50">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              Multi-Factor Authentication (MFA)
              {mfaEnabled && <ShieldCheck className="w-5 h-5 text-green-400" />}
            </h2>
            <p className="text-zinc-400 max-w-xl">
              Add an extra layer of security to your account by requiring a verification code from your authenticator app when you sign in.
            </p>
          </div>
          
          <div className="shrink-0">
            {mfaEnabled ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-sm font-medium border border-green-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                Enabled
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-500/10 text-zinc-400 text-sm font-medium border border-zinc-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                Disabled
              </span>
            )}
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-zinc-800/50">
          {enrolling ? (
            <div className="max-w-md mx-auto space-y-6 bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-medium text-white">Set up Authenticator App</h3>
                <p className="text-sm text-zinc-400">Scan this QR code with Google Authenticator, Authy, or your preferred TOTP app.</p>
              </div>
              
              <div className="bg-white p-4 rounded-xl w-48 h-48 mx-auto flex items-center justify-center">
                {qrCode ? (
                  <div dangerouslySetInnerHTML={{ __html: qrCode }} className="w-full h-full [&>svg]:w-full [&>svg]:h-full" />
                ) : (
                  <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
                )}
              </div>

              <form onSubmit={verifyEnrollment} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="enrollCode" className="block text-sm font-medium text-zinc-300 text-center">
                    Enter the 6-digit code
                  </label>
                  <input
                    id="enrollCode"
                    type="text"
                    value={enrollCode}
                    onChange={(e) => setEnrollCode(e.target.value)}
                    placeholder="000000"
                    pattern="\d{6}"
                    maxLength={6}
                    required
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all tracking-[0.5em] text-center text-lg font-mono"
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEnrolling(false)}
                    className="flex-1 px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors font-medium text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processing || enrollCode.length !== 6}
                    className="flex-1 px-4 py-2 bg-brand text-black rounded-lg hover:bg-brand-hover transition-colors font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify & Enable'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-white font-medium mb-1">Authenticator App</h3>
                <p className="text-sm text-zinc-400">Use an app like Google Authenticator or Authy to generate verification codes.</p>
              </div>
              {mfaEnabled ? (
                <button
                  onClick={disableMfa}
                  disabled={processing}
                  className="px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors font-medium text-sm border border-red-500/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Disable MFA'}
                </button>
              ) : (
                <button
                  onClick={startEnrollment}
                  disabled={processing}
                  className="px-4 py-2 bg-brand text-black rounded-lg hover:bg-brand-hover transition-colors font-medium text-sm shadow-lg shadow-brand/10 disabled:opacity-50 flex items-center gap-2"
                >
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><KeyRound className="w-4 h-4" /> Enable MFA</>}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
