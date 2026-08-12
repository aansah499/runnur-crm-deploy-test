-- Migration: 03_customer_merge.sql
-- Description: Add columns to support soft-deleting and tracing merged customers.

ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS merged_into UUID REFERENCES public.customers(id) ON DELETE SET NULL;

-- Index for filtering out archived customers quickly
CREATE INDEX IF NOT EXISTS idx_customers_is_archived ON public.customers (is_archived);
