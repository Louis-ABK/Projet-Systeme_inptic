import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function check() {
  const { data: etudiants, error } = await supabase
    .from('etudiants')
    .select('*, classes(code)')
    .order('created_at', { ascending: false })
    .limit(10);
    
  console.log('Last 10 etudiants:', etudiants);
  if (error) console.error('Error:', error);
}

check();
