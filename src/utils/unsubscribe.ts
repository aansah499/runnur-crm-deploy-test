import crypto from 'crypto';

/**
 * Gets the secure secret to sign unsubscribe tokens.
 */
function getSecret(): string {
  // Use a dedicated unsubscribe secret if set, otherwise fallback to the Resend API key.
  const secret = process.env.UNSUBSCRIBE_SECRET || process.env.RESEND_API_KEY;
  if (!secret) {
    console.warn('WARNING: No UNSUBSCRIBE_SECRET or RESEND_API_KEY found. Using an insecure fallback secret.');
    return 'insecure-fallback-secret';
  }
  return secret;
}

/**
 * Generates a signed token for a customer.
 */
export function generateUnsubscribeToken(customerId: string): string {
  const secret = getSecret();
  const hash = crypto.createHmac('sha256', secret).update(customerId).digest('hex');
  // Combine the customer ID and the signature
  return `${customerId}.${hash}`;
}

/**
 * Generates the full URL for the one-click unsubscribe link.
 */
export function generateUnsubscribeLink(customerId: string): string {
  const token = generateUnsubscribeToken(customerId);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://crm.runnur.co.uk';
  return `${baseUrl}/unsubscribe?token=${encodeURIComponent(token)}`;
}

/**
 * Verifies a given token and returns the customer ID if valid, otherwise null.
 */
export function verifyUnsubscribeToken(token: string): string | null {
  if (!token || !token.includes('.')) {
    return null;
  }

  const [customerId, hash] = token.split('.');
  if (!customerId || !hash) {
    return null;
  }

  const secret = getSecret();
  const expectedHash = crypto.createHmac('sha256', secret).update(customerId).digest('hex');
  
  // Prevent timing attacks by using crypto.timingSafeEqual if lengths match
  if (hash.length !== expectedHash.length) {
    return null;
  }
  
  const isValid = crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expectedHash));
  return isValid ? customerId : null;
}
