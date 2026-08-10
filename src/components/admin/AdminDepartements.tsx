import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Edit, Trash2, Plus } from "lucide-react";

type Departement = {
  id: string;
  code: string;
  libelle: string;
};

export const AdminDepartements = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Departement | null>(null);
  const [formData, setFormData] = useState({ code: "", libelle: "" });

  const { data: departements, isLoading } = useQuery({
    queryKey: ["departements"],
    queryFn: async () => {
      const { data, error } = await supabase.from("departements").select("*").order("code");
      if (error) throw error;
      return data as Departement[];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (dept: { id?: string; code: string; libelle: string }) => {
      if (dept.id) {
        const { error } = await supabase.from("departements").update({
          code: dept.code,
          libelle: dept.libelle,
        }).eq("id", dept.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("departements").insert([
          { code: dept.code, libelle: dept.libelle },
        ]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departements"] });
      toast.success(editingDept ? "Département mis à jour" : "Département ajouté");
      setIsOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Erreur lors de l'opération: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("departements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departements"] });
      toast.success("Département supprimé");
    },
    onError: (error) => {
      toast.error("Erreur lors de la suppression: " + error.message);
    },
  });

  const resetForm = () => {
    setEditingDept(null);
    setFormData({ code: "", libelle: "" });
  };

  const handleEdit = (dept: Departement) => {
    setEditingDept(dept);
    setFormData({ code: dept.code, libelle: dept.libelle });
    setIsOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce département ? Toutes les filières associées seront supprimées.")) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.libelle) {
      toast.error("Veuillez remplir tous les champs.");
      return;
    }
    upsertMutation.mutate({
      id: editingDept?.id,
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
            <Button onClick={resetForm}><Plus className="h-4 w-4 mr-2" /> Nouveau Département</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingDept ? "Modifier le Département" : "Ajouter un Département"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input 
                  id="code" 
                  value={formData.code} 
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })} 
                  placeholder="Ex: MTIC"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="libelle">Libellé</Label>
                <Input 
                  id="libelle" 
                  value={formData.libelle} 
                  onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
                  placeholder="Ex: Management des TIC" 
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button>
                <Button type="submit" disabled={upsertMutation.isPending}>
                  {upsertMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingDept ? "Mettre à jour" : "Ajouter"}
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
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departements?.map((dept) => (
              <TableRow key={dept.id}>
                <TableCell className="font-medium">{dept.code}</TableCell>
                <TableCell>{dept.libelle}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(dept)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(dept.id)} className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!departements?.length && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  Aucun département trouvé.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
