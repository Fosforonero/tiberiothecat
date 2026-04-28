-- v11: Stripe webhook event idempotency table
--
-- Apply via: Supabase dashboard → SQL Editor → New query → paste → Run
--
-- Purpose: prevent double-processing of Stripe webhook events (e.g. checkout.session.completed
-- arriving twice due to Stripe retries). The webhook handler is backward-compatible:
-- if this table does not exist, events are processed without idempotency protection
-- and a console.warn is emitted. Apply this migration before high-traffic launch or
-- when spinning up a new environment with Stripe configured.
--
-- Status flow:
--   (new event arrives)
--       → INSERT status='processing'
--       → (success) UPDATE status='processed', processed_at=now()
--       → (failure) UPDATE status='failed', error=sanitised_message
--
--   On Stripe retry of a 'failed' event:
--       → atomic UPDATE WHERE status='failed' → reclaim if won race
--
--   On Stripe retry of a 'processed' event:
--       → webhook returns 200 immediately (idempotent duplicate)
--
--   On Stripe retry of a 'processing' event (fresh):
--       → webhook returns 200 immediately (concurrent delivery protection)
--
--   On Stripe retry of a 'processing' event stale >10 min (server crash recovery):
--       → atomic UPDATE WHERE status='processing' AND updated_at < cutoff
--       → reclaim if won race; the BEFORE UPDATE trigger refreshes updated_at
--         so concurrent stale-reclaim attempts naturally serialize
--
-- The updated_at column is managed by the BEFORE UPDATE trigger below.
-- It is used for stale-processing detection in lib/stripe-webhook-events.ts.

CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id  TEXT        NOT NULL,
  event_type       TEXT        NOT NULL,
  status           TEXT        NOT NULL CHECK (status IN ('processing', 'processed', 'failed')),
  error            TEXT,                                  -- sanitised error message, max 500 chars
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at     TIMESTAMPTZ,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT stripe_webhook_events_event_id_unique UNIQUE (stripe_event_id)
);

-- Primary dedup lookup: find existing row by Stripe event ID in O(1)
CREATE UNIQUE INDEX IF NOT EXISTS stripe_webhook_events_event_id_idx
  ON public.stripe_webhook_events (stripe_event_id);

-- Monitoring: find stuck 'processing' or 'failed' events by recency
CREATE INDEX IF NOT EXISTS stripe_webhook_events_status_created_idx
  ON public.stripe_webhook_events (status, created_at DESC);

-- Auto-update updated_at on every row modification
CREATE OR REPLACE FUNCTION update_stripe_webhook_events_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS stripe_webhook_events_updated_at ON public.stripe_webhook_events;
CREATE TRIGGER stripe_webhook_events_updated_at
  BEFORE UPDATE ON public.stripe_webhook_events
  FOR EACH ROW EXECUTE FUNCTION update_stripe_webhook_events_updated_at();

-- RLS: table is server/admin-only.
-- The webhook handler uses the service role key which bypasses RLS by design.
-- No anonymous or authenticated-user policies are needed or desired.
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
-- Intentionally no RLS policies: service role access bypasses RLS automatically.
-- Do not add user-facing policies to this table.
