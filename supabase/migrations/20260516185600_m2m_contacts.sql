-- Migration to move single company_id to many-to-many contact_companies
insert into public.contact_companies (contact_id, company_id)
select id, company_id from public.contacts where company_id is not null
on conflict do nothing;

update public.contacts 
set company_ids = array[company_id]
where company_id is not null and (company_ids is null or array_length(company_ids, 1) = 0);
