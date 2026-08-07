# Implementation Plan: Gestion Universitaire Multi-Départements

## Overview

Ce plan décompose le design technique en étapes de codage incrémentales. Chaque tâche s'appuie sur la précédente et aboutit à un système fonctionnel où toutes les opérations (navigation, saisie, import, export, bulletins, statistiques, espace étudiant) sont filtrées par département et classe.

## Tasks

- [ ] 1. Mettre en place les types et constantes de base
  - Créer `src/types/university.ts` avec `DEPARTEMENTS`, `CLASSES`, `Departement`, `Classe`, `DepartementClasse` et `DEPARTEMENT_LABELS`
  - Étendre le type `Student` dans `src/data/students.ts` pour y ajouter les champs obligatoires `departement: Departement` et `classe: Classe`
  - Étendre le type `AuthUser` dans `src/lib/auth-store.ts` pour y ajouter `departement?: Departement` et `classe?: Classe`
  - _Requirements: 1.1, 1.2, 1.3, 6.1_

  - [ ] 1.1 Créer `src/types/university.ts`
    - Exporter `DEPARTEMENTS`, `CLASSES`, `Departement`, `Classe`, `DepartementClasse`, `DEPARTEMENT_LABELS`
    - _Requirements: 1.1, 1.2_

  - [ ]* 1.2 Écrire le test de propriété — Invariant structurel (Property 1)
    - Installer `fast-check` en devDependency : `npm install --save-dev fast-check`
    - Créer `src/__tests__/university-types.test.ts`
    - **Property 1 : Invariant structurel des entités**
    - **Validates: Requirements 1.1, 1.2, 1.3**

  - [ ]* 1.3 Écrire le test de propriété — Rejet des créations invalides (Property 2)
    - Dans `src/__tests__/university-types.test.ts`
    - **Property 2 : Rejet des créations invalides**
    - **Validates: Requirements 1.4, 1.5**

- [ ] 2. Créer le contexte global de sélection département/classe
  - Créer `src/contexts/DepartmentContext.tsx` exposant `departement`, `classe`, `setSelection`, `clearSelection`, `isSelected`
  - Persister la sélection dans `sessionStorage`
  - Envelopper l'application avec `DepartmentProvider` dans `src/App.tsx` (à l'intérieur de `AuthProvider`)
  - _Requirements: 2.1, 2.2, 2.4, 7.1, 7.2, 7.3_

  - [ ] 2.1 Implémenter `DepartmentContext.tsx` et le hook `useDepartment`
    - Créer `src/contexts/DepartmentContext.tsx`
    - Persister via `sessionStorage`
    - Exporter le hook `useDepartment()`
    - _Requirements: 2.4, 7.1, 7.3_

  - [ ] 2.2 Intégrer `DepartmentProvider` dans `App.tsx`
    - Modifier `src/App.tsx` pour envelopper les routes avec `DepartmentProvider`
    - _Requirements: 2.4_

  - [ ]* 2.3 Écrire le test de propriété — Persistance de la sélection (Property 4)
    - Créer `src/__tests__/department-context.test.ts`
    - **Property 4 : Persistance de la sélection entre les modes**
    - **Validates: Requirements 2.4**

- [ ] 3. Créer le composant `DepartmentSelector`
  - Créer `src/components/DepartmentSelector.tsx` avec deux `Select` (département puis classe)
  - Le sélecteur de classe est désactivé tant qu'aucun département n'est choisi
  - Appelle `setSelection` du contexte à chaque changement
  - _Requirements: 2.1, 2.2, 7.1, 7.2, 7.3_

  - [ ] 3.1 Implémenter `DepartmentSelector.tsx`
    - Utiliser les composants `Select` de shadcn/ui
    - Afficher les 3 départements ; après sélection, activer les 3 classes
    - _Requirements: 2.1, 2.2, 7.2_

  - [ ]* 3.2 Écrire les tests unitaires pour `DepartmentSelector`
    - Créer `src/__tests__/DepartmentSelector.test.tsx`
    - Vérifier que 3 options département sont affichées
    - Vérifier que le sélecteur de classe est disabled sans département
    - _Requirements: 2.1, 2.2_

- [ ] 4. Mettre à jour `AppHeader` avec l'indicateur de sélection courante
  - Modifier `src/components/AppHeader.tsx` pour intégrer `DepartmentSelector` et afficher le badge de sélection courante
  - Afficher un avertissement visuel quand aucune sélection n'est active
  - Mise à jour < 200 ms via la réactivité du contexte React
  - _Requirements: 7.1, 7.2, 7.3_

  - [ ] 4.1 Modifier `AppHeader.tsx`
    - Consommer `useDepartment()` et afficher département + classe ou l'indicateur "Sélectionner d'abord"
    - Intégrer `DepartmentSelector`
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ]* 4.2 Écrire le test de propriété — Affichage de la sélection (Property 12)
    - Créer `src/__tests__/AppHeader.test.tsx`
    - **Property 12 : Affichage de la sélection courante dans l'en-tête**
    - **Validates: Requirements 7.1**

- [ ] 5. Checkpoint — Vérifier la navigation et le contexte
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Créer le fichier de matières multi-départements `src/data/subjects.ts`
  - Créer `src/data/subjects.ts` avec la structure `SubjectsMap` indexée par `[Departement][Classe]`
  - Conserver les matières RSN L3 existantes (`S5_SUBJECTS` / `S6_SUBJECTS`) sous `SUBJECTS.RSN.L3`
  - Remplir les autres combinaisons (MTIC L1/L2/L3, AV L1/L2/L3, RSN L1/L2) avec des listes de matières adaptées
  - Exporter `getSubjects(dept, classe)` comme fonction principale d'accès
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ] 6.1 Implémenter `src/data/subjects.ts`
    - Définir `SubjectDef`, `SubjectsMap`, `SUBJECTS` et `getSubjects`
    - Migrer `S5_SUBJECTS` / `S6_SUBJECTS` vers `SUBJECTS.RSN.L3`
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 6.2 Écrire le test de propriété — Indépendance des configurations (Property 10)
    - Créer `src/__tests__/subjects.test.ts`
    - **Property 10 : Indépendance des configurations de matières**
    - **Validates: Requirements 5.4**

  - [ ]* 6.3 Écrire les tests unitaires pour `getSubjects`
    - Vérifier que `getSubjects('RSN', 'L3')` renvoie les matières S5/S6 existantes
    - Vérifier que deux groupes distincts ont des tableaux indépendants
    - Vérifier que `getSubjects` pour une combinaison inconnue retourne `[]`
    - _Requirements: 5.2, 5.3_

- [ ] 7. Modifier `students-store.ts` et `use-students.tsx` pour le filtrage Supabase
  - Modifier `fetchStudents` dans `src/lib/students-store.ts` pour accepter `departement?` et `classe?` et appliquer les filtres `.eq()` correspondants
  - Modifier `useStudents` dans `src/hooks/use-students.tsx` pour accepter `(dept, classe)` et les passer à `fetchStudents`
  - Créer `filterStudents(students, dept, classe)` comme fonction utilitaire pure dans `src/lib/students-store.ts`
  - _Requirements: 2.3, 3.1, 3.2_

  - [ ] 7.1 Modifier `fetchStudents` dans `src/lib/students-store.ts`
    - Ajouter les paramètres optionnels `departement` et `classe`
    - Inclure `departement` et `classe` dans le `select` Supabase
    - Mapper les champs dans le type `Student` étendu
    - _Requirements: 2.3, 3.1_

  - [ ] 7.2 Créer `filterStudents` et modifier `useStudents`
    - Exporter `filterStudents(students, dept, classe)` depuis `src/lib/students-store.ts`
    - Mettre à jour `src/hooks/use-students.tsx` pour passer `(dept, classe)` à `fetchStudents`
    - _Requirements: 2.3, 3.1_

  - [ ]* 7.3 Écrire le test de propriété — Filtrage correct (Property 3)
    - Créer `src/__tests__/students-filter.test.ts`
    - **Property 3 : Filtrage correct par département et classe**
    - **Validates: Requirements 2.3, 3.1, 3.3, 5.2, 5.3, 6.2**

  - [ ]* 7.4 Écrire le test de propriété — Isolation des statistiques (Property 5)
    - Dans `src/__tests__/students-filter.test.ts`
    - **Property 5 : Isolation des statistiques par groupe**
    - **Validates: Requirements 3.2**

