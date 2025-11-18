import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function testConnection() {
  console.log('Testing database connection...\n');
  
  console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...');
  console.log('DIRECT_URL:', process.env.DIRECT_URL?.substring(0, 50) + '...\n');

  try {
    // Test 1: Simple query
    console.log('Test 1: Running simple query...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Query successful:', result);

    // Test 2: Check if users table exists
    console.log('\nTest 2: Checking users table...');
    const userCount = await prisma.user.count();
    console.log(`✅ Users table accessible. Found ${userCount} users.`);

    // Test 3: Check if communities table exists
    console.log('\nTest 3: Checking communities table...');
    const communityCount = await prisma.community.count();
    console.log(`✅ Communities table accessible. Found ${communityCount} communities.`);

    // Test 4: Check if community_members table exists
    console.log('\nTest 4: Checking community_members table...');
    try {
      const memberCount = await prisma.$queryRaw`SELECT COUNT(*) FROM community_members`;
      console.log('✅ community_members table exists:', memberCount);
    } catch (err: any) {
      console.log('❌ community_members table does NOT exist yet.');
      console.log('   Error:', err.message);
    }

    console.log('\n✅ Database is running and accessible!');
    console.log('\nThe issue is that Prisma migrations cannot connect to the DIRECT_URL.');
    console.log('This is likely due to:');
    console.log('  - Firewall/network restrictions on port 5432');
    console.log('  - Supabase requiring connection through pooler (port 6543)');
    console.log('\nSolution: Run the migration SQL manually in Supabase SQL Editor.');
    
  } catch (error: any) {
    console.error('❌ Database connection FAILED:', error.message);
    console.error('\nFull error:', error);
    
    console.log('\nPossible issues:');
    console.log('  1. Database is paused/stopped in Supabase dashboard');
    console.log('  2. Wrong credentials in .env file');
    console.log('  3. Network/firewall blocking connection');
    console.log('  4. Supabase project issue');
    
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
