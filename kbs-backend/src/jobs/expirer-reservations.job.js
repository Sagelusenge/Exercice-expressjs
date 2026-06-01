const cron = require("node-cron");
const { callProcedure } = require("../config/database");
const { logger } = require("../utils/logger.util");

const startExpirerReservationsJob = () => {
  cron.schedule("0 * * * *", async () => {
    try {
      await callProcedure("CALL sp_expirer_reservations()");
      logger.info("✅ Job: Réservations expirées traitées");
    } catch (err) {
      logger.error("❌ Job expirer_reservations:", err.message);
    }
  });
  logger.info("⏰ Job [expirer_reservations] démarré — toutes les heures");
};

module.exports = { startExpirerReservationsJob };