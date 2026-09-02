import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Fix for Node.js >= 17 IPv6 DNS resolution issues on certain hosts (like Hostinger)
// This forces Node to prefer IPv4 over IPv6, preventing 30+ second timeouts
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const dns = require('dns')
  if (typeof dns.setDefaultResultOrder === 'function') {
    dns.setDefaultResultOrder('ipv4first')
  }
} catch (e) {
  // Ignore if dns module is not available (e.g. Edge runtime)
}

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
      global: {
        fetch: async (url, options) => {
          const controller = new AbortController()
          // 15 second timeout to prevent hanging UI
          const timeoutId = setTimeout(() => controller.abort(), 15000)
          
          try {
            const startTime = Date.now()
            const response = await fetch(url, {
              ...options,
              signal: controller.signal
            })
            const duration = Date.now() - startTime
            if (duration > 2000) {
              console.warn(`[Supabase Fetch] SLOW WARNING: ${url} took ${duration}ms`)
            }
            return response
          } catch (err: any) {
            console.error(`[Supabase Fetch Error] Request failed for ${url}:`, err.message || err)
            throw err
          } finally {
            clearTimeout(timeoutId)
          }
        }
      }
    }
  )
}
