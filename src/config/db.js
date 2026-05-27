const { Pool } = require("pg");
require("dotenv").config();

// Required env vars when DATABASE_URL is not provided
const requiredDbEnv = ["DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASSWORD"];
const isProduction = process.env.NODE_ENV === "production";
const isRender = Boolean(process.env.RENDER);
const isHostedEnvironment = isProduction || isRender;
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

const getMissingDbEnv = () => requiredDbEnv.filter((key) => !process.env[key]);

const createPoolConfig = () => {
  if (hasDatabaseUrl) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    };
  }

  const missing = getMissingDbEnv();
  if (missing.length > 0) {
    const hostedMessage = isHostedEnvironment
      ? "In Render, add DATABASE_URL or add all DB_* environment variables."
      : "Set local DB_* values or use DATABASE_URL.";

    throw new Error(
      `Missing DB config: ${missing.join(", ")}. ` +
        hostedMessage
    );
  }

  return {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  };
};

const poolConfig = createPoolConfig();

// Connection selection
if (hasDatabaseUrl) {
  console.log("Using DATABASE_URL for connection");
} else {
  console.log(
    `Using local DB: ${poolConfig.host}:${poolConfig.port}/${poolConfig.database}`
  );
}

// Safe pool config
const pool = new Pool(poolConfig);

// Global DB error handling
pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL error:", err.message);
});

// Init DB function
const initDB = async () => {
  let client;

  try {
    client = await pool.connect();
    console.log("Connected to PostgreSQL database");
  } catch (err) {
    console.error("Could not acquire DB client:", err.message);
    throw err;
  }

  try {
    // USERS TABLE
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

    // PRODUCTS TABLE
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

    // ORDERS TABLE
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

    // ORDER ITEMS TABLE
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER,
        quantity INTEGER DEFAULT 1,
        price DECIMAL(10,2)
      );
    `);

    // Safe migrations
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'customer';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

      ALTER TABLE products ADD COLUMN IF NOT EXISTS image_key VARCHAR(255);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS features JSONB;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

      ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_info JSONB;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_person_id INTEGER REFERENCES users(id);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS current_lat DECIMAL(10,8);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS current_lng DECIMAL(11,8);
    `);

    console.log("Database initialized successfully");
  } catch (err) {
    console.error("DB Init Error:", err.message);
    throw err;
  } finally {
    if (client) client.release();
  }
};

module.exports = { pool, initDB };
