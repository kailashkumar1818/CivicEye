import pg from 'pg';
import net from 'net';
import env from '../config/env.js';
import logger from '../utils/logger.js';
import mockDb from './mockDb.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.DB_SSL ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 1000,
});

pool.on('error', (err) => {
  logger.debug({ err: err.message }, 'PostgreSQL connection notice');
});

let postgresOnline = false;
let lastProbe = 0;
let fallbackAnnounced = false;

function announceFallback() {
  if (!fallbackAnnounced) {
    logger.info('💡 PostgreSQL on port 5432 is offline. CivicEye activated In-Memory Demo Database (Admin, Officer & Citizen accounts ready).');
    fallbackAnnounced = true;
  }
}

/**
 * Rapid non-blocking socket probe to test if PostgreSQL port 5432 is open
 */
function probePostgresPort() {
  const now = Date.now();
  if (now - lastProbe < 10000) {
    return Promise.resolve(postgresOnline);
  }
  lastProbe = now;

  return new Promise((resolve) => {
    const socket = net.createConnection({ port: 5432, host: '127.0.0.1' });
    socket.setTimeout(400);

    socket.on('connect', () => {
      socket.destroy();
      postgresOnline = true;
      resolve(true);
    });

    socket.on('error', () => {
      socket.destroy();
      postgresOnline = false;
      announceFallback();
      resolve(false);
    });

    socket.on('timeout', () => {
      socket.destroy();
      postgresOnline = false;
      announceFallback();
      resolve(false);
    });
  });
}

// Initial probe
probePostgresPort();

// Wrap pool.query to transparently fallback to mockDb when PostgreSQL is unreachable
const originalPoolQuery = pool.query.bind(pool);
pool.query = async function (text, params) {
  if (!postgresOnline) {
    announceFallback();
    return mockDb.query(text, params);
  }

  try {
    return await originalPoolQuery(text, params);
  } catch (err) {
    if (
      err.code === 'ECONNREFUSED' ||
      err.code === 'ETIMEDOUT' ||
      err.code === 'ENOTFOUND' ||
      err.message?.includes('connect') ||
      err.message?.includes('timeout')
    ) {
      postgresOnline = false;
      announceFallback();
      return mockDb.query(text, params);
    }
    throw err;
  }
};

// Wrap pool.connect to return a compatible client when PostgreSQL is unreachable
const originalPoolConnect = pool.connect.bind(pool);
pool.connect = async function () {
  if (!postgresOnline) {
    announceFallback();
    return {
      query: (text, params) => mockDb.query(text, params),
      release: () => {},
    };
  }

  try {
    return await originalPoolConnect();
  } catch (err) {
    postgresOnline = false;
    announceFallback();
    return {
      query: (text, params) => mockDb.query(text, params),
      release: () => {},
    };
  }
};

/**
 * Execute a parameterized query
 * @param {string} text - SQL query with $1, $2 placeholders
 * @param {Array} params - Parameter array
 */
export const query = (text, params) => pool.query(text, params);

/**
 * Check if the database connection is healthy
 * @returns {Promise<boolean>}
 */
export async function checkDbHealth() {
  await probePostgresPort();
  if (postgresOnline) {
    try {
      const res = await originalPoolQuery('SELECT 1 AS healthy');
      return res.rows[0]?.healthy === 1;
    } catch {
      postgresOnline = false;
      return false;
    }
  }
  return false;
}

export default {
  pool,
  query,
  checkDbHealth,
};

