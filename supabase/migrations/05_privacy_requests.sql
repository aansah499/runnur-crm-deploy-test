-- Migration: 05_privacy_requests.sql
-- Description: Add privacy_status to customers and create privacy_requests table.

-- Add privacy_status to customers
ALTER TABLE public.customers
ADD COLUMN privacy_status TEXT DEFAULT 'active' CHECK (privacy_status IN ('active', 'erasure_requested', 'erased'));

-- Create privacy_requests table
CREATE TABLE IF NOT EXISTS public.privacy_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    request_type TEXT CHECK (request_type IN ('erasure', 'subject_access', 'data_export')),
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed')),
    requested_by TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_privacy_requests_customer_id ON public.privacy_requests (customer_id);
CREATE INDEX IF NOT EXISTS idx_privacy_requests_created_at ON public.privacy_requests (created_at DESC);
