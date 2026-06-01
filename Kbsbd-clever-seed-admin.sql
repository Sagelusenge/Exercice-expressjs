-- ============================================================
-- SEED ADMIN KBS POUR CLEVER CLOUD
-- A executer apres l'import de Kbsbd-clever-basic.sql
-- Mot de passe initial: KbsAdmin@2026
-- ============================================================

INSERT INTO tenants (
    code_tenant,
    nom_organisation,
    slug,
    email_organisation,
    telephone,
    adresse,
    module_parcelles_actif,
    module_kbs_actif,
    module_chat_actif,
    module_reservation_actif,
    statut
)
SELECT
    'KBS-ORG-001',
    'KBS Real Estate',
    'kbs-immobilier',
    'contact@kbs-immobilier.com',
    '+243000000001',
    'Goma, RDC',
    1,
    1,
    1,
    1,
    'ACTIF'
WHERE NOT EXISTS (
    SELECT 1 FROM tenants WHERE slug = 'kbs-immobilier'
);

SET @tenant_id := (
    SELECT id FROM tenants WHERE slug = 'kbs-immobilier' LIMIT 1
);

INSERT INTO parametres_systeme (tenant_id, cle, valeur, type_valeur, description)
SELECT @tenant_id, 'MAX_TENTATIVES_CONNEXION', '5', 'INTEGER', 'Tentatives de connexion avant blocage'
WHERE NOT EXISTS (
    SELECT 1 FROM parametres_systeme WHERE tenant_id = @tenant_id AND cle = 'MAX_TENTATIVES_CONNEXION'
);

INSERT INTO parametres_systeme (tenant_id, cle, valeur, type_valeur, description)
SELECT @tenant_id, 'DUREE_BLOCAGE_MINUTES', '30', 'INTEGER', 'Duree de blocage compte en minutes'
WHERE NOT EXISTS (
    SELECT 1 FROM parametres_systeme WHERE tenant_id = @tenant_id AND cle = 'DUREE_BLOCAGE_MINUTES'
);

INSERT INTO sequences_references (table_cible, tenant_id, prefix, derniere_valeur)
VALUES
    ('tenants', 0, 'KBS-ORG-', 1),
    (CONCAT('users_SUPER_ADMIN_', @tenant_id), @tenant_id, 'KBS-BS-SADM-', 1)
ON DUPLICATE KEY UPDATE derniere_valeur = GREATEST(derniere_valeur, VALUES(derniere_valeur));

INSERT INTO users (
    tenant_id,
    code_user,
    module_accessible,
    nom,
    prenom,
    email,
    telephone,
    mot_de_passe,
    role,
    statut,
    email_verifie,
    cree_par
)
VALUES (
    @tenant_id,
    'KBS-BS-SADM-001',
    'LES_DEUX',
    'Balezi',
    'Serge',
    'serge.balezi@kbs-immobilier.com',
    '+243000000001',
    '$2a$10$Ofw5Hy2hIvSmXMeNEBWl.OEkZhFo2UIwewy3Pu22P/4v5rao8AWgO',
    'SUPER_ADMIN',
    'ACTIF',
    1,
    NULL
)
ON DUPLICATE KEY UPDATE
    tenant_id = VALUES(tenant_id),
    module_accessible = 'LES_DEUX',
    nom = VALUES(nom),
    prenom = VALUES(prenom),
    telephone = VALUES(telephone),
    mot_de_passe = VALUES(mot_de_passe),
    role = 'SUPER_ADMIN',
    statut = 'ACTIF',
    email_verifie = 1,
    bloque_jusqu_a = NULL,
    tentatives_connexion_echouees = 0,
    deleted_at = NULL;
