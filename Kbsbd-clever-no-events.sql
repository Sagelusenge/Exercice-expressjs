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
    code_tenant               VARCHAR(20)  NOT NULL UNIQUE
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
    code_user                     VARCHAR(30)  NOT NULL UNIQUE
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
    reference       VARCHAR(50)  NOT NULL
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
    reference           VARCHAR(30)  NOT NULL UNIQUE
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
    reference         VARCHAR(30)  NOT NULL UNIQUE
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
    reference             VARCHAR(30)  NOT NULL UNIQUE
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
    reference       VARCHAR(30)  NOT NULL UNIQUE
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
    code_locataire           VARCHAR(30)  NOT NULL UNIQUE
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
    reference        VARCHAR(30)  NOT NULL UNIQUE
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
    reference          VARCHAR(30)  NOT NULL UNIQUE
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
    reference     VARCHAR(30)  NOT NULL UNIQUE
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
    reference               VARCHAR(30)  NOT NULL UNIQUE
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
    reference          VARCHAR(30)  NOT NULL UNIQUE
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
    reference         VARCHAR(30)  NOT NULL UNIQUE
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
    reference       VARCHAR(30)  NOT NULL UNIQUE
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
    reference         VARCHAR(30)  NOT NULL UNIQUE
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
--                        TRIGGERS
-- ============================================================
-- ============================================================

DELIMITER $$

-- ============================================================
-- FONCTION UTILITAIRE : GÃ©nÃ©rer la prochaine rÃ©fÃ©rence
-- ============================================================

