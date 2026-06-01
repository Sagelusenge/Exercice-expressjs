# KBS Frontend

Frontend React pour la plateforme KBS de gestion immobilière.

## Installation

### Prérequis
- Node.js >= 16.x
- npm ou yarn

### Étapes d'installation

1. **Installer les dépendances**
```bash
npm install
```

2. **Configurer les variables d'environnement**
```bash
cp .env .env.local
# Éditer .env.local si nécessaire
```

## Démarrage

### Mode développement
```bash
npm run dev
```

L'application sera disponible à `http://localhost:5173`

### Build production
```bash
npm run build
```

## Structure du Projet

```
src/
├── components/          # Composants réutilisables
├── pages/              # Pages de l'application
├── hooks/              # Custom React hooks
├── store/              # Redux store et API
├── routes/             # Configuration des routes
├── utils/              # Utilitaires et helpers
└── design-system/      # Design tokens et styles globaux
```

## Composants UI

- **Button**: Bouton avec variantes
- **Card**: Conteneur de contenu
- **Badge**: Étiquettes
- **Input**: Champ texte
- **Select**: Liste déroulante
- **Modal**: Fenêtre modale
- **Table**: Tableau de données
- **Pagination**: Pagination
- **Avatar**: Avatar utilisateur
- **Spinner**: Indicateur de chargement
- **Toast**: Notifications
- **Tooltip**: Infobulle
- **Dropdown**: Menu déroulant
- **Tabs**: Onglets

## Pages

### Public
- Accueil
- Catalogue des parcelles
- Détails parcelle
- À propos
- Contact

### Authentification
- Connexion
- Inscription
- Vérification email
- Changement mot de passe

### Admin
- Dashboard
- Gestion utilisateurs
- Gestion parcelles
- Ventes
- Réservations
- Paiements
- Visites
- Locataires
- Factures
- Paiements loyer
- Rapports
- Chat
- Logs d'activité
- Paramètres

### Client
- Dashboard
- Mes favoris
- Mes réservations
- Mes achats
- Mes paiements
- Mes visites
- Profil
- Chat

### Locataire
- Dashboard
- Mes factures
- Mes paiements de loyer
- Profil
- Chat

## Redux Store

### Slices
- `auth`: État d'authentification
- `parcelles`: Liste des parcelles
- `notifications`: Notifications système
- `chat`: Messages de chat

### APIs RTK
- `authApi`: Authentification
- `usersApi`: Gestion utilisateurs
- `parcellesApi`: Gestion parcelles
- `reservationsApi`: Réservations
- `ventesApi`: Ventes
- `paiementsApi`: Paiements
- Et bien d'autres...

## Outils de développement

```bash
npm run lint          # Vérifier la qualité du code
npm run build         # Construire pour production
npm run preview       # Aperçu du build production
```

## License

ISC
