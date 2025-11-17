import { prisma } from '../src/lib/prisma';

async function testSavedPostsInsert() {
  try {
    console.log('Testing saved_posts insert...\n');
    
    // Get a test user and post
    const testUser = await prisma.user.findFirst();
    const testPost = await prisma.post.findFirst();
    
    if (!testUser || !testPost) {
      console.log('⚠ No test data found. Creating test data would be needed.');
      return;
    }
    
    console.log(`Test User: ${testUser.username} (${testUser.id})`);
    console.log(`Test Post: ${testPost.title} (${testPost.id})\n`);
    
    // Try to insert a saved post
    const savedPost = await prisma.savedPost.create({
      data: {
        userId: testUser.id,
        postId: testPost.id,
      },
    });
    
    console.log('✓ Successfully created saved post!');
    console.log(`Saved Post ID: ${savedPost.id}`);
    
    // Clean up - delete the test saved post
    await prisma.savedPost.delete({
      where: { id: savedPost.id },
    });
    
    console.log('✓ Test saved post cleaned up');
    console.log('\n✓ TEST PASSED - The saved posts feature is working correctly!');
  } catch (error: any) {
    console.error('✗ TEST FAILED:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testSavedPostsInsert()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nFailed:', error);
    process.exit(1);
  });
