'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  let mfaRequired = false;

  try {
    const supabase = createClient();

    console.log(`[Auth] Attempting login for ${email}`);
    const startTime = Date.now();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    const duration = Date.now() - startTime;
    console.log(`[Auth] Login request completed in ${duration}ms`);

    if (error) {
      console.error('[Auth] Login error from Supabase:', error);
      return { error: error.message };
    }

    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aalData?.nextLevel === 'aal2' && aalData?.currentLevel === 'aal1') {
      mfaRequired = true;
    }
  } catch (err: any) {
    console.error('[Auth] Unexpected error during login:', err);
    return { error: err.message || 'An unexpected error occurred during login. Please try again.' };
  }

  if (mfaRequired) {
    return { mfaRequired: true };
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function verifyMfa(formData: FormData) {
  const code = formData.get('code') as string;
  
  try {
    const supabase = createClient();
    console.log(`[Auth] Attempting MFA verification`);
    const startTime = Date.now();

    const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
    if (factorsError) {
      console.error('[Auth] MFA listFactors error:', factorsError);
      return { error: factorsError.message };
    }

    const totpFactor = factorsData.totp[0];
    if (!totpFactor) {
      console.error('[Auth] No TOTP factor found');
      return { error: 'No TOTP factor found' };
    }

    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: totpFactor.id });
    if (challengeError) {
      console.error('[Auth] MFA challenge error:', challengeError);
      return { error: challengeError.message };
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: totpFactor.id,
      challengeId: challengeData.id,
      code,
    });

    const duration = Date.now() - startTime;
    console.log(`[Auth] MFA request completed in ${duration}ms`);

    if (verifyError) {
      console.error('[Auth] MFA verify error:', verifyError);
      return { error: verifyError.message };
    }
  } catch (err: any) {
    console.error('[Auth] Unexpected error during MFA:', err);
    return { error: err.message || 'An unexpected error occurred during MFA verification. Please try again.' };
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  
  revalidatePath('/', 'layout');
  redirect('/login');
}