CREATE FUNCTION fn_next_reference(
    p_table   VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    p_tenant  BIGINT UNSIGNED,
    p_prefix  VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
RETURNS VARCHAR(30)
DETERMINISTIC
BEGIN
    DECLARE v_next INT DEFAULT 1;

    -- InsÃ©rer ou mettre Ã  jour la sÃ©quence
    INSERT INTO sequences_references (table_cible, tenant_id, prefix, derniere_valeur)
    VALUES (p_table, p_tenant, p_prefix, 1)
    ON DUPLICATE KEY UPDATE derniere_valeur = derniere_valeur + 1;

    SELECT derniere_valeur INTO v_next
    FROM sequences_references
    WHERE table_cible = p_table AND tenant_id = p_tenant;

    RETURN CONCAT(p_prefix, LPAD(v_next, 3, '0'));
END$$

-- ============================================================
-- TRIGGER : TENANT â€” GÃ©nÃ©ration code_tenant
-- ============================================================
DELIMITER $$

CREATE TRIGGER trg_tenant_before_insert
BEFORE INSERT ON tenants
FOR EACH ROW
BEGIN
    DECLARE v_next INT DEFAULT 1;

    INSERT INTO sequences_references (table_cible, tenant_id, prefix, derniere_valeur)
    VALUES ('tenants', 0, 'KBS-ORG-', 1)
    ON DUPLICATE KEY UPDATE derniere_valeur = derniere_valeur + 1;

    SELECT derniere_valeur INTO v_next
    FROM sequences_references
    WHERE table_cible = 'tenants' AND tenant_id = 0;

    SET NEW.code_tenant = CONCAT('KBS-ORG-', LPAD(v_next, 3, '0'));
END$$

-- ============================================================
-- TRIGGER : USER â€” GÃ©nÃ©ration code_user selon rÃ´le
-- Format : KBS-[INITIALES NOM]-[ROLE ABREV]-[NUM]
-- Ex: KBS-BS-SADM-001 (Balezi Serge, SUPER_ADMIN)
-- ============================================================
DELIMITER $$

CREATE TRIGGER trg_user_before_insert
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
    DECLARE v_prefix    VARCHAR(25);
    DECLARE v_role_abr  VARCHAR(5);
    DECLARE v_initiales VARCHAR(6);
    DECLARE v_next      INT DEFAULT 1;

    -- AbrÃ©viation du rÃ´le
    SET v_role_abr = CASE NEW.role
        WHEN 'SUPER_ADMIN' THEN 'SADM'
        WHEN 'BOSS'        THEN 'BOSS'
        WHEN 'GERANT'      THEN 'GER'
        WHEN 'CLIENT'      THEN 'CLT'
        WHEN 'LOCATAIRE'   THEN 'LOC'
        ELSE 'USR'
    END;

    -- Initiales : 1Ã¨re lettre nom + 1Ã¨re lettre prÃ©nom
    SET v_initiales = CONCAT(
        UPPER(LEFT(TRIM(NEW.nom),    1)),
        UPPER(LEFT(TRIM(NEW.prenom), 1))
    );

    SET v_prefix = CONCAT('KBS-', v_initiales, '-', v_role_abr, '-');

    INSERT INTO sequences_references (table_cible, tenant_id, prefix, derniere_valeur)
    VALUES (CONCAT('users_', NEW.role, '_', NEW.tenant_id), NEW.tenant_id, v_prefix, 1)
    ON DUPLICATE KEY UPDATE derniere_valeur = derniere_valeur + 1;

    SELECT derniere_valeur INTO v_next
    FROM sequences_references
    WHERE table_cible = CONCAT('users_', NEW.role, '_', NEW.tenant_id)
      AND tenant_id   = NEW.tenant_id;

    SET NEW.code_user = CONCAT(v_prefix, LPAD(v_next, 3, '0'));

    -- DÃ©finir module_accessible selon le rÃ´le
    SET NEW.module_accessible = CASE NEW.role
        WHEN 'SUPER_ADMIN' THEN 'LES_DEUX'
        WHEN 'BOSS'        THEN 'LES_DEUX'
        WHEN 'GERANT'      THEN 'LES_DEUX'
        WHEN 'CLIENT'      THEN 'PARCELLES'
        WHEN 'LOCATAIRE'   THEN 'KBS'
        ELSE 'PARCELLES'
    END;
END$$

-- ============================================================
-- TRIGGER : USER â€” VÃ©rification LOCATAIRE auto-inscription
-- ============================================================
DELIMITER $$

CREATE TRIGGER trg_user_check_locataire
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
    IF NEW.role = 'LOCATAIRE' AND NEW.cree_par IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
            'ERREUR KBS: Un locataire ne peut pas s''auto-inscrire. Un admin doit crÃ©er son compte.';
    END IF;
END$$

-- ============================================================
-- TRIGGER : PARCELLE â€” GÃ©nÃ©ration rÃ©fÃ©rence
-- Format : KBS-PARC-[TYPE_ABREV]-[NUM]
-- Ex: KBS-PARC-RES-001
-- ============================================================
DELIMITER $$

CREATE TRIGGER trg_parcelle_before_insert
BEFORE INSERT ON parcelles
FOR EACH ROW
BEGIN
    DECLARE v_type_abr VARCHAR(5);
    DECLARE v_prefix   VARCHAR(25);
    DECLARE v_next     INT DEFAULT 1;

    SET v_type_abr = CASE NEW.type_parcelle
        WHEN 'RESIDENTIELLE' THEN 'RES'
        WHEN 'COMMERCIALE'   THEN 'COM'
        WHEN 'AGRICOLE'      THEN 'AGR'
        WHEN 'INDUSTRIELLE'  THEN 'IND'
        ELSE 'AUT'
    END;

    SET v_prefix = CONCAT('KBS-PARC-', v_type_abr, '-');

    INSERT INTO sequences_references
        (table_cible, tenant_id, prefix, derniere_valeur)
    VALUES
        (CONCAT('parcelles_', NEW.type_parcelle, '_', NEW.tenant_id),
         NEW.tenant_id, v_prefix, 1)
    ON DUPLICATE KEY UPDATE derniere_valeur = derniere_valeur + 1;

    SELECT derniere_valeur INTO v_next
    FROM sequences_references
    WHERE table_cible = CONCAT('parcelles_', NEW.type_parcelle, '_', NEW.tenant_id)
      AND tenant_id   = NEW.tenant_id;

    SET NEW.reference = CONCAT(v_prefix, LPAD(v_next, 3, '0'));
END$$

-- ============================================================
-- TRIGGER : PARCELLE â€” VÃ©rification statut aprÃ¨s UPDATE
-- Si VENDUE â†’ met Ã  jour vendu_a et date_vente automatiquement
-- ============================================================
DELIMITER $$

CREATE TRIGGER trg_parcelle_after_update
AFTER UPDATE ON parcelles
FOR EACH ROW
BEGIN
    -- Si la parcelle vient d'Ãªtre vendue
    IF NEW.statut = 'VENDUE' AND OLD.statut != 'VENDUE' THEN
        -- Enregistrer dans activity_logs
        INSERT INTO activity_logs
            (reference, tenant_id, module, action, description,
             entite_type, entite_id, anciennes_valeurs, nouvelles_valeurs)
        VALUES (
            fn_next_reference('activity_logs', NEW.tenant_id, 'KBS-LOG-'),
            NEW.tenant_id,
            'PARCELLES',
            'PARCELLE_VENDUE',
            CONCAT('Parcelle ', NEW.reference, ' marquÃ©e comme VENDUE'),
            'Parcelle',
            NEW.id,
            JSON_OBJECT('statut', OLD.statut),
            JSON_OBJECT('statut', NEW.statut)
        );
    END IF;

    -- Si rÃ©servation annulÃ©e â†’ remettre disponible (gÃ©rÃ© par trigger rÃ©servation)
END$$

-- ============================================================
-- TRIGGER : RESERVATION â€” GÃ©nÃ©ration rÃ©fÃ©rence
-- ============================================================
DELIMITER $$

CREATE TRIGGER trg_reservation_before_insert
BEFORE INSERT ON reservations
FOR EACH ROW
BEGIN
    DECLARE v_next INT DEFAULT 1;

    INSERT INTO sequences_references
        (table_cible, tenant_id, prefix, derniere_valeur)
    VALUES (_utf8mb4'reservations' COLLATE utf8mb4_unicode_ci, NEW.tenant_id, _utf8mb4'KBS-RES-' COLLATE utf8mb4_unicode_ci, 1)
    ON DUPLICATE KEY UPDATE derniere_valeur = derniere_valeur + 1;

    SELECT derniere_valeur INTO v_next
    FROM sequences_references
    WHERE table_cible = _utf8mb4'reservations' COLLATE utf8mb4_unicode_ci AND tenant_id = NEW.tenant_id;

    SET NEW.reference = CONCAT(_utf8mb4'KBS-RES-' COLLATE utf8mb4_unicode_ci, LPAD(v_next, 3, '0'));

    -- DÃ©finir date_expiration selon paramÃ¨tre systÃ¨me
    IF NEW.date_expiration IS NULL THEN
        SET NEW.date_expiration = DATE_ADD(NOW(), INTERVAL 7 DAY);
    END IF;
END$$

-- ============================================================
-- TRIGGER : RESERVATION â€” VÃ©rification parcelle disponible
-- ============================================================

CREATE TRIGGER trg_reservation_check_disponible
BEFORE INSERT ON reservations
FOR EACH ROW
BEGIN
    DECLARE v_statut_parcelle VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_module_res_actif TINYINT;

    -- VÃ©rifier si module rÃ©servation est actif
    SELECT module_reservation_actif INTO v_module_res_actif
    FROM tenants WHERE id = NEW.tenant_id;

    IF v_module_res_actif = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
            'ERREUR KBS: Le module de rÃ©servation est actuellement dÃ©sactivÃ©.';
    END IF;

    -- VÃ©rifier statut de la parcelle
    SELECT statut INTO v_statut_parcelle
    FROM parcelles WHERE id = NEW.parcelle_id;

    IF v_statut_parcelle != _utf8mb4'DISPONIBLE' COLLATE utf8mb4_unicode_ci THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
            'ERREUR KBS: Cette parcelle n''est pas disponible Ã  la rÃ©servation.';
    END IF;

    -- VÃ©rifier qu'aucune rÃ©servation active n'existe
    IF EXISTS (
        SELECT 1 FROM reservations
        WHERE parcelle_id = NEW.parcelle_id
          AND statut IN (_utf8mb4'EN_ATTENTE' COLLATE utf8mb4_unicode_ci, _utf8mb4'CONFIRMEE' COLLATE utf8mb4_unicode_ci)
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
            'ERREUR KBS: Cette parcelle a dÃ©jÃ  une rÃ©servation active.';
    END IF;
END$$

-- ============================================================
-- TRIGGER : RESERVATION â€” Mise Ã  jour statut parcelle
-- ============================================================
DELIMITER $$

CREATE TRIGGER trg_reservation_after_insert
AFTER INSERT ON reservations
FOR EACH ROW
BEGIN
    -- Passer la parcelle en RESERVEE
    UPDATE parcelles
    SET statut = _utf8mb4'RESERVEE' COLLATE utf8mb4_unicode_ci, updated_at = NOW()
    WHERE id = NEW.parcelle_id;

    -- Log activitÃ©
    INSERT INTO activity_logs
        (reference, tenant_id, user_id, module, action,
         description, entite_type, entite_id)
    VALUES (
        fn_next_reference('activity_logs', NEW.tenant_id, 'KBS-LOG-'),
        NEW.tenant_id,
        NEW.user_id,
        'PARCELLES',
        'RESERVATION_EFFECTUEE',
        CONCAT('Nouvelle rÃ©servation ', NEW.reference,
               ' sur parcelle ID ', NEW.parcelle_id),
        'Reservation',
        NEW.id
    );
END$$

-- ============================================================
-- TRIGGER : RESERVATION UPDATE â€” Gestion expiration/annulation
-- ============================================================

CREATE TRIGGER trg_reservation_after_update
AFTER UPDATE ON reservations
FOR EACH ROW
BEGIN
    -- Si rÃ©servation expirÃ©e ou annulÃ©e â†’ remettre parcelle DISPONIBLE
    IF NEW.statut IN ('EXPIREE','ANNULEE')
       AND OLD.statut NOT IN ('EXPIREE','ANNULEE') THEN
        UPDATE parcelles
        SET statut = 'DISPONIBLE', updated_at = NOW()
        WHERE id = NEW.parcelle_id;
    END IF;

    -- Si rÃ©servation transformÃ©e en vente
    IF NEW.statut = 'TRANSFORMEE_EN_VENTE'
       AND OLD.statut != 'TRANSFORMEE_EN_VENTE' THEN
        UPDATE parcelles
        SET statut = 'VENDUE', updated_at = NOW()
        WHERE id = NEW.parcelle_id;
    END IF;

    -- Log
    INSERT INTO activity_logs
        (reference, tenant_id, module, action,
         description, entite_type, entite_id,
         anciennes_valeurs, nouvelles_valeurs)
    VALUES (
        fn_next_reference('activity_logs', NEW.tenant_id, 'KBS-LOG-'),
        NEW.tenant_id,
        'PARCELLES',
        CONCAT('RESERVATION_', NEW.statut),
        CONCAT('RÃ©servation ', NEW.reference, ' â†’ ', NEW.statut),
        'Reservation',
        NEW.id,
        JSON_OBJECT('statut', OLD.statut),
        JSON_OBJECT('statut', NEW.statut)
    );
END$$

-- ============================================================
-- TRIGGER : VENTE â€” GÃ©nÃ©ration rÃ©fÃ©rence
-- ============================================================

CREATE TRIGGER trg_vente_before_insert
BEFORE INSERT ON ventes
FOR EACH ROW
BEGIN
    DECLARE v_next INT DEFAULT 1;

    INSERT INTO sequences_references
        (table_cible, tenant_id, prefix, derniere_valeur)
    VALUES ('ventes', NEW.tenant_id, 'KBS-VTE-', 1)
    ON DUPLICATE KEY UPDATE derniere_valeur = derniere_valeur + 1;

    SELECT derniere_valeur INTO v_next
    FROM sequences_references
    WHERE table_cible = 'ventes' AND tenant_id = NEW.tenant_id;

    SET NEW.reference = CONCAT('KBS-VTE-', LPAD(v_next, 3, '0'));
END$$

-- ============================================================
-- TRIGGER : VENTE UPDATE â€” Confirmation vente â†’ parcelle VENDUE
-- ============================================================

CREATE TRIGGER trg_vente_after_update
AFTER UPDATE ON ventes
FOR EACH ROW
BEGIN
    IF NEW.statut = 'COMPLETE' AND OLD.statut != 'COMPLETE' THEN
        -- Parcelle â†’ VENDUE
        UPDATE parcelles
        SET statut   = 'VENDUE',
            vendu_a  = NEW.user_id,
            date_vente = NOW(),
            updated_at = NOW()
        WHERE id = NEW.parcelle_id;

        -- Log
        INSERT INTO activity_logs
            (reference, tenant_id, user_id, module, action,
             description, entite_type, entite_id)
        VALUES (
            fn_next_reference('activity_logs', NEW.tenant_id, 'KBS-LOG-'),
            NEW.tenant_id,
            NEW.valide_par,
            'PARCELLES',
            'VENTE_CONFIRMEE',
            CONCAT('Vente ', NEW.reference, ' confirmÃ©e et complÃ¨te'),
            'Vente',
            NEW.id
        );
    END IF;
END$$

-- ============================================================
-- TRIGGER : PAIEMENT â€” GÃ©nÃ©ration rÃ©fÃ©rence
-- ============================================================

CREATE TRIGGER trg_paiement_before_insert
BEFORE INSERT ON paiements
FOR EACH ROW
BEGIN
    DECLARE v_next INT DEFAULT 1;

    INSERT INTO sequences_references
        (table_cible, tenant_id, prefix, derniere_valeur)
    VALUES ('paiements', NEW.tenant_id, 'KBS-PAY-', 1)
    ON DUPLICATE KEY UPDATE derniere_valeur = derniere_valeur + 1;

    SELECT derniere_valeur INTO v_next
    FROM sequences_references
    WHERE table_cible = 'paiements' AND tenant_id = NEW.tenant_id;

    SET NEW.reference = CONCAT('KBS-PAY-', LPAD(v_next, 3, '0'));
END$$

-- ============================================================
-- TRIGGER : PAIEMENT UPDATE â€” Mise Ã  jour montant vente
-- ============================================================

CREATE TRIGGER trg_paiement_after_update
AFTER UPDATE ON paiements
FOR EACH ROW
BEGIN
    -- Paiement validÃ© et liÃ© Ã  une vente
    IF NEW.statut = 'PAYE'
       AND OLD.statut != 'PAYE'
       AND NEW.vente_id IS NOT NULL THEN

        UPDATE ventes
        SET montant_paye = montant_paye + NEW.montant,
            updated_at   = NOW()
        WHERE id = NEW.vente_id;

        -- VÃ©rifier si la vente est complÃ¨te
        UPDATE ventes
        SET statut     = 'COMPLETE',
            valide_par = NEW.valide_par,
            updated_at = NOW()
        WHERE id          = NEW.vente_id
          AND montant_paye >= montant_total;
    END IF;
END$$

-- ============================================================
-- TRIGGER : VISITE â€” GÃ©nÃ©ration rÃ©fÃ©rence
-- ============================================================

CREATE TRIGGER trg_visite_before_insert
BEFORE INSERT ON visites_demandes
FOR EACH ROW
BEGIN
    DECLARE v_next INT DEFAULT 1;

    INSERT INTO sequences_references
        (table_cible, tenant_id, prefix, derniere_valeur)
    VALUES ('visites', NEW.tenant_id, 'KBS-VIS-', 1)
    ON DUPLICATE KEY UPDATE derniere_valeur = derniere_valeur + 1;

    SELECT derniere_valeur INTO v_next
    FROM sequences_references
    WHERE table_cible = 'visites' AND tenant_id = NEW.tenant_id;

    SET NEW.reference = CONCAT('KBS-VIS-', LPAD(v_next, 3, '0'));
END$$

-- ============================================================
-- TRIGGER : PARCELLE IMAGE â€” GÃ©nÃ©ration code_image
-- ============================================================

CREATE TRIGGER trg_parcelle_image_before_insert
BEFORE INSERT ON parcelle_images
FOR EACH ROW
BEGIN
    DECLARE v_next INT DEFAULT 1;
    DECLARE v_tenant BIGINT UNSIGNED;

    SELECT tenant_id INTO v_tenant FROM parcelles WHERE id = NEW.parcelle_id;

    INSERT INTO sequences_references
        (table_cible, tenant_id, prefix, derniere_valeur)
    VALUES ('parcelle_images', v_tenant, 'KBS-IMG-', 1)
    ON DUPLICATE KEY UPDATE derniere_valeur = derniere_valeur + 1;

    SELECT derniere_valeur INTO v_next
    FROM sequences_references
    WHERE table_cible = 'parcelle_images' AND tenant_id = v_tenant;

    SET NEW.code_image = CONCAT('KBS-IMG-', LPAD(v_next, 3, '0'));
END$$

-- ============================================================
-- TRIGGER : PARCELLE DOCUMENT â€” GÃ©nÃ©ration code_document
-- ============================================================

CREATE TRIGGER trg_parcelle_doc_before_insert
BEFORE INSERT ON parcelle_documents
FOR EACH ROW
BEGIN
    DECLARE v_next INT DEFAULT 1;
    DECLARE v_tenant BIGINT UNSIGNED;

    SELECT tenant_id INTO v_tenant FROM parcelles WHERE id = NEW.parcelle_id;

    INSERT INTO sequences_references
        (table_cible, tenant_id, prefix, derniere_valeur)
    VALUES ('parcelle_documents', v_tenant, 'KBS-PDOC-', 1)
    ON DUPLICATE KEY UPDATE derniere_valeur = derniere_valeur + 1;

    SELECT derniere_valeur INTO v_next
    FROM sequences_references
    WHERE table_cible = 'parcelle_documents' AND tenant_id = v_tenant;

    SET NEW.code_document = CONCAT('KBS-PDOC-', LPAD(v_next, 3, '0'));
END$$

-- ============================================================
-- TRIGGER : VENTE DOCUMENT â€” GÃ©nÃ©ration code_doc
-- ============================================================

CREATE TRIGGER trg_vente_doc_before_insert
BEFORE INSERT ON vente_documents
FOR EACH ROW
BEGIN
    DECLARE v_next INT DEFAULT 1;
    DECLARE v_tenant BIGINT UNSIGNED;

    SELECT tenant_id INTO v_tenant FROM ventes WHERE id = NEW.vente_id;

    INSERT INTO sequences_references
        (table_cible, tenant_id, prefix, derniere_valeur)
    VALUES ('vente_documents', v_tenant, 'KBS-VDOC-', 1)
    ON DUPLICATE KEY UPDATE derniere_valeur = derniere_valeur + 1;

    SELECT derniere_valeur INTO v_next
    FROM sequences_references
    WHERE table_cible = 'vente_documents' AND tenant_id = v_tenant;

    SET NEW.code_doc = CONCAT('KBS-VDOC-', LPAD(v_next, 3, '0'));
END$$

-- ============================================================
-- TRIGGER : KBS_LOCATAIRE â€” GÃ©nÃ©ration code_locataire
-- Format : KBS-LOC-[CAT]-[NUM]
-- Ex: KBS-LOC-SMP-001 / KBS-LOC-ENT-001
-- ============================================================

CREATE TRIGGER trg_locataire_before_insert
BEFORE INSERT ON kbs_locataires
FOR EACH ROW
BEGIN
    DECLARE v_cat_abr VARCHAR(5);
    DECLARE v_prefix  VARCHAR(20);
    DECLARE v_next    INT DEFAULT 1;

    SET v_cat_abr = CASE NEW.categorie
        WHEN 'SIMPLE'     THEN 'SMP'
        WHEN 'ENTREPRISE' THEN 'ENT'
        ELSE 'LOC'
    END;

    SET v_prefix = CONCAT('KBS-LOC-', v_cat_abr, '-');

    INSERT INTO sequences_references
        (table_cible, tenant_id, prefix, derniere_valeur)
    VALUES (CONCAT('kbs_locataires_', NEW.categorie, '_', NEW.tenant_id),
            NEW.tenant_id, v_prefix, 1)
    ON DUPLICATE KEY UPDATE derniere_valeur = derniere_valeur + 1;

    SELECT derniere_valeur INTO v_next
    FROM sequences_references
    WHERE table_cible = CONCAT('kbs_locataires_', NEW.categorie, '_', NEW.tenant_id)
      AND tenant_id   = NEW.tenant_id;

    SET NEW.code_locataire = CONCAT(v_prefix, LPAD(v_next, 3, '0'));
END$$

-- ============================================================
-- TRIGGER : KBS_FACTURE â€” GÃ©nÃ©ration rÃ©fÃ©rence
-- Format : KBS-FAC-[ANNEE]-[NUM]
-- Ex: KBS-FAC-2024-001
-- ============================================================

CREATE TRIGGER trg_facture_before_insert
BEFORE INSERT ON kbs_factures
FOR EACH ROW
BEGIN
    DECLARE v_annee VARCHAR(4);
    DECLARE v_prefix VARCHAR(20);
    DECLARE v_next  INT DEFAULT 1;

    SET v_annee  = YEAR(NOW());
    SET v_prefix = CONCAT('KBS-FAC-', v_annee, '-');

    INSERT INTO sequences_references
        (table_cible, tenant_id, prefix, derniere_valeur)
    VALUES (CONCAT('kbs_factures_', v_annee, '_', NEW.tenant_id),
            NEW.tenant_id, v_prefix, 1)
    ON DUPLICATE KEY UPDATE derniere_valeur = derniere_valeur + 1;

    SELECT derniere_valeur INTO v_next
    FROM sequences_references
    WHERE table_cible = CONCAT('kbs_factures_', v_annee, '_', NEW.tenant_id)
      AND tenant_id   = NEW.tenant_id;

    SET NEW.reference = CONCAT(v_prefix, LPAD(v_next, 3, '0'));
END$$

-- ============================================================
-- TRIGGER : KBS_FACTURE â€” Historique automatique Ã  la crÃ©ation
-- ============================================================

CREATE TRIGGER trg_facture_after_insert
AFTER INSERT ON kbs_factures
FOR EACH ROW
BEGIN
    INSERT INTO kbs_facture_historique
        (facture_id, action, effectue_par, ancien_statut,
         nouveau_statut, commentaire)
    VALUES (
        NEW.id,
        'CREATION',
        NEW.cree_par,
        NULL,
        'EN_ATTENTE',
        CONCAT('Facture ', NEW.reference, ' crÃ©Ã©e pour la pÃ©riode ',
               NEW.periode_debut, ' au ', NEW.periode_fin)
    );
END$$

-- ============================================================
-- TRIGGER : KBS_FACTURE UPDATE â€” Historique + contrÃ´le tÃ©lÃ©chargement
-- ============================================================

CREATE TRIGGER trg_facture_after_update
AFTER UPDATE ON kbs_factures
FOR EACH ROW
BEGIN
    DECLARE v_action VARCHAR(30);
    DECLARE v_effectue BIGINT UNSIGNED;

    -- DÃ©terminer l'action et l'acteur
    IF NEW.statut = 'VALIDEE' AND OLD.statut != 'VALIDEE' THEN
        SET v_action   = 'VALIDATION';
        SET v_effectue = NEW.valide_par;

        -- Activer le tÃ©lÃ©chargement
        UPDATE kbs_factures
        SET peut_telecharger = 1
        WHERE id = NEW.id;

        -- Mettre Ã  jour statut paiement locataire
        UPDATE kbs_locataires
        SET statut_paiement = 'A_JOUR', updated_at = NOW()
        WHERE id = NEW.locataire_id;

    ELSEIF NEW.statut = 'REJETEE' AND OLD.statut != 'REJETEE' THEN
        SET v_action   = 'REJET';
        SET v_effectue = NEW.rejete_par;
    ELSE
        SET v_action   = 'MODIFICATION';
        SET v_effectue = NEW.cree_par;
    END IF;

    -- InsÃ©rer dans historique
    INSERT INTO kbs_facture_historique
        (facture_id, action, effectue_par, ancien_statut,
         nouveau_statut, commentaire)
    VALUES (
        NEW.id,
        v_action,
        v_effectue,
        OLD.statut,
        NEW.statut,
        CONCAT('Statut changÃ© de ', OLD.statut, ' vers ', NEW.statut)
    );
END$$

-- ============================================================
-- TRIGGER : KBS_PAIEMENT_LOYER â€” GÃ©nÃ©ration rÃ©fÃ©rence
-- ============================================================

CREATE TRIGGER trg_paiement_loyer_before_insert
BEFORE INSERT ON kbs_paiements_loyer
FOR EACH ROW
BEGIN
    DECLARE v_next INT DEFAULT 1;

    INSERT INTO sequences_references
        (table_cible, tenant_id, prefix, derniere_valeur)
    VALUES ('kbs_paiements_loyer', NEW.tenant_id, 'KBS-PLOYER-', 1)
    ON DUPLICATE KEY UPDATE derniere_valeur = derniere_valeur + 1;

    SELECT derniere_valeur INTO v_next
    FROM sequences_references
    WHERE table_cible = 'kbs_paiements_loyer' AND tenant_id = NEW.tenant_id;

    SET NEW.reference = CONCAT('KBS-PLOYER-', LPAD(v_next, 3, '0'));
END$$

-- ============================================================
-- TRIGGER : KBS_PAIEMENT_LOYER â€” Mise Ã  jour statut locataire
-- ============================================================

CREATE TRIGGER trg_paiement_loyer_after_update
AFTER UPDATE ON kbs_paiements_loyer
FOR EACH ROW
BEGIN
    IF NEW.statut = 'VALIDE' AND OLD.statut != 'VALIDE' THEN
        UPDATE kbs_locataires
        SET statut_paiement = 'A_JOUR', updated_at = NOW()
        WHERE id = NEW.locataire_id;
    END IF;
END$$

-- ============================================================
-- TRIGGER : NOTIFICATION â€” GÃ©nÃ©ration rÃ©fÃ©rence
-- ============================================================

CREATE TRIGGER trg_notification_before_insert
BEFORE INSERT ON notifications
FOR EACH ROW
BEGIN
    DECLARE v_next INT DEFAULT 1;

    INSERT INTO sequences_references
        (table_cible, tenant_id, prefix, derniere_valeur)
    VALUES ('notifications', NEW.tenant_id, 'KBS-NOTIF-', 1)
    ON DUPLICATE KEY UPDATE derniere_valeur = derniere_valeur + 1;

    SELECT derniere_valeur INTO v_next
    FROM sequences_references
    WHERE table_cible = 'notifications' AND tenant_id = NEW.tenant_id;

    SET NEW.reference = CONCAT('KBS-NOTIF-', LPAD(v_next, 3, '0'));
END$$

-- ============================================================
-- TRIGGER : EMAIL_LOG â€” GÃ©nÃ©ration rÃ©fÃ©rence
-- ============================================================

CREATE TRIGGER trg_email_log_before_insert
BEFORE INSERT ON email_logs
FOR EACH ROW
BEGIN
    DECLARE v_next INT DEFAULT 1;

    INSERT INTO sequences_references
        (table_cible, tenant_id, prefix, derniere_valeur)
    VALUES ('email_logs', NEW.tenant_id, 'KBS-MAIL-', 1)
    ON DUPLICATE KEY UPDATE derniere_valeur = derniere_valeur + 1;

    SELECT derniere_valeur INTO v_next
    FROM sequences_references
    WHERE table_cible = 'email_logs' AND tenant_id = NEW.tenant_id;

    SET NEW.reference = CONCAT('KBS-MAIL-', LPAD(v_next, 3, '0'));
END$$

-- ============================================================
-- TRIGGER : CHAT_CONVERSATION â€” GÃ©nÃ©ration rÃ©fÃ©rence
-- ============================================================

CREATE TRIGGER trg_conversation_before_insert
BEFORE INSERT ON chat_conversations
FOR EACH ROW
BEGIN
    DECLARE v_next INT DEFAULT 1;

    INSERT INTO sequences_references
        (table_cible, tenant_id, prefix, derniere_valeur)
    VALUES ('chat_conversations', NEW.tenant_id, 'KBS-CONV-', 1)
    ON DUPLICATE KEY UPDATE derniere_valeur = derniere_valeur + 1;

    SELECT derniere_valeur INTO v_next
    FROM sequences_references
    WHERE table_cible = 'chat_conversations' AND tenant_id = NEW.tenant_id;

    SET NEW.reference = CONCAT('KBS-CONV-', LPAD(v_next, 3, '0'));
END$$

-- ============================================================
-- TRIGGER : CHAT_MESSAGE â€” GÃ©nÃ©ration rÃ©fÃ©rence
-- ============================================================

CREATE TRIGGER trg_message_before_insert
BEFORE INSERT ON chat_messages
FOR EACH ROW
BEGIN
    DECLARE v_next    INT DEFAULT 1;
    DECLARE v_tenant  BIGINT UNSIGNED;

    SELECT tenant_id INTO v_tenant
    FROM chat_conversations WHERE id = NEW.conversation_id;

    INSERT INTO sequences_references
        (table_cible, tenant_id, prefix, derniere_valeur)
    VALUES ('chat_messages', v_tenant, 'KBS-MSG-', 1)
    ON DUPLICATE KEY UPDATE derniere_valeur = derniere_valeur + 1;

    SELECT derniere_valeur INTO v_next
    FROM sequences_references
    WHERE table_cible = 'chat_messages' AND tenant_id = v_tenant;

    SET NEW.reference = CONCAT('KBS-MSG-', LPAD(v_next, 3, '0'));
END$$

-- ============================================================
-- TRIGGER : ACTIVITY_LOG â€” GÃ©nÃ©ration rÃ©fÃ©rence
-- ============================================================

CREATE TRIGGER trg_activity_log_before_insert
BEFORE INSERT ON activity_logs
FOR EACH ROW
BEGIN
    DECLARE v_next INT DEFAULT 1;

    INSERT INTO sequences_references
        (table_cible, tenant_id, prefix, derniere_valeur)
    VALUES ('activity_logs', NEW.tenant_id, 'KBS-LOG-', 1)
    ON DUPLICATE KEY UPDATE derniere_valeur = derniere_valeur + 1;

    SELECT derniere_valeur INTO v_next
    FROM sequences_references
    WHERE table_cible = 'activity_logs' AND tenant_id = NEW.tenant_id;

    SET NEW.reference = CONCAT('KBS-LOG-', LPAD(v_next, 3, '0'));
END$$

-- ============================================================
-- TRIGGER : KBS_RAPPORT â€” GÃ©nÃ©ration rÃ©fÃ©rence
-- ============================================================

CREATE TRIGGER trg_rapport_before_insert
BEFORE INSERT ON kbs_rapports
FOR EACH ROW
BEGIN
    DECLARE v_next INT DEFAULT 1;

    INSERT INTO sequences_references
        (table_cible, tenant_id, prefix, derniere_valeur)
    VALUES ('kbs_rapports', NEW.tenant_id, 'KBS-RAP-', 1)
    ON DUPLICATE KEY UPDATE derniere_valeur = derniere_valeur + 1;

    SELECT derniere_valeur INTO v_next
    FROM sequences_references
    WHERE table_cible = 'kbs_rapports' AND tenant_id = NEW.tenant_id;

    SET NEW.reference = CONCAT('KBS-RAP-', LPAD(v_next, 3, '0'));
END$$

DELIMITER ;


-- ============================================================
-- ============================================================
--                      PROCÃ‰DURES STOCKÃ‰ES
-- ============================================================
-- ============================================================

DELIMITER $$

-- ============================================================
-- PROCÃ‰DURE : VÃ©rifier et expirer les rÃ©servations
-- Ã€ appeler via un EVENT planifiÃ© chaque heure
-- ============================================================

CREATE PROCEDURE sp_expirer_reservations()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- Mettre Ã  jour les rÃ©servations expirÃ©es
    UPDATE reservations
    SET statut     = 'EXPIREE',
        updated_at = NOW()
    WHERE statut       IN ('EN_ATTENTE','CONFIRMEE')
      AND date_expiration < NOW();

    -- Les parcelles repassent DISPONIBLE via le trigger trg_reservation_after_update

    COMMIT;
END$$

-- ============================================================
-- PROCÃ‰DURE : VÃ©rifier les locataires en retard
-- Ã€ appeler chaque jour via EVENT
-- ============================================================

CREATE PROCEDURE sp_verifier_locataires_retard(IN p_tenant_id BIGINT UNSIGNED)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- Marquer EN_RETARD les locataires dont la date_fin est dÃ©passÃ©e
    -- et qui n'ont pas de paiement validÃ© pour la pÃ©riode en cours
    UPDATE kbs_locataires kl
    SET kl.statut_paiement = 'EN_RETARD',
        kl.updated_at      = NOW()
    WHERE kl.tenant_id    = p_tenant_id
      AND kl.deleted_at   IS NULL
      AND kl.date_fin_loyer < CURDATE()
      AND kl.statut_paiement = 'A_JOUR'
      AND NOT EXISTS (
          SELECT 1 FROM kbs_paiements_loyer kp
          WHERE kp.locataire_id = kl.id
            AND kp.statut       = 'VALIDE'
            AND MONTH(kp.date_paiement) = MONTH(CURDATE())
            AND YEAR(kp.date_paiement)  = YEAR(CURDATE())
      );

    -- CrÃ©er des notifications pour les locataires en retard
    INSERT INTO notifications
        (tenant_id, user_id, titre, message, module, type, canal, donnees_supplementaires)
    SELECT
        kl.tenant_id,
        kl.user_id,
        'Retard de paiement de loyer',
        CONCAT('Bonjour ', COALESCE(kl.nom, kl.nom_representant),
               ', votre loyer est en retard. Veuillez rÃ©gulariser. â€” KBS Buildings'),
        'KBS',
        'LOCATAIRE_EN_RETARD',
        'PUSH',
        JSON_OBJECT('locataire_id', kl.id, 'montant', kl.montant_mensuel_loyer)
    FROM kbs_locataires kl
    WHERE kl.tenant_id     = p_tenant_id
      AND kl.statut_paiement = 'EN_RETARD'
      AND kl.deleted_at    IS NULL;

    COMMIT;
END$$

-- ============================================================
-- PROCÃ‰DURE : Envoyer rappel Ã©chÃ©ance J-7 locataires
-- Ã€ appeler chaque jour via EVENT
-- ============================================================

CREATE PROCEDURE sp_rappel_echeance_j7(IN p_tenant_id BIGINT UNSIGNED)
BEGIN
    DECLARE v_message TEXT;

    -- Locataires simples dont l'Ã©chÃ©ance est dans 7 jours
    INSERT INTO notifications
        (tenant_id, user_id, titre, message, module, type, canal, donnees_supplementaires)
    SELECT
        kl.tenant_id,
        kl.user_id,
        'Rappel : Ã‰chÃ©ance de loyer dans 7 jours',
        CONCAT(
            'Bonjour ', kl.nom, ' ', kl.prenom,
            ', votre Ã©chÃ©ance de loyer arrive dans 7 jours (',
            kl.date_fin_loyer,
            '). Veuillez procÃ©der au paiement de ',
            kl.montant_mensuel_loyer, ' ', kl.devise,
            ' avant la date limite. â€” KBS Buildings'
        ),
        'KBS',
        'ECHEANCE_LOYER_J7',
        'PUSH',
        JSON_OBJECT(
            'locataire_id', kl.id,
            'date_fin', kl.date_fin_loyer,
            'montant', kl.montant_mensuel_loyer
        )
    FROM kbs_locataires kl
    WHERE kl.tenant_id     = p_tenant_id
      AND kl.categorie     = 'SIMPLE'
      AND kl.deleted_at    IS NULL
      AND DATEDIFF(kl.date_fin_loyer, CURDATE()) = 7;

    -- Locataires entreprises
    INSERT INTO notifications
        (tenant_id, user_id, titre, message, module, type, canal, donnees_supplementaires)
    SELECT
        kl.tenant_id,
        kl.user_id,
        'Rappel : Ã‰chÃ©ance de loyer dans 7 jours',
        CONCAT(
            'Bonjour ', kl.nom_representant,
            ' (', kl.nom_entreprise, ')',
            ', votre Ã©chÃ©ance de loyer arrive dans 7 jours (',
            kl.date_fin_loyer,
            '). Veuillez procÃ©der au paiement de ',
            kl.montant_mensuel_loyer, ' ', kl.devise,
            ' avant la date limite. â€” KBS Buildings'
        ),
        'KBS',
        'ECHEANCE_LOYER_J7',
        'PUSH',
        JSON_OBJECT(
            'locataire_id',  kl.id,
            'date_fin',      kl.date_fin_loyer,
            'montant',       kl.montant_mensuel_loyer,
            'email_entreprise', kl.email_entreprise
        )
    FROM kbs_locataires kl
    WHERE kl.tenant_id  = p_tenant_id
      AND kl.categorie  = 'ENTREPRISE'
      AND kl.deleted_at IS NULL
      AND DATEDIFF(kl.date_fin_loyer, CURDATE()) = 7;

    -- Log email pour les entreprises (email entreprise en plus)
    INSERT INTO email_logs
        (tenant_id, user_id, destinataire_email, sujet, template_utilise, statut)
    SELECT
        kl.tenant_id,
        kl.user_id,
        kl.email_entreprise,
        'Rappel : Ã‰chÃ©ance de loyer dans 7 jours â€” KBS Buildings',
        'PUSH_ECHEANCE_J7',
        'EN_ATTENTE'
    FROM kbs_locataires kl
    WHERE kl.tenant_id      = p_tenant_id
      AND kl.categorie      = 'ENTREPRISE'
      AND kl.deleted_at     IS NULL
      AND kl.email_entreprise IS NOT NULL
      AND DATEDIFF(kl.date_fin_loyer, CURDATE()) = 7;
END$$

-- ============================================================
-- PROCÃ‰DURE : Valider une facture KBS
-- ============================================================

CREATE PROCEDURE sp_valider_facture(
    IN p_facture_id  BIGINT UNSIGNED,
    IN p_admin_id    BIGINT UNSIGNED,
    IN p_pdf_url     VARCHAR(500)
)
BEGIN
    DECLARE v_statut_actuel VARCHAR(20);
    DECLARE v_role_admin    VARCHAR(20);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- VÃ©rifier que l'admin a le droit
    SELECT role INTO v_role_admin FROM users WHERE id = p_admin_id;
    IF v_role_admin NOT IN ('SUPER_ADMIN','BOSS','GERANT') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'ERREUR KBS: Seul un admin peut valider une facture.';
    END IF;

    -- VÃ©rifier statut actuel
    SELECT statut INTO v_statut_actuel FROM kbs_factures WHERE id = p_facture_id;
    IF v_statut_actuel != 'EN_ATTENTE' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'ERREUR KBS: Cette facture ne peut pas Ãªtre validÃ©e dans son Ã©tat actuel.';
    END IF;

    -- Valider la facture
    UPDATE kbs_factures
    SET statut          = 'VALIDEE',
        date_validation = NOW(),
        valide_par      = p_admin_id,
        pdf_url         = p_pdf_url,
        peut_telecharger = 1,
        updated_at      = NOW()
    WHERE id = p_facture_id;

    -- Notification au locataire
    INSERT INTO notifications
        (tenant_id, user_id, titre, message, module, type, canal, donnees_supplementaires)
    SELECT
        kf.tenant_id,
        kl.user_id,
        'Votre facture a Ã©tÃ© validÃ©e',
        CONCAT('Votre facture ', kf.reference,
               ' pour la pÃ©riode ', kf.periode_debut, ' au ', kf.periode_fin,
               ' a Ã©tÃ© validÃ©e. Vous pouvez maintenant la tÃ©lÃ©charger.'),
        'KBS',
        'FACTURE_VALIDEE',
        'APP',
        JSON_OBJECT('facture_id', kf.id, 'reference', kf.reference)
    FROM kbs_factures kf
    JOIN kbs_locataires kl ON kl.id = kf.locataire_id
    WHERE kf.id = p_facture_id;

    COMMIT;
END$$

-- ============================================================
-- PROCÃ‰DURE : Rejeter une facture KBS
-- ============================================================

CREATE PROCEDURE sp_rejeter_facture(
    IN p_facture_id BIGINT UNSIGNED,
    IN p_admin_id   BIGINT UNSIGNED,
    IN p_motif      TEXT
)
BEGIN
    DECLARE v_role_admin VARCHAR(20);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    SELECT role INTO v_role_admin FROM users WHERE id = p_admin_id;
    IF v_role_admin NOT IN ('SUPER_ADMIN','BOSS','GERANT') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'ERREUR KBS: Seul un admin peut rejeter une facture.';
    END IF;

    UPDATE kbs_factures
    SET statut          = 'REJETEE',
        date_rejet      = NOW(),
        rejete_par      = p_admin_id,
        motif_rejet     = p_motif,
        peut_telecharger = 0,
        updated_at      = NOW()
    WHERE id = p_facture_id;

    -- Notification au locataire
    INSERT INTO notifications
        (tenant_id, user_id, titre, message, module, type, canal, donnees_supplementaires)
    SELECT
        kf.tenant_id,
        kl.user_id,
        'Votre facture a Ã©tÃ© rejetÃ©e',
        CONCAT('Votre facture ', kf.reference, ' a Ã©tÃ© rejetÃ©e. Motif : ',
               COALESCE(p_motif, 'Non spÃ©cifiÃ©')),
        'KBS',
        'FACTURE_REJETEE',
        'APP',
        JSON_OBJECT('facture_id', kf.id, 'motif', p_motif)
    FROM kbs_factures kf
    JOIN kbs_locataires kl ON kl.id = kf.locataire_id
    WHERE kf.id = p_facture_id;

    COMMIT;
END$$

-- ============================================================
-- PROCÃ‰DURE : Confirmer une vente de parcelle
-- ============================================================

CREATE PROCEDURE sp_confirmer_vente(
    IN p_vente_id  BIGINT UNSIGNED,
    IN p_admin_id  BIGINT UNSIGNED
)
BEGIN
    DECLARE v_statut_vente  VARCHAR(20);
    DECLARE v_montant_total DECIMAL(15,2);
    DECLARE v_montant_paye  DECIMAL(15,2);
    DECLARE v_role_admin    VARCHAR(20);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- VÃ©rifier rÃ´le admin
    SELECT role INTO v_role_admin FROM users WHERE id = p_admin_id;
    IF v_role_admin NOT IN ('SUPER_ADMIN','BOSS','GERANT') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'ERREUR KBS: Seul un admin peut confirmer une vente.';
    END IF;

    -- VÃ©rifier vente
    SELECT statut, montant_total, montant_paye
    INTO v_statut_vente, v_montant_total, v_montant_paye
    FROM ventes WHERE id = p_vente_id;

    IF v_statut_vente != 'EN_COURS' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'ERREUR KBS: Cette vente ne peut pas Ãªtre confirmÃ©e dans son Ã©tat actuel.';
    END IF;

    IF v_montant_paye < v_montant_total THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'ERREUR KBS: Le paiement total n''a pas encore Ã©tÃ© effectuÃ©.';
    END IF;

    -- Confirmer la vente
    UPDATE ventes
    SET statut     = 'COMPLETE',
        valide_par = p_admin_id,
        updated_at = NOW()
    WHERE id = p_vente_id;

    -- Les triggers gÃ¨rent le reste (parcelle â†’ VENDUE, notifications)

    COMMIT;
END$$

-- ============================================================
-- PROCÃ‰DURE : Statistiques dashboard Admin
-- ============================================================

CREATE PROCEDURE sp_dashboard_admin(IN p_tenant_id BIGINT UNSIGNED)
BEGIN
    -- MODULE PARCELLES
    SELECT
        'PARCELLES' AS module,
        COUNT(*) AS total_parcelles,
        SUM(CASE WHEN statut = 'DISPONIBLE' THEN 1 ELSE 0 END) AS disponibles,
        SUM(CASE WHEN statut = 'RESERVEE'   THEN 1 ELSE 0 END) AS reservees,
        SUM(CASE WHEN statut = 'VENDUE'     THEN 1 ELSE 0 END) AS vendues,
        SUM(CASE WHEN statut = 'MASQUEE'    THEN 1 ELSE 0 END) AS masquees,
        SUM(CASE WHEN statut = 'ARCHIVEE'   THEN 1 ELSE 0 END) AS archivees
    FROM parcelles
    WHERE tenant_id = p_tenant_id AND deleted_at IS NULL;

    -- CLIENTS et ADMINS
    SELECT
        'USERS' AS module,
        SUM(CASE WHEN role = 'CLIENT'      THEN 1 ELSE 0 END) AS total_clients,
        SUM(CASE WHEN role IN ('SUPER_ADMIN','BOSS','GERANT') THEN 1 ELSE 0 END) AS total_admins,
        SUM(CASE WHEN role = 'LOCATAIRE'   THEN 1 ELSE 0 END) AS total_locataires,
        SUM(CASE WHEN statut = 'ACTIF'     THEN 1 ELSE 0 END) AS actifs,
        SUM(CASE WHEN statut = 'BLOQUE'    THEN 1 ELSE 0 END) AS bloques
    FROM users
    WHERE tenant_id = p_tenant_id AND deleted_at IS NULL;

    -- VENTES
    SELECT
        'VENTES' AS module,
        COUNT(*) AS total_ventes,
        SUM(CASE WHEN statut = 'COMPLETE' THEN 1 ELSE 0 END)     AS ventes_completes,
        SUM(CASE WHEN statut = 'EN_COURS' THEN 1 ELSE 0 END)     AS ventes_en_cours,
        SUM(CASE WHEN statut = 'COMPLETE' THEN montant_total ELSE 0 END) AS revenu_total,
        SUM(CASE WHEN statut = 'EN_COURS' THEN montant_restant ELSE 0 END) AS encours_paiement
    FROM ventes
    WHERE tenant_id = p_tenant_id;

    -- RESERVATIONS
    SELECT
        'RESERVATIONS' AS module,
        COUNT(*) AS total_reservations,
        SUM(CASE WHEN statut = 'EN_ATTENTE'  THEN 1 ELSE 0 END) AS en_attente,
        SUM(CASE WHEN statut = 'CONFIRMEE'   THEN 1 ELSE 0 END) AS confirmees,
        SUM(CASE WHEN statut = 'EXPIREE'     THEN 1 ELSE 0 END) AS expirees,
        SUM(CASE WHEN statut = 'ANNULEE'     THEN 1 ELSE 0 END) AS annulees
    FROM reservations
    WHERE tenant_id = p_tenant_id;

    -- MODULE KBS LOYER
    SELECT
        'KBS_LOYER' AS module,
        COUNT(*) AS total_locataires,
        SUM(CASE WHEN categorie = 'SIMPLE'     THEN 1 ELSE 0 END) AS simples,
        SUM(CASE WHEN categorie = 'ENTREPRISE' THEN 1 ELSE 0 END) AS entreprises,
        SUM(CASE WHEN statut_paiement = 'A_JOUR'   THEN 1 ELSE 0 END) AS a_jour,
        SUM(CASE WHEN statut_paiement = 'EN_RETARD' THEN 1 ELSE 0 END) AS en_retard
    FROM kbs_locataires
    WHERE tenant_id = p_tenant_id AND deleted_at IS NULL;

    -- PAIEMENTS LOYER DU MOIS
    SELECT
        'PAIEMENTS_LOYER' AS module,
        COUNT(*) AS total_paiements_mois,
        SUM(CASE WHEN statut = 'VALIDE' THEN montant_paye ELSE 0 END) AS total_percu_mois
    FROM kbs_paiements_loyer
    WHERE tenant_id = p_tenant_id
      AND MONTH(created_at) = MONTH(NOW())
      AND YEAR(created_at)  = YEAR(NOW());

    -- PAIEMENTS EN ATTENTE (parcelles)
    SELECT
        'PAIEMENTS_PARCELLES' AS module,
        COUNT(*) AS paiements_en_attente,
        SUM(montant) AS montant_en_attente
    FROM paiements
    WHERE tenant_id = p_tenant_id AND statut = 'EN_ATTENTE';
END$$

-- ============================================================
-- PROCÃ‰DURE : Rapport mensuel locataires KBS
-- ============================================================

CREATE PROCEDURE sp_rapport_mensuel_kbs(
    IN p_tenant_id  BIGINT UNSIGNED,
    IN p_mois       INT,
    IN p_annee      INT
)
BEGIN
    -- Liste des locataires avec statut paiement du mois
    SELECT
        kl.code_locataire,
        kl.categorie,
        COALESCE(CONCAT(kl.nom,' ',kl.prenom), kl.nom_entreprise) AS locataire,
        COALESCE(kl.telephone_personnel, kl.telephone_entreprise) AS telephone,
        kl.date_debut_loyer,
        kl.date_fin_loyer,
        kl.montant_mensuel_loyer,
        kl.devise,
        kl.statut_paiement,
        COALESCE(SUM(kp.montant_paye), 0) AS montant_paye_mois,
        CASE
            WHEN COALESCE(SUM(kp.montant_paye),0) >= kl.montant_mensuel_loyer
            THEN 'PAYÃ‰'
            WHEN COALESCE(SUM(kp.montant_paye),0) > 0
            THEN 'PARTIEL'
            ELSE 'NON PAYÃ‰'
        END AS statut_mois
    FROM kbs_locataires kl
    LEFT JOIN kbs_paiements_loyer kp
        ON kp.locataire_id = kl.id
        AND kp.statut      = 'VALIDE'
        AND MONTH(kp.date_paiement) = p_mois
        AND YEAR(kp.date_paiement)  = p_annee
    WHERE kl.tenant_id  = p_tenant_id
      AND kl.deleted_at IS NULL
    GROUP BY
        kl.id, kl.code_locataire, kl.categorie,
        kl.nom, kl.prenom, kl.nom_entreprise,
        kl.telephone_personnel, kl.telephone_entreprise,
        kl.date_debut_loyer, kl.date_fin_loyer,
        kl.montant_mensuel_loyer, kl.devise, kl.statut_paiement
    ORDER BY kl.categorie, statut_mois;
END$$

-- ============================================================
-- PROCÃ‰DURE : Recherche avancÃ©e de parcelles
-- ============================================================

CREATE PROCEDURE sp_recherche_parcelles(
    IN p_tenant_id    BIGINT UNSIGNED,
    IN p_ville        VARCHAR(100),
    IN p_commune      VARCHAR(100),
    IN p_superficie_min DECIMAL(10,2),
    IN p_superficie_max DECIMAL(10,2),
    IN p_type         VARCHAR(50)
)
BEGIN
    SELECT
        p.id,
        p.reference,
        p.titre,
        p.localisation,
        p.ville,
        p.commune,
        p.quartier,
        p.superficie,
        p.type_parcelle,
        p.statut,
        p.nombre_vues,
        p.est_vedette,
        p.created_at,
        pi_main.url_image AS image_principale
    FROM parcelles p
    LEFT JOIN parcelle_images pi_main
        ON pi_main.parcelle_id = p.id
       AND pi_main.est_principale = 1
    WHERE p.tenant_id   = p_tenant_id
      AND p.statut      = 'DISPONIBLE'
      AND p.deleted_at  IS NULL
      AND (p_ville        IS NULL OR p.ville       LIKE CONCAT('%', p_ville, '%'))
      AND (p_commune      IS NULL OR p.commune     LIKE CONCAT('%', p_commune, '%'))
      AND (p_superficie_min IS NULL OR p.superficie >= p_superficie_min)
      AND (p_superficie_max IS NULL OR p.superficie <= p_superficie_max)
      AND (p_type         IS NULL OR p.type_parcelle = p_type)
    ORDER BY p.est_vedette DESC, p.created_at DESC;
END$$

DELIMITER ;


-- ============================================================
-- ============================================================
--                          VIEWS
-- ============================================================
-- ============================================================

-- ============================================================
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
