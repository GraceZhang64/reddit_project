import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteAllAISummaries() {
  try {
    console.log('🗑️  Deleting all AI summaries...');
    
    // Count posts with AI summaries before deletion
    const postsWithSummaries = await prisma.post.count({
      where: {
        ai_summary: {
          not: null,
        },
      },
    });

    console.log(`Found ${postsWithSummaries} posts with AI summaries`);

    if (postsWithSummaries === 0) {
      console.log('✅ No AI summaries to delete.');
      return;
    }

    // Delete all AI summaries by setting them to null
    const result = await prisma.post.updateMany({
      where: {
        ai_summary: {
          not: null,
        },
      },
      data: {
        ai_summary: null,
        ai_summary_generated_at: null,
        ai_summary_comment_count: null,
      },
    });

    console.log(`✅ Successfully deleted AI summaries from ${result.count} posts!`);
    
  } catch (error) {
    console.error('❌ Error deleting AI summaries:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllAISummaries()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });

