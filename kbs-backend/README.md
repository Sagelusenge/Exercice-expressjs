# KBS Backend API

Backend REST API pour la plateforme KBS de gestion immobilière.

## Structure du Projet

```
kbs-backend/
├── src/
│   ├── config/                  # Configuration
│   │   ├── database.js         # Configuration base de données
│   │   ├── environment.js      # Variables d'environnement
│   │   └── constants.js        # Constantes globales
│   │
│   ├── middleware/             # Middlewares Express
│   │   ├── auth.middleware.js          # Authentication
│   │   ├── role.middleware.js          # Autorisation par rôle
│   │   ├── tenant.middleware.js        # Multi-tenancy
│   │   ├── rateLimit.middleware.js     # Rate limiting
│   │   ├── upload.middleware.js        # Upload de fichiers
│   │   ├── validator.middleware.js     # Validation des requêtes
│   │   └── activityLog.middleware.js   # Logging des activités
│   │
│   ├── modules/                # Modules métier (par feature)
│   │   ├── auth/               # Authentification & autorisation
│   │   ├── tenants/            # Gestion des locataires
│   │   ├── users/              # Gestion des utilisateurs
│   │   ├── parcelles/          # Gestion des parcelles
│   │   ├── reservations/       # Gestion des réservations
│   │   ├── ventes/             # Gestion des ventes
│   │   ├── paiements/          # Gestion des paiements
│   │   ├── visites/            # Gestion des visites
│   │   ├── favoris/            # Gestion des favoris
│   │   ├── kbs-locataires/     # Locataires spécifiques KBS
│   │   ├── kbs-factures/       # Factures KBS
│   │   ├── kbs-paiements-loyer/# Paiements de loyer
│   │   ├── kbs-rapports/       # Rapports KBS
│   │   ├── notifications/      # Notifications
│   │   ├── chat/               # Système de chat
│   │   ├── activity-logs/      # Logs d'activité
│   │   ├── dashboard/          # Tableau de bord
│   │   └── parametres/         # Paramètres système
│   │
│   ├── services/               # Services métier
│   │   ├── email.service.js            # Service d'email
│   │   ├── notification.service.js     # Service de notifications
│   │   ├── upload.service.js           # Service d'upload
│   │   ├── pdf.service.js              # Service de génération PDF
│   │   └── sequence.service.js         # Service de numérotation
│   │
│   ├── utils/                  # Utilitaires
│   │   ├── response.util.js    # Format des réponses
│   │   ├── pagination.util.js  # Utilitaires de pagination
│   │   ├── date.util.js        # Utilitaires de date
│   │   └── crypto.util.js      # Utilitaires cryptographiques
│   │
│   ├── jobs/                   # Jobs programmés (Cron)
│   │   ├── expirer-reservations.job.js      # Expire les réservations
│   │   ├── verifier-retards-loyer.job.js    # Vérifie les retards de loyer
│   │   └── rappel-echeance.job.js           # Rappels d'échéances
│   │
│   └── app.js                  # Configuration Express
│
├── server.js                   # Point d'entrée
├── .env                        # Variables d'environnement
├── .env.example                # Exemple de variables
├── package.json                # Dépendances NPM
└── README.md                   # Ce fichier
```

## Installation

### Prérequis
- Node.js >= 14.x
- PostgreSQL >= 12.x
- npm ou yarn

### Étapes d'installation

1. **Cloner le projet**
```bash
git clone <repository-url>
cd kbs-backend
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer les variables d'environnement**
```bash
cp .env.example .env
# Éditer .env avec vos paramètres
```

4. **Initialiser la base de données**
```bash
npm run migrate
```

## Démarrage

### Mode développement
```bash
npm run dev
```

### Mode production
```bash
npm start
```

## Scripts disponibles

| Script | Description |
|--------|-------------|
| `npm start` | Démarre le serveur en production |
| `npm run dev` | Démarre le serveur avec nodemon (dev) |
| `npm test` | Lance les tests |
| `npm run lint` | Vérifie la qualité du code |
| `npm run migrate` | Exécute les migrations |

## Architecture

### Principes
- **Modularité**: Chaque feature est dans son propre module
- **Couches**: Séparation entre routes, services, et données
- **Réutilisabilité**: Middleware et services réutilisables
- **Scalabilité**: Support multi-tenant

### Structure d'un module

Chaque module devrait contenir:
```
module-name/
├── routes.js        # Routes Express
├── controller.js    # Logique des requêtes
├── service.js       # Logique métier
├── model.js         # Modèle de données
└── validation.js    # Validations
```

## Dépendances principales

- **express**: Framework web
- **pg**: Client PostgreSQL
- **jsonwebtoken**: JWT pour l'auth
- **bcryptjs**: Hachage de mots de passe
- **multer**: Upload de fichiers
- **bull**: Queue job
- **nodemailer**: Envoi d'emails

## Variables d'environnement

```
NODE_ENV=development          # development, production, test
PORT=3000                     # Port du serveur
DB_HOST=localhost            # Hôte PostgreSQL
DB_PORT=5432                 # Port PostgreSQL
DB_USER=postgres             # Utilisateur PostgreSQL
DB_PASSWORD=password         # Mot de passe PostgreSQL
DB_NAME=kbs_db              # Nom de la base de données
JWT_SECRET=your_secret       # Secret JWT
JWT_EXPIRY=7d               # Durée du JWT
```

## API Documentation

Voir la documentation Swagger/OpenAPI à `http://localhost:3000/api-docs`

## Contribution

1. Créer une branche feature: `git checkout -b feature/feature-name`
2. Commit les changements: `git commit -am 'Add feature'`
3. Push vers la branche: `git push origin feature/feature-name`
4. Créer une Pull Request

## License

ISC

## Recapitulatif

TRIGGERS BD                          →  SERVICE/CONTROLLER BACKEND
─────────────────────────────────────────────────────────────────────
trg_tenant_before_insert             →  tenants.routes POST /
trg_user_before_insert               →  auth.service.register() / users.service.createUser()
trg_user_check_locataire             →  locataires.service.createLocataire() [géré BD]
trg_parcelle_before_insert           →  parcelles.service.createParcelle()
trg_parcelle_after_update            →  paiements.routes PATCH /valider
trg_reservation_before_insert        →  reservations.service.createReservation()
trg_reservation_check_disponible     →  reservations.service.createReservation() [géré BD]
trg_reservation_after_insert         →  reservations.service.createReservation()
trg_reservation_after_update         →  reservations.service.updateStatut()
trg_vente_before_insert              →  ventes.service.createVente()
trg_vente_after_update               →  ventes.service.confirmerVente()
trg_paiement_before_insert           →  paiements.routes POST /
trg_paiement_after_update            →  paiements.routes PATCH /valider
trg_visite_before_insert             →  visites.routes POST /
trg_parcelle_image_before_insert     →  parcelles.service.addImage()
trg_parcelle_doc_before_insert       →  parcelles.service.addDocument()
trg_vente_doc_before_insert          →  ventes.service.addDocument()
trg_locataire_before_insert          →  locataires.service.createLocataire()
trg_facture_before_insert            →  factures.service.createFacture()
trg_facture_after_insert             →  factures.service.createFacture() [historique auto]
trg_facture_after_update             →  factures.service.validerFacture/rejeterFacture()
trg_paiement_loyer_before_insert     →  paiements-loyer.routes POST /
trg_paiement_loyer_after_update      →  paiements-loyer.routes PATCH /valider
trg_notification_before_insert       →  notification.service.createNotification()
trg_email_log_before_insert          →  notification.service.logEmail()
trg_conversation_before_insert       →  chat.service.createConversation()
trg_message_before_insert            →  chat.service.sendMessage() + chat.socket.js
trg_activity_log_before_insert       →  activityLog.middleware.js
trg_rapport_before_insert            →  rapports.routes POST /generer

VIEWS BD                             →  SERVICE/ROUTE BACKEND
─────────────────────────────────────────────────────────────────────
v_parcelles_publiques                →  GET /parcelles (public, SANS prix)
v_parcelles_admin                    →  GET /parcelles/admin/liste (admin, AVEC prix)
v_dashboard_parcelles                →  GET /dashboard/parcelles
v_dashboard_users                    →  GET /dashboard/users
v_ventes_detail                      →  GET /ventes + GET /ventes/:id
v_reservations_actives               →  GET /reservations/actives
v_locataires_kbs                     →  GET /kbs/locataires
v_dashboard_kbs                      →  GET /kbs/locataires/dashboard + GET /dashboard/kbs
v_factures_kbs                       →  GET /kbs/factures
v_rapport_financier_ventes           →  GET /dashboard/rapport-financier
v_paiements_loyer_mensuel            →  GET /kbs/paiements-loyer/rapport-mensuel
v_chat_actif                         →  GET /chat/conversations (admin)
v_activites_recentes                 →  GET /dashboard/activites
v_notifications_non_lues             →  GET /notifications/non-lues
v_parcelles_populaires               →  GET /parcelles/populaires

PROCÉDURES BD                        →  SERVICE/ROUTE BACKEND
─────────────────────────────────────────────────────────────────────
sp_expirer_reservations              →  jobs/expirer-reservations.job.js (CRON 1h)
sp_verifier_locataires_retard        →  jobs/verifier-retards-loyer.job.js (CRON 08h)
sp_rappel_echeance_j7                →  jobs/rappel-echeance.job.js (CRON 09h)
sp_valider_facture                   →  PATCH /kbs/factures/:id/valider
sp_rejeter_facture                   →  PATCH /kbs/factures/:id/rejeter
sp_confirmer_vente                   →  PATCH /ventes/:id/confirmer
sp_dashboard_admin                   →  GET /dashboard/admin
sp_rapport_mensuel_kbs               →  GET /kbs/rapports/mensuel
sp_recherche_parcelles               →  GET /parcelles/recherche

EVENTS BD                            →  JOBS CRON NODE
─────────────────────────────────────────────────────────────────────
evt_expirer_reservations (1h)        →  cron.schedule("0 * * * *", ...)
evt_verifier_retards_loyer (08h)     →  cron.schedule("0 8 * * *", ...)
evt_rappel_echeance_j7 (09h)         →  cron.schedule("0 9 * * *", ...)