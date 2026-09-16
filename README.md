# Ma Garderie — gestion de garderie

Application web de gestion pour une garderie : présences des enfants, équipe
d'éducatrices, emplois du temps, et une base pensée pour ajouter d'autres
modules au fil du temps.

## Fonctionnalités

| Module | Ce qu'il permet |
| --- | --- |
| **Tableau de bord** | Vue du jour : enfants présents/absents, taux par groupe, programme restant, équipe en service. |
| **Présences** | Feuille de présence quotidienne (par groupe ou globale) : présent / retard / absent / excusé, heures d'arrivée et de départ, remarques, boutons « tous présents ». Historique par période avec taux de présence par enfant. |
| **Enfants** | Dossier de chaque enfant : identité, groupe, allergies (mises en évidence sur la feuille de présence), infos médicales, contacts parents/tuteurs, historique de présence. |
| **Groupes** | Groupes d'âge, salle, capacité, couleur, éducatrices affectées et référente. |
| **Éducatrices** | Fiche du personnel, horaire hebdomadaire type, congés/absences, pointage quotidien de l'équipe. |
| **Emploi du temps** | Planning hebdomadaire par groupe (accueil, activités, repas, sieste, sorties), créneaux multi-jours, copie d'un groupe à l'autre, version imprimable. |
| **Utilisateurs** | Comptes d'accès et rôles : Administration, Éducatrice, Parent (réservé pour un futur espace parents). |

## Démarrage rapide

Prérequis : Node.js 20 ou plus récent.

```bash
npm install
npm run setup     # crée .env, applique les migrations, charge les données de démo
npm run dev       # http://localhost:3000
```

Comptes de démonstration :

| Rôle | Courriel | Mot de passe |
| --- | --- | --- |
| Administration | admin@garderie.local | admin1234 |
| Éducatrice | marie@garderie.local | educ1234 |

Changez ces mots de passe depuis **Utilisateurs** avant toute utilisation réelle.

## Stack technique

- **Next.js 16** (App Router, Server Actions) + **React 19** + **TypeScript**
- **Tailwind CSS 4**
- **Prisma 6** avec **SQLite** (fichier `prisma/dev.db`) — migrable vers PostgreSQL en changeant le `provider` du schéma
- Authentification maison par sessions (cookie httpOnly, mots de passe hachés avec bcrypt)

## Scripts

| Commande | Rôle |
| --- | --- |
| `npm run dev` | Serveur de développement |
| `npm run build` / `npm start` | Build et serveur de production |
| `npm run lint` / `npm run typecheck` | Qualité du code |
| `npm run db:migrate` | Créer/appliquer une migration après modification de `prisma/schema.prisma` |
| `npm run db:seed` | Charger les données de démonstration |
| `npm run db:studio` | Explorer la base de données dans le navigateur |
| `npm run db:reset` | Réinitialiser complètement la base (⚠ efface tout) |

## Structure du projet

```
prisma/
  schema.prisma        # modèle de données (enfants, groupes, présences, personnel, planning…)
  seed.ts              # données de démonstration
src/
  proxy.ts             # redirection vers /login si non connecté
  lib/
    auth.ts            # sessions, rôles, requireUser / requireRole
    modules.ts         # registre des modules (menu de navigation)
    dates.ts, labels.ts, forms.ts
  components/          # composants d'interface réutilisables
  app/
    login/             # page de connexion
    (app)/             # pages protégées, une sous-dossier par module
      page.tsx         # tableau de bord
      presences/  enfants/  groupes/  educatrices/  emploi-du-temps/  utilisateurs/
```

Chaque module suit la même organisation : `page.tsx` (liste), `nouveau/`,
`[id]/` (détail), `[id]/modifier/`, un fichier `actions.ts` (Server Actions
validées avec zod) et un ou deux formulaires client.

## Ajouter un nouveau module

Exemple : un module « Menus de la semaine ».

1. **Données** — ajouter le modèle dans `prisma/schema.prisma`, puis
   `npm run db:migrate -- --name menus`.
2. **Pages** — créer `src/app/(app)/menus/page.tsx` (et `actions.ts` pour les
   écritures). Utiliser `requireUser()` ou `requireRole("ADMIN")` en tête de
   page pour la protection.
3. **Menu** — ajouter une entrée dans `MODULES` (`src/lib/modules.ts`) : elle
   apparaît automatiquement dans la barre latérale pour les rôles indiqués.

Idées de modules prévus : facturation et paiements, messagerie avec les
parents, menus et repas, rapports quotidiens (sommeil, repas, changements),
liste d'attente et inscriptions, événements et fermetures.

## Rôles

- **Administration** : accès complet (groupes, personnel, comptes, suppression).
- **Éducatrice** : présences, dossiers enfants, emploi du temps, pointage ; lecture du reste.
- **Parent** : aucun accès pour l'instant (prévu pour un espace parents).
