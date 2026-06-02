-- Ajoute un prix admin confidentiel aux parcelles.
-- A executer une seule fois sur la base kbsw si la colonne n existe pas encore.

ALTER TABLE parcelles
  ADD COLUMN IF NOT EXISTS prix_vente_confidentiel DECIMAL(15,2) NULL
  COMMENT 'Prix renseigne par l admin pour les reponses internes/chat';
