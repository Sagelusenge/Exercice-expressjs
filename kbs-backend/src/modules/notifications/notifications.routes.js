const router = require("express").Router();
const { query } = require("../../config/database");
const R = require("../../utils/response.util");
const { authenticate } = require("../../middleware/auth.middleware");
const { paginate, buildPagination } = require("../../utils/pagination.util");

router.get("/", authenticate, async (req, res) => {
  const { lu, page = 1, limit = 20 } = req.query;
  const { offset, limit: l } = paginate(page, limit);

  let where = "WHERE n.user_id = ? AND n.tenant_id = ?";
  const params = [req.user.id, req.tenantId];
  if (lu === "false") where += " AND n.est_lu = 0";
  if (lu === "true")  where += " AND n.est_lu = 1";

  const [{ total }] = await query(
    `SELECT COUNT(*) AS total FROM notifications n ${where}`, params
  );
  const notifs = await query(
    `SELECT * FROM notifications n ${where} ORDER BY n.created_at DESC LIMIT ? OFFSET ?`,
    [...params, l, offset]
  );
  return R.paginated(res, notifs, buildPagination(total, page, l));
});

router.get("/non-lues", authenticate, async (req, res) => {
  const data = await query(
    `SELECT * FROM v_notifications_non_lues
     WHERE user_id = ? AND tenant_id = ? LIMIT 50`,
    [req.user.id, req.tenantId]
  );
  return R.success(res, data);
});

router.get("/count", authenticate, async (req, res) => {
  const [{ count }] = await query(
    "SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND tenant_id = ? AND est_lu = 0",
    [req.user.id, req.tenantId]
  );
  return R.success(res, { count });
});

router.patch("/:id/lue", authenticate, async (req, res) => {
  await query(
    "UPDATE notifications SET est_lu = 1, lu_at = NOW() WHERE id = ? AND user_id = ?",
    [req.params.id, req.user.id]
  );
  return R.success(res, null, "Notification marquée comme lue");
});

router.patch("/tout-lire", authenticate, async (req, res) => {
  await query(
    "UPDATE notifications SET est_lu = 1, lu_at = NOW() WHERE user_id = ? AND tenant_id = ? AND est_lu = 0",
    [req.user.id, req.tenantId]
  );
  return R.success(res, null, "Toutes les notifications marquées comme lues");
});

module.exports = router;