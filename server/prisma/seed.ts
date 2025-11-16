import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Check if data already exists
  const existingPosts = await prisma.post.count();
  if (existingPosts > 0) {
    console.log(`Database already has ${existingPosts} posts. Skipping seed to preserve data.`);
    console.log('To force re-seed, manually clear the database first.');
    return;
  }

  console.log('Database is empty. Creating seed data...');

  // Create users
  // Note: Password hashing should be handled by auth service, not stored directly
  const user1 = await prisma.user.create({
    data: {
      username: 'john_doe',
      email: 'john@example.com',
      avatar_url: null,
      bio: 'Software developer passionate about clean code',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      username: 'jane_smith',
      email: 'jane@example.com',
      avatar_url: null,
      bio: 'Full-stack developer and tech enthusiast',
    },
  });

  const user3 = await prisma.user.create({
    data: {
      username: 'bob_wilson',
      email: 'bob@example.com',
      avatar_url: null,
      bio: 'Gaming and cooking enthusiast',
    },
  });

  console.log('Created users');

  // Create communities
  const programming = await prisma.community.create({
    data: {
      name: 'programming',
      slug: 'programming',
      description: 'A community for discussing programming and software development',
      creator_id: user1.id,
    },
  });

  const gaming = await prisma.community.create({
    data: {
      name: 'gaming',
      slug: 'gaming',
      description: 'Share your gaming experiences and discuss video games',
      creator_id: user2.id,
    },
  });

  const cooking = await prisma.community.create({
    data: {
      name: 'cooking',
      slug: 'cooking',
      description: 'Share recipes, cooking tips, and culinary adventures',
      creator_id: user3.id,
    },
  });

  console.log('Created 3 communities');

  // Note: Community memberships would be handled by a separate model if needed
  // For now, users can interact with communities without explicit membership

  // Helper function to create slug
  function slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '')
      .substring(0, 100);
  }

  // Create posts
  const post1 = await prisma.post.create({
    data: {
      title: 'What is your favorite programming language?',
      slug: slugify('What is your favorite programming language?'),
      body: 'I am curious to know what programming languages the community prefers and why. Share your thoughts!',
      authorId: user1.id,
      communityId: programming.id,
    },
  });

  const post2 = await prisma.post.create({
    data: {
      title: 'Tips for learning TypeScript',
      slug: slugify('Tips for learning TypeScript'),
      body: 'TypeScript has been gaining popularity. Here are some resources I found helpful for learning it...',
      authorId: user2.id,
      communityId: programming.id,
    },
  });

  const post3 = await prisma.post.create({
    data: {
      title: 'Just finished Elden Ring!',
      slug: slugify('Just finished Elden Ring!'),
      body: 'What an incredible game. The boss fights were challenging but rewarding. Anyone else played it?',
      authorId: user2.id,
      communityId: gaming.id,
    },
  });

  const post4 = await prisma.post.create({
    data: {
      title: 'Best indie games of 2025',
      slug: slugify('Best indie games of 2025'),
      body: 'Looking for recommendations on indie games released this year. What are your favorites?',
      authorId: user3.id,
      communityId: gaming.id,
    },
  });

  const post5 = await prisma.post.create({
    data: {
      title: 'My homemade sourdough bread recipe',
      slug: slugify('My homemade sourdough bread recipe'),
      body: 'After months of practice, I finally perfected my sourdough recipe. Here is what worked for me...',
      authorId: user3.id,
      communityId: cooking.id,
    },
  });

  console.log('Created 5 sample posts');

  // Create some comments
  await prisma.comment.create({
    data: {
      body: 'I love Python for its simplicity and readability!',
      authorId: user2.id,
      postId: post1.id,
    },
  });

  await prisma.comment.create({
    data: {
      body: 'TypeScript is amazing! The type safety really helps catch bugs early.',
      authorId: user1.id,
      postId: post2.id,
    },
  });

  const parentComment = await prisma.comment.create({
    data: {
      body: 'Elden Ring is a masterpiece! FromSoftware outdid themselves.',
      authorId: user1.id,
      postId: post3.id,
    },
  });

  // Create a reply to a comment
  await prisma.comment.create({
    data: {
      body: 'Agreed! The open world design was a great addition to the Souls formula.',
      authorId: user3.id,
      postId: post3.id,
      parentCommentId: parentComment.id,
    },
  });

  await prisma.comment.create({
    data: {
      body: 'This looks delicious! How long does the fermentation process take?',
      authorId: user1.id,
      postId: post5.id,
    },
  });

  console.log('Created sample comments');

  // Create some votes
  await prisma.vote.createMany({
    data: [
      { userId: user1.id, target_type: 'post', target_id: post3.id, value: 1 },
      { userId: user1.id, target_type: 'post', target_id: post5.id, value: 1 },
      { userId: user2.id, target_type: 'post', target_id: post1.id, value: 1 },
      { userId: user2.id, target_type: 'post', target_id: post4.id, value: 1 },
      { userId: user3.id, target_type: 'post', target_id: post2.id, value: 1 },
      { userId: user3.id, target_type: 'post', target_id: post3.id, value: 1 },
    ],
  });

  console.log('Created sample votes');

  console.log('Database seeding completed successfully! 🎉');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
