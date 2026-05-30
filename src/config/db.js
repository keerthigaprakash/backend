const { Pool } = require("pg");
require("dotenv").config();

const isProduction = process.env.NODE_ENV === "production";
const hasDatabaseUrl = !!process.env.DATABASE_URL;

// Parse connection details for safe logging
let connectionDetails = "";
if (hasDatabaseUrl) {
  try {
    const parsed = new URL(process.env.DATABASE_URL);
    connectionDetails = `host: ${parsed.hostname}, database: ${parsed.pathname.substring(1)}`;
  } catch (e) {
    connectionDetails = "DATABASE_URL (invalid URL format)";
  }
} else {
  connectionDetails = `host: ${process.env.DB_HOST || "localhost"}, database: ${process.env.DB_NAME || "bloom_bliss"}`;
}

console.log(`🔌 Initializing PostgreSQL Pool...`);
console.log(`   Target : ${connectionDetails}`);
if (!hasDatabaseUrl && isProduction) {
  console.warn(`⚠️  WARNING: DATABASE_URL is not set in production! Falling back to individual credentials.`);
}

// Config setup
const poolConfig = hasDatabaseUrl
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    }
  : {
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      database: process.env.DB_NAME || "bloom_bliss",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "postgres",
    };

const pool = new Pool(poolConfig);

// Test connection properly with detailed logs
const testDB = async () => {
  try {
    await pool.query("SELECT 1");
    console.log("✅ Connected to PostgreSQL database successfully");
  } catch (err) {
    console.error("❌ Database connection failed.");
    console.error(`   Error Message : ${err.message || err}`);
    console.error(`   Error Code    : ${err.code || "N/A"}`);
    if (err.stack) {
      console.error(`   Error Stack   : ${err.stack}`);
    }
  }
};

testDB();

// Error handler
pool.on("error", (err) => {
  console.error("❌ Unexpected PostgreSQL error:", err.message || err);
  process.exit(-1);
});

/**
 * Initialise DB
 */
const initDB = async () => {
  let client;
  try {
    client = await pool.connect();
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
    console.error("❌ DB Init Error:");
    console.error(`   Error Message : ${err.message || err}`);
    console.error(`   Error Code    : ${err.code || "N/A"}`);
    if (err.stack) {
      console.error(`   Error Stack   : ${err.stack}`);
    }
    // Re-throw so server.js is notified of initialization failure
    throw err;
  } finally {
    if (client) {
      client.release();
    }
  }
};

module.exports = { pool, initDB };