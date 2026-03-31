-- Migration to add phone_number to profiles table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone_number') THEN
        ALTER TABLE public.profiles ADD COLUMN phone_number TEXT;
    END IF;
END $$;
