// Check member counts in database
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMemberCounts() {
  try {
    console.log('Checking member counts in database...\n');

    const communities = await prisma.community.findMany({
      select: {
        id: true,
        name: true,
        memberCount: true,
        _count: {
          select: {
            memberships: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    console.log('Communities and member counts:');
    console.log('='.repeat(50));

    communities.forEach(community => {
      console.log(`${community.name.padEnd(15)} | DB: ${community.memberCount.toString().padStart(3)} | Actual: ${community._count.memberships.toString().padStart(3)}`);
    });

    console.log('\nNote: "DB" is the stored member_count, "Actual" is the count from community_memberships table');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMemberCounts();
