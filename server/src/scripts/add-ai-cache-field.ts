import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addAICacheField() {
  try {
    console.log('Adding ai_summary_comment_count field to posts table...');
    
    // Execute raw SQL to add the column
    await prisma.$executeRaw`
      ALTER TABLE posts 
      ADD COLUMN IF NOT EXISTS ai_summary_comment_count INTEGER DEFAULT 0;
    `;
    
    console.log('✅ Field added successfully!');
    console.log('📝 Updating existing posts to have correct comment counts...');
    
    // Get all posts and update their comment counts
    const posts = await prisma.post.findMany({
      include: {
        _count: {
          select: {
            comments: true
          }
        }
      }
    });
    
    for (const post of posts) {
      await prisma.$executeRaw`
        UPDATE posts 
        SET ai_summary_comment_count = ${post._count.comments}
        WHERE id = ${post.id} AND ai_summary IS NOT NULL;
      `;
    }
    
    console.log(`✅ Updated ${posts.length} posts with current comment counts`);
    
  } catch (error) {
    console.error('Error adding field:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addAICacheField()
  .then(() => {
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });

