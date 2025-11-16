import { PrismaClient } from '@prisma/client';
import { generateUniqueSlug } from '../utils/slugify';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function updatePostSlugs() {
  console.log('Updating post slugs...');

  const posts = await prisma.post.findMany({
    where: {
      slug: null
    },
    select: {
      id: true,
      title: true
    }
  });

  console.log(`Found ${posts.length} posts without slugs`);

  for (const post of posts) {
    const slug = generateUniqueSlug(post.title);
    await prisma.post.update({
      where: { id: post.id },
      data: { slug }
    });
    console.log(`Updated post ${post.id}: ${slug}`);
  }

  console.log('✅ All post slugs updated!');
}

updatePostSlugs()
  .catch((e) => {
    console.error('Error updating post slugs:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

