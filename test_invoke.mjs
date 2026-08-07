import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
let SUPABASE_URL = '';
let SUPABASE_KEY = '';

envFile.split('\n').forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) SUPABASE_URL = line.split('=')[1].trim();
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) SUPABASE_KEY = line.split('=')[1].trim();
});

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testFunction() {
  const payload = {}; // Empty payload to trigger 400
  const { data, error } = await supabase.functions.invoke('import-students', { body: payload });
  console.log("Data:", data);
  console.log("Error:", error);
  if (error && error.context && typeof error.context.json === 'function') {
    const body = await error.context.json().catch(() => null);
    console.log("Parsed error body:", body);
  }
}

testFunction();
