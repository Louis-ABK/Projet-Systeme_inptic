import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { initReferentiel, Departement, SubjectDef } from '@/data/referentiel';

type ClasseContextType = {
  departement: string | null;
  filiere: string | null;
  niveau: string | null;
  classeKey: string | null; // This will now represent the class code directly
  setDepartement: (d: string | null) => void;
  setFiliere: (f: string | null) => void;
  setNiveau: (n: string | null) => void;
  setClasseKey: (k: string | null) => void; 
};

const STORAGE_KEY = 'inptic_classe_selection';

export const ClasseContext = createContext<ClasseContextType>({
  departement: null,
  filiere: null,
  niveau: null,
  classeKey: null,
  setDepartement: () => {},
  setFiliere: () => {},
  setNiveau: () => {},
  setClasseKey: () => {},
});

export const ClasseProvider = ({ children }: { children: React.ReactNode }) => {
  const [departement, setDept] = useState<string | null>(null);
  const [filiere, setFil] = useState<string | null>(null);
  const [niveau, setNiv] = useState<string | null>(null);
  const [classeKey, setClasse] = useState<string | null>(null);

  // Load from local storage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.departement) setDept(parsed.departement);
        if (parsed.filiere) setFil(parsed.filiere);
        if (parsed.niveau) setNiv(parsed.niveau);
        if (parsed.classeKey) setClasse(parsed.classeKey);
      }
    } catch (e) {
      console.warn('Could not load classe context from local storage');
    }
  }, []);

  const { data: refData, isSuccess } = useQuery({
    queryKey: ["global-referentiel"],
    queryFn: async () => {
      const [
        { data: depts },
        { data: fils },
        { data: classes },
        { data: ues },
        { data: matieres },
        { data: semestres }
      ] = await Promise.all([
        supabase.from("departements").select("*"),
        supabase.from("filieres").select("*, departement:departements(code)"),
        supabase.from("classes").select("*, filiere:filieres(code)"),
        supabase.from("ues").select("*, semestre:semestres(libelle), classe:classes(code)"),
        supabase.from("matieres").select("*, ue:ues(code, classe:classes(code))"),
        supabase.from("semestres").select("*")
      ]);

      const departements: Departement[] = (depts || []).map(d => ({
        code: d.code,
        libelle: d.libelle,
        filieres: (fils || []).filter(f => f.departement?.code === d.code).map(f => f.code)
      }));

      const filieresMap: Record<string, { libelle: string; dept: string }> = {};
      (fils || []).forEach(f => {
        filieresMap[f.code] = { libelle: f.libelle, dept: f.departement?.code };
      });

      const matieresByClasse: Record<string, { s5: SubjectDef[]; s6: SubjectDef[] }> = {};
      
      // Initialize with empty arrays for all classes
      (classes || []).forEach(c => {
        matieresByClasse[c.code] = { s5: [], s6: [] };
      });

      // Group matieres by class and semester
      (matieres || []).forEach(m => {
        const classCode = m.ue?.classe?.code;
        if (!classCode) return;
        
        // Find the UE to know the semester
        const ue = (ues || []).find(u => u.code === m.ue?.code);
        const semesterLabel = ue?.semestre?.libelle || "";
        const semKey = semesterLabel.toLowerCase().includes("5") || semesterLabel.toLowerCase().includes("1") || semesterLabel.toLowerCase().includes("3") ? 's5' : 's6';
        
        if (!matieresByClasse[classCode]) {
            matieresByClasse[classCode] = { s5: [], s6: [] };
        }
        
        matieresByClasse[classCode][semKey].push({
          key: m.code,
          label: m.libelle,
          credits: m.credits || 1,
          coef: m.credits || 1, // Using credits as coef as default in DB
          ue: ue?.code || 'UE-ND'
        });
      });

      initReferentiel(departements, filieresMap, matieresByClasse);
      return true;
    }
  });

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ departement, filiere, niveau, classeKey }));
  }, [departement, filiere, niveau, classeKey]);

  const setDepartement = (d: string | null) => {
    setDept(d);
    setFil(null);
    setNiv(null);
    setClasse(null);
  };

  const setFiliere = (f: string | null) => {
    setFil(f);
    setNiv(null);
    setClasse(null);
  };

  const setNiveau = (n: string | null) => {
    setNiv(n);
    setClasse(null);
  };

  const setClasseKey = (k: string | null) => {
    setClasse(k);
  };

  if (!isSuccess) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <ClasseContext.Provider
      value={{
        departement,
        filiere,
        niveau,
        classeKey,
        setDepartement,
        setFiliere,
        setNiveau,
        setClasseKey,
      }}
    >
      {children}
    </ClasseContext.Provider>
  );
};

export const useClasse = () => useContext(ClasseContext);
