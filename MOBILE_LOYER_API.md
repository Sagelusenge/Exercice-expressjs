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

---

# Endpoints Complètes - Référence Rapide

## Environnement Production

Base URL:
```
https://backend-dx5f.onrender.com/api/v1
```

## Environnement Production

Base URL production:
```
https://backend-dx5f.onrender.com/api/v1
```

---

## Authentification - Endpoints Complètes

### 1. Connexion (Login)

**Endpoint:**
```
POST https://backend-dx5f.onrender.com/api/v1/auth/login
```

**Headers:**
```
Content-Type: application/json
X-Tenant-Slug: kbs-immobilier
```

**Paramètres Body (JSON):**
| Clé | Type | Description | Obligatoire | Exemple |
|-----|------|-------------|-------------|---------|
| `email` | String | Email de l'utilisateur | ✓ | `"serge.balezi@kbs-immobilier.com"` |
| `mot_de_passe` | String | Mot de passe de l'utilisateur | ✓ | `"KbsAdmin@2026"` |

**Réponse Succès (200):**
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
    "token": "jwt_token_here"
  }
}
```

---

### 2. Vérifier Email avec Code

**Endpoint:**
```
POST https://backend-dx5f.onrender.com/api/v1/auth/verify-email
```

**Headers:**
```
Content-Type: application/json
X-Tenant-Slug: kbs-immobilier
```

**Paramètres Body (JSON):**
| Clé | Type | Description | Obligatoire | Exemple |
|-----|------|-------------|-------------|---------|
| `email` | String | Email à vérifier | ✓ | `"locataire@example.com"` |
| `code` | String | Code de vérification reçu | ✓ | `"123456"` |

---

### 3. Vérifier Code Seulement

**Endpoint:**
```
POST https://backend-dx5f.onrender.com/api/v1/auth/verify-code
```

**Headers:**
```
Content-Type: application/json
X-Tenant-Slug: kbs-immobilier
```

**Paramètres Body (JSON):**
| Clé | Type | Description | Obligatoire | Exemple |
|-----|------|-------------|-------------|---------|
| `email` | String | Email de l'utilisateur | ✓ | `"locataire@example.com"` |
| `code` | String | Code à vérifier | ✓ | `"123456"` |

**Note:** Utilisé avant d'afficher l'écran de création de mot de passe.

---

### 4. Renvoyer le Code

**Endpoint:**
```
POST https://backend-dx5f.onrender.com/api/v1/auth/resend-code
```

**Headers:**
```
Content-Type: application/json
X-Tenant-Slug: kbs-immobilier
```

**Paramètres Body (JSON):**
| Clé | Type | Description | Obligatoire | Exemple |
|-----|------|-------------|-------------|---------|
| `email` | String | Email de l'utilisateur | ✓ | `"locataire@example.com"` |

---

### 5. Mot de Passe Oublié

**Endpoint:**
```
POST https://backend-dx5f.onrender.com/api/v1/auth/forgot-password
```

**Headers:**
```
Content-Type: application/json
X-Tenant-Slug: kbs-immobilier
```

**Paramètres Body (JSON):**
| Clé | Type | Description | Obligatoire | Exemple |
|-----|------|-------------|-------------|---------|
| `email` | String | Email de l'utilisateur | ✓ | `"locataire@example.com"` |

---

### 6. Réinitialiser le Mot de Passe

**Endpoint:**
```
POST https://backend-dx5f.onrender.com/api/v1/auth/reset-password
```

**Headers:**
```
Content-Type: application/json
X-Tenant-Slug: kbs-immobilier
```

**Paramètres Body (JSON):**
| Clé | Type | Description | Obligatoire | Exemple |
|-----|------|-------------|-------------|---------|
| `email` | String | Email de l'utilisateur | ✓ | `"locataire@example.com"` |
| `code` | String | Code de vérification | ✓ | `"123456"` |
| `nouveau_mot_de_passe` | String | Nouveau mot de passe | ✓ | `"NouveauPass@2026"` |

---

### 7. Profil Connecté

**Endpoint:**
```
GET https://backend-dx5f.onrender.com/api/v1/auth/me
```

**Headers:**
```
Content-Type: application/json
X-Tenant-Slug: kbs-immobilier
Authorization: Bearer <token>
```

**Paramètres:** Aucun

---

## Locataires - Endpoints Complètes

### 8. Profil du Locataire Connecté

**Endpoint:**
```
GET https://backend-dx5f.onrender.com/api/v1/kbs/locataires/mon-profil
```

**Headers:**
```
Content-Type: application/json
X-Tenant-Slug: kbs-immobilier
Authorization: Bearer <token>
```

**Rôle Autorisé:** `LOCATAIRE`

**Paramètres:** Aucun

---

### 9. Liste des Locataires

**Endpoint:**
```
GET https://backend-dx5f.onrender.com/api/v1/kbs/locataires?page=1&limit=20&search=&categorie=&statut_paiement=
```

**Headers:**
```
Content-Type: application/json
X-Tenant-Slug: kbs-immobilier
Authorization: Bearer <token>
```

**Rôles Autorisés:** `SUPER_ADMIN`, `BOSS`, `GERANT`

**Paramètres Query (URL):**
| Paramètre | Type | Description | Obligatoire | Exemple | Valeurs Acceptées |
|-----------|------|-------------|-------------|---------|-------------------|
| `page` | Integer | Numéro de page | ✗ | `1` | Nombre > 0 |
| `limit` | Integer | Nombre d'éléments par page | ✗ | `20` | Nombre > 0 |
| `search` | String | Recherche par nom/email | ✗ | `"serge"` | Texte libre |
| `categorie` | String | Filtre par catégorie | ✗ | `"SIMPLE"` | `SIMPLE`, `ENTREPRISE` |
| `statut_paiement` | String | Filtre par statut paiement | ✗ | `"A_JOUR"` | `A_JOUR`, `EN_RETARD` |

---

### 10. Créer un Locataire (Simple)

**Endpoint:**
```
POST https://backend-dx5f.onrender.com/api/v1/kbs/locataires
```

**Headers:**
```
Content-Type: application/json
X-Tenant-Slug: kbs-immobilier
Authorization: Bearer <token>
```

**Rôles Autorisés:** `SUPER_ADMIN`, `BOSS`, `GERANT`

**Paramètres Body (JSON) - Locataire Simple:**
| Clé | Type | Description | Obligatoire | Exemple |
|-----|------|-------------|-------------|---------|
| `categorie` | String | Type de locataire | ✓ | `"SIMPLE"` |
| `nom` | String | Nom du locataire | ✓ | `"Lusenge"` |
| `prenom` | String | Prénom du locataire | ✓ | `"Sage"` |
| `email` | String | Email du locataire | ✓ | `"sage@example.com"` |
| `telephone_personnel` | String | Téléphone personnel | ✓ | `"+243980208012"` |
| `adresse_personnelle` | String | Adresse personnelle | ✓ | `"Goma"` |
| `date_debut_loyer` | String (Date) | Date début de loyer | ✓ | `"2026-06-01"` |
| `date_fin_loyer` | String (Date) | Date fin de loyer | ✓ | `"2026-07-01"` |
| `montant_mensuel_loyer` | Number | Montant mensuel loyer | ✓ | `765` |
| `devise` | String | Devise du montant | ✓ | `"USD"` |

---

### 11. Créer un Locataire (Entreprise)

**Endpoint:**
```
POST https://backend-dx5f.onrender.com/api/v1/kbs/locataires
```

**Headers:**
```
Content-Type: application/json
X-Tenant-Slug: kbs-immobilier
Authorization: Bearer <token>
```

**Rôles Autorisés:** `SUPER_ADMIN`, `BOSS`, `GERANT`

**Paramètres Body (JSON) - Locataire Entreprise:**
| Clé | Type | Description | Obligatoire | Exemple |
|-----|------|-------------|-------------|---------|
| `categorie` | String | Type de locataire | ✓ | `"ENTREPRISE"` |
| `nom_entreprise` | String | Nom de l'entreprise | ✓ | `"DeGang's Tech"` |
| `nom_representant` | String | Nom du représentant | ✓ | `"Ganza Serge"` |
| `telephone_entreprise` | String | Téléphone entreprise | ✓ | `"+243000000000"` |
| `email_entreprise` | String | Email entreprise | ✓ | `"contact@degang.example"` |
| `adresse_siege` | String | Adresse siège social | ✓ | `"Goma"` |
| `date_debut_loyer` | String (Date) | Date début loyer | ✓ | `"2026-06-01"` |
| `date_fin_loyer` | String (Date) | Date fin loyer | ✓ | `"2026-07-01"` |
| `montant_mensuel_loyer` | Number | Montant mensuel loyer | ✓ | `765` |
| `devise` | String | Devise du montant | ✓ | `"USD"` |

---

### 12. Détail d'un Locataire

**Endpoint:**
```
GET https://backend-dx5f.onrender.com/api/v1/kbs/locataires/:id
```

**Headers:**
```
Content-Type: application/json
X-Tenant-Slug: kbs-immobilier
Authorization: Bearer <token>
```

**Paramètres URL:**
| Paramètre | Type | Description | Obligatoire | Exemple |
|-----------|------|-------------|-------------|---------|
| `:id` | Integer | ID du locataire | ✓ | `1` |

---

### 13. Modifier un Locataire

**Endpoint:**
```
PUT https://backend-dx5f.onrender.com/api/v1/kbs/locataires/:id
```

**Headers:**
```
Content-Type: application/json
X-Tenant-Slug: kbs-immobilier
Authorization: Bearer <token>
```

**Paramètres URL:**
| Paramètre | Type | Description | Obligatoire | Exemple |
|-----------|------|-------------|-------------|---------|
| `:id` | Integer | ID du locataire | ✓ | `1` |

**Paramètres Body (JSON) - Partiel:**
Vous pouvez envoyer seulement les champs à modifier (voir endpoints 10 et 11 pour tous les champs possibles).

---

### 14. Supprimer un Locataire

**Endpoint:**
```
DELETE https://backend-dx5f.onrender.com/api/v1/kbs/locataires/:id
```

**Headers:**
```
Content-Type: application/json
X-Tenant-Slug: kbs-immobilier
Authorization: Bearer <token>
```

**Paramètres URL:**
| Paramètre | Type | Description | Obligatoire | Exemple |
|-----------|------|-------------|-------------|---------|
| `:id` | Integer | ID du locataire | ✓ | `1` |

---

## Factures de Loyer - Endpoints Complètes

### 15. Créer une Facture

**Endpoint:**
```
POST https://backend-dx5f.onrender.com/api/v1/kbs/factures
```

**Headers:**
```
Content-Type: application/json
X-Tenant-Slug: kbs-immobilier
Authorization: Bearer <token>
```

**Rôles Autorisés:** `SUPER_ADMIN`, `BOSS`, `GERANT`

**Paramètres Body (JSON):**
| Clé | Type | Description | Obligatoire | Exemple |
|-----|------|-------------|-------------|---------|
| `locataire_id` | Integer | ID du locataire | ✓ | `1` |
| `periode_debut` | String (Date) | Début de la période | ✓ | `"2026-06-01"` |
| `periode_fin` | String (Date) | Fin de la période | ✓ | `"2026-06-30"` |
| `montant_loyer` | Number | Montant du loyer | ✓ | `765` |
| `devise` | String | Devise du montant | ✓ | `"USD"` |
| `notes_admin` | String | Notes administrateur | ✗ | `"Loyer juin"` |

---

### 16. Liste des Factures

**Endpoint:**
```
GET https://backend-dx5f.onrender.com/api/v1/kbs/factures?page=1&limit=20&statut=&locataire_id=
```

**Headers:**
```
Content-Type: application/json
X-Tenant-Slug: kbs-immobilier
Authorization: Bearer <token>
```

**Paramètres Query (URL):**
| Paramètre | Type | Description | Obligatoire | Exemple | Valeurs Acceptées |
|-----------|------|-------------|-------------|---------|-------------------|
| `page` | Integer | Numéro de page | ✗ | `1` | Nombre > 0 |
| `limit` | Integer | Nombre d'éléments par page | ✗ | `20` | Nombre > 0 |
| `statut` | String | Filtre par statut | ✗ | `"VALIDEE"` | `EN_ATTENTE`, `VALIDEE`, `REJETEE` |
| `locataire_id` | Integer | Filtre par locataire | ✗ | `1` | ID locataire |

**Champs Retournés:**
| Champ | Type | Description |
|-------|------|-------------|
| `montant_loyer` | Number | Montant du loyer |
| `montant_paye` | Number | Montant payé |
| `montant_restant` | Number | Montant restant à payer |
| `statut` | String | Statut de la facture |
| `peut_telecharger` | Boolean | Peut télécharger la facture |
| `pdf_url` | String | URL du PDF |

---

### 17. Mes Factures (Locataire)

**Endpoint:**
```
GET https://backend-dx5f.onrender.com/api/v1/kbs/factures/mes-factures
```

**Headers:**
```
Content-Type: application/json
X-Tenant-Slug: kbs-immobilier
Authorization: Bearer <token>
```

**Rôle Autorisé:** `LOCATAIRE`

**Paramètres:** Aucun

---

### 18. Détail d'une Facture

**Endpoint:**
```
GET https://backend-dx5f.onrender.com/api/v1/kbs/factures/:id
```

**Headers:**
```
Content-Type: application/json
X-Tenant-Slug: kbs-immobilier
Authorization: Bearer <token>
```

**Paramètres URL:**
| Paramètre | Type | Description | Obligatoire | Exemple |
|-----------|------|-------------|-------------|---------|
| `:id` | Integer | ID de la facture | ✓ | `3` |

---

### 19. Modifier une Facture

**Endpoint:**
```
PUT https://backend-dx5f.onrender.com/api/v1/kbs/factures/:id
```

**Headers:**
```
Content-Type: application/json
X-Tenant-Slug: kbs-immobilier
Authorization: Bearer <token>
```

**Paramètres URL:**
| Paramètre | Type | Description | Obligatoire | Exemple |
|-----------|------|-------------|-------------|---------|
| `:id` | Integer | ID de la facture | ✓ | `3` |

**Paramètres Body (JSON) - Partiel:**
| Clé | Type | Description | Obligatoire | Exemple |
|-----|------|-------------|-------------|---------|
| `montant_loyer` | Number | Montant du loyer | ✗ | `800` |
| `notes_admin` | String | Notes administrateur | ✗ | `"Correction montant"` |

---

### 20. Valider une Facture

**Endpoint:**
```
PATCH https://backend-dx5f.onrender.com/api/v1/kbs/factures/:id/valider
```

**Headers:**
```
Content-Type: application/json
X-Tenant-Slug: kbs-immobilier
Authorization: Bearer <token>
```

**Paramètres URL:**
| Paramètre | Type | Description | Obligatoire | Exemple |
|-----------|------|-------------|-------------|---------|
| `:id` | Integer | ID de la facture | ✓ | `3` |

**Paramètres Body (JSON):**
| Clé | Type | Description | Obligatoire | Exemple |
|-----|------|-------------|-------------|---------|
| `pdf_url` | String | URL du PDF généré | ✓ | `"https://example.com/facture.pdf"` |

---

### 21. Rejeter une Facture

**Endpoint:**
```
PATCH https://backend-dx5f.onrender.com/api/v1/kbs/factures/:id/rejeter
```

**Headers:**
```
Content-Type: application/json
X-Tenant-Slug: kbs-immobilier
Authorization: Bearer <token>
```

**Paramètres URL:**
| Paramètre | Type | Description | Obligatoire | Exemple |
|-----------|------|-------------|-------------|---------|
| `:id` | Integer | ID de la facture | ✓ | `3` |

**Paramètres Body (JSON):**
| Clé | Type | Description | Obligatoire | Exemple |
|-----|------|-------------|-------------|---------|
| `motif` | String | Motif du rejet | ✓ | `"Montant incorrect"` |

---

### 22. Historique d'une Facture

**Endpoint:**
```
GET https://backend-dx5f.onrender.com/api/v1/kbs/factures/:id/historique
```

**Headers:**
```
Content-Type: application/json
X-Tenant-Slug: kbs-immobilier
Authorization: Bearer <token>
```

**Paramètres URL:**
| Paramètre | Type | Description | Obligatoire | Exemple |
|-----------|------|-------------|-------------|---------|
| `:id` | Integer | ID de la facture | ✓ | `3` |

---

### 23. Télécharger une Facture

**Endpoint:**
```
GET https://backend-dx5f.onrender.com/api/v1/kbs/factures/:id/telecharger
```

**Headers:**
```
Content-Type: application/json
X-Tenant-Slug: kbs-immobilier
Authorization: Bearer <token>
```

**Paramètres URL:**
| Paramètre | Type | Description | Obligatoire | Exemple |
|-----------|------|-------------|-------------|---------|
| `:id` | Integer | ID de la facture | ✓ | `3` |

**Note:** Retourne `pdf_url` si `peut_telecharger = 1`.

---

## Paiements de Loyer - Endpoints Complètes

### 24. Enregistrer un Paiement

**Endpoint:**
```
POST https://backend-dx5f.onrender.com/api/v1/kbs/paiements-loyer
```

**Headers:**
```
Content-Type: application/json
X-Tenant-Slug: kbs-immobilier
Authorization: Bearer <token>
```

**Rôles Autorisés:** `SUPER_ADMIN`, `BOSS`, `GERANT`

**Paramètres Body (JSON) - Avec Facture:**
| Clé | Type | Description | Obligatoire | Exemple |
|-----|------|-------------|-------------|---------|
| `locataire_id` | Integer | ID du locataire | ✓ | `1` |
| `facture_id` | Integer | ID de la facture | ✓ | `3` |
| `montant_paye` | Number | Montant payé | ✓ | `200` |
| `devise` | String | Devise du montant | ✓ | `"USD"` |
| `mode_paiement` | String | Mode de paiement | ✓ | `"CASH"` |
| `reference_paiement` | String | Référence/reçu | ✗ | `"RECU-001"` |
| `preuve_url` | String | URL preuve paiement | ✗ | `"https://example.com/proof.pdf"` |
| `notes` | String | Notes sur le paiement | ✗ | `"Paiement partiel"` |

**Paramètres Body (JSON) - Sans Facture (Automatique):**
| Clé | Type | Description | Obligatoire | Exemple |
|-----|------|-------------|-------------|---------|
| `locataire_id` | Integer | ID du locataire | ✓ | `1` |
| `montant_paye` | Number | Montant payé | ✓ | `200` |
| `mode_paiement` | String | Mode de paiement | ✓ | `"CASH"` |

**Note:** Si `facture_id` est absent, le backend cherche automatiquement la première facture ouverte du locataire.

**Modes de Paiement Acceptés:**
- `CASH`
- `MOBILE_MONEY`
- `VIREMENT`
- `AUTRE`

---

### 25. Liste des Paiements

**Endpoint:**
```
GET https://backend-dx5f.onrender.com/api/v1/kbs/paiements-loyer?page=1&limit=20&locataire_id=&statut=
```

**Headers:**
```
Content-Type: application/json
X-Tenant-Slug: kbs-immobilier
Authorization: Bearer <token>
```

**Paramètres Query (URL):**
| Paramètre | Type | Description | Obligatoire | Exemple | Valeurs Acceptées |
|-----------|------|-------------|-------------|---------|-------------------|
| `page` | Integer | Numéro de page | ✗ | `1` | Nombre > 0 |
| `limit` | Integer | Nombre d'éléments par page | ✗ | `20` | Nombre > 0 |
| `locataire_id` | Integer | Filtre par locataire | ✗ | `1` | ID locataire |
| `statut` | String | Filtre par statut | ✗ | `"VALIDE"` | `EN_ATTENTE`, `VALIDE`, `REJETE` |

---

### 26. Mes Paiements (Locataire)

**Endpoint:**
```
GET https://backend-dx5f.onrender.com/api/v1/kbs/paiements-loyer/mes-paiements
```

**Headers:**
```
Content-Type: application/json
X-Tenant-Slug: kbs-immobilier
Authorization: Bearer <token>
```

**Rôle Autorisé:** `LOCATAIRE`

**Paramètres:** Aucun

---

### 27. Valider un Paiement

**Endpoint:**
```
PATCH https://backend-dx5f.onrender.com/api/v1/kbs/paiements-loyer/:id/valider
```

**Headers:**
```
Content-Type: application/json
X-Tenant-Slug: kbs-immobilier
Authorization: Bearer <token>
```

**Paramètres URL:**
| Paramètre | Type | Description | Obligatoire | Exemple |
|-----------|------|-------------|-------------|---------|
| `:id` | Integer | ID du paiement | ✓ | `1` |

**Note:** Quand le paiement est validé, il apparaît dans le total payé de la facture; le `montant_restant` diminue via la vue facture.

---

### 28. Rejeter un Paiement

**Endpoint:**
```
PATCH https://backend-dx5f.onrender.com/api/v1/kbs/paiements-loyer/:id/rejeter
```

**Headers:**
```
Content-Type: application/json
X-Tenant-Slug: kbs-immobilier
Authorization: Bearer <token>
```

**Paramètres URL:**
| Paramètre | Type | Description | Obligatoire | Exemple |
|-----------|------|-------------|-------------|---------|
| `:id` | Integer | ID du paiement | ✓ | `1` |

---

### 29. Modifier un Paiement

**Endpoint:**
```
PUT https://backend-dx5f.onrender.com/api/v1/kbs/paiements-loyer/:id
```

**Headers:**
```
Content-Type: application/json
X-Tenant-Slug: kbs-immobilier
Authorization: Bearer <token>
```

**Paramètres URL:**
| Paramètre | Type | Description | Obligatoire | Exemple |
|-----------|------|-------------|-------------|---------|
| `:id` | Integer | ID du paiement | ✓ | `1` |

**Paramètres Body (JSON) - Partiel:**
| Clé | Type | Description | Obligatoire | Exemple |
|-----|------|-------------|-------------|---------|
| `montant_paye` | Number | Montant payé | ✗ | `300` |
| `notes` | String | Notes sur le paiement | ✗ | `"Correction du montant"` |

---

### 30. Supprimer un Paiement

**Endpoint:**
```
DELETE https://backend-dx5f.onrender.com/api/v1/kbs/paiements-loyer/:id
```

**Headers:**
```
Content-Type: application/json
X-Tenant-Slug: kbs-immobilier
Authorization: Bearer <token>
```

**Paramètres URL:**
| Paramètre | Type | Description | Obligatoire | Exemple |
|-----------|------|-------------|-------------|---------|
| `:id` | Integer | ID du paiement | ✓ | `1` |

---

### 31. Rapport Mensuel des Paiements

**Endpoint:**
```
GET https://backend-dx5f.onrender.com/api/v1/kbs/paiements-loyer/rapport-mensuel
```

**Headers:**
```
Content-Type: application/json
X-Tenant-Slug: kbs-immobilier
Authorization: Bearer <token>
```

**Paramètres:** Aucun

---

## Tableau Récapitulatif de Tous les Endpoints

| # | Méthode | Endpoint | Description | Rôle |
|----|---------|----------|-------------|------|
| 1 | POST | `/auth/login` | Connexion utilisateur | Public |
| 2 | POST | `/auth/verify-email` | Vérifier email avec code | Public |
| 3 | POST | `/auth/verify-code` | Vérifier code seulement | Public |
| 4 | POST | `/auth/resend-code` | Renvoyer code | Public |
| 5 | POST | `/auth/forgot-password` | Mot de passe oublié | Public |
| 6 | POST | `/auth/reset-password` | Réinitialiser mot de passe | Public |
| 7 | GET | `/auth/me` | Profil connecté | Auth |
| 8 | GET | `/kbs/locataires/mon-profil` | Profil locataire | LOCATAIRE |
| 9 | GET | `/kbs/locataires` | Liste locataires | ADMIN |
| 10 | POST | `/kbs/locataires` | Créer locataire | ADMIN |
| 11 | POST | `/kbs/locataires` | Créer locataire entreprise | ADMIN |
| 12 | GET | `/kbs/locataires/:id` | Détail locataire | Auth |
| 13 | PUT | `/kbs/locataires/:id` | Modifier locataire | ADMIN |
| 14 | DELETE | `/kbs/locataires/:id` | Supprimer locataire | ADMIN |
| 15 | POST | `/kbs/factures` | Créer facture | ADMIN |
| 16 | GET | `/kbs/factures` | Liste factures | Auth |
| 17 | GET | `/kbs/factures/mes-factures` | Mes factures | LOCATAIRE |
| 18 | GET | `/kbs/factures/:id` | Détail facture | Auth |
| 19 | PUT | `/kbs/factures/:id` | Modifier facture | ADMIN |
| 20 | PATCH | `/kbs/factures/:id/valider` | Valider facture | ADMIN |
| 21 | PATCH | `/kbs/factures/:id/rejeter` | Rejeter facture | ADMIN |
| 22 | GET | `/kbs/factures/:id/historique` | Historique facture | Auth |
| 23 | GET | `/kbs/factures/:id/telecharger` | Télécharger facture | Auth |
| 24 | POST | `/kbs/paiements-loyer` | Enregistrer paiement | ADMIN |
| 25 | GET | `/kbs/paiements-loyer` | Liste paiements | Auth |
| 26 | GET | `/kbs/paiements-loyer/mes-paiements` | Mes paiements | LOCATAIRE |
| 27 | PATCH | `/kbs/paiements-loyer/:id/valider` | Valider paiement | ADMIN |
| 28 | PATCH | `/kbs/paiements-loyer/:id/rejeter` | Rejeter paiement | ADMIN |
| 29 | PUT | `/kbs/paiements-loyer/:id` | Modifier paiement | ADMIN |
| 30 | DELETE | `/kbs/paiements-loyer/:id` | Supprimer paiement | ADMIN |
| 31 | GET | `/kbs/paiements-loyer/rapport-mensuel` | Rapport mensuel | Auth |

---

## Types de Données

### Devises Acceptées
- `USD` - Dollar américain
- `CDF` - Franc congolais
- `EUR` - Euro

### Rôles Utilisateurs
- `SUPER_ADMIN` - Administrateur système complet
- `BOSS` - Responsable propriétés
- `GERANT` - Gestionnaire immobilier
- `LOCATAIRE` - Locataire

### Modules Accessibles
- `LES_DEUX` - Accès à tous les modules
- `MOBILE_ONLY` - Accès mobile uniquement
- `WEB_ONLY` - Accès web uniquement
