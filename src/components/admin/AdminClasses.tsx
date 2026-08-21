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

type Classe = {
  id: string;
  code: string;
  libelle: string;
  filiere_id: string;
  niveau: string;
  filiere?: { code: string; departement?: { code: string } };
};

export const AdminClasses = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingClasse, setEditingClasse] = useState<Classe | null>(null);
  const [formData, setFormData] = useState({ code: "", libelle: "", filiere_id: "", niveau: "" });

  const { data: filieres } = useQuery({
    queryKey: ["filieres"],
    queryFn: async () => {
      const { data, error } = await supabase.from("filieres").select("*, departement:departements(code)").order("code");
      if (error) throw error;
      return data;
    },
  });

  const { data: classes, isLoading } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("classes").select("*, filiere:filieres(code, departement:departements(code))").order("code");
      if (error) throw error;
      return data as any[];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (classe: { id?: string; code: string; libelle: string; filiere_id: string; niveau: string }) => {
      if (classe.id) {
        const { error } = await supabase.from("classes").update({
          code: classe.code,
          libelle: classe.libelle,
          filiere_id: classe.filiere_id,
          niveau: classe.niveau,
        }).eq("id", classe.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("classes").insert([
          { code: classe.code, libelle: classe.libelle, filiere_id: classe.filiere_id, niveau: classe.niveau },
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
      toast.success(editingClasse ? "Classe mise à jour" : "Classe ajoutée");
      setIsOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Erreur lors de l'opération: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("classes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departements"] });
      queryClient.invalidateQueries({ queryKey: ["filieres"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["ues"] });
      queryClient.invalidateQueries({ queryKey: [ "matieres" ] });
      queryClient.invalidateQueries({ queryKey: [ "global-referentiel" ] });
      toast.success("Classe supprimée");
    },
    onError: (error) => {
      toast.error("Erreur lors de la suppression: " + error.message);
    },
  });

  const resetForm = () => {
    setEditingClasse(null);
    setFormData({ code: "", libelle: "", filiere_id: "", niveau: "" });
  };

  const handleEdit = (classe: Classe) => {
    setEditingClasse(classe);
    setFormData({ code: classe.code, libelle: classe.libelle, filiere_id: classe.filiere_id, niveau: classe.niveau || "" });
    setIsOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette classe ? Toutes les UEs associées seront supprimées.")) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.libelle || !formData.filiere_id || !formData.niveau) {
      toast.error("Veuillez remplir tous les champs.");
      return;
    }
    upsertMutation.mutate({
      id: editingClasse?.id,
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
            <Button onClick={resetForm}><Plus className="h-4 w-4 mr-2" /> Nouvelle Classe</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingClasse ? "Modifier la Classe" : "Ajouter une Classe"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code (ex: L1)</Label>
                <Input 
                  id="code" 
                  value={formData.code} 
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })} 
                  placeholder="Ex: L1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="libelle">Libellé</Label>
                <Input 
                  id="libelle" 
                  value={formData.libelle} 
                  onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
                  placeholder="Ex: Licence 1" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="niveau">Niveau</Label>
                <Select value={formData.niveau} onValueChange={(val) => setFormData({ ...formData, niveau: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un niveau" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L1">L1</SelectItem>
                    <SelectItem value="L2">L2</SelectItem>
                    <SelectItem value="L3">L3</SelectItem>
                    <SelectItem value="M1">M1</SelectItem>
                    <SelectItem value="M2">M2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Filière</Label>
                <Select value={formData.filiere_id} onValueChange={(val) => setFormData({ ...formData, filiere_id: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une filière" />
                  </SelectTrigger>
                  <SelectContent>
                    {filieres?.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.code} - {f.libelle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button>
                <Button type="submit" disabled={upsertMutation.isPending}>
                  {upsertMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingClasse ? "Mettre à jour" : "Ajouter"}
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
              <TableHead>Niveau</TableHead>
              <TableHead>Filière</TableHead>
              <TableHead>Département</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classes?.map((classe) => (
              <TableRow key={classe.id}>
                <TableCell className="font-medium">{classe.code}</TableCell>
                <TableCell>{classe.libelle}</TableCell>
                <TableCell>{classe.niveau}</TableCell>
                <TableCell>{classe.filiere?.code}</TableCell>
                <TableCell>{classe.filiere?.departement?.code}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(classe)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(classe.id)} className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!classes?.length && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Aucune classe trouvée.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
