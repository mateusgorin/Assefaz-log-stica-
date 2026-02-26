
import { createClient } from '@supabase/supabase-js';

// Prioritize environment variables from the platform prompt
const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL || 'https://sdtayaezhoxqkgznjnxz.supabase.co';
const SUPABASE_ANON_KEY = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkdGF5YWV6aG94cWtnem5qbnh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNjk3MjgsImV4cCI6MjA4Njk0NTcyOH0.OSXMPeFcWhcUY0snE7qMvEHMjtpPqJJ4INTcaWnZr0s';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const isConfigured = () => {
  return SUPABASE_URL && 
         SUPABASE_ANON_KEY && 
         SUPABASE_ANON_KEY !== 'COLE_AQUI_SUA_CHAVE_ANON' && 
         SUPABASE_ANON_KEY.length > 20;
};