- [ ] 8. Modifier la page principale `Index.tsx` pour le filtrage et les gardes
  - Consommer `useDepartment()` dans `src/pages/Index.tsx`
  - Passer `(departement, classe)` à `useStudents` pour ne charger que le groupe sélectionné
  - Bloquer les actions import/export avec toast si `!isSelected`
  - Afficher le message "Aucun étudiant" quand la liste filtrée est vide
  - _Requirements: 2.3, 2.5, 3.5, 4.2, 7.2_

  - [ ] 8.1 Filtrer les étudiants et afficher l'état vide dans `Index.tsx`
    - Modifier `src/pages/Index.tsx` pour consommer `useDepartment()`
    - Afficher le message d'état vide conditionnel
    - _Requirements: 2.3, 2.5_

  - [ ] 8.2 Bloquer import et export ZIP sans sélection
    - Dans `src/pages/Index.tsx`, vérifier `isSelected` avant import Excel et export ZIP
    - Afficher un toast d'avertissement si non sélectionné
    - _Requirements: 3.5, 4.2, 7.2_

  - [ ]* 8.3 Écrire les tests unitaires — Comportements de `Index.tsx`
    - Tester que l'import est bloqué sans sélection
    - Tester que le message vide s'affiche quand `students.length === 0`
    - _Requirements: 2.5, 4.2_

- [ ] 9. Modifier `GradeEntry.tsx` pour filtrer les matières par département/classe
  - Consommer `useDepartment()` et `useSubjects(dept, classe)` dans `src/components/GradeEntry.tsx`
  - Créer le hook `useSubjects(dept, classe)` dans `src/hooks/use-subjects.tsx`
  - Afficher uniquement les matières du groupe sélectionné
  - _Requirements: 3.3, 5.2, 5.3_

  - [ ] 9.1 Créer le hook `useSubjects` dans `src/hooks/use-subjects.tsx`
    - Retourner `getSubjects(dept, classe)` pour la sélection courante
    - _Requirements: 3.3, 5.2_

  - [ ] 9.2 Modifier `GradeEntry.tsx`
    - Consommer `useDepartment()` et `useSubjects()`
    - Remplacer les constantes monolithiques par les matières filtrées
    - _Requirements: 3.3, 5.2, 5.3_

  - [ ]* 9.3 Écrire les tests unitaires — `GradeEntry` avec filtrage
    - Vérifier que seules les matières du groupe sélectionné sont affichées
    - _Requirements: 3.3, 5.3_

- [ ] 10. Mettre à jour la logique de bulletin (BulletinPrintContent & BulletinModal)
  - Modifier `src/components/BulletinPrintContent.tsx` pour recevoir et afficher `departement` et `classe` dans l'en-tête
  - Modifier `src/components/BulletinModal.tsx` pour transmettre ces champs depuis la sélection courante
  - _Requirements: 3.4, 6.3_

  - [ ] 10.1 Modifier `BulletinPrintContent.tsx`
    - Ajouter `departement` et `classe` aux props
    - Afficher `DEPARTEMENT_LABELS[departement]` et `classe` dans l'en-tête du bulletin
    - _Requirements: 3.4, 6.3_

  - [ ] 10.2 Modifier `BulletinModal.tsx`
    - Lire `useDepartment()` et passer les valeurs à `BulletinPrintContent`
    - _Requirements: 3.4_

  - [ ]* 10.3 Écrire le test de propriété — Contenu du bulletin (Property 6)
    - Créer `src/__tests__/bulletin.test.ts`
    - **Property 6 : Contenu du bulletin — présence du département et de la classe**
    - **Validates: Requirements 3.4, 6.3**

