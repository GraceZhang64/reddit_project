import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create users
  const user1 = await prisma.user.create({
    data: {
      username: 'john_doe',
      email: 'john@example.com',
      passwordHash: 'hashed_password_1', // In production, use bcrypt
    },
  });

  const user2 = await prisma.user.create({
    data: {
      username: 'jane_smith',
      email: 'jane@example.com',
      passwordHash: 'hashed_password_2',
    },
  });

  const user3 = await prisma.user.create({
    data: {
      username: 'bob_wilson',
      email: 'bob@example.com',
      passwordHash: 'hashed_password_3',
    },
  });

  console.log('Created users');

  // Create communities
  const programming = await prisma.community.create({
    data: {
      name: 'programming',
      description: 'A community for discussing programming and software development',
      createdBy: user1.id,
    },
  });

  const gaming = await prisma.community.create({
    data: {
      name: 'gaming',
      description: 'Share your gaming experiences and discuss video games',
      createdBy: user2.id,
    },
  });

  const cooking = await prisma.community.create({
    data: {
      name: 'cooking',
      description: 'Share recipes, cooking tips, and culinary adventures',
      createdBy: user3.id,
    },
  });

  console.log('Created 3 communities');

  // Create community memberships
  await prisma.communityMember.createMany({
    data: [
      { userId: user1.id, communityId: programming.id },
      { userId: user2.id, communityId: programming.id },
      { userId: user2.id, communityId: gaming.id },
      { userId: user3.id, communityId: gaming.id },
      { userId: user3.id, communityId: cooking.id },
      { userId: user1.id, communityId: cooking.id },
    ],
  });

  console.log('Created community memberships');

  // Create posts
  const post1 = await prisma.post.create({
    data: {
      title: 'What is your favorite programming language?',
      body: 'I am curious to know what programming languages the community prefers and why. Share your thoughts!',
      authorId: user1.id,
      communityId: programming.id,
      voteCount: 15,
    },
  });

  const post2 = await prisma.post.create({
    data: {
      title: 'Tips for learning TypeScript',
      body: 'TypeScript has been gaining popularity. Here are some resources I found helpful for learning it...',
      authorId: user2.id,
      communityId: programming.id,
      voteCount: 23,
    },
  });

  const post3 = await prisma.post.create({
    data: {
      title: 'Just finished Elden Ring!',
      body: 'What an incredible game. The boss fights were challenging but rewarding. Anyone else played it?',
      authorId: user2.id,
      communityId: gaming.id,
      voteCount: 42,
    },
  });

  const post4 = await prisma.post.create({
    data: {
      title: 'Best indie games of 2025',
      body: 'Looking for recommendations on indie games released this year. What are your favorites?',
      authorId: user3.id,
      communityId: gaming.id,
      voteCount: 31,
    },
  });

  const post5 = await prisma.post.create({
    data: {
      title: 'My homemade sourdough bread recipe',
      body: 'After months of practice, I finally perfected my sourdough recipe. Here is what worked for me...',
      authorId: user3.id,
      communityId: cooking.id,
      voteCount: 67,
    },
  });

  console.log('Created 5 sample posts');

  // Create some comments
  await prisma.comment.create({
    data: {
      body: 'I love Python for its simplicity and readability!',
      authorId: user2.id,
      postId: post1.id,
      voteCount: 8,
    },
  });

  await prisma.comment.create({
    data: {
      body: 'TypeScript is amazing! The type safety really helps catch bugs early.',
      authorId: user1.id,
      postId: post2.id,
      voteCount: 12,
    },
  });

  const parentComment = await prisma.comment.create({
    data: {
      body: 'Elden Ring is a masterpiece! FromSoftware outdid themselves.',
      authorId: user1.id,
      postId: post3.id,
      voteCount: 5,
    },
  });

  // Create a reply to a comment
  await prisma.comment.create({
    data: {
      body: 'Agreed! The open world design was a great addition to the Souls formula.',
      authorId: user3.id,
      postId: post3.id,
      parentCommentId: parentComment.id,
      voteCount: 3,
    },
  });

  await prisma.comment.create({
    data: {
      body: 'This looks delicious! How long does the fermentation process take?',
      authorId: user1.id,
      postId: post5.id,
      voteCount: 4,
    },
  });

  console.log('Created sample comments');

  // Create some votes
  await prisma.vote.createMany({
    data: [
      { userId: user1.id, votableType: 'post', votableId: post3.id, voteValue: 1 },
      { userId: user1.id, votableType: 'post', votableId: post5.id, voteValue: 1 },
      { userId: user2.id, votableType: 'post', votableId: post1.id, voteValue: 1 },
      { userId: user2.id, votableType: 'post', votableId: post4.id, voteValue: 1 },
      { userId: user3.id, votableType: 'post', votableId: post2.id, voteValue: 1 },
      { userId: user3.id, votableType: 'post', votableId: post3.id, voteValue: 1 },
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
