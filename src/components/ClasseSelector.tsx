import React from 'react';
import { useClasse } from '@/contexts/ClasseContext';
import { DEPARTEMENTS, FILIERES_MAP } from '@/data/referentiel';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const ClasseSelector = () => {
  const { departement, filiere, niveau, setDepartement, setFiliere, setNiveau } = useClasse();

  const selectedDept = DEPARTEMENTS.find(d => d.code === departement);
  const availableFilieres = selectedDept?.filieres || [];
  const NIVEAUX = ['L1', 'L2', 'L3'];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Département */}
      <Select value={departement || undefined} onValueChange={setDepartement}>
        <SelectTrigger className="w-[200px] h-9 text-sm bg-white text-slate-900 border-white/20">
          <SelectValue placeholder="Département..." />
        </SelectTrigger>
        <SelectContent>
          {DEPARTEMENTS.map(d => (
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
            <SelectItem key={f} value={f}>
              {FILIERES_MAP[f]?.libelle || f}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Niveau */}
      <Select 
        value={niveau || undefined} 
        onValueChange={setNiveau} 
        disabled={!filiere}
      >
        <SelectTrigger className="w-[110px] h-9 text-sm bg-white text-slate-900 border-white/20 disabled:opacity-50">
          <SelectValue placeholder="Niveau..." />
        </SelectTrigger>
        <SelectContent>
          {NIVEAUX.map(n => (
            <SelectItem key={n} value={n}>
              {n}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

