-- Migration: Add project dates columns to public.deals
alter table public.deals
    add column project_start_date date,
    add column project_duration_days integer,
    add column project_end_date date;
