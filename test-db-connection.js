import 'dotenv/config';
import { testConnection, pool } from './server/database.js';

console.log('Testing database connection...\n');

testConnection()
  .then(async (isConnected) => {
    if (isConnected) {
      console.log('\n✅ Database connection successful!');

      // Try a simple query
      try {
        const result = await pool.query('SELECT COUNT(*) FROM organizations');
        console.log(`✓ Found ${result.rows[0].count} organizations in database`);
      } catch (error) {
        console.log('⚠ Warning: Could not query organizations table:', error.message);
      }
    } else {
      console.log('\n❌ Database connection failed!');
      console.log('\nTroubleshooting steps:');
      console.log('1. Check if DATABASE_URL is set correctly in .env file');
      console.log('2. Verify Railway database service is running');
      console.log('3. Check network connectivity');
      console.log('4. Verify database credentials are valid');
    }

    process.exit(isConnected ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n❌ Connection test error:', error.message);
    process.exit(1);
  });
