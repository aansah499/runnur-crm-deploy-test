-- Migration: 04_campaign_recipients.sql
-- Description: Create campaign_recipients table for tracking per-recipient email delivery.

CREATE TABLE IF NOT EXISTS public.campaign_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    resend_email_id TEXT,
    status TEXT DEFAULT 'sent',
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    failed_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for fast webhook lookups
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_resend_email_id ON public.campaign_recipients(resend_email_id);
-- Index for fetching all recipients of a campaign
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign_id ON public.campaign_recipients(campaign_id);
