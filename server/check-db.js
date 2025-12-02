// Quick database check
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const count = await prisma.community.count();
    console.log(`Total communities: ${count}`);

    const communities = await prisma.community.findMany({
      select: { name: true, memberCount: true },
      orderBy: { memberCount: 'desc' },
      take: 5
    });

    console.log('Top communities by member count:');
    communities.forEach(c => console.log(`${c.name}: ${c.memberCount} members`));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

check();
