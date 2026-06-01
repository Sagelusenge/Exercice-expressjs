-- ============================================================
-- BASE DE DONNÃ‰ES COMPLÃˆTE â€” SYSTÃˆME KBS
-- KITUMAINI BALEZI Serge
-- MODULE 1 : Plateforme de Vente de Parcelles en Ligne
-- MODULE 2 : Gestion de Loyer KBS
-- Version : 1.0.0De Gang
-- Date    : 2024
-- ============================================================
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ============================================================
-- SUPPRESSION DES TABLES EXISTANTES (ordre inverse des FK)
-- ============================================================

DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS chat_participants;
DROP TABLE IF EXISTS chat_conversations;
DROP TABLE IF EXISTS notification_templates;
DROP TABLE IF EXISTS email_logs;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS kbs_rapports;
DROP TABLE IF EXISTS kbs_paiements_loyer;
DROP TABLE IF EXISTS kbs_facture_historique;
DROP TABLE IF EXISTS kbs_factures;
DROP TABLE IF EXISTS kbs_locataires;
DROP TABLE IF EXISTS visites_demandes;
DROP TABLE IF EXISTS favoris;
DROP TABLE IF EXISTS vente_documents;
DROP TABLE IF EXISTS paiements;
DROP TABLE IF EXISTS ventes;
DROP TABLE IF EXISTS reservations;
DROP TABLE IF EXISTS parcelle_documents;
DROP TABLE IF EXISTS parcelle_images;
DROP TABLE IF EXISTS parcelles;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS parametres_systeme;
DROP TABLE IF EXISTS tenants;
DROP TABLE IF EXISTS sequences_references;

-- ============================================================
-- TABLE SEQUENCES â€” Gestion des auto-incrÃ©ments personnalisÃ©s
-- ============================================================

