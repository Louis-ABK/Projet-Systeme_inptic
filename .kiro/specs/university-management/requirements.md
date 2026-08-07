# Document de Exigences — Gestion Universitaire Multi-Départements

## Introduction

L'application INPTIC Grade Manager doit être étendue pour prendre en charge plusieurs départements et plusieurs classes au sein de chaque département. Actuellement, l'application est dédiée à une seule filière (LP ASUR — Réseaux et Systèmes Numériques, L3). La nouvelle fonctionnalité doit permettre à l'administration de gérer les étudiants, les matières, les notes et les bulletins pour l'ensemble des départements et classes de l'université INPTIC.

Les trois départements concernés sont :
- **Management des TIC** (MTIC) : classes L1, L2, L3
- **Réseaux et Systèmes Numériques** (RSN) : classes L1, L2, L3
- **Audio-visuel** (AV) : classes L1, L2, L3

## Glossaire

- **Application** : L'application web INPTIC Grade Manager (React + Supabase)
- **Département** : Une filière d'enseignement de l'INPTIC (ex. : Management des TIC, Réseaux et Systèmes Numériques, Audio-visuel)
- **Classe** : Un niveau d'études au sein d'un département (L1, L2 ou L3)
- **Étudiant** : Une personne inscrite dans un département et une classe spécifiques
- **Filtre_Département_Classe** : Le sélecteur combiné permettant de choisir un département et une classe dans l'interface
- **Administrateur** : Un utilisateur ayant le rôle "admin" ou "secretariat" dans l'application
- **Sélecteur** : Le composant d'interface permettant de naviguer entre départements et classes
- **Tableau_de_Bord** : La vue principale de l'administration affichant les étudiants et leurs notes
- **Note** : La valeur numérique (entre 0 et 20) attribuée à un étudiant pour une matière
- **Bulletin** : Le document récapitulatif des notes d'un étudiant pour une période donnée
- **Matière** : Une unité d'enseignement associée à un département, une classe et un semestre
- **Semestre** : Une période d'enseignement au sein d'une année universitaire
- **Matricule** : L'identifiant unique d'un étudiant

---

## Exigences

### Exigence 1 : Structure de données multi-départements

**User Story :** En tant qu'administrateur, je veux que chaque étudiant soit associé à un département et une classe, afin de pouvoir organiser et filtrer les données par filière et niveau.

#### Critères d'acceptation

1. THE Application SHALL associer chaque étudiant à exactement un département parmi : "Management des TIC", "Réseaux et Systèmes Numériques", "Audio-visuel".
2. THE Application SHALL associer chaque étudiant à exactement une classe parmi : "L1", "L2", "L3".
3. THE Application SHALL associer chaque matière à exactement un département et une classe.
4. WHEN un nouvel étudiant est créé, THE Application SHALL exiger la sélection d'un département et d'une classe valides.
5. IF un étudiant est créé sans département ou sans classe, THEN THE Application SHALL rejeter l'enregistrement et retourner un message d'erreur indiquant les champs manquants.

---

### Exigence 2 : Navigation par département et classe

**User Story :** En tant qu'administrateur, je veux pouvoir naviguer entre les différents départements et classes, afin de consulter les données de chaque groupe d'étudiants séparément.

#### Critères d'acceptation

1. THE Sélecteur SHALL afficher les trois départements disponibles : "Management des TIC", "Réseaux et Systèmes Numériques", "Audio-visuel".
2. WHEN un département est sélectionné, THE Sélecteur SHALL afficher les classes disponibles pour ce département : L1, L2, L3.
3. WHEN un département et une classe sont sélectionnés, THE Tableau_de_Bord SHALL afficher uniquement les étudiants appartenant à ce département et cette classe.
4. THE Application SHALL conserver la sélection département/classe active lors de la navigation entre les modes "Tableau de bord" et "Saisie des notes".
5. WHEN aucun étudiant n'est inscrit dans le département et la classe sélectionnés, THE Tableau_de_Bord SHALL afficher un message indiquant qu'aucun étudiant n'est enregistré pour cette combinaison.

---

### Exigence 3 : Filtrage des données par département et classe

**User Story :** En tant qu'administrateur, je veux que toutes les données (notes, bulletins, statistiques) soient filtrées selon le département et la classe sélectionnés, afin d'éviter toute confusion entre les filières.

