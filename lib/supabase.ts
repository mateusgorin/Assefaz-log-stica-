
import { createClient } from '@supabase/supabase-js';

// URL do seu projeto (confirmada pelo seu print)
const SUPABASE_URL = 'https://sdtayaezhoxqkgznjnxz.supabase.co';

// ATENÇÃO: Vá em Settings > API > anon (public) e cole o código abaixo
// Fix: Added explicit string type to prevent narrowing to the literal placeholder, which was causing the 'never' type error on line 13.
const SUPABASE_ANON_KEY: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkdGF5YWV6aG94cWtnem5qbnh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNjk3MjgsImV4cCI6MjA4Njk0NTcyOH0.OSXMPeFcWhcUY0snE7qMvEHMjtpPqJJ4INTcaWnZr0s';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const isConfigured = () => {
  return SUPABASE_ANON_KEY !== 'COLE_AQUI_SUA_CHAVE_ANON' && SUPABASE_ANON_KEY.length > 10;
};
