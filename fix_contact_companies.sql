-- ============================================================
-- FIX DEFINITIVO: Vínculo Contatos <-> Empresas (M2M)
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- 1. Garante que a coluna company_ids existe nos contatos
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS company_ids bigint[] DEFAULT '{}'::bigint[];

-- 2. Cria a tabela de junção se não existir
CREATE TABLE IF NOT EXISTS public.contact_companies (
    contact_id bigint NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    company_id bigint NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (contact_id, company_id)
);

CREATE INDEX IF NOT EXISTS contact_companies_contact_id_idx ON public.contact_companies(contact_id);
CREATE INDEX IF NOT EXISTS contact_companies_company_id_idx ON public.contact_companies(company_id);

-- 3. Ativa RLS e cria policies para usuários autenticados (ESTE ERA O BUG!)
ALTER TABLE public.contact_companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contact_companies select" ON public.contact_companies;
DROP POLICY IF EXISTS "contact_companies insert" ON public.contact_companies;
DROP POLICY IF EXISTS "contact_companies update" ON public.contact_companies;
DROP POLICY IF EXISTS "contact_companies delete" ON public.contact_companies;

CREATE POLICY "contact_companies select" ON public.contact_companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "contact_companies insert" ON public.contact_companies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "contact_companies update" ON public.contact_companies FOR update TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "contact_companies delete" ON public.contact_companies FOR DELETE TO authenticated USING (true);

-- 4. Recria a função de sincronização com SECURITY DEFINER para evitar bloqueio de RLS no trigger
CREATE OR REPLACE FUNCTION "public"."sync_contact_companies"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    DELETE FROM public.contact_companies WHERE contact_id = NEW.id;

    IF NEW.company_ids IS NOT NULL AND array_length(NEW.company_ids, 1) > 0 THEN
        INSERT INTO public.contact_companies (contact_id, company_id)
        SELECT NEW.id, unnested_id
        FROM unnest(NEW.company_ids) AS unnested_id
        WHERE EXISTS (SELECT 1 FROM public.companies WHERE id = unnested_id)
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$;

-- 5. Sincroniza retroativamente: preenche contact_companies a partir do array company_ids
INSERT INTO public.contact_companies (contact_id, company_id)
SELECT c.id, unnested_id
FROM public.contacts c,
     unnest(c.company_ids) AS unnested_id
WHERE c.company_ids IS NOT NULL
  AND array_length(c.company_ids, 1) > 0
  AND EXISTS (SELECT 1 FROM public.companies WHERE id = unnested_id)
ON CONFLICT DO NOTHING;

-- 6. Sincroniza retroativamente: preenche company_ids a partir de contact_companies (para contatos
--    que foram linkados diretamente na tabela de junção sem ter o array atualizado)
UPDATE public.contacts c
SET company_ids = (
    SELECT COALESCE(array_agg(DISTINCT cc.company_id), '{}'::bigint[])
    FROM public.contact_companies cc
    WHERE cc.contact_id = c.id
)
WHERE EXISTS (
    SELECT 1 FROM public.contact_companies cc WHERE cc.contact_id = c.id
);

-- 7. Recria a view companies_summary com o fix do count (cc.contact_id em vez de co.id)
CREATE OR REPLACE VIEW public.companies_summary WITH (security_invoker = on) AS
SELECT
    c.id,
    c.created_at,
    c.name,
    c.sector,
    c.size,
    c.linkedin_url,
    c.website,
    c.phone_number,
    c.address,
    c.zipcode,
    c.city,
    c.state_abbr,
    c.sales_id,
    c.context_links,
    c.country,
    c.description,
    c.revenue,
    c.tax_identifier,
    c.logo,
    count(DISTINCT d.id) AS nb_deals,
    count(DISTINCT cc.contact_id) AS nb_contacts
FROM public.companies c
    LEFT JOIN public.deals d ON c.id = d.company_id
    LEFT JOIN public.contact_companies cc ON c.id = cc.company_id
GROUP BY c.id;

-- 8. Reload do schema PostgREST
NOTIFY pgrst, 'reload schema';
