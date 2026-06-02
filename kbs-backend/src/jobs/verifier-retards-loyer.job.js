const cron = require("node-cron");
const { callProcedure, query } = require("../config/database");
const { logger } = require("../utils/logger.util");

const startVerifierRetardsJob = () => {
  cron.schedule("0 8 * * *", async () => {
    try {
      const tenants = await query(
        "SELECT id FROM tenants WHERE statut = 'ACTIF' AND module_kbs_actif = 1"
      );
      for (const tenant of tenants) {
        await callProcedure("CALL sp_verifier_locataires_retard(?)", [tenant.id]);
        logger.info(`✅ Retards loyer vérifiés — Tenant ${tenant.id}`);
      }
    } catch (err) {
      logger.error("❌ Job verifier_retards_loyer:", err.message);
    }
  });
  logger.info("⏰ Job [verifier_retards_loyer] démarré — 08h00 quotidien");
};

module.exports = { startVerifierRetardsJob };