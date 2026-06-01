const router = require("express").Router();
const R = require("../../utils/response.util");
const { authenticate } = require("../../middleware/auth.middleware");
const { requireRole } = require("../../middleware/role.middleware");
const { enforceTenant } = require("../../middleware/tenant.middleware");
const { logActivity } = require("../../middleware/activityLog.middleware");
const { notificationService } = require("../../services/notification.service");
const emailService = require("../../services/email.service");
const EmailTemplates = require("../../services/email.templates");
const { query } = require("../../config/database");
const {
  createReservation,
  listReservations,
  getReservationsActives,
  getById,
  updateStatut,
  annulerParClient,
} = require("./reservations.service");

router.post(
  "/",
  authenticate,
  enforceTenant,
  logActivity("RESERVATIONS", "RESERVATION_EFFECTUEE"),
  async (req, res) => {
    try {
      const reservation = await createReservation(req.tenantId, req.user.id, req.body);
      
      // Send confirmation email
      try {
        // Get parcelle data
        const [parcelle] = await query(
          "SELECT * FROM parcelles WHERE id = ? AND tenant_id = ?",
          [reservation.parcelle_id, req.tenantId]
        );
        
        if (parcelle && req.user.email) {
          const htmlBody = EmailTemplates.reservationConfirmed(reservation, parcelle, req.user);
          await emailService.sendEmail(req.user.email, "Confirmation de votre réservation KBS", htmlBody);
        }
      } catch (emailErr) {
        console.error("Erreur envoi email confirmation réservation:", emailErr);
      }
      
      return R.created(res, reservation, "Reservation effectuee avec succes");
    } catch (err) {
      if (err.status) return R.error(res, err.message, err.status);
      throw err;
    }
  }
);

router.get(
  "/actives",
  authenticate,
  requireRole("SUPER_ADMIN", "BOSS", "GERANT"),
  enforceTenant,
  async (req, res) => {
    const data = await getReservationsActives(req.tenantId);
    return R.success(res, data);
  }
);

router.get(
  "/",
  authenticate,
  requireRole("SUPER_ADMIN", "BOSS", "GERANT"),
  enforceTenant,
  async (req, res) => {
    const { statut, user_id, parcelle_id, page = 1, limit = 20 } = req.query;
    const result = await listReservations(
      req.tenantId,
      { statut, user_id, parcelle_id },
      parseInt(page),
      parseInt(limit)
    );
    return R.paginated(res, result.reservations, result.pagination);
  }
);

router.get(
  "/mes-reservations",
  authenticate,
  requireRole("CLIENT"),
  enforceTenant,
  async (req, res) => {
    const result = await listReservations(req.tenantId, { user_id: req.user.id }, 1, 100);
    return R.success(res, result.reservations);
  }
);

router.get("/:id", authenticate, enforceTenant, async (req, res) => {
  const reservation = await getById(req.tenantId, parseInt(req.params.id));
  return R.success(res, reservation);
});

router.patch(
  "/:id/statut",
  authenticate,
  requireRole("SUPER_ADMIN", "BOSS", "GERANT"),
  enforceTenant,
  logActivity("RESERVATIONS", "RESERVATION_STATUT_MODIFIE"),
  async (req, res) => {
    const { statut, notes_admin } = req.body;
    const reservation = await updateStatut(
      req.tenantId,
      parseInt(req.params.id),
      statut,
      req.user.id,
      notes_admin || null
    );

    await notificationService.sendActionNotification(req.tenantId, reservation.user_id, {
      titre: "Reservation mise a jour",
      message: `Votre reservation est maintenant: ${statut}.`,
      module: "RESERVATIONS",
      type: `RESERVATION_${statut}`,
      emailSubject: "Mise a jour de votre reservation KBS",
      donnees_supplementaires: { reservation_id: Number(req.params.id), statut },
    });

    return R.success(res, reservation, `Reservation mise a jour : ${statut}`);
  }
);

router.patch(
  "/:id/annuler",
  authenticate,
  requireRole("CLIENT"),
  enforceTenant,
  logActivity("RESERVATIONS", "RESERVATION_ANNULEE"),
  async (req, res) => {
    const reservation = await annulerParClient(
      req.tenantId,
      parseInt(req.params.id),
      req.user.id
    );
    return R.success(res, reservation, "Reservation annulee");
  }
);

module.exports = router;
