require('dotenv').config();
const { pool } = require('./src/config/db');

const products = [
  // Cakes
  { name: 'Chocolate Cake', price: 500, category: 'cakes', description: 'Rich and decadent chocolate cake.', image_key: 'cake1' },
  { name: 'Vanilla Cake', price: 450, category: 'cakes', description: 'Classic vanilla cake with cream.', image_key: 'cake2' },
  { name: 'Strawberry Cheesecake', price: 650, category: 'cakes', description: 'Delicious strawberry cheesecake.', image_key: 'cake3' },
  { name: 'Black Forest Cake', price: 700, category: 'cakes', description: 'Traditional German Black Forest cake.', image_key: 'cake4' },
  { name: 'Red Velvet Cake', price: 550, category: 'cakes', description: 'Elegant red velvet with cream cheese frosting.', image_key: 'cake5' },
  { name: 'Carrot Cake', price: 480, category: 'cakes', description: 'Moist carrot cake with walnuts.', image_key: 'cake6' },

  // Flowers
  { name: 'Red Roses Bouquet', price: 800, category: 'flowers', description: 'Beautiful arrangement of red roses.', image_key: 'flower1' },
  { name: 'Sunflower Bundle', price: 600, category: 'flowers', description: 'Bright and cheerful sunflowers.', image_key: 'flower2' },
  { name: 'Tulip Mix', price: 550, category: 'flowers', description: 'Colorful tulips from Netherlands.', image_key: 'flower3' },
  { name: 'Lily Bouquet', price: 750, category: 'flowers', description: 'Elegant white lilies.', image_key: 'flower4' },
  { name: 'Daisy Delight', price: 450, category: 'flowers', description: 'Fresh daisies in vibrant colors.', image_key: 'flower5' },
  { name: 'Orchid Collection', price: 900, category: 'flowers', description: 'Exotic orchid plants.', image_key: 'flower6' },

  // Gifts
  { name: 'Gift Hamper', price: 1200, category: 'gifts', description: 'Luxury gift hamper with chocolates and treats.', image_key: 'gift1' },
  { name: 'Perfume Set', price: 2000, category: 'gifts', description: 'Premium perfume gift set.', image_key: 'gift2' },
  { name: 'Spa Kit', price: 1500, category: 'gifts', description: 'Relaxing spa kit with bath bombs.', image_key: 'gift3' },
  { name: 'Jewellery Box', price: 1800, category: 'gifts', description: 'Beautiful jewellery storage box.', image_key: 'gift4' },
  { name: 'Candle Set', price: 800, category: 'gifts', description: 'Scented candles collection.', image_key: 'gift5' },
  { name: 'Wine Basket', price: 2500, category: 'gifts', description: 'Premium wine with gourmet snacks.', image_key: 'gift6' },

  // Plants
  { name: 'Snake Plant', price: 350, category: 'plants', description: 'Perfect for low light environments.', image_key: 'pl1' },
  { name: 'Peace Lily', price: 450, category: 'plants', description: 'Elegant and air-purifying.', image_key: 'pl2' },
  { name: 'Monstera Deliciosa', price: 600, category: 'plants', description: 'Tropical beauty with split leaves.', image_key: 'pl3' },
  { name: 'Fiddle Leaf Fig', price: 750, category: 'plants', description: 'Trendy statement plant for indoors.', image_key: 'pl4' },
  { name: 'Aloe Vera', price: 250, category: 'plants', description: 'Healing succulent, easy to grow.', image_key: 'pl5' },
  { name: 'Rubber Plant', price: 400, category: 'plants', description: 'Hardy plant with glossy dark leaves.', image_key: 'pl6' },
];

const seedDatabase = async () => {
  try {
    const client = await pool.connect();
    
    try {
      // Clear existing products
      await client.query('DELETE FROM products');
      console.log('🗑️ Cleared existing products');
      
      // Insert all products
      await client.query('BEGIN');
      for (const p of products) {
        await client.query(
          `INSERT INTO products (name, price, category, description, image_key)
           VALUES ($1, $2, $3, $4, $5)`,
          [p.name, p.price, p.category, p.description, p.image_key]
        );
      }
      await client.query('COMMIT');
      console.log(`✅ Seeded ${products.length} products into DB!`);
      console.log('   - 6 Cakes');
      console.log('   - 6 Flowers');
      console.log('   - 6 Gifts');
      console.log('   - 6 Plants');
    } catch(err) {
      await client.query('ROLLBACK');
      throw err;
    }
    client.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

seedDatabase();
