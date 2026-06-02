# Documentation API Loyers - KBS Buildings
## Dans ce fichier vous avez tous les endspoint concerant le loyer
## Overview
Ce document décrit les endpoints API pour la gestion des locataires et des paiements de loyer dans le système KBS Buildings.

---

## Base URL
```
http://localhost:3000/api/v1/kbs
```

---

## Locataires

### 1. Créer un locataire
**Endpoint:** `POST /locataires`

**Headers:**
```
Authorization: Bearer <token>
X-Tenant-Slug: <tenant_slug>
```

**Body (JSON):**
```json
{
  "categorie": "ENTREPRISE",
  "nom_entreprise": "KBS Buildings",
  "email": "contact@kbs.com",
  "telephone": "+243 123 456 789",
  "adresse": "123 Rue Principale",
  "montant_mensuel_loyer": 500,
  "devise": "USD",
  "date_debut_loyer": "2024-01-01",
  "date_fin_loyer": "2024-12-31",
  "notes": "Contrat annuel"
}
```

**Response de la requete:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "code_locataire": "LOC-2024-001",
    "categorie": "ENTREPRISE",
    "nom_entreprise": "KBS Buildings",
    "email": "contact@kbs.com",
    "telephone": "+243 123 456 789",
    "adresse": "123 Rue Principale",
    "montant_mensuel_loyer": 500,
    "devise": "USD",
    "date_debut_loyer": "2024-01-01",
    "date_fin_loyer": "2024-12-31",
    "statut": "ACTIF",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "message": "Locataire créé avec succès"
}
```

---

### 2. Lister les locataires
**Endpoint:** `GET /locataires`

**Query Parameters:**
- `categorie` (optional): "SIMPLE" ou "ENTREPRISE"
- `statut_paiement` (optional): "A_JOUR", "EN_RETARD", "SUSPENDU"
- `search` (optional): terme de recherche
- `page` (optional): numéro de page (défaut: 1)
- `limit` (optional): nombre par page (défaut: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "code_locataire": "LOC-2024-001",
      "categorie": "ENTREPRISE",
      "nom_entreprise": "KBS Buildings",
      "email": "contact@kbs.com",
      "telephone": "+243 123 456 789",
      "montant_mensuel_loyer": 500,
      "devise": "USD",
      "statut": "ACTIF",
      "statut_paiement": "A_JOUR"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

---

### 3. Détails d'un locataire
**Endpoint:** `GET /locataires/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "code_locataire": "LOC-2024-001",
    "categorie": "ENTREPRISE",
    "nom_entreprise": "KBS Buildings",
    "email": "contact@kbs.com",
    "telephone": "+243 123 456 789",
    "adresse": "123 Rue Principale",
    "montant_mensuel_loyer": 500,
    "devise": "USD",
    "date_debut_loyer": "2024-01-01",
    "date_fin_loyer": "2024-12-31",
    "statut": "ACTIF",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

### 4. Mettre à jour un locataire
**Endpoint:** `PUT /locataires/:id`

**Body (JSON):**
```json
{
  "montant_mensuel_loyer": 600,
  "date_fin_loyer": "2025-12-31",
  "notes": "Renouvellement"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Locataire mis à jour avec succès"
}
```

---

### 5. Supprimer un locataire (soft delete)
**Endpoint:** `DELETE /locataires/:id`

**Response:**
```json
{
  "success": true,
  "message": "Locataire supprimé avec succès"
}
```

---

### 6. Dashboard locataire
**Endpoint:** `GET /locataires/dashboard`

**Response:**
```json
{
  "success": true,
  "data": {
    "total_locataires": 25,
    "actifs": 20,
    "en_retard": 3,
    "suspendus": 2,
    "revenu_mensuel_total": 12500
  }
}
```

---

