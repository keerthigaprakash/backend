/**
 * seed.js
 * ───────
 * Populates the database with initial product data and an admin user.
 * Run with: npm run seed
 */

require('dotenv').config();

const bcrypt = require('bcryptjs');
const { pool, initDB } = require('./config/db');

const products = [
  { name: 'Chocolate Truffle Cake', price: 45, category: 'cakes', description: 'Rich and decadent chocolate cake', image_key: 'ch1' },
  { name: 'Vanilla Cake', price: 40, category: 'cakes', description: 'Classic vanilla cake with cream', image_key: 'ch2' },
  { name: 'Strawberry Shortcake', price: 50, category: 'cakes', description: 'Fresh strawberries with fluffy cake', image_key: 'img' },
  { name: 'Red Velvet Cake', price: 48, category: 'cakes', description: 'Elegant red velvet with cream cheese frosting', image_key: 'cake1' },
  { name: 'Carrot Cake', price: 42, category: 'cakes', description: 'Moist carrot cake with nuts and spices', image_key: 'cake2' },
  { name: 'Cheesecake', price: 55, category: 'cakes', description: 'Creamy New York style cheesecake', image_key: 'cakeHome' },
  { name: 'Black Forest Cake', price: 52, category: 'cakes', description: 'Chocolate cake with cherries and cream', image_key: 'c1' },
  { name: 'Lemon Drizzle Cake', price: 38, category: 'cakes', description: 'Fresh lemon cake with zesty glaze', image_key: 'cake1' },
  { name: 'Tiramisu Cake', price: 50, category: 'cakes', description: 'Italian inspired layered tiramisu cake', image_key: 'cake2' },
  { name: 'Chocolate Mousse Cake', price: 46, category: 'cakes', description: 'Light and fluffy chocolate mousse', image_key: 'cakeHome' },
  { name: 'Coconut Cake', price: 43, category: 'cakes', description: 'Tropical coconut cake with white frosting', image_key: 'ch1' },
  { name: 'Pistachio Cake', price: 49, category: 'cakes', description: 'Nutty pistachio cake with truffle filling', image_key: 'c1' },
  { name: 'Matcha Green Tea Cake', price: 47, category: 'cakes', description: 'Delicate matcha green tea cake', image_key: 'ch2' },
  { name: 'Blueberry Cheesecake', price: 54, category: 'cakes', description: 'Creamy cheesecake with fresh blueberries', image_key: 'cake1' },
  { name: 'Marble Cake', price: 41, category: 'cakes', description: 'Swirled vanilla and chocolate marble cake', image_key: 'cake2' },
  { name: 'Strawberry Cake', price: 51, category: 'cakes', description: 'Fresh strawberry cake with buttercream frosting', image_key: 'ch1' },
  { name: 'Mango Cake', price: 44, category: 'cakes', description: 'Tropical mango cake with light sponge', image_key: 'ch2' },
  { name: 'Butterscotch Cake', price: 48, category: 'cakes', description: 'Delicious butterscotch cake with toffee bits', image_key: 't2' },
  { name: 'Raspberry Truffle Cake', price: 56, category: 'cakes', description: 'Elegant raspberry and dark chocolate combination', image_key: 'cakeHome' },
  { name: 'Pineapple Upsidedown Cake', price: 39, category: 'cakes', description: 'Classic pineapple upsidedown cake', image_key: 'cake1' },
  { name: 'Walnut Spice Cake', price: 45, category: 'cakes', description: 'Aromatic walnut spice cake with cream', image_key: 'cake2' },

  // Flowers
  { name: 'Red Rose Bouquet', price: 60, category: 'flowers', description: 'Beautiful red roses arrangement', image_key: 'f2' },
  { name: 'Sunflower Bundle', price: 55, category: 'flowers', description: 'Bright sunflowers for joy', image_key: 'f3' },
  { name: 'Tulip Mix', price: 50, category: 'flowers', description: 'Colorful tulips arrangement', image_key: 'f4' },
  { name: 'White Lily Arrangement', price: 65, category: 'flowers', description: 'Elegant white lilies with greenery', image_key: 'f5' },
  { name: 'Pink Rose Garden', price: 58, category: 'flowers', description: 'Beautiful pink roses in a garden style', image_key: 'f2' },
  { name: 'Lavender Dreams', price: 52, category: 'flowers', description: 'Soothing lavender flower arrangement', image_key: 'f3' },
  { name: 'Cherry Blossom Mix', price: 54, category: 'flowers', description: 'Delicate cherry blossoms with branches', image_key: 'f4' },
  { name: 'Peony Romance', price: 70, category: 'flowers', description: 'Gorgeous peonies in romantic arrangement', image_key: 'f5' },
  { name: 'Orchid Paradise', price: 65, category: 'flowers', description: 'Exotic orchids in beautiful display', image_key: 'f2' },
  { name: 'Daisy Delight', price: 48, category: 'flowers', description: 'Cheerful daisies for any occasion', image_key: 'f3' },
  { name: 'Hydrangea Heaven', price: 62, category: 'flowers', description: 'Full hydrangea blooms in vibrant colors', image_key: 'f4' },
  { name: 'Carnation Celebration', price: 50, category: 'flowers', description: 'Festive carnation mix with ribbons', image_key: 'f5' },
  { name: 'Iris Elegance', price: 60, category: 'flowers', description: 'Stunning iris flowers in purple and blue', image_key: 'f2' },
  { name: 'Sunburst Bouquet', price: 56, category: 'flowers', description: 'Bright and vibrant mixed flower bouquet', image_key: 'f3' },
  { name: 'Romantic Heartbeat', price: 68, category: 'flowers', description: 'Heart-shaped arrangement with red flowers', image_key: 'f4' },
  { name: 'Magnolia Bliss', price: 63, category: 'flowers', description: 'Stunning magnolia flowers with elegant stems', image_key: 'f5' },
  { name: 'Wildflower Meadow', price: 51, category: 'flowers', description: 'Natural wildflower mix for a rustic look', image_key: 'f2' },
  { name: 'Coral Beauty', price: 59, category: 'flowers', description: 'Warm coral toned flower arrangement', image_key: 'f3' },
  { name: 'Golden Sunset', price: 64, category: 'flowers', description: 'Golden and orange blooms for warm vibes', image_key: 'f4' },
  { name: 'Forget Me Not Bundle', price: 47, category: 'flowers', description: 'Delicate blue forget-me-not flowers', image_key: 'f5' },
  { name: 'Tropical Paradise', price: 72, category: 'flowers', description: 'Exotic tropical flowers and birds of paradise', image_key: 'f2' },

  // Gifts
  { name: 'Teddy Bear Gift', price: 35, category: 'gifts', description: 'Cute teddy bear for special ones', image_key: 't2' },
  { name: 'Chocolate Box', price: 30, category: 'gifts', description: 'Premium chocolates collection', image_key: 'ch2' },
  { name: 'Luxury Gift Set', price: 75, category: 'gifts', description: 'Premium gift set with curated items', image_key: 'sc3' },
  { name: 'Perfume Gift Set', price: 55, category: 'gifts', description: 'Luxurious perfume collection for special occasions', image_key: 'gift1' },
  { name: 'Scented Candle Set', price: 40, category: 'gifts', description: 'Aromatic candles for a cozy atmosphere', image_key: 'sc1' },
  { name: 'Photo Frame Gift', price: 25, category: 'gifts', description: 'Elegant photo frame for precious memories', image_key: 'sc2' },
  { name: 'Spa Gift Basket', price: 65, category: 'gifts', description: 'Relaxing spa essentials gift basket', image_key: 'sc3' },
  { name: 'Gourmet Hamper', price: 85, category: 'gifts', description: 'Curated gourmet food and wine hamper', image_key: 'gift1' },
];

