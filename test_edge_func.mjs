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
  console.log("Calling import-students...");
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
        s5: {},
        s6: {}
      }
    ]
  };

  const { data, error } = await supabase.functions.invoke("import-students", {
    body: payload,
  });

  console.log("Response:", data);
  if (error) {
    console.error("Error invoking:", error);
  }
}

testFunction();
