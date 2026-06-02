const mysql = require("mysql2/promise");
const fs = require("fs");
const { logger } = require("../utils/logger.util");

function getSslOptions() {
  if (process.env.DB_SSL !== "true") return undefined;

  const sslOptions = {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false",
  };

  if (process.env.DB_SSL_CA) {
    sslOptions.ca = fs.readFileSync(process.env.DB_SSL_CA, "utf8");
  }

  return sslOptions;
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || process.env.MYSQL_ADDON_HOST || "localhost",
  port: process.env.DB_PORT || process.env.MYSQL_ADDON_PORT || 3306,
  user: process.env.DB_USER || process.env.MYSQL_ADDON_USER || "root",
  password: process.env.DB_PASSWORD || process.env.MYSQL_ADDON_PASSWORD || "",
  database: process.env.DB_NAME || process.env.MYSQL_ADDON_DB || "KBSw",
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  charset: "utf8mb4_unicode_ci",
  timezone: "+00:00",
  multipleStatements: true,
  ssl: getSslOptions(),
});

async function prepareConnection(conn) {
  await conn.query("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
  await conn.query("SET collation_connection = 'utf8mb4_unicode_ci'");
}

async function testConnection() {
  try {
    const conn = await pool.getConnection();
    await prepareConnection(conn);
    await conn.query("SELECT 1");
    conn.release();
    logger.info("✅ Connexion MySQL établie — Base KBSw");
  } catch (error) {
    logger.error("❌ Erreur connexion MySQL:", error.message);
    process.exit(1);
  }
}

async function query(sql, params = []) {
  const conn = await pool.getConnection();
  try {
    await prepareConnection(conn);
    const safeParams = params.map((param) => param === undefined ? null : param);
    const [rows] = await conn.query(sql, safeParams);
    return rows;
  } finally {
    conn.release();
  }
}

async function callProcedure(sql, params = []) {
  const conn = await pool.getConnection();
  try {
    await prepareConnection(conn);
    const safeParams = params.map((param) => param === undefined ? null : param);
    const [results] = await conn.query(sql, safeParams);
    return results;
  } finally {
    conn.release();
  }
}

async function withTransaction(callback) {
  const conn = await pool.getConnection();
  await prepareConnection(conn);
  await conn.beginTransaction();
  try {
    const result = await callback(conn);
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

module.exports = { pool, query, callProcedure, withTransaction, testConnection };
