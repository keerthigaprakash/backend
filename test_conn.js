const { Pool } = require('pg');
require('dotenv').config();

console.log('Using DATABASE_URL:', process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Connection failed:', err.message);
    console.error(err);
    process.exit(1);
  }
  console.log('✅ Connection successful!');
  client.query('SELECT NOW()', (err, result) => {
    release();
    if (err) {
      console.error('❌ Query failed:', err.message);
      process.exit(1);
    }
    console.log('Query result:', result.rows[0]);
    process.exit(0);
  });
});