const seedDatabase = async () => {
  try {
    // Initialise tables
    await initDB();

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // ── Seed admin user ───────────────────────────────────────
      const existingAdmin = await client.query(
        "SELECT id FROM users WHERE email = 'admin123@gmail.com'"
      );

      if (existingAdmin.rows.length === 0) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin12345', salt);

        await client.query(
          `INSERT INTO users (name, email, password, role)
           VALUES ($1, $2, $3, $4)`,
          ['Admin', 'admin123@gmail.com', hashedPassword, 'admin']
        );
        console.log('✅ Admin user created (admin123@gmail.com / admin12345)');
      } else {
        console.log('ℹ️  Admin user already exists — skipped.');
      }

      // ── Seed products ─────────────────────────────────────────
      const existingProducts = await client.query('SELECT COUNT(*)::int AS count FROM products');

      if (existingProducts.rows[0].count === 0) {
        for (const p of products) {
          await client.query(
            `INSERT INTO products (name, price, category, description, image_key)
             VALUES ($1, $2, $3, $4, $5)`,
            [p.name, p.price, p.category, p.description, p.image_key]
          );
        }
        console.log(`✅ Seeded ${products.length} products`);
      } else {
        console.log(`ℹ️  Products table already has ${existingProducts.rows[0].count} rows — skipped.`);
      }

      await client.query('COMMIT');
      console.log('\n🌸 Database seeding complete!\n');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

seedDatabase();
