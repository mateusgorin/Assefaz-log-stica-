
import { createClient } from '@supabase/supabase-js';

// Prioritize environment variables from the platform prompt
// Safe access to environment variables
const getEnvVar = (name: string, fallback: string): string => {
  try {
    return import.meta.env[name] || fallback;
  } catch {
    return fallback;
  }
};

const SUPABASE_URL = getEnvVar('VITE_SUPABASE_URL', 'https://sdtayaezhoxqkgznjnxz.supabase.co');
const SUPABASE_ANON_KEY = getEnvVar('VITE_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkdGF5YWV6aG94cWtnem5qbnh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNjk3MjgsImV4cCI6MjA4Njk0NTcyOH0.OSXMPeFcWhcUY0snE7qMvEHMjtpPqJJ4INTcaWnZr0s');

// Only create client if URL is valid to prevent crash
export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co', 
  SUPABASE_ANON_KEY || 'placeholder'
);

export const isConfigured = () => {
  return !!(SUPABASE_URL && 
         SUPABASE_ANON_KEY && 
         SUPABASE_ANON_KEY !== 'COLE_AQUI_SUA_CHAVE_ANON' && 
         SUPABASE_ANON_KEY.length > 20);
};
