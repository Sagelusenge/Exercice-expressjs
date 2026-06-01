const cron = require("node-cron");
const { query } = require("../config/database");
const { logger } = require("../utils/logger.util");
const { notificationService } = require("../services/notification.service");

const startRappelEcheanceJob = () => {
  cron.schedule("0 9 * * *", async () => {
    try {
      const tenants = await query(
        "SELECT id FROM tenants WHERE statut = 'ACTIF' AND module_kbs_actif = 1"
      );
      for (const tenant of tenants) {
        const locataires = await query(
          `SELECT * FROM kbs_locataires
           WHERE tenant_id = ? AND deleted_at IS NULL
             AND DATEDIFF(date_fin_loyer, CURDATE()) = 7`,
          [tenant.id]
        );
        for (const locataire of locataires) {
          await notificationService.createNotification(tenant.id, locataire.user_id, {
            titre: "Rappel : échéance de loyer dans 7 jours",
            message: `Votre échéance de loyer arrive dans 7 jours. Montant: ${locataire.montant_mensuel_loyer} ${locataire.devise}.`,
            module: "KBS",
            type: "ECHEANCE_LOYER_J7",
            canal: "APP",
            donnees_supplementaires: {
              locataire_id: locataire.id,
              date_fin: locataire.date_fin_loyer,
              montant: locataire.montant_mensuel_loyer,
            },
          });
        }
        logger.info(`✅ Rappels J-7 envoyés — Tenant ${tenant.id}`);
      }
    } catch (err) {
      logger.error("❌ Job rappel_echeance_j7:", err.message);
    }
  });
  logger.info("⏰ Job [rappel_echeance_j7] démarré — 09h00 quotidien");
};

module.exports = { startRappelEcheanceJob };
