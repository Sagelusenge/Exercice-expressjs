require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

function parseSqlStatements(sql) {
  const statements = [];
  let delimiter = ";";
  let buffer = "";

  for (const rawLine of sql.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const line = rawLine.trim();

    if (/^DELIMITER\s+/i.test(line)) {
      const nextDelimiter = line.replace(/^DELIMITER\s+/i, "").trim();
      if (buffer.trim()) {
        statements.push(buffer.trim());
        buffer = "";
      }
      delimiter = nextDelimiter;
      continue;
    }

    buffer += `${rawLine}\n`;

    if (buffer.trimEnd().endsWith(delimiter)) {
      const statement = buffer.trimEnd().slice(0, -delimiter.length).trim();
      if (statement) statements.push(statement);
      buffer = "";
    }
  }

  if (buffer.trim()) statements.push(buffer.trim());
  return statements;
}

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

function collectExistingObjectDrops(statements) {
  const drops = [];
  const patterns = [
    { type: "FUNCTION", regex: /CREATE\s+FUNCTION\s+`?([a-zA-Z0-9_]+)`?/i },
    { type: "PROCEDURE", regex: /CREATE\s+PROCEDURE\s+`?([a-zA-Z0-9_]+)`?/i },
    { type: "EVENT", regex: /CREATE\s+EVENT\s+`?([a-zA-Z0-9_]+)`?/i },
    { type: "TRIGGER", regex: /CREATE\s+TRIGGER\s+`?([a-zA-Z0-9_]+)`?/i },
  ];

  for (const statement of statements) {
    for (const pattern of patterns) {
      const match = statement.match(pattern.regex);
      if (match) drops.push(`DROP ${pattern.type} IF EXISTS \`${match[1]}\``);
    }
  }

  return drops;
}

async function main() {
  const inputPath = process.argv[2] || path.join(__dirname, "..", "..", "Kbsbd-aiven-full.sql");
  const sqlPath = path.resolve(inputPath);

  if (!fs.existsSync(sqlPath)) {
    throw new Error(`Fichier SQL introuvable: ${sqlPath}`);
  }

  const sql = fs.readFileSync(sqlPath, "utf8");
  const statements = parseSqlStatements(sql);

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: getSslOptions(),
  });

  try {
    for (const dropStatement of collectExistingObjectDrops(statements)) {
      try {
        await conn.query(dropStatement);
      } catch (error) {
        if (!["ER_SP_DOES_NOT_EXIST", "ER_TRG_DOES_NOT_EXIST", "ER_EVENT_DOES_NOT_EXIST"].includes(error.code)) {
          throw error;
        }
      }
    }

    let skipped = 0;
    for (let index = 0; index < statements.length; index += 1) {
      let statement = statements[index];
      const preview = statement.split(/\s+/).slice(0, 8).join(" ");

      if (/SET\s+GLOBAL\s+event_scheduler/i.test(statement) || /CREATE\s+EVENT/i.test(statement)) {
        skipped += 1;
        continue;
      }

      statement = statement.replace(/INSERT\s+INTO\s+sequences_references/i, "INSERT IGNORE INTO sequences_references");

      try {
        await conn.query(statement);
      } catch (error) {
        error.message = `Erreur SQL statement ${index + 1}/${statements.length} (${preview}): ${error.message}`;
        throw error;
      }
    }

    const [tables] = await conn.query("SHOW TABLES");
    const [tenants] = await conn.query("SELECT id, slug FROM tenants LIMIT 5");
    console.log(JSON.stringify({ imported: true, tables: tables.length, tenants, skipped }, null, 2));
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
