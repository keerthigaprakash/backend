const bcrypt = require('bcryptjs');
const { pool } = require('./src/config/db');

async function update() {
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('admin12345', salt);
    await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hash, 'admin123@gmail.com']);
    console.log('Password updated successfully');
  } catch (err) {
    console.error('Error updating password:', err);
  } finally {
    process.exit(0);
  }
}

update();