- [ ] 11. Checkpoint — Vérifier le tableau de bord complet et les bulletins
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Mettre à jour la logique d'import Excel pour tagger avec dept/classe
  - Modifier `importStudentsFromExcel` dans `src/lib/excel-import.ts` pour accepter `departement` et `classe` et les attacher à chaque étudiant importé
  - Mettre à jour l'appel dans `Index.tsx` pour passer la sélection courante
  - Implémenter la logique upsert préservant `departement` et `classe` des étudiants existants
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ] 12.1 Modifier `excel-import.ts` — ajout des paramètres dept/classe
    - Modifier `importStudentsFromExcel` pour accepter `departement: Departement` et `classe: Classe`
    - Tagguer chaque étudiant importé avec ces valeurs
    - Signaler les lignes invalides (matricule absent, note hors [0,20])
    - _Requirements: 4.1, 4.4_

  - [ ] 12.2 Implémenter la préservation du dept/classe lors de l'upsert
    - Dans la logique d'écriture Supabase, ne pas écraser `departement`/`classe` si l'étudiant existe déjà
    - _Requirements: 4.3_

  - [ ]* 12.3 Écrire le test de propriété — Attribution lors de l'import (Property 7)
    - Créer `src/__tests__/excel-import.test.ts`
    - **Property 7 : Attribution correcte lors de l'import**
    - **Validates: Requirements 4.1**

  - [ ]* 12.4 Écrire le test de propriété — Préservation dept/classe lors d'un upsert (Property 8)
    - Dans `src/__tests__/excel-import.test.ts`
    - **Property 8 : Préservation du département/classe lors d'un upsert**
    - **Validates: Requirements 4.3**

  - [ ]* 12.5 Écrire le test de propriété — Import partiel (Property 9)
    - Dans `src/__tests__/excel-import.test.ts`
    - **Property 9 : Import partiel — seules les lignes valides sont insérées**
    - **Validates: Requirements 4.4**

- [ ] 13. Mettre à jour `use-auth.tsx` pour charger dept/classe dans le profil étudiant
  - Modifier `buildAuthUser` dans `src/hooks/use-auth.tsx` pour lire `departement` et `classe` depuis la table `etudiants` et les exposer dans `AuthUser`
  - _Requirements: 6.1_

  - [ ] 13.1 Modifier `buildAuthUser` dans `use-auth.tsx`
    - Inclure `departement` et `classe` dans le `select` de la table `etudiants`
    - Renseigner `AuthUser.departement` et `AuthUser.classe`
    - _Requirements: 6.1_

  - [ ]* 13.2 Écrire le test de propriété — Cohérence profil/contexte (Property 11)
    - Créer `src/__tests__/auth-user.test.ts`
    - **Property 11 : Cohérence du profil étudiant et du contexte de navigation**
    - **Validates: Requirements 6.1**

- [ ] 14. Mettre à jour l'espace étudiant `StudentSpace.tsx`
  - Modifier `src/pages/StudentSpace.tsx` pour lire `departement` et `classe` depuis `useAuth().user`
  - Utiliser `getSubjects(departement, classe)` pour afficher uniquement les matières du groupe de l'étudiant
  - Afficher le nom du département et la classe dans l'en-tête du bulletin étudiant
  - Afficher le message de contact administration si `departement` ou `classe` est absent
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ] 14.1 Filtrer les matières et l'en-tête dans `StudentSpace.tsx`
    - Consommer `useAuth().user.departement` et `useAuth().user.classe`
    - Passer à `getSubjects` et afficher le bon en-tête
    - _Requirements: 6.2, 6.3_

  - [ ] 14.2 Gérer le cas étudiant sans profil dept/classe
    - Si `!user.departement || !user.classe`, afficher le message d'invitation à contacter l'administration
    - _Requirements: 6.4_

  - [ ]* 14.3 Écrire les tests unitaires — `StudentSpace` filtrage et état manquant
    - Vérifier le filtrage des matières selon le profil
    - Vérifier l'affichage du message si profil incomplet
    - _Requirements: 6.2, 6.4_

