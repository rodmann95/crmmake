-- Definitive fix for contacts_summary view and many-to-many relationship

-- 1. Ensure the array column exists on contacts
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS company_ids bigint[] default '{}'::bigint[];

-- 2. Backfill company_ids array for any contacts that only have the singular company_id
UPDATE public.contacts 
SET company_ids = ARRAY[company_id]
WHERE company_id IS NOT NULL AND (company_ids IS NULL OR array_length(company_ids, 1) IS NULL);

-- 3. Sync all existing contact_companies links back into the array (in case they got out of sync)
UPDATE public.contacts c
SET company_ids = (
    SELECT array_agg(DISTINCT cc.company_id)
    FROM public.contact_companies cc
    WHERE cc.contact_id = c.id
)
WHERE EXISTS (
    SELECT 1 FROM public.contact_companies cc WHERE cc.contact_id = c.id
);

-- 4. Drop the old view entirely to avoid Postgres column replacement errors
DROP VIEW IF EXISTS public.contacts_summary CASCADE;

-- 5. Recreate the view with both company_id and company_ids, grouping correctly
CREATE VIEW public.contacts_summary WITH (security_invoker = on) AS
SELECT
    co.id,
    co.first_name,
    co.last_name,
    co.gender,
    co.title,
    co.background,
    co.avatar,
    co.first_seen,
    co.last_seen,
    co.has_newsletter,
    co.status,
    co.tags,
    co.company_id,
    co.company_ids,
    co.sales_id,
    co.linkedin_url,
    co.email_jsonb,
    co.phone_jsonb,
    (jsonb_path_query_array(co.email_jsonb, '$[*]."email"'))::text as email_fts,
    (jsonb_path_query_array(co.phone_jsonb, '$[*]."number"'))::text as phone_fts,
    (select name from public.companies where id = co.company_id) as company_name,
    count(distinct t.id) filter (where t.done_date is null) as nb_tasks
FROM public.contacts co
    LEFT JOIN public.tasks t ON co.id = t.contact_id
GROUP BY co.id;
