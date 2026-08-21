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

type Filiere = {
  id: string;
  code: string;
  libelle: string;
  departement_id: string;
  departement?: { code: string };
};

export const AdminFilieres = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingFiliere, setEditingFiliere] = useState<Filiere | null>(null);
  const [formData, setFormData] = useState({ code: "", libelle: "", departement_id: "" });

  const { data: departements } = useQuery({
    queryKey: ["departements"],
    queryFn: async () => {
      const { data, error } = await supabase.from("departements").select("*").order("code");
      if (error) throw error;
      return data;
    },
  });

  const { data: filieres, isLoading } = useQuery({
    queryKey: ["filieres"],
    queryFn: async () => {
      const { data, error } = await supabase.from("filieres").select("*, departement:departements(code)").order("code");
      if (error) throw error;
      return data as Filiere[];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (filiere: { id?: string; code: string; libelle: string; departement_id: string }) => {
      if (filiere.id) {
        const { error } = await supabase.from("filieres").update({
          code: filiere.code,
          libelle: filiere.libelle,
          departement_id: filiere.departement_id,
        }).eq("id", filiere.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("filieres").insert([
          { code: filiere.code, libelle: filiere.libelle, departement_id: filiere.departement_id },
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
      toast.success(editingFiliere ? "Filière mise à jour" : "Filière ajoutée");
      setIsOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Erreur lors de l'opération: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("filieres").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departements"] });
      queryClient.invalidateQueries({ queryKey: ["filieres"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["ues"] });
      queryClient.invalidateQueries({ queryKey: [ "matieres" ] });
      queryClient.invalidateQueries({ queryKey: [ "global-referentiel" ] });
      toast.success("Filière supprimée");
    },
    onError: (error) => {
      toast.error("Erreur lors de la suppression: " + error.message);
    },
  });

  const resetForm = () => {
    setEditingFiliere(null);
    setFormData({ code: "", libelle: "", departement_id: "" });
  };

  const handleEdit = (filiere: Filiere) => {
    setEditingFiliere(filiere);
    setFormData({ code: filiere.code, libelle: filiere.libelle, departement_id: filiere.departement_id });
    setIsOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette filière ? Toutes les classes associées seront supprimées.")) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.libelle || !formData.departement_id) {
      toast.error("Veuillez remplir tous les champs.");
      return;
    }
    upsertMutation.mutate({
      id: editingFiliere?.id,
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
            <Button onClick={resetForm}><Plus className="h-4 w-4 mr-2" /> Nouvelle Filière</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingFiliere ? "Modifier la Filière" : "Ajouter une Filière"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input 
                  id="code" 
                  value={formData.code} 
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })} 
                  placeholder="Ex: TC"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="libelle">Libellé</Label>
                <Input 
                  id="libelle" 
                  value={formData.libelle} 
                  onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
                  placeholder="Ex: Technique Commercial" 
                />
              </div>
              <div className="space-y-2">
                <Label>Département</Label>
                <Select value={formData.departement_id} onValueChange={(val) => setFormData({ ...formData, departement_id: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un département" />
                  </SelectTrigger>
                  <SelectContent>
                    {departements?.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.code} - {dept.libelle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button>
                <Button type="submit" disabled={upsertMutation.isPending}>
                  {upsertMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingFiliere ? "Mettre à jour" : "Ajouter"}
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
              <TableHead>Département</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filieres?.map((filiere) => (
              <TableRow key={filiere.id}>
                <TableCell className="font-medium">{filiere.code}</TableCell>
                <TableCell>{filiere.libelle}</TableCell>
                <TableCell>{filiere.departement?.code}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(filiere)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(filiere.id)} className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!filieres?.length && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Aucune filière trouvée.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
