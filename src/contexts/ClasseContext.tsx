import React, { createContext, useContext, useState, useEffect } from 'react';
import { ClasseKey, DEPARTEMENTS, FILIERES_MAP } from '@/data/referentiel';

type ClasseContextType = {
  departement: string | null;
  filiere: string | null;
  niveau: string | null;
  classeKey: ClasseKey | null;
  setDepartement: (d: string | null) => void;
  setFiliere: (f: string | null) => void;
  setNiveau: (n: string | null) => void;
  setClasseKey: (k: ClasseKey | null) => void; // Optional direct setter
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

  // Load from local storage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.departement) setDept(parsed.departement);
        if (parsed.filiere) setFil(parsed.filiere);
        if (parsed.niveau) setNiv(parsed.niveau);
      }
    } catch (e) {
      console.warn('Could not load classe context from local storage');
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ departement, filiere, niveau }));
  }, [departement, filiere, niveau]);

  const classeKey = filiere && niveau ? `${filiere}-${niveau}` : null;

  const setDepartement = (d: string | null) => {
    setDept(d);
    setFil(null);
    setNiv(null);
  };

  const setFiliere = (f: string | null) => {
    setFil(f);
    setNiv(null);
  };

  const setNiveau = (n: string | null) => {
    setNiv(n);
  };

  const setClasseKey = (k: ClasseKey | null) => {
    if (!k) {
      setDept(null); setFil(null); setNiv(null);
      return;
    }
    const [fil, niv] = k.split('-');
    if (fil && niv && FILIERES_MAP[fil]) {
      setDept(FILIERES_MAP[fil].dept);
      setFil(fil);
      setNiv(niv);
    }
  };

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