- [ ] 15. Créer et appliquer la migration SQL Supabase
  - Créer `supabase/migrations/001_add_dept_classe.sql` avec les `ALTER TABLE` pour `etudiants`, `matieres`, `profiles` et les index de performance
  - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 15.1 Créer `supabase/migrations/001_add_dept_classe.sql`
    - Ajouter colonnes `departement` et `classe` avec contraintes `CHECK` et valeurs par défaut `'RSN'`/`'L3'` pour la migration des données existantes
    - Créer `idx_etudiants_dept_classe` et `idx_matieres_dept_classe`
    - Ajouter colonnes optionnelles à `profiles`
    - _Requirements: 1.1, 1.2, 1.3_

- [ ] 16. Intégration finale et câblage
  - Vérifier que `GradesTable.tsx` reçoit uniquement les étudiants déjà filtrés (aucune modification interne nécessaire)
  - S'assurer que l'export ZIP dans `Index.tsx` n'exporte que les bulletins du groupe courant
  - Vérifier la cohérence du passage de `departement`/`classe` sur tous les chemins de saisie de note
  - _Requirements: 3.5, 2.3, 3.1_

  - [ ] 16.1 Vérifier et corriger l'export ZIP
    - S'assurer que la génération ZIP filtre les étudiants par la sélection courante
    - _Requirements: 3.5_

  - [ ] 16.2 Vérifier le passage des données dans `GradesTable`
    - Confirmer que `GradesTable` reçoit des étudiants pré-filtrés depuis `Index.tsx`
    - _Requirements: 2.3_

  - [ ]* 16.3 Écrire les tests d'intégration — Flux complet
    - Créer `src/__tests__/integration.test.ts`
    - Tester import Excel → vérification tag dept/classe en sortie
    - Tester espace étudiant RSN L3 — matières correctes chargées
    - _Requirements: 4.1, 6.2_

- [ ] 17. Checkpoint final — Vérifier l'ensemble des tests
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Les tâches marquées `*` sont optionnelles et peuvent être ignorées pour un MVP plus rapide
- Chaque tâche référence les exigences spécifiques pour la traçabilité
- La migration SQL (tâche 15) doit être appliquée dans Supabase avant les tests de bout en bout
- `fast-check` doit être installé avant l'exécution des tests de propriétés : `npm install --save-dev fast-check`
- Les matières des groupes MTIC L1/L2/L3 et AV L1/L2/L3 doivent être définies en accord avec le programme pédagogique réel ; des placeholders peuvent être utilisés en attendant la validation
- La tâche 6.1 (subjects.ts) est le seul endroit où une connaissance métier spécifique (programmes par département) est nécessaire

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "15.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "2.1", "6.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "6.2", "6.3", "7.1"] },
    { "id": 3, "tasks": ["3.1", "7.2", "9.1"] },
    { "id": 4, "tasks": ["3.2", "4.1", "7.3", "7.4", "9.2"] },
    { "id": 5, "tasks": ["4.2", "8.1", "9.3", "10.1", "13.1"] },
    { "id": 6, "tasks": ["8.2", "10.2", "12.1", "13.2", "14.1"] },
    { "id": 7, "tasks": ["8.3", "10.3", "12.2", "14.2"] },
    { "id": 8, "tasks": ["12.3", "12.4", "12.5", "14.3"] },
    { "id": 9, "tasks": ["16.1", "16.2"] },
    { "id": 10, "tasks": ["16.3"] }
  ]
}
```
