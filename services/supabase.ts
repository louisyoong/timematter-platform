import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zplltucaedxtryzdsepo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Zx0RnzPh2wKMOad0EIOaPA_JM1Thdhi';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export const BACKEND_URL = 'http://localhost:3000';
export const TM_TOKEN_KEY = 'tm_token';