### 7. Profil locataire (pour le locataire connecté)
**Endpoint:** `GET /locataires/mon-profil`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "code_locataire": "LOC-2024-001",
    "categorie": "ENTREPRISE",
    "nom_entreprise": "KBS Buildings",
    "montant_mensuel_loyer": 500,
    "statut": "ACTIF",
    "statut_paiement": "A_JOUR"
  }
}
```

---

## Paiements de Loyer

### 1. Créer un paiement de loyer
**Endpoint:** `POST /paiements-loyer`

**Headers:**
```
Authorization: Bearer <token>
X-Tenant-Slug: <tenant_slug>
```

**Body (JSON):**
```json
{
  "locataire_id": 1,
  "facture_id": 10,
  "montant_paye": 500,
  "devise": "USD",
  "mode_paiement": "MOBILE_MONEY",
  "reference_paiement": "REF-123456",
  "preuve_url": "https://example.com/preuve.jpg",
  "notes": "Paiement mensuel"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "locataire_id": 1,
    "facture_id": 10,
    "montant_paye": 500,
    "devise": "USD",
    "mode_paiement": "MOBILE_MONEY",
    "reference_paiement": "REF-123456",
    "statut": "EN_ATTENTE",
    "created_at": "2024-01-15T00:00:00Z"
  },
  "message": "Paiement de loyer enregistré"
}
```

---

### 2. Lister les paiements de loyer (Admin)
**Endpoint:** `GET /paiements-loyer`

**Query Parameters:**
- `locataire_id` (optional): ID du locataire
- `statut` (optional): "EN_ATTENTE", "VALIDE", "REJETE"
- `page` (optional): numéro de page (défaut: 1)
- `limit` (optional): nombre par page (défaut: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "locataire_id": 1,
      "nom_locataire": "KBS Buildings",
      "code_locataire": "LOC-2024-001",
      "montant_paye": 500,
      "devise": "USD",
      "mode_paiement": "MOBILE_MONEY",
      "reference_paiement": "REF-123456",
      "statut": "VALIDE",
      "date_paiement": "2024-01-15T00:00:00Z",
      "created_at": "2024-01-15T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

---

### 3. Mes paiements (Locataire)
**Endpoint:** `GET /paiements-loyer/mes-paiements`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "montant_paye": 500,
      "devise": "USD",
      "mode_paiement": "MOBILE_MONEY",
      "reference_paiement": "REF-123456",
      "statut": "VALIDE",
      "date_paiement": "2024-01-15T00:00:00Z"
    }
  ]
}
```

---

### 4. Valider un paiement
**Endpoint:** `PATCH /paiements-loyer/:id/valider`

**Response:**
```json
{
  "success": true,
  "message": "Paiement de loyer validé"
}
```

---

### 5. Rejeter un paiement
**Endpoint:** `PATCH /paiements-loyer/:id/rejeter`

**Response:**
```json
{
  "success": true,
  "message": "Paiement rejeté"
}
```

---

### 6. Mettre à jour un paiement
**Endpoint:** `PUT /paiements-loyer/:id`

**Body (JSON):**
```json
{
  "montant_paye": 550,
  "notes": "Ajustement",
  "reference_paiement": "REF-789012",
  "statut": "VALIDE"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Paiement mis à jour"
}
```

---

### 7. Supprimer un paiement
**Endpoint:** `DELETE /paiements-loyer/:id`

**Response:**
```json
{
  "success": true,
  "message": "Paiement supprimé"
}
```

---

