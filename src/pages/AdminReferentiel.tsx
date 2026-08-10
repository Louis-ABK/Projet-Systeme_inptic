import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AdminDepartements } from "@/components/admin/AdminDepartements";
import { AdminFilieres } from "@/components/admin/AdminFilieres";
import { AdminClasses } from "@/components/admin/AdminClasses";
import { AdminUEs } from "@/components/admin/AdminUEs";
import { AdminMatieres } from "@/components/admin/AdminMatieres";

const AdminReferentiel = () => {
  const [activeTab, setActiveTab] = useState("departements");

  return (
    <div className="min-h-screen bg-background">
      <AppHeader hideClasseSelector />
      <div className="container mx-auto p-4 max-w-6xl space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Gestion du Référentiel</h1>
            <p className="text-muted-foreground mt-1">Gérez les départements, filières, classes, UEs et matières de l'université.</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-auto p-1 bg-muted/50 border">
            <TabsTrigger value="departements" className="py-2.5">Départements</TabsTrigger>
            <TabsTrigger value="filieres" className="py-2.5">Filières</TabsTrigger>
            <TabsTrigger value="classes" className="py-2.5">Classes</TabsTrigger>
            <TabsTrigger value="ues" className="py-2.5">Unités d'Enseignement</TabsTrigger>
            <TabsTrigger value="matieres" className="py-2.5">Matières</TabsTrigger>
          </TabsList>

          <TabsContent value="departements" className="mt-6">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Départements</CardTitle>
                  <CardDescription>Gérez les départements de l'établissement.</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <AdminDepartements />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="filieres" className="mt-6">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Filières</CardTitle>
                  <CardDescription>Gérez les filières rattachées aux départements.</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <AdminFilieres />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="classes" className="mt-6">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Classes</CardTitle>
                  <CardDescription>Gérez les classes (niveaux) pour chaque filière.</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <AdminClasses />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ues" className="mt-6">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Unités d'Enseignement</CardTitle>
                  <CardDescription>Gérez les UEs pour chaque classe et semestre.</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <AdminUEs />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="matieres" className="mt-6">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Matières</CardTitle>
                  <CardDescription>Gérez les matières et leurs coefficients dans chaque UE.</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <AdminMatieres />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminReferentiel;
