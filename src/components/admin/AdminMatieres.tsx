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

type Matiere = {
  id: string;
  code: string;
  libelle: string;
  credits: number;
  ue_id: string;
  ue?: { code: string; classe?: { code: string; filiere?: { code: string } } };
};

export const AdminMatieres = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingMatiere, setEditingMatiere] = useState<Matiere | null>(null);
  const [formData, setFormData] = useState({ code: "", libelle: "", credits: "1", ue_id: "" });

  const { data: ues } = useQuery({
    queryKey: ["ues"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ues").select("*, semestre:semestres(libelle), classe:classes(code, filiere:filieres(code))").order("code");
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: matieres, isLoading } = useQuery({
    queryKey: ["matieres"],
    queryFn: async () => {
      const { data, error } = await supabase.from("matieres").select("*, ue:ues(code, classe:classes(code, filiere:filieres(code)))").order("code");
      if (error) throw error;
      return data as any[];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (matiere: { id?: string; code: string; libelle: string; credits: number; ue_id: string }) => {
      if (matiere.id) {
        const { error } = await supabase.from("matieres").update({
          code: matiere.code,
          libelle: matiere.libelle,
          credits: matiere.credits,
          ue_id: matiere.ue_id,
        }).eq("id", matiere.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("matieres").insert([
          { code: matiere.code, libelle: matiere.libelle, credits: matiere.credits, ue_id: matiere.ue_id },
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
      toast.success(editingMatiere ? "Matière mise à jour" : "Matière ajoutée");
      setIsOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Erreur lors de l'opération: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("matieres").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departements"] });
      queryClient.invalidateQueries({ queryKey: ["filieres"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["ues"] });
      queryClient.invalidateQueries({ queryKey: [ "matieres" ] });
      queryClient.invalidateQueries({ queryKey: [ "global-referentiel" ] });
      toast.success("Matière supprimée");
    },
    onError: (error) => {
      toast.error("Erreur lors de la suppression: " + error.message);
    },
  });

  const resetForm = () => {
    setEditingMatiere(null);
    setFormData({ code: "", libelle: "", credits: "1", ue_id: "" });
  };

  const handleEdit = (matiere: Matiere) => {
    setEditingMatiere(matiere);
    setFormData({ code: matiere.code, libelle: matiere.libelle, credits: matiere.credits.toString(), ue_id: matiere.ue_id });
    setIsOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette matière ? Toutes les notes associées risquent d'être supprimées.")) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.libelle || !formData.credits || !formData.ue_id) {
      toast.error("Veuillez remplir tous les champs.");
      return;
    }
    const creditsNum = parseInt(formData.credits);
    if (isNaN(creditsNum) || creditsNum < 1) {
      toast.error("Les crédits doivent être un nombre positif.");
      return;
    }

    upsertMutation.mutate({
      id: editingMatiere?.id,
      ...formData,
      credits: creditsNum,
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
            <Button onClick={resetForm}><Plus className="h-4 w-4 mr-2" /> Nouvelle Matière</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingMatiere ? "Modifier la Matière" : "Ajouter une Matière"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input 
                  id="code" 
                  value={formData.code} 
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })} 
                  placeholder="Ex: MAT1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="libelle">Libellé</Label>
                <Input 
                  id="libelle" 
                  value={formData.libelle} 
                  onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
                  placeholder="Ex: Algorithmique" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="credits">Crédits / Coefficient</Label>
                <Input 
                  id="credits" 
                  type="number"
                  min="1"
                  value={formData.credits} 
                  onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Unité d'Enseignement (UE)</Label>
                <Select value={formData.ue_id} onValueChange={(val) => setFormData({ ...formData, ue_id: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une UE" />
                  </SelectTrigger>
                  <SelectContent>
                    {ues?.map((ue) => (
                      <SelectItem key={ue.id} value={ue.id}>
                        {ue.code} {ue.classe ? `(${ue.classe.filiere?.code} - ${ue.classe.code})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button>
                <Button type="submit" disabled={upsertMutation.isPending}>
                  {upsertMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingMatiere ? "Mettre à jour" : "Ajouter"}
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
              <TableHead>Crédits</TableHead>
              <TableHead>UE</TableHead>
              <TableHead>Classe</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matieres?.map((matiere) => (
              <TableRow key={matiere.id}>
                <TableCell className="font-medium">{matiere.code}</TableCell>
                <TableCell>{matiere.libelle}</TableCell>
                <TableCell>{matiere.credits}</TableCell>
                <TableCell>{matiere.ue?.code}</TableCell>
                <TableCell>{matiere.ue?.classe ? `${matiere.ue.classe.filiere?.code} - ${matiere.ue.classe.code}` : "-"}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(matiere)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(matiere.id)} className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!matieres?.length && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Aucune matière trouvée.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
