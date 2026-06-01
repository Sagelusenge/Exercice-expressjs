const cron = require("node-cron");
const { query } = require("../config/database");
const { logger } = require("../utils/logger.util");

const startExpirerReservationsJob = () => {
  cron.schedule("0 * * * *", async () => {
    try {
      const expired = await query(
        `SELECT id, parcelle_id, tenant_id
         FROM reservations
         WHERE statut IN ('EN_ATTENTE','CONFIRMEE') AND date_expiration < NOW()`
      );
      await query(
        `UPDATE reservations SET statut = 'EXPIREE', updated_at = NOW()
         WHERE statut IN ('EN_ATTENTE','CONFIRMEE') AND date_expiration < NOW()`
      );
      for (const reservation of expired) {
        await query(
          "UPDATE parcelles SET statut = 'DISPONIBLE', updated_at = NOW() WHERE id = ? AND tenant_id = ?",
          [reservation.parcelle_id, reservation.tenant_id]
        );
      }
      logger.info("✅ Job: Réservations expirées traitées");
    } catch (err) {
      logger.error("❌ Job expirer_reservations:", err.message);
    }
  });
  logger.info("⏰ Job [expirer_reservations] démarré — toutes les heures");
};

module.exports = { startExpirerReservationsJob };
