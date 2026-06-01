const cron = require("node-cron");
const { query } = require("../config/database");
const { logger } = require("../utils/logger.util");
const { notificationService } = require("../services/notification.service");

const startVerifierRetardsJob = () => {
  cron.schedule("0 8 * * *", async () => {
    try {
      const tenants = await query(
        "SELECT id FROM tenants WHERE statut = 'ACTIF' AND module_kbs_actif = 1"
      );
      for (const tenant of tenants) {
        const retards = await query(
          `SELECT kl.*
           FROM kbs_locataires kl
           WHERE kl.tenant_id = ?
             AND kl.deleted_at IS NULL
             AND kl.date_fin_loyer < CURDATE()
             AND kl.statut_paiement = 'A_JOUR'
             AND NOT EXISTS (
               SELECT 1 FROM kbs_paiements_loyer kp
               WHERE kp.locataire_id = kl.id
                 AND kp.statut = 'VALIDE'
                 AND MONTH(kp.date_paiement) = MONTH(CURDATE())
                 AND YEAR(kp.date_paiement) = YEAR(CURDATE())
             )`,
          [tenant.id]
        );
        await query(
          `UPDATE kbs_locataires kl
           SET kl.statut_paiement = 'EN_RETARD', kl.updated_at = NOW()
           WHERE kl.tenant_id = ?
             AND kl.deleted_at IS NULL
             AND kl.date_fin_loyer < CURDATE()
             AND kl.statut_paiement = 'A_JOUR'
             AND NOT EXISTS (
               SELECT 1 FROM kbs_paiements_loyer kp
               WHERE kp.locataire_id = kl.id
                 AND kp.statut = 'VALIDE'
                 AND MONTH(kp.date_paiement) = MONTH(CURDATE())
                 AND YEAR(kp.date_paiement) = YEAR(CURDATE())
             )`,
          [tenant.id]
        );
        for (const locataire of retards) {
          await notificationService.createNotification(tenant.id, locataire.user_id, {
            titre: "Retard de paiement de loyer",
            message: "Votre loyer est en retard. Veuillez régulariser.",
            module: "KBS",
            type: "LOCATAIRE_EN_RETARD",
            canal: "APP",
            donnees_supplementaires: { locataire_id: locataire.id, montant: locataire.montant_mensuel_loyer },
          });
        }
        logger.info(`✅ Retards loyer vérifiés — Tenant ${tenant.id}`);
      }
    } catch (err) {
      logger.error("❌ Job verifier_retards_loyer:", err.message);
    }
  });
  logger.info("⏰ Job [verifier_retards_loyer] démarré — 08h00 quotidien");
};

module.exports = { startVerifierRetardsJob };
