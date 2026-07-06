require("express-async-errors");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const { logger } = require("./utils/logger.util");
const R = require("./utils/response.util");

const path = require("path");
const app = express();

app.set("trust proxy", 1);

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ── Sécurité ──────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173,http://127.0.0.1:5173,https://exercice-expressjs.onrender.com")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Origine non autorisee par CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Tenant-Slug"],
    credentials: true,
  })
);

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: "Trop de requêtes, réessayez dans 15 minutes" },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Trop de tentatives de connexion" },
});

app.use(globalLimiter);
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(
  morgan("combined", {
    stream: { write: (msg) => logger.info(msg.trim()) },
  })
);

// ── Routes ────────────────────────────────────────────────
const API = "/api/v1";

app.use(`${API}/auth`,               authLimiter, require("./modules/auth/auth.routes"));
app.use(`${API}/tenants`,            require("./modules/tenants/tenants.routes"));
app.use(`${API}/users`,              require("./modules/users/users.routes"));
app.use(`${API}/parcelles`,          require("./modules/parcelles/parcelles.routes"));
const mount = (basePath, mod, label) => {
  const m = mod;
  const ok =
    typeof m === "function" ||
    (m && typeof m === "object" && typeof m.use === "function");

  if (!ok) {
    // Ne crash pas le serveur: on log clairement l'export incorrect
    // (ça permet de démarrer et de corriger le module fautif)
    logger.error(`Route mount invalide (${label})`, {
      basePath,
      typeof: typeof m,
      keys: m && typeof m === "object" ? Object.keys(m) : null,
    });
    return;
  }

  app.use(basePath, m);
};

// ── Routes ────────────────────────────────────────────────
app.use(`${API}/reservations`,       require("./modules/reservations/reservations.routes"));
app.use(`${API}/ventes`,             require("./modules/ventes/ventes.routes"));
app.use(`${API}/paiements`,          require("./modules/paiements/paiements.routes"));
app.use(`${API}/favoris`,            require("./modules/favoris/favoris.routes"));
app.use(`${API}/visites`,            require("./modules/visites/visites.routes"));
app.use(`${API}/kbs/locataires`,     require("./modules/kbs-locataires/locataires.routes"));
app.use(`${API}/kbs/factures`,       require("./modules/kbs-factures/factures.routes"));
app.use(`${API}/kbs/paiements-loyer`,require("./modules/kbs-paiements-loyer/paiements-loyer.routes"));
app.use(`${API}/kbs/rapports`,       require("./modules/kbs-rapports/rapports.routes"));
app.use(`${API}/notifications`,      require("./modules/notifications/notifications.routes"));
app.use(`${API}/chat`,               require("./modules/chat/chat.routes"));
app.use(`${API}/dashboard`,          require("./modules/dashboard/dashboard.routes"));
app.use(`${API}/parametres`,         require("./modules/parametres/parametres.routes"));
app.use(`${API}/activity-logs`,      require("./modules/activity-logs/activity-logs.routes"));

// ── Health Check ──────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    system: "KBS — KITUMAINI BALEZI Serge",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// ── 404 ───────────────────────────────────────────────────
app.use((req, res) => {
  R.notFound(res, `Route ${req.method} ${req.path} introuvable`);
});

// ── Erreurs globales ──────────────────────────────────────
app.use((err, req, res, next) => {
  if (err.status) {
    return R.error(res, err.message, err.status, err.errors);
  }

  if (err.code === "ER_DUP_ENTRY") {
    return R.badRequest(res, "Cette ressource existe déjà");
  }

  if (err.code === "ER_NO_REFERENCED_ROW_2") {
    return R.badRequest(res, "Référence vers une ressource inexistante");
  }

  if (err.message && err.message.includes("ERREUR KBS:")) {
    return R.badRequest(res, err.message.replace("ERREUR KBS: ", ""));
  }

  logger.error("Erreur non gérée:", {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
  });

  return R.error(res, "Erreur interne du serveur", 500);
});

module.exports = app;
