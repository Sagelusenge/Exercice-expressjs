const router = require("express").Router();
const { query } = require("../../config/database");
const R = require("../../utils/response.util");
const { authenticate } = require("../../middleware/auth.middleware");
const { requireRole } = require("../../middleware/role.middleware");
const { paginate, buildPagination } = require("../../utils/pagination.util");

router.get(
  "/",
  authenticate,
  requireRole("SUPER_ADMIN", "BOSS", "GERANT"),
  async (req, res) => {
    const { module, action, user_id, page = 1, limit = 20 } = req.query;
    const { offset, limit: l } = paginate(page, limit);

    let where = "WHERE al.tenant_id = ?";
    const params = [req.tenantId];
    if (module)  { where += " AND al.module = ?";           params.push(module); }
    if (action)  { where += " AND al.action LIKE ?";        params.push(`%${action}%`); }
    if (user_id) { where += " AND al.user_id = ?";          params.push(user_id); }

    const [{ total }] = await query(
      `SELECT COUNT(*) AS total FROM activity_logs al ${where}`, params
    );
    const logs = await query(
      `SELECT al.*, CONCAT(u.nom,' ',u.prenom) AS acteur, u.role AS role_acteur
       FROM activity_logs al
       LEFT JOIN users u ON u.id = al.user_id
       ${where} ORDER BY al.created_at DESC LIMIT ? OFFSET ?`,
      [...params, l, offset]
    );
    return R.paginated(res, logs, buildPagination(total, page, l));
  }
);

module.exports = router;