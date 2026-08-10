import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Départements</CardTitle>
                    <CardDescription>Gérez les départements de l'établissement.</CardDescription>
                  </div>
                  <Button>Nouveau Département</Button>
                </div>
              </CardHeader>
              <CardContent>
                <p>En construction...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="filieres" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Filières</CardTitle>
                    <CardDescription>Gérez les filières rattachées aux départements.</CardDescription>
                  </div>
                  <Button>Nouvelle Filière</Button>
                </div>
              </CardHeader>
              <CardContent>
                <p>En construction...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="classes" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Classes</CardTitle>
                    <CardDescription>Gérez les classes (niveaux) pour chaque filière.</CardDescription>
                  </div>
                  <Button>Nouvelle Classe</Button>
                </div>
              </CardHeader>
              <CardContent>
                <p>En construction...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ues" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Unités d'Enseignement</CardTitle>
                    <CardDescription>Gérez les UEs pour chaque classe et semestre.</CardDescription>
                  </div>
                  <Button>Nouvelle UE</Button>
                </div>
              </CardHeader>
              <CardContent>
                <p>En construction...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="matieres" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Matières</CardTitle>
                    <CardDescription>Gérez les matières et leurs coefficients dans chaque UE.</CardDescription>
                  </div>
                  <Button>Nouvelle Matière</Button>
                </div>
              </CardHeader>
              <CardContent>
                <p>En construction...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminReferentiel;