### 8. Rapport mensuel des paiements
**Endpoint:** `GET /paiements-loyer/rapport-mensuel`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "annee": 2024,
      "mois": 1,
      "total_paiements": 12500,
      "nombre_paiements": 25,
      "paiements_valides": 23,
      "paiements_en_attente": 2
    }
  ]
}
```

---

## Factures de Loyer

### 1. Créer une facture
**Endpoint:** `POST /factures`

**Headers:**
```
Authorization: Bearer <token>
X-Tenant-Slug: <tenant_slug>
```

**Body (JSON):**
```json
{
  "locataire_id": 1,
  "periode_debut": "2024-01-01",
  "periode_fin": "2024-01-31",
  "montant_loyer": 500,
  "devise": "USD",
  "notes_admin": "Facture mensuelle"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 10,
    "reference": "FAC-2024-001",
    "locataire_id": 1,
    "periode_debut": "2024-01-01",
    "periode_fin": "2024-01-31",
    "montant_loyer": 500,
    "devise": "USD",
    "statut": "EMISE",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "message": "Facture créée"
}
```

---

### 2. Lister les factures (Admin)
**Endpoint:** `GET /factures`

**Query Parameters:**
- `statut` (optional): "EMISE", "VALIDEE", "ANNULEE"
- `locataire_id` (optional): ID du locataire
- `page` (optional): numéro de page (défaut: 1)
- `limit` (optional): nombre par page (défaut: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 10,
      "reference": "FAC-2024-001",
      "locataire_id": 1,
      "nom_locataire": "KBS Buildings",
      "periode_debut": "2024-01-01",
      "periode_fin": "2024-01-31",
      "montant_loyer": 500,
      "devise": "USD",
      "statut": "VALIDEE",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

---

### 3. Mes factures (Locataire)
**Endpoint:** `GET /factures/mes-factures`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 10,
      "reference": "FAC-2024-001",
      "periode_debut": "2024-01-01",
      "periode_fin": "2024-01-31",
      "montant_loyer": 500,
      "devise": "USD",
      "statut": "VALIDEE",
      "peut_telecharger": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### 4. Détails d'une facture
**Endpoint:** `GET /factures/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 10,
    "reference": "FAC-2024-001",
    "locataire_id": 1,
    "periode_debut": "2024-01-01",
    "periode_fin": "2024-01-31",
    "montant_loyer": 500,
    "devise": "USD",
    "statut": "VALIDEE",
    "pdf_url": "https://example.com/facture.pdf"
  }
}
```

---

### 5. Valider une facture
**Endpoint:** `PATCH /factures/:id/valider`

**Body (JSON):**
```json
{
  "pdf_url": "https://example.com/facture.pdf"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 10,
    "statut": "VALIDEE",
    "pdf_url": "https://example.com/facture.pdf"
  },
  "message": "Facture validée et disponible au téléchargement"
}
```

---

### 6. Rejeter une facture
**Endpoint:** `PATCH /factures/:id/rejeter`

**Body (JSON):**
```json
{
  "motif": "Informations incorrectes"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 10,
    "statut": "ANNULEE"
  },
  "message": "Facture rejetée"
}
```

---

### 7. Historique d'une facture
**Endpoint:** `GET /factures/:id/historique`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "facture_id": 10,
      "action": "VALIDATION",
      "ancien_statut": "EMISE",
      "nouveau_statut": "VALIDEE",
      "commentaire": "Validation par admin",
      "effectue_par": 1,
      "acteur": "Admin User",
      "role": "SUPER_ADMIN",
      "created_at": "2024-01-02T00:00:00Z"
    }
  ]
}
```

---

### 8. Télécharger une facture
**Endpoint:** `GET /factures/:id/telecharger`

**Response:**
```json
{
  "success": true,
  "data": {
    "pdf_url": "https://example.com/facture.pdf",
    "reference": "FAC-2024-001"
  }
}
```

---

## Codes d'erreur

| Code | Description |
|------|-------------|
| 200 | Succès |
| 201 | Créé avec succès |
| 400 | Requête invalide |
| 401 | Non authentifié |
| 403 | Accès refusé |
| 404 | Ressource introuvable |
| 500 | Erreur interne du serveur |

---

## Notes
- Tous les endpoints nécessitent une authentification via le header `Authorization`
- Le header `X-Tenant-Slug` est requis pour le multi-tenancy
- Les dates doivent être au format ISO 8601 (YYYY-MM-DD)
- Les montants sont en nombres décimaux
- La suppression est un "soft delete" (les données ne sont pas vraiment supprimées)
