import React, { useMemo } from 'react';
import { useClasse } from '@/contexts/ClasseContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const ClasseSelector = () => {
  const { departement, filiere, niveau, classeKey, setDepartement, setFiliere, setNiveau, setClasseKey } = useClasse();

  const { data: departements } = useQuery({
    queryKey: ["departements"],
    queryFn: async () => {
      const { data, error } = await supabase.from("departements").select("*").order("code");
      if (error) throw error;
      return data;
    },
  });

  const { data: filieres } = useQuery({
    queryKey: ["filieres"],
    queryFn: async () => {
      const { data, error } = await supabase.from("filieres").select("*, departement:departements(code)").order("code");
      if (error) throw error;
      return data;
    },
  });

  const { data: classes } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("classes").select("*, filiere:filieres(code, departement:departements(code))").order("code");
      if (error) throw error;
      return data;
    },
  });

  const availableFilieres = useMemo(() => {
    if (!departement || !filieres) return [];
    return filieres.filter(f => f.departement?.code === departement);
  }, [departement, filieres]);

  const availableNiveaux = useMemo(() => {
    if (!filiere || !classes) return [];
    const classNiveaux = classes.filter(c => c.filiere?.code === filiere).map(c => c.niveau || "Non spécifié");
    return Array.from(new Set(classNiveaux));
  }, [filiere, classes]);

  const availableClasses = useMemo(() => {
    if (!filiere || !niveau || !classes) return [];
    return classes.filter(c => c.filiere?.code === filiere && (c.niveau || "Non spécifié") === niveau);
  }, [filiere, niveau, classes]);

  // Si on sélectionne un niveau, on devrait idéalement aussi sélectionner la classe associée, 
  // mais il peut y avoir plusieurs classes pour le même (filiere, niveau) ? (ex: L1A, L1B).
  // Dans le modèle, classes.code est unique (ex: GI-L1).
  const handleNiveauChange = (n: string) => {
    setNiveau(n);
    const cls = classes?.find(c => c.filiere?.code === filiere && (c.niveau || "Non spécifié") === n);
    if (cls) setClasseKey(cls.code);
  };

  const handleClasseChange = (c: string) => {
    setClasseKey(c);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Département */}
      <Select value={departement || undefined} onValueChange={setDepartement}>
        <SelectTrigger className="w-[200px] h-9 text-sm bg-white text-slate-900 border-white/20">
          <SelectValue placeholder="Département..." />
        </SelectTrigger>
        <SelectContent>
          {departements?.map(d => (
            <SelectItem key={d.code} value={d.code}>
              {d.libelle}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Filière */}
      <Select 
        value={filiere || undefined} 
        onValueChange={setFiliere} 
        disabled={!departement}
      >
        <SelectTrigger className="w-[220px] h-9 text-sm bg-white text-slate-900 border-white/20 disabled:opacity-50">
          <SelectValue placeholder="Filière..." />
        </SelectTrigger>
        <SelectContent>
          {availableFilieres.map(f => (
            <SelectItem key={f.code} value={f.code}>
              {f.libelle}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Niveau */}
      <Select 
        value={niveau || undefined} 
        onValueChange={handleNiveauChange} 
        disabled={!filiere}
      >
        <SelectTrigger className="w-[110px] h-9 text-sm bg-white text-slate-900 border-white/20 disabled:opacity-50">
          <SelectValue placeholder="Niveau..." />
        </SelectTrigger>
        <SelectContent>
          {availableNiveaux.map((n: string) => (
            <SelectItem key={n} value={n}>
              {n}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Classe Spécifique (Si multiples) */}
      {availableClasses.length > 1 && (
        <Select 
          value={classeKey || undefined} 
          onValueChange={handleClasseChange} 
          disabled={!niveau}
        >
          <SelectTrigger className="w-[110px] h-9 text-sm bg-white text-slate-900 border-white/20 disabled:opacity-50">
            <SelectValue placeholder="Classe..." />
          </SelectTrigger>
          <SelectContent>
            {availableClasses.map(c => (
              <SelectItem key={c.code} value={c.code}>
                {c.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};
