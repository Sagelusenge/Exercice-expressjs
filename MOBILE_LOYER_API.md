# API Mobile KBS - Module Loyer

Base URL production:

```txt
https://backend-dx5f.onrender.com/api/v1
```

Headers communs:

```txt
Content-Type: application/json
X-Tenant-Slug: kbs-immobilier
Authorization: Bearer <token>
```

`Authorization` est obligatoire sauf pour login, verification email et reset password.

## Authentification

### Connexion

```http
POST /auth/login
```

Body:

```json
{
  "email": "serge.balezi@kbs-immobilier.com",
  "mot_de_passe": "KbsAdmin@2026"
}
```

Reponse succes:

```json
{
  "success": true,
  "message": "Connexion reussie",
  "data": {
    "user": {
      "id": 1,
      "code_user": "KBS-BS-SADM-001",
      "nom": "Balezi",
      "prenom": "Serge",
      "email": "serge.balezi@kbs-immobilier.com",
      "role": "SUPER_ADMIN",
      "module_accessible": "LES_DEUX"
    },
    "token": "jwt..."
  }
}
```

### Verification email par code

```http
POST /auth/verify-email
```

Body:

```json
{
  "email": "locataire@example.com",
  "code": "123456"
}
```

### Verification du code seulement

```http
POST /auth/verify-code
```

Utilise avant d'afficher l'ecran de creation de mot de passe.

### Renvoyer le code

```http
POST /auth/resend-code
```

Body:

```json
{
  "email": "locataire@example.com"
}
```

### Mot de passe oublie

```http
POST /auth/forgot-password
```

Body:

```json
{
  "email": "locataire@example.com"
}
```

### Reinitialiser le mot de passe

```http
POST /auth/reset-password
```

Body:

```json
{
  "email": "locataire@example.com",
  "code": "123456",
  "nouveau_mot_de_passe": "NouveauPass@2026"
}
```

### Profil connecte

```http
GET /auth/me
```

## Locataires

### Profil du locataire connecte

Role: `LOCATAIRE`

```http
GET /kbs/locataires/mon-profil
```

### Liste des locataires

Roles: `SUPER_ADMIN`, `BOSS`, `GERANT`

```http
GET /kbs/locataires?page=1&limit=20&search=serge&categorie=SIMPLE&statut_paiement=A_JOUR
```

Filtres:

```txt
page, limit, search, categorie=SIMPLE|ENTREPRISE, statut_paiement=A_JOUR|EN_RETARD
```

### Creer un locataire

Roles: `SUPER_ADMIN`, `BOSS`, `GERANT`

```http
POST /kbs/locataires
```

Body locataire simple:

```json
{
  "categorie": "SIMPLE",
  "nom": "Lusenge",
  "prenom": "Sage",
  "email": "sage@example.com",
  "telephone_personnel": "+243980208012",
  "adresse_personnelle": "Goma",
  "date_debut_loyer": "2026-06-01",
  "date_fin_loyer": "2026-07-01",
  "montant_mensuel_loyer": 765,
  "devise": "USD"
}
```

Body entreprise:

```json
{
  "categorie": "ENTREPRISE",
  "nom_entreprise": "DeGang's Tech",
  "nom_representant": "Ganza Serge",
  "telephone_entreprise": "+243000000000",
  "email_entreprise": "contact@degang.example",
  "adresse_siege": "Goma",
  "date_debut_loyer": "2026-06-01",
  "date_fin_loyer": "2026-07-01",
  "montant_mensuel_loyer": 765,
  "devise": "USD"
}
```

### Detail locataire

```http
GET /kbs/locataires/:id
```

### Modifier locataire

```http
PUT /kbs/locataires/:id
```

### Supprimer locataire

```http
DELETE /kbs/locataires/:id
```

## Factures de loyer

### Creer une facture

Roles: `SUPER_ADMIN`, `BOSS`, `GERANT`

```http
POST /kbs/factures
```

Body:

