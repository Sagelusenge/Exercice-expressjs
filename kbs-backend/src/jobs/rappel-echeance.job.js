const cron = require("node-cron");
const { callProcedure, query } = require("../config/database");
const { logger } = require("../utils/logger.util");

const startRappelEcheanceJob = () => {
  cron.schedule("0 9 * * *", async () => {
    try {
      const tenants = await query(
        "SELECT id FROM tenants WHERE statut = 'ACTIF' AND module_kbs_actif = 1"
      );
      for (const tenant of tenants) {
        await callProcedure("CALL sp_rappel_echeance_j7(?)", [tenant.id]);
        logger.info(`✅ Rappels J-7 envoyés — Tenant ${tenant.id}`);
      }
    } catch (err) {
      logger.error("❌ Job rappel_echeance_j7:", err.message);
    }
  });
  logger.info("⏰ Job [rappel_echeance_j7] démarré — 09h00 quotidien");
};

module.exports = { startRappelEcheanceJob };