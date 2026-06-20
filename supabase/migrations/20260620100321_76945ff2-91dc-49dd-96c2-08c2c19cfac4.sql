
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS wallet_cash numeric,
  ADD COLUMN IF NOT EXISTS wallet_starting numeric;

-- Backfill from legacy starting_balance where wallet values were never set.
UPDATE public.profiles
   SET wallet_starting = COALESCE(wallet_starting, starting_balance),
       wallet_cash     = COALESCE(wallet_cash, starting_balance)
 WHERE wallet_starting IS NULL OR wallet_cash IS NULL;

-- Make sure each user/ticker pair is unique so we can upsert holdings safely.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'holdings_user_ticker_unique'
  ) THEN
    ALTER TABLE public.holdings
      ADD CONSTRAINT holdings_user_ticker_unique UNIQUE (user_id, ticker);
  END IF;
END$$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.holdings TO authenticated;
GRANT ALL ON public.holdings TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
