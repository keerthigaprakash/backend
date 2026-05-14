const path = require('path');
require('dotenv').config();
const { pool } = require('./src/config/db');

async function checkUsers() {
  try {
    const { rows } = await pool.query('SELECT id, name, email, role FROM users');
    console.log('Users in database:');
    console.table(rows);
    process.exit(0);
  } catch (err) {
    console.error('Error checking users:', err);
    process.exit(1);
  }
}

checkUsers();