CREATE TABLE sequences_references (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    table_cible VARCHAR(100) NOT NULL,
    tenant_id   BIGINT UNSIGNED NOT NULL DEFAULT 1,
    prefix      VARCHAR(20)  NOT NULL,
    derniere_valeur INT UNSIGNED NOT NULL DEFAULT 0,
    UNIQUE KEY unique_seq (table_cible, tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Gestion centralisÃ©e des rÃ©fÃ©rences personnalisÃ©es KBS';

-- ============================================================
-- 1. TABLE TENANTS
-- ============================================================

CREATE TABLE tenants (
    id                        BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code_tenant               VARCHAR(20)  NULL UNIQUE
        COMMENT 'Ex: KBS-001 gÃ©nÃ©rÃ© automatiquement',
    nom_organisation          VARCHAR(255) NOT NULL,
    slug                      VARCHAR(255) NOT NULL UNIQUE,
    email_organisation        VARCHAR(255) NOT NULL,
    telephone                 VARCHAR(50),
    adresse                   TEXT,
    logo_url                  VARCHAR(500),
    statut                    ENUM('ACTIF','INACTIF','SUSPENDU') DEFAULT 'ACTIF',
    module_parcelles_actif    TINYINT(1)   DEFAULT 1,
    module_kbs_actif          TINYINT(1)   DEFAULT 1,
    module_chat_actif         TINYINT(1)   DEFAULT 1,
    module_reservation_actif  TINYINT(1)   DEFAULT 0,
    created_at                TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at                TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
                                           ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Organisation KBS - KITUMAINI BALEZI Serge';

-- ============================================================
-- 2. TABLE PARAMETRES SYSTEME
-- ============================================================

CREATE TABLE parametres_systeme (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tenant_id       BIGINT UNSIGNED NOT NULL,
    cle             VARCHAR(100)    NOT NULL,
    valeur          TEXT            NOT NULL,
    type_valeur     ENUM('STRING','BOOLEAN','INTEGER','JSON') DEFAULT 'STRING',
    description     TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_params_tenant
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE KEY unique_cle_par_tenant (tenant_id, cle)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. TABLE USERS (5 rÃ´les uniquement)
-- ============================================================

CREATE TABLE users (
    id                            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code_user                     VARCHAR(30)  NULL UNIQUE
        COMMENT 'Ex: KBS-SADM-001 / KBS-CLT-001 / KBS-LOC-001',
    tenant_id                     BIGINT UNSIGNED NOT NULL,
    nom                           VARCHAR(100) NOT NULL,
    prenom                        VARCHAR(100) NOT NULL,
    email                         VARCHAR(255) NOT NULL,
    telephone                     VARCHAR(50),
    mot_de_passe                  VARCHAR(255) NOT NULL,
    role                          ENUM(
                                      'SUPER_ADMIN',
                                      'BOSS',
                                      'GERANT',
                                      'CLIENT',
                                      'LOCATAIRE'
                                  ) NOT NULL,
    module_accessible             ENUM('PARCELLES','KBS','LES_DEUX')
                                  DEFAULT 'PARCELLES',
    statut                        ENUM(
                                      'ACTIF',
                                      'INACTIF',
                                      'BLOQUE',
                                      'SUPPRIME',
                                      'EN_ATTENTE_VERIFICATION'
                                  ) DEFAULT 'EN_ATTENTE_VERIFICATION',
    photo_url                     VARCHAR(500),
    adresse                       TEXT,
    -- VÃ©rification email
    email_verifie                 TINYINT(1)   DEFAULT 0,
    code_verification_email       VARCHAR(10),
    code_verification_expire_at   TIMESTAMP    NULL,
    -- SÃ©curitÃ© connexion
    derniere_connexion            TIMESTAMP    NULL,
    tentatives_connexion_echouees INT          DEFAULT 0,
    bloque_jusqu_a                TIMESTAMP    NULL,
    -- TraÃ§abilitÃ© crÃ©ation
    cree_par                      BIGINT UNSIGNED NULL
        COMMENT 'NULL si auto-inscription CLIENT, sinon admin crÃ©ateur',
    created_at                    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at                    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                                            ON UPDATE CURRENT_TIMESTAMP,
    deleted_at                    TIMESTAMP NULL,
    CONSTRAINT fk_user_tenant
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_createur
        FOREIGN KEY (cree_par) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_email_par_tenant (tenant_id, email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tous les acteurs du systÃ¨me KBS';

-- ============================================================
-- 4. TABLE PARCELLES
-- ============================================================

CREATE TABLE parcelles (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    reference       VARCHAR(50)  NULL
        COMMENT 'Ex: KBS-PARC-001 gÃ©nÃ©rÃ© automatiquement',
    tenant_id       BIGINT UNSIGNED NOT NULL,
    titre           VARCHAR(255) NOT NULL,
    description     LONGTEXT,
    localisation    VARCHAR(255),
    ville           VARCHAR(100),
    commune         VARCHAR(100),
    quartier        VARCHAR(100),
    superficie      DECIMAL(10,2) COMMENT 'En mÂ²',
    devise          ENUM('USD','CDF') DEFAULT 'USD',
    statut          ENUM(
                        'DISPONIBLE',
                        'RESERVEE',
                        'VENDUE',
                        'MAINTENANCE',
                        'MASQUEE',
                        'ARCHIVEE'
                    ) DEFAULT 'DISPONIBLE',
    latitude        DECIMAL(10,8),
    longitude       DECIMAL(11,8),
    type_parcelle   ENUM(
                        'RESIDENTIELLE',
                        'COMMERCIALE',
                        'AGRICOLE',
                        'INDUSTRIELLE',
                        'AUTRE'
                    ) DEFAULT 'RESIDENTIELLE',
    est_vedette     TINYINT(1)   DEFAULT 0,
    nombre_vues     INT UNSIGNED DEFAULT 0,
    prix_vente_confidentiel DECIMAL(15,2) NULL
        COMMENT 'Prix renseigne par l admin pour le chat et les espaces internes',
    -- PRIX JAMAIS AFFICHÃ‰ PUBLIQUEMENT
    -- gÃ©rÃ© uniquement dans la table ventes
    publie_par      BIGINT UNSIGNED NOT NULL,
    vendu_a         BIGINT UNSIGNED NULL,
    date_vente      TIMESTAMP    NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP NULL,
    CONSTRAINT fk_parcelle_tenant
        FOREIGN KEY (tenant_id)  REFERENCES tenants(id),
    CONSTRAINT fk_parcelle_publie
        FOREIGN KEY (publie_par) REFERENCES users(id),
    CONSTRAINT fk_parcelle_vendu
        FOREIGN KEY (vendu_a)    REFERENCES users(id),
    UNIQUE KEY unique_reference_parcelle (tenant_id, reference)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Parcelles Ã  vendre - PRIX CONFIDENTIEL';

-- ============================================================
-- 5. TABLE PARCELLE_IMAGES
-- ============================================================

CREATE TABLE parcelle_images (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code_image      VARCHAR(30)  NOT NULL UNIQUE
        COMMENT 'Ex: KBS-IMG-001',
    parcelle_id     BIGINT UNSIGNED NOT NULL,
    url_image       VARCHAR(500) NOT NULL,
    est_principale  TINYINT(1)   DEFAULT 0,
    ordre           INT          DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_img_parcelle
        FOREIGN KEY (parcelle_id) REFERENCES parcelles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. TABLE PARCELLE_DOCUMENTS
-- ============================================================

CREATE TABLE parcelle_documents (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code_document   VARCHAR(30)  NOT NULL UNIQUE
        COMMENT 'Ex: KBS-PDOC-001',
    parcelle_id     BIGINT UNSIGNED NOT NULL,
    type_document   ENUM(
                        'PLAN_CADASTRAL',
                        'CERTIFICAT_ENREGISTREMENT',
                        'CONTRAT_TYPE',
                        'AUTORISATION_VENTE',
                        'AUTRE'
                    ) NOT NULL,
    nom_fichier     VARCHAR(255),
    url_fichier     VARCHAR(500) NOT NULL,
    est_public      TINYINT(1)   DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pdoc_parcelle
        FOREIGN KEY (parcelle_id) REFERENCES parcelles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. TABLE RESERVATIONS
-- ============================================================

CREATE TABLE reservations (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    reference           VARCHAR(30)  NULL UNIQUE
        COMMENT 'Ex: KBS-RES-001',
    tenant_id           BIGINT UNSIGNED NOT NULL,
    user_id             BIGINT UNSIGNED NOT NULL COMMENT 'CLIENT uniquement',
    parcelle_id         BIGINT UNSIGNED NOT NULL,
    montant_reservation DECIMAL(15,2) DEFAULT 0.00,
    devise              ENUM('USD','CDF') DEFAULT 'USD',
    statut              ENUM(
                            'EN_ATTENTE',
                            'EN_COURS',
                            'CONFIRMEE',
                            'EXPIREE',
                            'ANNULEE',
                            'TRANSFORMEE_EN_VENTE'
                        ) DEFAULT 'EN_ATTENTE',
    date_reservation    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    date_expiration     TIMESTAMP    NULL,
    notes_client        TEXT,
    notes_admin         TEXT,
    traite_par          BIGINT UNSIGNED NULL,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_res_tenant
        FOREIGN KEY (tenant_id)   REFERENCES tenants(id),
    CONSTRAINT fk_res_user
        FOREIGN KEY (user_id)     REFERENCES users(id),
    CONSTRAINT fk_res_parcelle
        FOREIGN KEY (parcelle_id) REFERENCES parcelles(id),
    CONSTRAINT fk_res_traite
        FOREIGN KEY (traite_par)  REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 8. TABLE VENTES
-- ============================================================

CREATE TABLE ventes (
    id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    reference         VARCHAR(30)  NULL UNIQUE
        COMMENT 'Ex: KBS-VTE-001',
    tenant_id         BIGINT UNSIGNED NOT NULL,
    user_id           BIGINT UNSIGNED NOT NULL COMMENT 'CLIENT acheteur',
    parcelle_id       BIGINT UNSIGNED NOT NULL,
    reservation_id    BIGINT UNSIGNED NULL,
    -- PRIX CONFIDENTIEL â€” jamais exposÃ© publiquement
    montant_total     DECIMAL(15,2) NOT NULL,
    montant_paye      DECIMAL(15,2) DEFAULT 0.00,
    montant_restant   DECIMAL(15,2) AS (montant_total - montant_paye) STORED,
    devise            ENUM('USD','CDF') DEFAULT 'USD',
    statut            ENUM(
                          'EN_COURS',
                          'COMPLETE',
                          'ANNULEE'
                      ) DEFAULT 'EN_COURS',
    date_vente        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    valide_par        BIGINT UNSIGNED NULL,
    notes             TEXT,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_vte_tenant
        FOREIGN KEY (tenant_id)      REFERENCES tenants(id),
    CONSTRAINT fk_vte_user
        FOREIGN KEY (user_id)        REFERENCES users(id),
    CONSTRAINT fk_vte_parcelle
        FOREIGN KEY (parcelle_id)    REFERENCES parcelles(id),
    CONSTRAINT fk_vte_reservation
        FOREIGN KEY (reservation_id) REFERENCES reservations(id),
    CONSTRAINT fk_vte_valide
        FOREIGN KEY (valide_par)     REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Ventes confirmÃ©es - montant confidentiel';

-- ============================================================
-- 9. TABLE PAIEMENTS
-- ============================================================

CREATE TABLE paiements (
    id                    BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    reference             VARCHAR(30)  NULL UNIQUE
        COMMENT 'Ex: KBS-PAY-001',
    tenant_id             BIGINT UNSIGNED NOT NULL,
    user_id               BIGINT UNSIGNED NOT NULL,
    parcelle_id           BIGINT UNSIGNED NULL,
    reservation_id        BIGINT UNSIGNED NULL,
    vente_id              BIGINT UNSIGNED NULL,
    montant               DECIMAL(15,2) NOT NULL,
    devise                ENUM('USD','CDF') DEFAULT 'USD',
    mode_paiement         ENUM(
                              'MOBILE_MONEY',
                              'CARTE_BANCAIRE',
                              'VIREMENT',
                              'AGENCE',
                              'CASH'
                          ) NOT NULL,
    reference_transaction VARCHAR(255),
    statut                ENUM(
                              'EN_ATTENTE',
                              'PAYE',
                              'ECHOUE',
                              'ANNULE',
                              'REMBOURSE',
                              'PARTIEL'
                          ) DEFAULT 'EN_ATTENTE',
    date_paiement         TIMESTAMP    NULL,
    valide_par            BIGINT UNSIGNED NULL,
    date_validation       TIMESTAMP    NULL,
    preuve_paiement_url   VARCHAR(500),
    notes                 TEXT,
    created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_pay_tenant
        FOREIGN KEY (tenant_id)      REFERENCES tenants(id),
    CONSTRAINT fk_pay_user
        FOREIGN KEY (user_id)        REFERENCES users(id),
    CONSTRAINT fk_pay_parcelle
        FOREIGN KEY (parcelle_id)    REFERENCES parcelles(id),
    CONSTRAINT fk_pay_reservation
        FOREIGN KEY (reservation_id) REFERENCES reservations(id),
    CONSTRAINT fk_pay_vente
        FOREIGN KEY (vente_id)       REFERENCES ventes(id),
    CONSTRAINT fk_pay_valide
        FOREIGN KEY (valide_par)     REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 10. TABLE VENTE_DOCUMENTS
-- ============================================================

CREATE TABLE vente_documents (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code_doc        VARCHAR(30)  NOT NULL UNIQUE
        COMMENT 'Ex: KBS-VDOC-001',
    vente_id        BIGINT UNSIGNED NOT NULL,
    user_id         BIGINT UNSIGNED NOT NULL,
    type_document   ENUM(
                        'RECU_PAIEMENT',
                        'CONTRAT_VENTE',
                        'ATTESTATION_VENTE',
                        'FACTURE',
                        'CNI_CLIENT',
                        'AUTRE'
                    ) NOT NULL,
    nom_fichier     VARCHAR(255),
    url_fichier     VARCHAR(500) NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vdoc_vente
        FOREIGN KEY (vente_id) REFERENCES ventes(id),
    CONSTRAINT fk_vdoc_user
        FOREIGN KEY (user_id)  REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 11. TABLE FAVORIS
-- ============================================================

CREATE TABLE favoris (
    id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id       BIGINT UNSIGNED NOT NULL COMMENT 'CLIENT uniquement',
    parcelle_id   BIGINT UNSIGNED NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_fav_user
        FOREIGN KEY (user_id)     REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_fav_parcelle
        FOREIGN KEY (parcelle_id) REFERENCES parcelles(id) ON DELETE CASCADE,
    UNIQUE KEY unique_favori (user_id, parcelle_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 12. TABLE VISITES_DEMANDES
-- ============================================================

CREATE TABLE visites_demandes (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    reference       VARCHAR(30)  NULL UNIQUE
        COMMENT 'Ex: KBS-VIS-001',
    tenant_id       BIGINT UNSIGNED NOT NULL,
    user_id         BIGINT UNSIGNED NOT NULL COMMENT 'CLIENT',
    parcelle_id     BIGINT UNSIGNED NOT NULL,
    date_souhaitee  DATE         NOT NULL,
    heure_souhaitee TIME,
    statut          ENUM(
                        'EN_ATTENTE',
                        'CONFIRMEE',
                        'ANNULEE',
                        'EFFECTUEE'
                    ) DEFAULT 'EN_ATTENTE',
    notes_client    TEXT,
    notes_admin     TEXT,
    traite_par      BIGINT UNSIGNED NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_vis_tenant
        FOREIGN KEY (tenant_id)   REFERENCES tenants(id),
    CONSTRAINT fk_vis_user
        FOREIGN KEY (user_id)     REFERENCES users(id),
    CONSTRAINT fk_vis_parcelle
        FOREIGN KEY (parcelle_id) REFERENCES parcelles(id),
    CONSTRAINT fk_vis_traite
        FOREIGN KEY (traite_par)  REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 13. TABLE KBS_LOCATAIRES
-- ============================================================

CREATE TABLE kbs_locataires (
    id                       BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code_locataire           VARCHAR(30)  NULL UNIQUE
        COMMENT 'Ex: KBS-LOC-001',
    tenant_id                BIGINT UNSIGNED NOT NULL,
    user_id                  BIGINT UNSIGNED NOT NULL
        COMMENT 'FK vers users avec role=LOCATAIRE',
    categorie                ENUM('SIMPLE','ENTREPRISE') NOT NULL,
    statut_paiement          ENUM('A_JOUR','EN_RETARD') DEFAULT 'A_JOUR',

    -- CHAMPS LOCATAIRE SIMPLE
    nom                      VARCHAR(100),
    prenom                   VARCHAR(100),
    date_naissance           DATE,
    telephone_personnel      VARCHAR(50),
    adresse_personnelle      TEXT,
    photo_identite_url       VARCHAR(500),
    photo_piece_identite_url VARCHAR(500),
    type_piece_identite      ENUM(
                                 'CARTE_ELECTEUR',
                                 'PASSEPORT',
                                 'PERMIS_CONDUIRE',
                                 'AUTRE'
                             ),

    -- CHAMPS LOCATAIRE ENTREPRISE
    nom_entreprise           VARCHAR(255),
    secteur_activite         VARCHAR(255),
    numero_rccm              VARCHAR(100),
    numero_nif               VARCHAR(100),
    nom_representant         VARCHAR(255),
    telephone_entreprise     VARCHAR(50),
    email_entreprise         VARCHAR(255),
    adresse_siege            TEXT,
    numero_local             VARCHAR(100),
    logo_entreprise_url      VARCHAR(500),

    -- CHAMPS COMMUNS
    date_debut_loyer         DATE         NOT NULL,
    date_fin_loyer           DATE         NOT NULL,
    montant_mensuel_loyer    DECIMAL(15,2) NOT NULL,
    devise                   ENUM('USD','CDF') DEFAULT 'USD',

    cree_par                 BIGINT UNSIGNED NOT NULL,
    created_at               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at               TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at               TIMESTAMP NULL,

    CONSTRAINT fk_loc_tenant
        FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_loc_user
        FOREIGN KEY (user_id)   REFERENCES users(id),
    CONSTRAINT fk_loc_cree
        FOREIGN KEY (cree_par)  REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Locataires KBS - Module Gestion de Loyer uniquement';

-- ============================================================
-- 14. TABLE KBS_FACTURES
-- ============================================================

CREATE TABLE kbs_factures (
    id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    reference        VARCHAR(30)  NULL UNIQUE
        COMMENT 'Ex: KBS-FAC-001',
    tenant_id        BIGINT UNSIGNED NOT NULL,
    locataire_id     BIGINT UNSIGNED NOT NULL,
    periode_debut    DATE         NOT NULL,
    periode_fin      DATE         NOT NULL,
    montant_loyer    DECIMAL(15,2) NOT NULL,
    devise           ENUM('USD','CDF') DEFAULT 'USD',
    statut           ENUM(
                         'EN_ATTENTE',
                         'VALIDEE',
                         'REJETEE'
                     ) DEFAULT 'EN_ATTENTE',
    date_validation  TIMESTAMP    NULL,
    valide_par       BIGINT UNSIGNED NULL,
    date_rejet       TIMESTAMP    NULL,
    rejete_par       BIGINT UNSIGNED NULL,
    motif_rejet      TEXT,
    pdf_url          VARCHAR(500)
        COMMENT 'GÃ©nÃ©rÃ© uniquement aprÃ¨s validation',
    peut_telecharger TINYINT(1)   DEFAULT 0
        COMMENT 'TRUE uniquement aprÃ¨s validation admin',
    signature_url    VARCHAR(500),
    cachet_url       VARCHAR(500),
    notes_admin      TEXT,
    cree_par         BIGINT UNSIGNED NOT NULL,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_fac_tenant
        FOREIGN KEY (tenant_id)    REFERENCES tenants(id),
    CONSTRAINT fk_fac_locataire
        FOREIGN KEY (locataire_id) REFERENCES kbs_locataires(id),
    CONSTRAINT fk_fac_valide
        FOREIGN KEY (valide_par)   REFERENCES users(id),
    CONSTRAINT fk_fac_rejete
        FOREIGN KEY (rejete_par)   REFERENCES users(id),
    CONSTRAINT fk_fac_cree
        FOREIGN KEY (cree_par)     REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 15. TABLE KBS_FACTURE_HISTORIQUE
-- ============================================================

CREATE TABLE kbs_facture_historique (
    id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    facture_id     BIGINT UNSIGNED NOT NULL,
    action         ENUM(
                       'CREATION',
                       'MISE_EN_ATTENTE',
                       'VALIDATION',
                       'REJET',
                       'TELECHARGEMENT_ADMIN',
                       'TELECHARGEMENT_LOCATAIRE',
                       'MODIFICATION'
                   ) NOT NULL,
    effectue_par   BIGINT UNSIGNED NOT NULL,
    ancien_statut  VARCHAR(50),
    nouveau_statut VARCHAR(50),
    commentaire    TEXT,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_fhist_facture
        FOREIGN KEY (facture_id)   REFERENCES kbs_factures(id) ON DELETE CASCADE,
    CONSTRAINT fk_fhist_user
        FOREIGN KEY (effectue_par) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='TraÃ§abilitÃ© complÃ¨te des actions sur les factures';

-- ============================================================
-- 16. TABLE KBS_PAIEMENTS_LOYER
-- ============================================================

CREATE TABLE kbs_paiements_loyer (
    id                 BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    reference          VARCHAR(30)  NULL UNIQUE
        COMMENT 'Ex: KBS-PLOYER-001',
    tenant_id          BIGINT UNSIGNED NOT NULL,
    locataire_id       BIGINT UNSIGNED NOT NULL,
    facture_id         BIGINT UNSIGNED NULL,
    montant_paye       DECIMAL(15,2) NOT NULL,
    devise             ENUM('USD','CDF') DEFAULT 'USD',
    mode_paiement      ENUM(
                           'CASH',
                           'MOBILE_MONEY',
                           'VIREMENT',
                           'AUTRE'
                       ) NOT NULL,
    reference_paiement VARCHAR(255),
    statut             ENUM(
                           'EN_ATTENTE',
                           'VALIDE',
                           'REJETE'
                       ) DEFAULT 'EN_ATTENTE',
    date_paiement      TIMESTAMP    NULL,
    valide_par         BIGINT UNSIGNED NULL,
    date_validation    TIMESTAMP    NULL,
    preuve_url         VARCHAR(500),
    notes              TEXT,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_ployer_tenant
        FOREIGN KEY (tenant_id)    REFERENCES tenants(id),
    CONSTRAINT fk_ployer_locataire
        FOREIGN KEY (locataire_id) REFERENCES kbs_locataires(id),
    CONSTRAINT fk_ployer_facture
        FOREIGN KEY (facture_id)   REFERENCES kbs_factures(id),
    CONSTRAINT fk_ployer_valide
        FOREIGN KEY (valide_par)   REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 17. TABLE KBS_RAPPORTS
-- ============================================================

CREATE TABLE kbs_rapports (
    id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    reference     VARCHAR(30)  NULL UNIQUE
        COMMENT 'Ex: KBS-RAP-001',
    tenant_id     BIGINT UNSIGNED NOT NULL,
    type_rapport  ENUM(
                      'PAIEMENTS_EFFECTUES',
                      'LOYERS_EN_RETARD',
                      'GLOBAL_LOCATAIRES',
                      'LOCATAIRES_SIMPLES',
                      'LOCATAIRES_ENTREPRISES'
                  ) NOT NULL,
    periode_debut DATE,
    periode_fin   DATE,
    genere_par    BIGINT UNSIGNED NOT NULL,
    format        ENUM('PDF','EXCEL') DEFAULT 'PDF',
    url_fichier   VARCHAR(500),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rap_tenant
        FOREIGN KEY (tenant_id)  REFERENCES tenants(id),
    CONSTRAINT fk_rap_genere
        FOREIGN KEY (genere_par) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 18. TABLE NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
    id                      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    reference               VARCHAR(30)  NULL UNIQUE
        COMMENT 'Ex: KBS-NOTIF-001',
    tenant_id               BIGINT UNSIGNED NOT NULL,
    user_id                 BIGINT UNSIGNED NOT NULL,
    titre                   VARCHAR(255) NOT NULL,
    message                 TEXT         NOT NULL,
    module                  ENUM('PARCELLES','KBS','SYSTEME') NOT NULL,
    type                    ENUM(
                                'COMPTE_CREE',
                                'EMAIL_CODE_VERIFICATION',
                                'EMAIL_BIENVENUE',
                                'RESERVATION_EFFECTUEE',
                                'RESERVATION_CONFIRMEE',
                                'RESERVATION_EXPIREE',
                                'RESERVATION_ANNULEE',
                                'PAIEMENT_RECU',
                                'PAIEMENT_VALIDE',
                                'VENTE_CONFIRMEE',
                                'DOCUMENT_DISPONIBLE',
                                'NOUVELLE_PARCELLE',
                                'VISITE_CONFIRMEE',
                                'VISITE_ANNULEE',
                                'COMPTE_LOCATAIRE_CREE',
                                'ECHEANCE_LOYER_J7',
                                'FACTURE_GENEREE',
                                'FACTURE_VALIDEE',
                                'FACTURE_REJETEE',
                                'PAIEMENT_LOYER_VALIDE',
                                'LOCATAIRE_EN_RETARD',
                                'NOUVEAU_CLIENT_INSCRIT',
                                'NOUVELLE_RESERVATION_ADMIN',
                                'NOUVEAU_PAIEMENT_ADMIN',
                                'ALERTE_SYSTEME'
                            ) NOT NULL,
    canal                   ENUM('APP','EMAIL','SMS','PUSH') NOT NULL,
    est_lu                  TINYINT(1)   DEFAULT 0,
    lu_at                   TIMESTAMP    NULL,
    donnees_supplementaires JSON,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notif_tenant
        FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_notif_user
        FOREIGN KEY (user_id)   REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 19. TABLE EMAIL_LOGS
-- ============================================================

CREATE TABLE email_logs (
    id                 BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    reference          VARCHAR(30)  NULL UNIQUE
        COMMENT 'Ex: KBS-MAIL-001',
    tenant_id          BIGINT UNSIGNED NOT NULL,
    user_id            BIGINT UNSIGNED NULL,
    destinataire_email VARCHAR(255) NOT NULL,
    sujet              VARCHAR(255) NOT NULL,
    template_utilise   VARCHAR(100),
    statut             ENUM('ENVOYE','ECHOUE','EN_ATTENTE') DEFAULT 'EN_ATTENTE',
    erreur_message     TEXT,
    date_envoi         TIMESTAMP    NULL,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mail_tenant
        FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_mail_user
        FOREIGN KEY (user_id)   REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 20. TABLE NOTIFICATION_TEMPLATES
-- ============================================================

CREATE TABLE notification_templates (
    id                    BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tenant_id             BIGINT UNSIGNED NOT NULL,
    code                  VARCHAR(100) NOT NULL,
    module                ENUM('PARCELLES','KBS','SYSTEME') NOT NULL,
    sujet_email           VARCHAR(255),
    corps_email           LONGTEXT,
    corps_push            TEXT,
    corps_sms             TEXT,
    variables_disponibles JSON,
    created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_tpl_tenant
        FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    UNIQUE KEY unique_code_par_tenant (tenant_id, code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 21. TABLE CHAT_CONVERSATIONS
-- ============================================================

CREATE TABLE chat_conversations (
    id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    reference         VARCHAR(30)  NULL UNIQUE
        COMMENT 'Ex: KBS-CONV-001',
    tenant_id         BIGINT UNSIGNED NOT NULL,
    sujet             VARCHAR(255),
    module            ENUM('PARCELLES','KBS','GENERAL') NOT NULL,
    type_conversation ENUM(
                          'SUPPORT',
                          'PARCELLE',
                          'LOYER',
                          'GENERAL'
                      ) DEFAULT 'GENERAL',
    reference_id      BIGINT UNSIGNED NULL,
    statut            ENUM(
                          'OUVERTE',
                          'FERMEE',
                          'EN_ATTENTE',
                          'ARCHIVEE'
                      ) DEFAULT 'OUVERTE',
    cree_par          BIGINT UNSIGNED NOT NULL,
    assigne_a         BIGINT UNSIGNED NULL,
    closed_at         TIMESTAMP NULL,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_conv_tenant
        FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_conv_cree
        FOREIGN KEY (cree_par)  REFERENCES users(id),
    CONSTRAINT fk_conv_assigne
        FOREIGN KEY (assigne_a) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 22. TABLE CHAT_PARTICIPANTS
-- ============================================================

CREATE TABLE chat_participants (
    id                     BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    conversation_id        BIGINT UNSIGNED NOT NULL,
    user_id                BIGINT UNSIGNED NOT NULL,
    role_dans_conversation ENUM('CLIENT','LOCATAIRE','ADMIN') NOT NULL,
    date_derniere_lecture  TIMESTAMP NULL,
    created_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_part_conv
        FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE,
    CONSTRAINT fk_part_user
        FOREIGN KEY (user_id)         REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_participant (conversation_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 23. TABLE CHAT_MESSAGES
-- ============================================================

CREATE TABLE chat_messages (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    reference       VARCHAR(30)  NULL UNIQUE
        COMMENT 'Ex: KBS-MSG-001',
    conversation_id BIGINT UNSIGNED NOT NULL,
    sender_id       BIGINT UNSIGNED NOT NULL,
    contenu         TEXT,
    type_message    ENUM(
                        'TEXTE',
                        'IMAGE',
                        'FICHIER',
                        'AUDIO',
                        'SYSTEME'
                    ) DEFAULT 'TEXTE',
    fichier_url     VARCHAR(500),
    fichier_nom     VARCHAR(255),
    est_lu          TINYINT(1)   DEFAULT 0,
    lu_at           TIMESTAMP    NULL,
    est_supprime    TINYINT(1)   DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_msg_conv
        FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE,
    CONSTRAINT fk_msg_sender
        FOREIGN KEY (sender_id)       REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 24. TABLE ACTIVITY_LOGS
-- ============================================================

CREATE TABLE activity_logs (
    id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    reference         VARCHAR(30)  NULL UNIQUE
        COMMENT 'Ex: KBS-LOG-001',
    tenant_id         BIGINT UNSIGNED NOT NULL,
    user_id           BIGINT UNSIGNED NULL,
    role_utilisateur  ENUM(
                          'SUPER_ADMIN',
                          'BOSS',
                          'GERANT',
                          'CLIENT',
                          'LOCATAIRE'
                      ),
    module            ENUM(
                          'PARCELLES',
                          'KBS',
                          'USERS',
                          'CHAT',
                          'SYSTEME'
                      ) NOT NULL,
    action            VARCHAR(100) NOT NULL,
    description       TEXT,
    entite_type       VARCHAR(100),
    entite_id         BIGINT UNSIGNED NULL,
    anciennes_valeurs JSON,
    nouvelles_valeurs JSON,
    adresse_ip        VARCHAR(45),
    user_agent        TEXT,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_log_tenant
        FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_log_user
        FOREIGN KEY (user_id)   REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- ============================================================

-- Triggers, functions, procedures and events removed for Clever Cloud shared MySQL.
-- The Node.js backend handles application logic.

-- VUE 1 : Parcelles disponibles (site public â€” SANS PRIX)
-- ============================================================

CREATE OR REPLACE VIEW v_parcelles_publiques AS
SELECT
    p.id,
    p.reference,
    p.titre,
    p.description,
    p.localisation,
    p.ville,
    p.commune,
    p.quartier,
    p.superficie,
    p.type_parcelle,
    p.latitude,
    p.longitude,
    p.est_vedette,
    p.nombre_vues,
    p.created_at,
    pi_main.url_image  AS image_principale,
    t.nom_organisation AS publie_par_organisation
FROM parcelles p
JOIN tenants t ON t.id = p.tenant_id
LEFT JOIN parcelle_images pi_main
    ON pi_main.parcelle_id  = p.id
   AND pi_main.est_principale = 1
WHERE p.statut    = 'DISPONIBLE'
  AND p.deleted_at IS NULL;

-- ============================================================
-- VUE 2 : Parcelles avec dÃ©tail complet (admin â€” AVEC PRIX)
-- ============================================================

CREATE OR REPLACE VIEW v_parcelles_admin AS
SELECT
    p.id,
    p.reference,
    p.titre,
    p.description,
    p.localisation,
    p.ville,
    p.commune,
    p.quartier,
    p.superficie,
    p.type_parcelle,
    p.statut,
    p.est_vedette,
    p.nombre_vues,
    p.latitude,
    p.longitude,
    p.tenant_id,
    p.created_at,
    p.updated_at,
    CONCAT(u_pub.nom,' ',u_pub.prenom) AS publie_par,
    u_pub.code_user                    AS code_publieur,
    CONCAT(u_ach.nom,' ',u_ach.prenom) AS acheteur,
    u_ach.code_user                    AS code_acheteur,
    p.date_vente,
    v.reference                        AS reference_vente,
    COALESCE(p.prix_vente_confidentiel, v.montant_total) AS prix_vente,
    v.montant_paye,
    v.montant_restant,
    v.devise,
    v.statut                           AS statut_vente
FROM parcelles p
JOIN tenants t ON t.id = p.tenant_id
LEFT JOIN users u_pub ON u_pub.id = p.publie_par
LEFT JOIN users u_ach ON u_ach.id = p.vendu_a
LEFT JOIN ventes v    ON v.parcelle_id = p.id AND v.statut = 'COMPLETE'
WHERE p.deleted_at IS NULL;

-- ============================================================
-- VUE 3 : Dashboard Admin â€” RÃ©sumÃ© parcelles par statut
-- ============================================================

CREATE OR REPLACE VIEW v_dashboard_parcelles AS
SELECT
    t.id                 AS tenant_id,
    t.nom_organisation,
    COUNT(p.id)          AS total,
    SUM(CASE WHEN p.statut = 'DISPONIBLE' THEN 1 ELSE 0 END) AS disponibles,
    SUM(CASE WHEN p.statut = 'RESERVEE'   THEN 1 ELSE 0 END) AS reservees,
    SUM(CASE WHEN p.statut = 'VENDUE'     THEN 1 ELSE 0 END) AS vendues,
    SUM(CASE WHEN p.statut = 'MASQUEE'    THEN 1 ELSE 0 END) AS masquees,
    SUM(CASE WHEN p.statut = 'ARCHIVEE'   THEN 1 ELSE 0 END) AS archivees
FROM tenants t
LEFT JOIN parcelles p ON p.tenant_id = t.id AND p.deleted_at IS NULL
GROUP BY t.id, t.nom_organisation;

-- ============================================================
-- VUE 4 : Dashboard Admin â€” RÃ©sumÃ© utilisateurs
-- ============================================================

CREATE OR REPLACE VIEW v_dashboard_users AS
SELECT
    t.id                 AS tenant_id,
    t.nom_organisation,
    COUNT(u.id)          AS total_users,
    SUM(CASE WHEN u.role = 'CLIENT'     THEN 1 ELSE 0 END)    AS clients,
    SUM(CASE WHEN u.role = 'LOCATAIRE'  THEN 1 ELSE 0 END)    AS locataires,
    SUM(CASE WHEN u.role IN ('SUPER_ADMIN','BOSS','GERANT')
             THEN 1 ELSE 0 END)                                 AS admins,
    SUM(CASE WHEN u.statut = 'ACTIF'    THEN 1 ELSE 0 END)    AS actifs,
    SUM(CASE WHEN u.statut = 'BLOQUE'   THEN 1 ELSE 0 END)    AS bloques,
    SUM(CASE WHEN u.statut = 'EN_ATTENTE_VERIFICATION'
             THEN 1 ELSE 0 END)                                 AS en_attente
FROM tenants t
LEFT JOIN users u ON u.tenant_id = t.id AND u.deleted_at IS NULL
GROUP BY t.id, t.nom_organisation;

-- ============================================================
-- VUE 5 : Ventes complÃ¨tes avec dÃ©tails
-- ============================================================

CREATE OR REPLACE VIEW v_ventes_detail AS
SELECT
    v.id,
    v.reference,
    v.tenant_id,
    v.statut,
    v.date_vente,
    v.montant_total,
    v.montant_paye,
    v.montant_restant,
    v.devise,
    v.notes,
    -- Acheteur
    u_ach.code_user                    AS code_client,
    CONCAT(u_ach.nom,' ',u_ach.prenom) AS nom_client,
    u_ach.email                        AS email_client,
    u_ach.telephone                    AS tel_client,
    -- Parcelle
    p.reference                        AS reference_parcelle,
    p.titre                            AS titre_parcelle,
    p.ville,
    p.commune,
    p.quartier,
    p.superficie,
    p.type_parcelle,
    -- Admin validateur
    CONCAT(u_val.nom,' ',u_val.prenom) AS valide_par,
    -- RÃ©servation liÃ©e
    r.reference                        AS reference_reservation
FROM ventes v
JOIN users u_ach    ON u_ach.id   = v.user_id
JOIN parcelles p    ON p.id       = v.parcelle_id
LEFT JOIN users u_val ON u_val.id = v.valide_par
LEFT JOIN reservations r ON r.id  = v.reservation_id;

-- ============================================================
-- VUE 6 : RÃ©servations actives
-- ============================================================

CREATE OR REPLACE VIEW v_reservations_actives AS
SELECT
    r.id,
    r.reference,
    r.tenant_id,
    r.statut,
    r.date_reservation,
    r.date_expiration,
    r.montant_reservation,
    r.devise,
    r.notes_client,
    r.notes_admin,
    CONCAT(u.nom,' ',u.prenom) AS nom_client,
    u.code_user                AS code_client,
    u.email                    AS email_client,
    u.telephone,
    p.reference                AS reference_parcelle,
    p.titre                    AS titre_parcelle,
    p.ville,
    p.commune,
    p.superficie,
    DATEDIFF(r.date_expiration, NOW()) AS jours_restants
FROM reservations r
JOIN users     u ON u.id = r.user_id
JOIN parcelles p ON p.id = r.parcelle_id
WHERE r.statut IN ('EN_ATTENTE','EN_COURS','CONFIRMEE');

-- ============================================================
-- VUE 7 : Locataires KBS complet (admin)
-- ============================================================

CREATE OR REPLACE VIEW v_locataires_kbs AS
SELECT
    kl.id,
    kl.code_locataire,
    kl.tenant_id,
    kl.categorie,
    kl.statut_paiement,
    -- Nom selon catÃ©gorie
    CASE kl.categorie
        WHEN 'SIMPLE'     THEN CONCAT(kl.nom,' ',kl.prenom)
        WHEN 'ENTREPRISE' THEN kl.nom_entreprise
    END AS nom_affichage,
    CASE kl.categorie
        WHEN 'SIMPLE'     THEN kl.telephone_personnel
        WHEN 'ENTREPRISE' THEN kl.telephone_entreprise
    END AS telephone,
    CASE kl.categorie
        WHEN 'ENTREPRISE' THEN kl.nom_representant
        ELSE NULL
    END AS representant,
    kl.date_debut_loyer,
    kl.date_fin_loyer,
    kl.montant_mensuel_loyer,
    kl.devise,
    DATEDIFF(kl.date_fin_loyer, CURDATE()) AS jours_avant_echeance,
    CASE
        WHEN DATEDIFF(kl.date_fin_loyer, CURDATE()) <= 0  THEN 'EXPIRE'
        WHEN DATEDIFF(kl.date_fin_loyer, CURDATE()) <= 7  THEN 'URGENT'
        WHEN DATEDIFF(kl.date_fin_loyer, CURDATE()) <= 30 THEN 'BIENTOT'
        ELSE 'OK'
    END AS alerte_echeance,
    u.email            AS email_connexion,
    u.code_user,
    u.statut           AS statut_compte,
    CONCAT(u_cree.nom,' ',u_cree.prenom) AS cree_par,
    kl.created_at
FROM kbs_locataires kl
JOIN users u      ON u.id      = kl.user_id
JOIN users u_cree ON u_cree.id = kl.cree_par
WHERE kl.deleted_at IS NULL;

-- ============================================================
-- VUE 8 : Dashboard KBS Loyer
-- ============================================================

CREATE OR REPLACE VIEW v_dashboard_kbs AS
SELECT
    t.id               AS tenant_id,
    t.nom_organisation,
    COUNT(kl.id)       AS total_locataires,
    SUM(CASE WHEN kl.categorie = 'SIMPLE'      THEN 1 ELSE 0 END) AS simples,
    SUM(CASE WHEN kl.categorie = 'ENTREPRISE'  THEN 1 ELSE 0 END) AS entreprises,
    SUM(CASE WHEN kl.statut_paiement = 'A_JOUR'    THEN 1 ELSE 0 END) AS a_jour,
    SUM(CASE WHEN kl.statut_paiement = 'EN_RETARD' THEN 1 ELSE 0 END) AS en_retard,
    SUM(CASE WHEN DATEDIFF(kl.date_fin_loyer, CURDATE()) <= 7
             AND kl.statut_paiement = 'A_JOUR'
             THEN 1 ELSE 0 END) AS echeance_imminente,
    SUM(kl.montant_mensuel_loyer)                                      AS loyer_mensuel_total
FROM tenants t
LEFT JOIN kbs_locataires kl
    ON kl.tenant_id = t.id AND kl.deleted_at IS NULL
GROUP BY t.id, t.nom_organisation;

-- ============================================================
-- VUE 9 : Factures KBS avec dÃ©tails
-- ============================================================

CREATE OR REPLACE VIEW v_factures_kbs AS
SELECT
    kf.id,
    kf.reference,
    kf.tenant_id,
    kf.locataire_id,
    kf.statut,
    kf.periode_debut,
    kf.periode_fin,
    kf.montant_loyer,
    kf.devise,
    kf.peut_telecharger,
    kf.date_validation,
    kf.date_rejet,
    kf.motif_rejet,
    kf.created_at,
    -- Locataire
    kl.code_locataire,
    kl.categorie,
    CASE kl.categorie
        WHEN 'SIMPLE'     THEN CONCAT(kl.nom,' ',kl.prenom)
        WHEN 'ENTREPRISE' THEN kl.nom_entreprise
    END AS nom_locataire,
    CASE kl.categorie
        WHEN 'SIMPLE'     THEN kl.telephone_personnel
        WHEN 'ENTREPRISE' THEN kl.telephone_entreprise
    END AS telephone,
    -- Admin crÃ©ateur
    CONCAT(u_cree.nom,' ',u_cree.prenom)  AS cree_par,
    u_cree.code_user                       AS code_createur,
    -- Admin validateur
    CONCAT(u_val.nom,' ',u_val.prenom)    AS valide_par,
    -- Admin rejeteur
    CONCAT(u_rej.nom,' ',u_rej.prenom)    AS rejete_par,
    -- Paiements
    COALESCE(SUM(kp.montant_paye), 0)     AS montant_paye,
    kf.montant_loyer - COALESCE(SUM(kp.montant_paye), 0) AS montant_restant
FROM kbs_factures kf
JOIN kbs_locataires kl ON kl.id  = kf.locataire_id
JOIN users u_cree       ON u_cree.id = kf.cree_par
LEFT JOIN users u_val   ON u_val.id  = kf.valide_par
LEFT JOIN users u_rej   ON u_rej.id  = kf.rejete_par
LEFT JOIN kbs_paiements_loyer kp ON kp.facture_id = kf.id AND kp.statut <> 'REJETE'
GROUP BY kf.id, kf.reference, kf.tenant_id, kf.locataire_id, kf.statut, kf.periode_debut, kf.periode_fin, kf.montant_loyer, kf.devise, kf.peut_telecharger, kf.date_validation, kf.date_rejet, kf.motif_rejet, kf.created_at, kl.code_locataire, kl.categorie, nom_locataire, telephone, cree_par, code_createur, valide_par, rejete_par;

-- ============================================================
-- VUE 10 : Rapport financier ventes (admin)
-- ============================================================

CREATE OR REPLACE VIEW v_rapport_financier_ventes AS
SELECT
    t.nom_organisation,
    YEAR(v.date_vente)  AS annee,
    MONTH(v.date_vente) AS mois,
    COUNT(v.id)         AS nombre_ventes,
    SUM(v.montant_total) AS chiffre_affaires,
    SUM(v.montant_paye)  AS encaisse,
    SUM(v.montant_restant) AS reste_a_percevoir,
    v.devise
FROM ventes v
JOIN tenants t ON t.id = v.tenant_id
WHERE v.statut IN ('COMPLETE','EN_COURS')
GROUP BY
    t.nom_organisation,
    YEAR(v.date_vente),
    MONTH(v.date_vente),
    v.devise
ORDER BY annee DESC, mois DESC;

-- ============================================================
-- VUE 11 : Paiements loyer mensuels KBS
-- ============================================================

CREATE OR REPLACE VIEW v_paiements_loyer_mensuel AS
SELECT
    kp.tenant_id,
    YEAR(kp.date_paiement)  AS annee,
    MONTH(kp.date_paiement) AS mois,
    COUNT(kp.id)            AS nombre_paiements,
    SUM(CASE WHEN kp.statut = 'VALIDE'    THEN kp.montant_paye ELSE 0 END) AS total_valide,
    SUM(CASE WHEN kp.statut = 'EN_ATTENTE' THEN kp.montant_paye ELSE 0 END) AS total_en_attente,
    kp.devise
FROM kbs_paiements_loyer kp
GROUP BY
    kp.tenant_id,
    YEAR(kp.date_paiement),
    MONTH(kp.date_paiement),
    kp.devise;

-- ============================================================
-- VUE 12 : Conversations chat actives
-- ============================================================

CREATE OR REPLACE VIEW v_chat_actif AS
SELECT
    cc.id,
    cc.reference,
    cc.tenant_id,
    cc.sujet,
    cc.module,
    cc.type_conversation,
    cc.statut,
    cc.created_at,
    CONCAT(u_cree.nom,' ',u_cree.prenom) AS initiateur,
    u_cree.role                           AS role_initiateur,
    CONCAT(u_ass.nom,' ',u_ass.prenom)   AS assigne_a,
    COUNT(cm.id)                          AS total_messages,
    MAX(cm.created_at)                    AS dernier_message
FROM chat_conversations cc
JOIN users u_cree ON u_cree.id = cc.cree_par
LEFT JOIN users u_ass ON u_ass.id = cc.assigne_a
LEFT JOIN chat_messages cm ON cm.conversation_id = cc.id AND cm.est_supprime = 0
WHERE cc.statut IN ('OUVERTE','EN_ATTENTE')
GROUP BY
    cc.id, cc.reference, cc.tenant_id, cc.sujet,
    cc.module, cc.type_conversation, cc.statut, cc.created_at,
    u_cree.nom, u_cree.prenom, u_cree.role,
    u_ass.nom, u_ass.prenom;

-- ============================================================
-- VUE 13 : Historique activitÃ©s rÃ©centes
-- ============================================================

CREATE OR REPLACE VIEW v_activites_recentes AS
SELECT
    al.id,
    al.reference,
    al.tenant_id,
    al.module,
    al.action,
    al.description,
    al.entite_type,
    al.entite_id,
    al.adresse_ip,
    al.created_at,
    CONCAT(u.nom,' ',u.prenom) AS acteur,
    u.role                      AS role_acteur,
    u.code_user
FROM activity_logs al
LEFT JOIN users u ON u.id = al.user_id
ORDER BY al.created_at DESC;

-- ============================================================
-- VUE 14 : Notifications non lues par utilisateur
-- ============================================================

CREATE OR REPLACE VIEW v_notifications_non_lues AS
SELECT
    n.id,
    n.reference,
    n.tenant_id,
    n.user_id,
    n.titre,
    n.message,
    n.module,
    n.type,
    n.canal,
    n.created_at,
    CONCAT(u.nom,' ',u.prenom) AS destinataire,
    u.role
FROM notifications n
JOIN users u ON u.id = n.user_id
WHERE n.est_lu = 0
ORDER BY n.created_at DESC;

-- ============================================================
-- VUE 15 : Parcelles les plus consultÃ©es
-- ============================================================

CREATE OR REPLACE VIEW v_parcelles_populaires AS
SELECT
    p.id,
    p.reference,
    p.titre,
    p.ville,
    p.commune,
    p.superficie,
    p.type_parcelle,
    p.statut,
    p.nombre_vues,
    p.est_vedette,
    COUNT(f.id) AS nombre_favoris,
    COUNT(r.id) AS nombre_reservations
FROM parcelles p
LEFT JOIN favoris f ON f.parcelle_id = p.id
LEFT JOIN reservations r ON r.parcelle_id = p.id
WHERE p.deleted_at IS NULL
GROUP BY
    p.id, p.reference, p.titre, p.ville, p.commune,
    p.superficie, p.type_parcelle, p.statut,
    p.nombre_vues, p.est_vedette
ORDER BY p.nombre_vues DESC, nombre_favoris DESC;


-- ============================================================
-- ============================================================
-- Events planifies retires pour Clever Cloud: les jobs Node.js du backend les remplacent.


