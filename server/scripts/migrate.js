import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import env from '../src/config/env.js';
import logger from '../src/utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.resolve(__dirname, '../migrations');

async function runMigrations() {
  const client = new pg.Client({
    connectionString: env.DATABASE_URL,
    ssl: env.DB_SSL ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    logger.info('Connected to PostgreSQL for database migration');

    // Create migrations tracker table if it does not exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // Get applied migrations
    const { rows: appliedRows } = await client.query('SELECT name FROM schema_migrations');
    const appliedNames = new Set(appliedRows.map((r) => r.name));

    // Read migration files in order
    const files = await fs.readdir(migrationsDir);
    const sqlFiles = files
      .filter((file) => file.endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    if (sqlFiles.length === 0) {
      logger.info('No migration files found.');
      return;
    }

    for (const file of sqlFiles) {
      if (appliedNames.has(file)) {
        logger.info({ migration: file }, 'Migration already applied, skipping');
        continue;
      }

      logger.info({ migration: file }, 'Applying migration...');
      const filePath = path.join(migrationsDir, file);
      const sql = await fs.readFile(filePath, 'utf-8');

      // Execute migration
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        logger.info({ migration: file }, 'Successfully applied migration');
      } catch (err) {
        await client.query('ROLLBACK');
        logger.error({ migration: file, err: err.message }, 'Migration failed and was rolled back');
        throw err;
      }
    }

    logger.info('All migrations are up to date!');
  } catch (err) {
    logger.error({ err: err.message }, 'Migration process failed');
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();