```json
{
  "locataire_id": 1,
  "periode_debut": "2026-06-01",
  "periode_fin": "2026-06-30",
  "montant_loyer": 765,
  "devise": "USD",
  "notes_admin": "Loyer juin"
}
```

### Liste des factures

```http
GET /kbs/factures?page=1&limit=20&statut=VALIDEE&locataire_id=1
```

Statuts:

```txt
EN_ATTENTE, VALIDEE, REJETEE
```

La reponse de `v_factures_kbs` contient notamment:

```txt
montant_loyer, montant_paye, montant_restant, statut, peut_telecharger, pdf_url
```

### Mes factures

Role: `LOCATAIRE`

```http
GET /kbs/factures/mes-factures
```

### Detail facture

```http
GET /kbs/factures/:id
```

### Modifier facture

```http
PUT /kbs/factures/:id
```

Body partiel:

```json
{
  "montant_loyer": 800,
  "notes_admin": "Correction montant"
}
```

### Valider facture

```http
PATCH /kbs/factures/:id/valider
```

Body:

```json
{
  "pdf_url": "https://..."
}
```

### Rejeter facture

```http
PATCH /kbs/factures/:id/rejeter
```

Body:

```json
{
  "motif": "Montant incorrect"
}
```

### Historique facture

```http
GET /kbs/factures/:id/historique
```

### Telecharger facture

```http
GET /kbs/factures/:id/telecharger
```

Retourne `pdf_url` si `peut_telecharger = 1`.

## Paiements de loyer

### Enregistrer un paiement

Roles: `SUPER_ADMIN`, `BOSS`, `GERANT`

```http
POST /kbs/paiements-loyer
```

Body avec facture:

```json
{
  "locataire_id": 1,
  "facture_id": 3,
  "montant_paye": 200,
  "devise": "USD",
  "mode_paiement": "CASH",
  "reference_paiement": "RECU-001",
  "preuve_url": "https://...",
  "notes": "Paiement partiel"
}
```

Body sans facture:

```json
{
  "locataire_id": 1,
  "montant_paye": 200,
  "mode_paiement": "CASH"
}
```

Si `facture_id` est absent, le backend cherche automatiquement la premiere facture ouverte du locataire.

Modes de paiement acceptes par la BD:

```txt
CASH, MOBILE_MONEY, VIREMENT, AUTRE
```

### Liste des paiements

```http
GET /kbs/paiements-loyer?page=1&limit=20&locataire_id=1&statut=VALIDE
```

Statuts:

```txt
EN_ATTENTE, VALIDE, REJETE
```

### Mes paiements

Role: `LOCATAIRE`

```http
GET /kbs/paiements-loyer/mes-paiements
```

### Valider paiement

```http
PATCH /kbs/paiements-loyer/:id/valider
```

Quand le paiement est valide, il apparait dans le total paye de la facture; le `montant_restant` diminue via la vue facture.

### Rejeter paiement

```http
PATCH /kbs/paiements-loyer/:id/rejeter
```

### Modifier paiement

```http
PUT /kbs/paiements-loyer/:id
```

Body partiel:

```json
{
  "montant_paye": 300,
  "notes": "Correction du montant"
}
```

### Supprimer paiement

```http
DELETE /kbs/paiements-loyer/:id
```

### Rapport mensuel

```http
GET /kbs/paiements-loyer/rapport-mensuel
```

## Codes erreur frequents

```txt
400: donnees invalides ou paiement superieur au reste a payer
401: token absent/expire ou identifiants incorrects
403: role non autorise, email non verifie, compte bloque
404: ressource introuvable
500: erreur serveur
```

## Notes mobile

- Toujours stocker le `token` JWT apres login.
- Toujours envoyer `X-Tenant-Slug: kbs-immobilier`.
- Pour un locataire, utiliser `mes-factures`, `mes-paiements`, `mon-profil`.
- Pour un admin, utiliser les routes de liste/creation/validation/rejet.
- Les montants peuvent etre envoyes en nombre (`765`) ou chaine (`"765.00"`). Eviter la virgule cote mobile si possible.
