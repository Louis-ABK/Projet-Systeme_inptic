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
  console.log("Calling local import-students...");
  const payload = {
    defaultClasseKey: "TC-L2",
    students: [
      {
        matricule: "jean.ndong",
        nom: "NDONG",
        prenom: "Jean-Daniel",
        dateNaissance: "2001-03-12",
        lieuNaissance: "Libreville",
        classeKey: "TC-L2",
        s5: {
          "UE5-1": 15,
          "anglais": 14
        },
        s6: {
          "linux": 16
        }
      }
    ]
  };

  try {
    const res = await fetch(SUPABASE_URL + "/functions/v1/import-students", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_KEY}` // Use real key
      },
      body: JSON.stringify(payload)
    });
    
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
  } catch (e) {
    console.error("Fetch error:", e);
  }
}

testFunction();
