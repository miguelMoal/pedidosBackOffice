import { createClient } from '@supabase/supabase-js';

import { Database } from './database.types';

// Declaración de tipos para import.meta.env
declare global {
  interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string;
    readonly VITE_SUPABASE_KEY: string;
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY);
