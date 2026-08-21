import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Edit, Trash2, Plus } from "lucide-react";

type UE = {
  id: string;
  code: string;
  libelle: string;
  semestre_id: string;
  classe_id: string | null;
  classe?: { code: string; filiere?: { code: string } };
  semestre?: { libelle: string };
};

export const AdminUEs = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingUE, setEditingUE] = useState<UE | null>(null);
  const [formData, setFormData] = useState({ code: "", libelle: "", semestre_id: "", classe_id: "" });

  const { data: semestres } = useQuery({
    queryKey: ["semestres"],
    queryFn: async () => {
      const { data, error } = await supabase.from("semestres").select("id, libelle").order("libelle");
      if (error) throw error;
      return data;
    },
  });

  const { data: classes } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("classes").select("*, filiere:filieres(code, departement:departements(code))").order("code");
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: ues, isLoading } = useQuery({
    queryKey: ["ues"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ues").select("*, semestre:semestres(libelle), classe:classes(code, filiere:filieres(code))").order("code");
      if (error) throw error;
      return data as any[];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (ue: { id?: string; code: string; libelle: string; semestre_id: string; classe_id: string }) => {
      if (ue.id) {
        const { error } = await supabase.from("ues").update({
          code: ue.code,
          libelle: ue.libelle,
          semestre_id: ue.semestre_id,
          classe_id: ue.classe_id || null,
        }).eq("id", ue.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ues").insert([
          { code: ue.code, libelle: ue.libelle, semestre_id: ue.semestre_id, classe_id: ue.classe_id || null },
        ]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departements"] });
      queryClient.invalidateQueries({ queryKey: ["filieres"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["ues"] });
      queryClient.invalidateQueries({ queryKey: [ "matieres" ] });
      queryClient.invalidateQueries({ queryKey: [ "global-referentiel" ] });
      toast.success(editingUE ? "UE mise à jour" : "UE ajoutée");
      setIsOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Erreur lors de l'opération: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ues").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departements"] });
      queryClient.invalidateQueries({ queryKey: ["filieres"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["ues"] });
      queryClient.invalidateQueries({ queryKey: [ "matieres" ] });
      queryClient.invalidateQueries({ queryKey: [ "global-referentiel" ] });
      toast.success("UE supprimée");
    },
    onError: (error) => {
      toast.error("Erreur lors de la suppression: " + error.message);
    },
  });

  const resetForm = () => {
    setEditingUE(null);
    setFormData({ code: "", libelle: "", semestre_id: "", classe_id: "" });
  };

  const handleEdit = (ue: UE) => {
    setEditingUE(ue);
    setFormData({ code: ue.code, libelle: ue.libelle, semestre_id: ue.semestre_id, classe_id: ue.classe_id || "" });
    setIsOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette UE ? Toutes les matières associées seront supprimées.")) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.libelle || !formData.semestre_id) {
      toast.error("Veuillez remplir au moins le code, le libellé et le semestre.");
      return;
    }
    upsertMutation.mutate({
      id: editingUE?.id,
      ...formData,
    });
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isOpen} onOpenChange={(open) => {
          if (!open) resetForm();
          setIsOpen(open);
        }}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}><Plus className="h-4 w-4 mr-2" /> Nouvelle UE</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUE ? "Modifier l'UE" : "Ajouter une UE"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input 
                  id="code" 
                  value={formData.code} 
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })} 
                  placeholder="Ex: UE1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="libelle">Libellé</Label>
                <Input 
                  id="libelle" 
                  value={formData.libelle} 
                  onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
                  placeholder="Ex: Développement Web" 
                />
              </div>
              <div className="space-y-2">
                <Label>Semestre</Label>
                <Select value={formData.semestre_id} onValueChange={(val) => setFormData({ ...formData, semestre_id: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un semestre" />
                  </SelectTrigger>
                  <SelectContent>
                    {semestres?.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.libelle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Classe (Optionnel)</Label>
                <Select value={formData.classe_id} onValueChange={(val) => setFormData({ ...formData, classe_id: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une classe" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.filiere?.code} - {c.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button>
                <Button type="submit" disabled={upsertMutation.isPending}>
                  {upsertMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingUE ? "Mettre à jour" : "Ajouter"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Libellé</TableHead>
              <TableHead>Semestre</TableHead>
              <TableHead>Classe</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ues?.map((ue) => (
              <TableRow key={ue.id}>
                <TableCell className="font-medium">{ue.code}</TableCell>
                <TableCell>{ue.libelle}</TableCell>
                <TableCell>{ue.semestre?.libelle}</TableCell>
                <TableCell>{ue.classe ? `${ue.classe.filiere?.code} - ${ue.classe.code}` : "-"}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(ue)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(ue.id)} className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!ues?.length && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Aucune UE trouvée.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
