const { Pool } = require('pg');
require('dotenv').config();

// Create PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: process.env.DB_HOST === 'localhost' ? false : { rejectUnauthorized: false }
});

// Log successful connections
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

// Removed process.exit(-1) — server no longer crashes on pool errors
pool.on('error', (err) => {
  console.error('❌ Unexpected PostgreSQL error:', err);
});

// Helper function to execute queries with proper array wrapping
const query = async function(sql, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    // Return in mysql2 format: [rows, fields]
    return [result.rows, result.fields || []];
  } finally {
    client.release();
  }
};

// Attach the query function to the pool
pool.query = query;

module.exports = pool;