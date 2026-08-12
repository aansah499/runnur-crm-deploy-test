-- Migration: 01_suppressions.sql
-- Description: Create table for email suppressions to comply with unsubscribe/bounce requirements.

CREATE TABLE IF NOT EXISTS public.suppressions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    email TEXT NOT NULL UNIQUE,
    reason TEXT NOT NULL CHECK (reason IN ('unsubscribed', 'bounced', 'complained')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for fast lookups (optional but recommended since this is checked before every email send)
CREATE INDEX IF NOT EXISTS idx_suppressions_email ON public.suppressions (email);
