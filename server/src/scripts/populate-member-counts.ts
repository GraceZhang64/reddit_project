import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function populateMemberCounts() {
  try {
    console.log('📊 Populating member counts for all communities...');
    
    // Get all communities
    const communities = await prisma.community.findMany({
      select: { id: true, name: true },
    });

    console.log(`Found ${communities.length} communities to process`);

    for (const community of communities) {
      // Count unique users who have posted or commented in this community
      const [postAuthors, commentAuthors] = await Promise.all([
        prisma.post.groupBy({
          by: ['authorId'],
          where: { communityId: community.id },
        }),
        prisma.$queryRaw<{ authorId: string }[]>`
          SELECT DISTINCT author_id as "authorId"
          FROM comments
          WHERE post_id IN (
            SELECT id FROM posts WHERE community_id = ${community.id}
          )
        `,
      ]);

      const uniqueMemberIds = new Set([
        ...postAuthors.map(p => p.authorId),
        ...commentAuthors.map(c => c.authorId),
      ]);

      const memberCount = uniqueMemberIds.size;

      // Update member count using raw SQL (works even if column doesn't exist yet)
      await prisma.$executeRaw`
        UPDATE communities 
        SET member_count = ${memberCount}
        WHERE id = ${community.id}
      `;

      console.log(`✅ ${community.name}: ${memberCount} members`);
    }

    console.log(`\n✅ Successfully populated member counts for ${communities.length} communities!`);
    
  } catch (error) {
    console.error('❌ Error populating member counts:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

populateMemberCounts()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });

