const { pool } = require('./src/config/db');
require('dotenv').config();

async function checkUsers() {
  try {
    const { rows } = await pool.query('SELECT id, name, email, role FROM users');
    console.log('Users in database:');
    rows.forEach(r => {
      console.log(`ID: ${r.id}, Role: "${r.role}", Length: ${r.role ? r.role.length : 0}`);
      if (r.role) {
        for (let i = 0; i < r.role.length; i++) {
          console.log(`  char[${i}]: ${r.role[i]} (code: ${r.role.charCodeAt(i)})`);
        }
      }
    });
    process.exit(0);
  } catch (err) {
    console.error('Error checking users:', err);
    process.exit(1);
  }
}

checkUsers();
