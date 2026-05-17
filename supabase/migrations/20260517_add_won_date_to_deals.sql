-- 1. Adiciona coluna won_date na tabela deals (se não existir)
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS won_date date;

-- 2. Retroativo: preenche won_date com updated_at para deals já marcados como ganhos
UPDATE public.deals
SET won_date = updated_at::date
WHERE stage = 'won' AND won_date IS NULL;

-- 3. Cria função de trigger para auto-preencher won_date ao mover para 'won'
CREATE OR REPLACE FUNCTION "public"."sync_deal_won_date"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Ao mudar para 'won': preenche won_date com hoje SE ainda não definida (permite retroativo)
    IF NEW.stage IS DISTINCT FROM OLD.stage THEN
        IF NEW.stage = 'won' AND NEW.won_date IS NULL THEN
            NEW.won_date := CURRENT_DATE;
        END IF;
        -- Ao sair de 'won': limpa won_date
        IF OLD.stage = 'won' AND NEW.stage <> 'won' THEN
            NEW.won_date := NULL;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

-- 4. Cria o trigger na tabela deals
DROP TRIGGER IF EXISTS deal_won_date_sync ON public.deals;
CREATE TRIGGER deal_won_date_sync
    BEFORE UPDATE ON public.deals
    FOR EACH ROW EXECUTE FUNCTION public.sync_deal_won_date();

-- 5. Reload do schema PostgREST
NOTIFY pgrst, 'reload schema';
