const { Pool } = require("pg");
require("dotenv").config();

const requiredLocalEnv = ["DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASSWORD"];

const getMissingLocalEnv = () => requiredLocalEnv.filter((key) => !process.env[key]);

// Support DATABASE_URL (Render, Supabase, Neon, etc.) or individual env vars (local dev)
if (process.env.DATABASE_URL) {
  console.log('🔗 Using DATABASE_URL for connection');
} else {
  const missing = getMissingLocalEnv();
  if (missing.length > 0) {
    console.warn(`⚠️ Missing database env vars: ${missing.join(", ")}`);
    console.warn("   Set DATABASE_URL in production, or set all DB_* variables for local development.");
  } else {
    console.log(`🔗 Using local DB: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
  }
}

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // Required by most cloud Postgres providers
    }
  : {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    };

const pool = new Pool(poolConfig);

// Error handler
pool.on("error", (err) => {
  console.error("❌ Unexpected PostgreSQL error:", err.message);
  process.exit(-1);
});

/**
 * Initialise DB
 */
const initDB = async () => {
  const missing = process.env.DATABASE_URL ? [] : getMissingLocalEnv();
  if (missing.length > 0) {
    throw new Error(
      `Missing database configuration: ${missing.join(", ")}. ` +
        "On Render, create/connect a PostgreSQL database and set DATABASE_URL in Environment."
    );
  }

  let client;
  try {
    client = await pool.connect();
    console.log("✅ Connected to PostgreSQL database");
  } catch (err) {
    console.error("❌ Could not acquire DB client:", err.message || JSON.stringify(err));
    throw err;
  }
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'customer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        category VARCHAR(100),
        description TEXT,
        image_key VARCHAR(255),
        in_stock BOOLEAN DEFAULT true
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        total DECIMAL(10,2),
        shipping_info JSONB,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER, -- Optional: removed strict reference to allow static frontend IDs
        quantity INTEGER DEFAULT 1,
        price DECIMAL(10,2)
      );
    `);

    // Migration: ensure columns exist in case tables were created in a previous version
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'customer';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      
      ALTER TABLE products ADD COLUMN IF NOT EXISTS image_key VARCHAR(255);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS features JSONB;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_info JSONB;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_person_id INTEGER REFERENCES users(id);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS current_lat DECIMAL(10, 8);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS current_lng DECIMAL(11, 8);
    `);

    console.log("✅ Tables checked and updated successfully");
  } catch (err) {
    console.error("❌ DB Init Error:", err.message || JSON.stringify(err));
    throw err; // Propagate so server.js can exit with context
  } finally {
    if (client) client.release();
  }
};

module.exports = { pool, initDB };
