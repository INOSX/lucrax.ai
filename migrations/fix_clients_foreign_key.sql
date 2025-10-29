-- Fix clients table foreign key constraint
-- Change from auth.users to public.profiles

-- Remove existing foreign key
ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_user_id_fkey;

-- Add new foreign key pointing to public.profiles
ALTER TABLE public.clients 
ADD CONSTRAINT clients_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Update RLS policies to work with profiles table
-- (Policies should already be correct, but ensuring they reference the right table)

-- Verify the change
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.clients'::regclass;
