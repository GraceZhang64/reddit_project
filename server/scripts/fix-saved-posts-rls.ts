import { prisma } from '../src/lib/prisma';

async function fixSavedPostsRLS() {
  try {
    console.log('Disabling RLS on saved_posts table...');
    
    // Disable RLS
    await prisma.$executeRawUnsafe(`ALTER TABLE "saved_posts" DISABLE ROW LEVEL SECURITY;`);
    console.log('✓ RLS disabled');
    
    // Drop policies
    await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "Users can view their own saved posts" ON "saved_posts";`);
    await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "Users can save posts" ON "saved_posts";`);
    await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "Users can unsave their own posts" ON "saved_posts";`);
    console.log('✓ RLS policies dropped');
    
    console.log('\n✓ Migration complete! The saved posts feature should now work correctly.');
  } catch (error) {
    console.error('Error fixing saved_posts RLS:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixSavedPostsRLS()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
