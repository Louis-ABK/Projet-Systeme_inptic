import { useCallback, useEffect, useState } from "react";
import { Student } from "@/data/students";
import { fetchStudents } from "@/lib/students-store";
import { ClasseKey } from "@/data/referentiel";

export const useStudents = (classeKey?: ClasseKey | null) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchStudents(classeKey);
      setStudents(data);
    } catch (e: any) {
      setError(e?.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [classeKey]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { students, loading, error, reload, setStudents };
};
