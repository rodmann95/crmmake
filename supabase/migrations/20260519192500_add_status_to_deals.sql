-- Migration: Add status column to public.deals for opportunity heat rating
alter table public.deals
    add column status text;
