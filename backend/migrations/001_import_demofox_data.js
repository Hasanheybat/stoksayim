/**
 * Migration: Import demofox.me product data into StokSay
 *
 * This script imports 2000 products from 12 businesses from demofox.me
 *
 * Usage:
 *   node migrations/001_import_demofox_data.js                    # With JSON file
 *   node migrations/001_import_demofox_data.js --inline           # With embedded data
 *
 * Prerequisites:
 *   1. MySQL database running and accessible
 *   2. StokSay schema already created (run schema_mariadb.sql first)
 *   3. Environment variables set in .env file
 *   4. Either: demofox_products_export.json in db/ folder OR use --inline flag
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

let demofoxData = [];

// Try to load from JSON file first
const dataFilePath = path.join(__dirname, '../db/demofox_products_export.json');
if (fs.existsSync(dataFilePath)) {
  console.log('Loading data from: ' + dataFilePath);
  const rawData = fs.readFileSync(dataFilePath, 'utf8');
  demofoxData = JSON.parse(rawData);
  console.log(`Loaded ${demofoxData.length} products from JSON file`);
} else if (process.argv.includes('--inline')) {
  // Inline sample data (first 10 products - extend with full dataset)
  demofoxData = [
    { restaurantName: "Maccoy JFA", productName: "MZP RM Koz badimcan ezmesi", articleName: "MZP RM Köz badımcan əzməsi", articleCode: "46464646363465146", createdDate: "11/30/2025" },
    { restaurantName: "Maccoy JFA", productName: "MZP RM MC Dana eti Bismis (Jarko)", articleName: "MZP RM MC Dana Əti Bişmiş (Jarko)", articleCode: "46464646363466591", createdDate: "11/30/2025" },
    { restaurantName: "BigChefs", productName: "7 Peppers Spicy", articleName: "7 Peppers Spicy", articleCode: "0000002979", createdDate: "8/1/2025" },
    { restaurantName: "BigChefs", productName: "7 Peppers Spicy", articleName: "7 Peppers Spicy", articleCode: "00000002979", createdDate: "8/1/2025" },
    { restaurantName: "parfum", productName: "a.testani for shoes", articleName: "a.testani for shoes", articleCode: "468", createdDate: "3/2/2026" },
    { restaurantName: "Maize Beach 2025", productName: "Aberlour 12 Lt", articleName: "Aberlour 12 Lt", articleCode: "6547897246", createdDate: "8/31/2025" },
    { restaurantName: "Maize Feseel 2025", productName: "Aberlour 12 Lt", articleName: "Aberlour 12 Lt", articleCode: "6547897246", createdDate: "11/30/2025" },
    { restaurantName: "Maize Port 2025 New", productName: "Aberlour 12 Lt", articleName: "Aberlour 12 Lt", articleCode: "6547897246", createdDate: "11/30/2025" },
    { restaurantName: "Shusha Manzara", productName: "Affilla Cress", articleName: "Affilla Cress", articleCode: "999001", createdDate: "1/15/2025" },
    { restaurantName: "BigChefs", productName: "Acai Bowl Y/F", articleName: "MZP Acai Bowl BC", articleCode: "0000003228", createdDate: "8/2/2025" },
  ];
  console.log(`Using inline sample data with ${demofoxData.length} products (limited preview)`);
  console.log('For full migration, provide demofox_products_export.json');
} else {
  console.error('ERROR: No data source found!');
  console.error('Either:');
  console.error('  1. Place demofox_products_export.json in db/ folder, OR');
  console.error('  2. Run with --inline flag for sample data');
  console.error('');
  console.error('Full export from demofox.me includes 2000 products from 12 businesses');
  process.exit(1);
}

async function migrateData() {
  let connection;
  const startTime = Date.now();

  try {
    // Validate configuration
    if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME) {
      throw new Error('Missing required environment variables: DB_HOST, DB_USER, DB_NAME');
    }

    console.log('\n=== StokSay demofox.me Data Migration ===\n');
    console.log(`Database: ${process.env.DB_NAME} @ ${process.env.DB_HOST}`);
    console.log(`Total records to import: ${demofoxData.length}`);

    // Connect to MySQL
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      charset: 'utf8mb4',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    console.log('✓ Connected to database\n');

    // Step 1: Get unique businesses from the data
    const businessMap = {};
    const businesses = [];

    demofoxData.forEach(row => {
      const restaurantName = row.restaurantName || 'Unknown';
      if (!businessMap[restaurantName]) {
        businessMap[restaurantName] = true;
        businesses.push({
          ad: restaurantName,
          kod: restaurantName.toLowerCase().replace(/\s+/g, '_').substring(0, 50),
          aktif: 1
        });
      }
    });

    console.log(`Step 1: Found ${businesses.length} unique businesses`);
    businesses.forEach(b => console.log(`  - ${b.ad}`));
    console.log();

    // Step 2: Insert businesses and get their UUIDs (or auto-increment IDs)
    const businessIds = {};
    let businessInserted = 0;
    let businessExists = 0;

    for (const business of businesses) {
      try {
        const [result] = await connection.execute(
          'INSERT INTO isletmeler (ad, kod, aktif) VALUES (?, ?, ?)',
          [business.ad, business.kod, business.aktif]
        );
        businessIds[business.ad] = result.insertId;
        businessInserted++;
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          // Business already exists, get its ID by kod (unique key)
          const [rows] = await connection.execute(
            'SELECT id FROM isletmeler WHERE kod = ?',
            [business.kod]
          );
          if (rows.length > 0) {
            businessIds[business.ad] = rows[0].id;
            businessExists++;
          } else {
            throw new Error(`Cannot find existing business: ${business.ad}`);
          }
        } else {
          throw err;
        }
      }
    }

    console.log(`Step 2: Business summary`);
    console.log(`  ✓ Inserted: ${businessInserted}`);
    console.log(`  ✓ Already existed: ${businessExists}`);
    console.log();

    // Step 3: Insert products
    let inserted = 0;
    let skipped = 0;
    let failed = 0;

    console.log('Step 3: Importing products...');
    const batchSize = 100;

    for (let i = 0; i < demofoxData.length; i++) {
      const product = demofoxData[i];
      const restaurantName = product.restaurantName || 'Unknown';
      const businessId = businessIds[restaurantName];

      if (!businessId) {
        console.error(`  ✗ No business found for: "${restaurantName}"`);
        skipped++;
        continue;
      }

      // Convert date from M/D/YYYY to YYYY-MM-DD
      let createdDate = new Date().toISOString().split('T')[0];
      if (product.createdDate) {
        const [month, day, year] = product.createdDate.split('/');
        if (month && day && year) {
          createdDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }

      try {
        await connection.execute(
          `INSERT INTO isletme_urunler
           (isletme_id, urun_kodu, urun_adi, isim_2, aktif, created_at)
           VALUES (?, ?, ?, ?, 1, ?)`,
          [
            businessId,
            (product.articleCode || '').substring(0, 100),
            (product.productName || '').substring(0, 500),
            (product.articleName || '').substring(0, 500),
            createdDate
          ]
        );
        inserted++;
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          skipped++;
          // Product code already exists for this business
        } else {
          console.error(`  ✗ Error inserting product "${product.productName}": ${err.message}`);
          failed++;
          if (failed > 10) {
            throw new Error('Too many insertion failures, aborting migration');
          }
        }
      }

      // Show progress every 100 records
      if ((i + 1) % batchSize === 0) {
        const percent = Math.round((i + 1) / demofoxData.length * 100);
        process.stdout.write(`  [${percent}%] Processed ${i + 1} products...\r`);
      }
    }

    console.log('\nStep 3: Product import summary');
    console.log(`  ✓ Inserted: ${inserted}`);
    console.log(`  ⊘ Skipped (duplicate): ${skipped}`);
    console.log(`  ✗ Failed: ${failed}`);
    console.log();

    // Final verification
    const [businesses_] = await connection.execute(
      'SELECT COUNT(*) as count FROM isletmeler'
    );
    const [products_] = await connection.execute(
      'SELECT COUNT(*) as count FROM isletme_urunler'
    );

    const totalBusiness = businesses_[0].count;
    const totalProducts = products_[0].count;

    const elapsedSecs = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('=== Migration Summary ===');
    console.log(`Total businesses in system: ${totalBusiness}`);
    console.log(`Total products in system: ${totalProducts}`);
    console.log(`Migration time: ${elapsedSecs}s`);
    console.log('\n✓ Migration completed successfully!\n');

  } catch (error) {
    console.error('\n✗ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run migration
migrateData().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