#### Critères d'acceptation

1. WHEN un département et une classe sont sélectionnés, THE Application SHALL afficher uniquement les notes des étudiants appartenant à ce département et cette classe.
2. WHEN un département et une classe sont sélectionnés, THE Application SHALL calculer les statistiques (effectif, moyenne de promotion, nombre d'admis) en utilisant uniquement les étudiants de ce département et cette classe.
3. WHEN un département et une classe sont sélectionnés, THE Application SHALL afficher uniquement les matières associées à ce département et cette classe dans la vue saisie des notes.
4. WHEN un bulletin est généré pour un étudiant, THE Application SHALL inclure le nom du département et la classe de l'étudiant dans le document de bulletin.
5. WHEN une exportation ZIP des bulletins est lancée, THE Application SHALL exporter uniquement les bulletins des étudiants du département et de la classe actuellement sélectionnés.

---

### Exigence 4 : Import de données par département et classe

**User Story :** En tant qu'administrateur, je veux pouvoir importer des fichiers Excel d'étudiants en précisant le département et la classe cibles, afin que les données importées soient correctement catégorisées.

#### Critères d'acceptation

1. WHEN un fichier Excel est importé, THE Application SHALL associer tous les étudiants importés au département et à la classe actuellement sélectionnés dans le Filtre_Département_Classe.
2. WHEN un import Excel est lancé sans département et classe sélectionnés, THE Application SHALL bloquer l'import et afficher un message demandant de sélectionner un département et une classe.
3. WHEN un étudiant importé possède déjà un matricule existant dans la base, THE Application SHALL mettre à jour ses données sans modifier son département ni sa classe d'origine.
4. IF un fichier Excel contient des données invalides (colonnes manquantes, notes hors de la plage 0–20), THEN THE Application SHALL signaler les lignes problématiques et importer uniquement les données valides.

---

### Exigence 5 : Gestion des matières par département et classe

**User Story :** En tant qu'administrateur, je veux que les matières soient organisées par département et classe, afin que chaque filière dispose de son propre programme pédagogique.

#### Critères d'acceptation

1. THE Application SHALL permettre à l'Administrateur d'associer des matières à un département et une classe spécifiques.
2. WHEN les matières d'un département et d'une classe sont affichées, THE Application SHALL afficher uniquement les matières appartenant à cette combinaison département/classe.
3. IF une matière est associée à un département et une classe, THEN THE Application SHALL empêcher son affichage dans les vues d'un autre département ou d'une autre classe.
4. THE Application SHALL conserver les paramètres de calcul des notes (coefficient, crédits, type d'évaluation) indépendamment pour chaque département et classe.

---

### Exigence 6 : Espace étudiant filtré par département et classe

**User Story :** En tant qu'étudiant, je veux accéder à mes notes et mon bulletin correspondant à mon propre département et ma propre classe, afin de ne voir que les informations qui me concernent.

#### Critères d'acceptation

1. WHEN un étudiant se connecte, THE Application SHALL identifier son département et sa classe à partir de son profil.
2. WHEN un étudiant consulte ses notes, THE Application SHALL afficher uniquement les matières de son département et de sa classe.
3. WHEN un étudiant consulte son bulletin, THE Application SHALL afficher le nom du département et la classe dans l'en-tête du bulletin.
4. IF un étudiant n'est associé à aucun département ou aucune classe, THEN THE Application SHALL afficher un message l'invitant à contacter l'administration.

---

### Exigence 7 : Affichage de l'identité de la sélection courante

**User Story :** En tant qu'utilisateur, je veux toujours voir clairement quel département et quelle classe sont actuellement sélectionnés, afin d'éviter les erreurs de saisie ou de consultation.

#### Critères d'acceptation

1. THE Application SHALL afficher le nom du département et la classe actuellement sélectionnés dans l'en-tête ou la barre de navigation de l'interface d'administration.
2. WHILE aucun département ou aucune classe n'est sélectionné, THE Application SHALL afficher un indicateur visuel invitant l'utilisateur à effectuer une sélection avant toute action.
3. THE Application SHALL mettre à jour l'affichage de la sélection courante en moins de 200ms après tout changement de département ou de classe.
