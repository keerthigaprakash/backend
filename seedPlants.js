require('dotenv').config();
const { pool } = require('./src/config/db');

const plants = [
  { name: 'Snake Plant', price: 350, category: 'plants', description: 'Perfect for low light environments.', image_key: 'pl1' },
  { name: 'Peace Lily', price: 450, category: 'plants', description: 'Elegant and air-purifying.', image_key: 'pl2' },
  { name: 'Monstera Deliciosa', price: 600, category: 'plants', description: 'Tropical beauty with split leaves.', image_key: 'pl3' },
  { name: 'Fiddle Leaf Fig', price: 750, category: 'plants', description: 'Trendy statement plant for indoors.', image_key: 'pl4' },
  { name: 'Aloe Vera', price: 250, category: 'plants', description: 'Healing succulent, easy to grow.', image_key: 'pl5' },
  { name: 'Rubber Plant', price: 400, category: 'plants', description: 'Hardy plant with glossy dark leaves.', image_key: 'pl6' },
  { name: 'ZZ Plant', price: 500, category: 'plants', description: 'Almost impossible to kill.', image_key: 'pl7' },
  { name: 'Pothos', price: 300, category: 'plants', description: 'Cascading beauty for any shelf.', image_key: 'pl8' },
  { name: 'Spider Plant', price: 280, category: 'plants', description: 'Fast-growing plant with ribbon-like leaves.', image_key: 'pl9' },
  { name: 'Fern', price: 320, category: 'plants', description: 'Lush green fern for high humidity spots.', image_key: 'pl10' },
  { name: 'Succulent Mix', price: 420, category: 'plants', description: 'A cute mix of mini succulents.', image_key: 'pl11' }
];

const seedPlants = async () => {
  try {
    const client = await pool.connect();
    
    // check if we already have plants
    const existingPlants = await client.query("SELECT COUNT(*) FROM products WHERE category = 'plants'");
    
    if (existingPlants.rows[0].count === '0') {
      try {
        await client.query('BEGIN');
        for (const p of plants) {
          await client.query(
            `INSERT INTO products (name, price, category, description, image_key)
             VALUES ($1, $2, $3, $4, $5)`,
            [p.name, p.price, p.category, p.description, p.image_key]
          );
        }
        await client.query('COMMIT');
        console.log(`✅ Seeded ${plants.length} plant products into DB!`);
      } catch(err) {
        await client.query('ROLLBACK');
        throw err;
      }
    } else {
      console.log('ℹ️ Plants already exist in DB!');
    }
    client.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding plants failed:', error.message);
    process.exit(1);
  }
};

seedPlants();
