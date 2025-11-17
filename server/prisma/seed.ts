import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const prisma = new PrismaClient();

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

// Helper to get random element from array
function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helper to get random number between min and max
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper to get random date in the past
function randomDate(daysAgo: number = 30): Date {
  const now = new Date();
  const past = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  const randomTime = past.getTime() + Math.random() * (now.getTime() - past.getTime());
  return new Date(randomTime);
}

async function main() {
  console.log('🌱 Starting MASSIVE database seed...');

  // Ensure member_count column exists (in case migration hasn't been run)
  try {
    await prisma.$executeRaw`
      ALTER TABLE communities 
      ADD COLUMN IF NOT EXISTS member_count INTEGER DEFAULT 0;
    `;
    console.log('✅ Ensured member_count column exists\n');
  } catch (e) {
    // Column might already exist, that's fine
    console.log('ℹ️  member_count column check skipped\n');
  }

  // Check if data already exists
  const existingPosts = await prisma.post.count();
  if (existingPosts > 0) {
    console.log(`⚠️  Database already has ${existingPosts} posts. Clearing existing data...`);
    
    // Clear all data in correct order (respecting foreign keys)
    await prisma.vote.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.pollVote.deleteMany();
    await prisma.pollOption.deleteMany();
    await prisma.poll.deleteMany();
    await prisma.post.deleteMany();
    await prisma.userFollow.deleteMany();
    await prisma.community.deleteMany();
    await prisma.user.deleteMany();
    
    console.log('✅ Cleared existing data\n');
  }

  console.log('📝 Database is empty. Creating CRAZY amount of seed data...\n');

  // ============================================
  // CREATE 30+ USERS
  // ============================================
  console.log('👥 Creating 30 users...');
  const userBios = [
    'Software developer passionate about clean code and open source',
    'Full-stack developer and tech enthusiast',
    'Gaming and cooking enthusiast',
    'Data scientist exploring machine learning',
    'UI/UX designer focused on accessibility',
    'DevOps engineer automating everything',
    'Mobile app developer building iOS and Android apps',
    'Backend engineer specializing in microservices',
    'Frontend developer passionate about React and TypeScript',
    'Security researcher and ethical hacker',
    'Game developer working on indie projects',
    'Blockchain developer exploring DeFi',
    'Cloud architect designing scalable systems',
    'QA engineer ensuring quality software',
    'Product manager bridging tech and business',
    'Technical writer documenting complex systems',
    'AI researcher working on neural networks',
    'Cybersecurity expert protecting digital assets',
    'Database administrator optimizing queries',
    'System administrator managing infrastructure',
    'Embedded systems engineer working with IoT',
    'Computer graphics programmer creating visual effects',
    'Network engineer designing robust networks',
    'Software architect designing enterprise solutions',
    'Test automation engineer building CI/CD pipelines',
    'API developer creating RESTful services',
    'Game engine developer working on Unity',
    'Cryptocurrency trader and analyst',
    'Open source contributor to major projects',
    'Freelance developer building custom solutions',
  ];

  const users = [];
  const names = ['alice', 'bob', 'charlie', 'diana', 'eve', 'frank', 'grace', 'henry', 'ivy', 'jack', 'kate', 'liam', 'mia', 'noah', 'olivia', 'paul', 'quinn', 'ruby', 'sam', 'tina', 'uma', 'vince', 'willa', 'xander', 'yara', 'zoe', 'adam', 'bella', 'carlos', 'dana'];
  for (let i = 0; i < 30; i++) {
    const username = names[i];
    const user = await prisma.user.create({
      data: {
        username,
        email: `${username}@example.com`,
        avatar_url: null,
        bio: userBios[i],
        karma: randomInt(0, 5000),
      },
    });
    users.push(user);
  }
  console.log(`✅ Created ${users.length} users\n`);

  // ============================================
  // CREATE 20+ COMMUNITIES
  // ============================================
  console.log('🏘️  Creating 20 communities...');
  const communityData = [
    { name: 'programming', description: 'A community for discussing programming, software development, and coding best practices. Share your projects, ask questions, and learn from fellow developers.' },
    { name: 'gaming', description: 'Share your gaming experiences, discuss video games, review titles, and connect with fellow gamers. From AAA to indie, all games welcome!' },
    { name: 'cooking', description: 'Share recipes, cooking tips, culinary adventures, and food photography. Whether you\'re a beginner or a chef, everyone is welcome!' },
    { name: 'webdev', description: 'Web development discussions, tutorials, and resources. Frontend, backend, full-stack - we cover it all!' },
    { name: 'javascript', description: 'Everything about JavaScript: ES6+, frameworks, libraries, best practices, and the latest features.' },
    { name: 'python', description: 'Python programming community. Share code, ask questions, discuss libraries, and learn together.' },
    { name: 'reactjs', description: 'React.js community for sharing projects, asking questions, and discussing React ecosystem.' },
    { name: 'nodejs', description: 'Node.js server-side JavaScript. Discuss packages, best practices, and server architecture.' },
    { name: 'machinelearning', description: 'Machine learning, deep learning, AI research, and data science discussions.' },
    { name: 'cybersecurity', description: 'Cybersecurity news, discussions, and resources. Ethical hacking, security best practices, and threat analysis.' },
    { name: 'devops', description: 'DevOps practices, CI/CD, containerization, cloud infrastructure, and automation tools.' },
    { name: 'linux', description: 'Linux operating system discussions, distributions, command line tips, and system administration.' },
    { name: 'photography', description: 'Photography techniques, gear reviews, photo sharing, and artistic discussions.' },
    { name: 'fitness', description: 'Fitness routines, nutrition advice, workout tips, and motivation for your health journey.' },
    { name: 'books', description: 'Book recommendations, reviews, literary discussions, and reading challenges.' },
    { name: 'movies', description: 'Movie reviews, discussions, recommendations, and film analysis. What are you watching?' },
    { name: 'music', description: 'Music discovery, album reviews, artist discussions, and sharing your favorite tracks.' },
    { name: 'travel', description: 'Travel stories, destination guides, tips, and beautiful photos from around the world.' },
    { name: 'finance', description: 'Personal finance, investing, budgeting, and financial independence discussions.' },
    { name: 'science', description: 'Scientific discussions, research papers, discoveries, and explanations of complex topics.' },
  ];

  const communities = [];
  for (const comm of communityData) {
    const community = await prisma.community.create({
      data: {
        name: comm.name,
        slug: comm.name,
        description: comm.description,
        creator_id: randomElement(users).id,
      },
    });
    communities.push(community);
  }
  console.log(`✅ Created ${communities.length} communities\n`);

  // ============================================
  // CREATE 100+ POSTS WITH LONGER CONTENT
  // ============================================
  console.log('📝 Creating 100+ posts with detailed content...');

  const longPostTemplates = [
    {
      title: 'The Complete Guide to Modern JavaScript Development',
      body: `JavaScript has evolved tremendously over the past decade. From ES6 to the latest features, the language has become more powerful and expressive. In this comprehensive guide, I'll walk you through the most important concepts every developer should know.

**ES6+ Features:**
- Arrow functions provide a concise syntax and lexical this binding
- Destructuring allows elegant extraction of values from arrays and objects
- Template literals make string interpolation and multi-line strings a breeze
- Promises and async/await revolutionized asynchronous programming
- Modules (import/export) enable better code organization

**Best Practices:**
1. Always use const by default, only use let when reassignment is needed
2. Prefer arrow functions for callbacks to maintain context
3. Use template literals instead of string concatenation
4. Leverage destructuring for cleaner code
5. Handle errors properly with try/catch blocks

**Common Pitfalls:**
- Hoisting can lead to unexpected behavior if not understood
- This binding can be tricky, especially in callbacks
- Type coercion can cause subtle bugs
- Memory leaks from closures and event listeners

What are your favorite JavaScript features? Share your thoughts and experiences!`,
      community: 'javascript',
      type: 'text' as const,
    },
    {
      title: 'Building Scalable React Applications: Lessons Learned',
      body: `After building several large-scale React applications, I've learned valuable lessons about architecture, performance, and maintainability. Here's what I wish I knew when I started.

**State Management:**
Choosing the right state management solution is crucial. For small apps, React's built-in state is sufficient. For larger applications, consider Redux, Zustand, or Jotai. The key is to avoid prop drilling and keep state close to where it's used.

**Component Architecture:**
- Keep components small and focused on a single responsibility
- Use composition over inheritance
- Extract reusable logic into custom hooks
- Separate presentational and container components

**Performance Optimization:**
1. Use React.memo for expensive components
2. Implement code splitting with React.lazy
3. Optimize images and use lazy loading
4. Debounce/throttle expensive operations
5. Use useMemo and useCallback wisely (not everywhere!)

**Testing Strategy:**
- Write unit tests for utility functions
- Test components with React Testing Library
- Use integration tests for critical user flows
- Mock external dependencies appropriately

**Common Mistakes:**
- Over-optimizing too early
- Not handling loading and error states
- Ignoring accessibility requirements
- Creating components that are too tightly coupled

What challenges have you faced in your React projects? Let's discuss!`,
      community: 'reactjs',
      type: 'text' as const,
    },
    {
      title: 'My Journey Learning Machine Learning: From Zero to Building Models',
      body: `I started learning machine learning six months ago with zero background in data science. Here's my journey and the resources that helped me the most.

**Getting Started:**
The hardest part was knowing where to begin. There are so many resources, frameworks, and concepts. I started with Andrew Ng's Machine Learning course on Coursera, which provided an excellent foundation in the mathematics and theory.

**Key Concepts I Learned:**
- Supervised vs unsupervised learning
- Overfitting and how to prevent it
- Cross-validation techniques
- Feature engineering and selection
- Model evaluation metrics (accuracy, precision, recall, F1)

**Practical Projects:**
1. **Image Classification**: Built a CNN to classify cats vs dogs using TensorFlow
2. **Sentiment Analysis**: Created a model to analyze product reviews
3. **Price Prediction**: Predicted house prices using regression models
4. **Recommendation System**: Built a collaborative filtering system

**Challenges:**
- Understanding the math behind algorithms was initially overwhelming
- Debugging ML models is different from traditional programming
- Data preprocessing takes more time than expected
- Choosing the right algorithm for a problem

**Resources That Helped:**
- Fast.ai for practical deep learning
- Kaggle competitions for real-world practice
- scikit-learn documentation
- Papers with Code for staying current

**Next Steps:**
I'm now exploring deep learning more deeply, particularly transformers and NLP. The field moves so fast, but that's what makes it exciting!

What's your ML learning journey been like? Share your experiences!`,
      community: 'machinelearning',
      type: 'text' as const,
    },
    {
      title: 'The Ultimate Guide to RESTful API Design',
      body: `Designing a good REST API is both an art and a science. After designing dozens of APIs, I've compiled the best practices and common pitfalls.

**REST Principles:**
- Use HTTP methods correctly (GET, POST, PUT, PATCH, DELETE)
- Resources should be nouns, not verbs
- Use proper HTTP status codes
- Implement proper error handling
- Support content negotiation

**URL Design:**
Good: /api/users/123/posts
Bad: /api/getUserPosts?userId=123

**Versioning:**
Always version your API. Common approaches:
- URL versioning: /api/v1/users
- Header versioning: Accept: application/vnd.api+json;version=1

**Pagination:**
For large datasets, always implement pagination:
GET /api/posts?page=1&limit=20

**Filtering and Sorting:**
Allow clients to filter and sort:
GET /api/posts?status=published&sort=-created_at

**Error Responses:**
Always return consistent error formats with code, message, and details fields.

**Security:**
- Always use HTTPS
- Implement authentication (JWT, OAuth)
- Rate limiting is essential
- Validate and sanitize all inputs
- Use parameterized queries to prevent SQL injection

**Documentation:**
Good API documentation is crucial. Use tools like Swagger/OpenAPI to generate interactive docs.

What are your API design principles? Share your experiences!`,
      community: 'webdev',
      type: 'text' as const,
    },
    {
      title: 'Docker and Kubernetes: A Practical Guide for Developers',
      body: `Containerization has revolutionized how we deploy applications. Here's a practical guide to Docker and Kubernetes from a developer's perspective.

**Docker Basics:**
Docker allows you to package applications with all their dependencies. A Dockerfile defines how to build an image using FROM, WORKDIR, COPY, RUN, EXPOSE, and CMD instructions.

**Best Practices:**
- Use multi-stage builds to reduce image size
- Don't run as root user
- Use .dockerignore to exclude unnecessary files
- Leverage layer caching effectively
- Keep images minimal (Alpine Linux is great)

**Docker Compose:**
For local development, Docker Compose orchestrates multiple containers with services, build configs, ports, and environment variables.

**Kubernetes Basics:**
Kubernetes orchestrates containers at scale. Key concepts:
- **Pods**: Smallest deployable unit
- **Deployments**: Manage pod replicas
- **Services**: Expose pods to network
- **ConfigMaps**: Store configuration
- **Secrets**: Store sensitive data

**Common Patterns:**
- Use Deployments instead of Pods directly
- Implement health checks (liveness and readiness probes)
- Use ConfigMaps for environment-specific configs
- Implement resource limits and requests
- Use namespaces to organize resources

**Scaling:**
Kubernetes makes horizontal scaling easy with kubectl scale deployment commands.

**Monitoring:**
- Use Prometheus for metrics
- Grafana for visualization
- ELK stack for logging

What containerization challenges have you faced? Let's discuss!`,
      community: 'devops',
      type: 'text' as const,
    },
  ];

  const postTitles = [
    'Understanding Async/Await in JavaScript',
    'React Hooks: A Deep Dive',
    'Python List Comprehensions Explained',
    'CSS Grid vs Flexbox: When to Use What',
    'Database Indexing: Performance Optimization',
    'Git Workflow Best Practices',
    'TypeScript Generics: Advanced Patterns',
    'Microservices Architecture Patterns',
    'GraphQL vs REST: Choosing the Right API',
    'Clean Code Principles in Practice',
    'Testing Strategies for Modern Applications',
    'CI/CD Pipeline Setup Guide',
    'Docker Best Practices for Production',
    'Kubernetes Deployment Strategies',
    'AWS Services Every Developer Should Know',
    'MongoDB vs PostgreSQL: Database Comparison',
    'Redis Caching Strategies',
    'WebSocket vs Server-Sent Events',
    'OAuth 2.0 Implementation Guide',
    'JWT Authentication Best Practices',
    'Building RESTful APIs with Express',
    'Next.js 14 Features and Improvements',
    'Vue 3 Composition API Tutorial',
    'Angular Dependency Injection Explained',
    'Svelte: The Compiler Framework',
    'WebAssembly: Performance Optimization',
    'Progressive Web Apps: Complete Guide',
    'Service Workers: Offline-First Apps',
    'WebRTC: Real-Time Communication',
    'GraphQL Subscriptions: Real-Time Data',
    'State Management in Large Applications',
    'Code Review Best Practices',
    'Refactoring Legacy Code',
    'Design Patterns in JavaScript',
    'Functional Programming Concepts',
    'Object-Oriented Design Principles',
    'SOLID Principles Explained',
    'Domain-Driven Design Basics',
    'Event-Driven Architecture',
    'Message Queue Patterns',
    'Caching Strategies for Web Apps',
    'Database Sharding Techniques',
    'Load Balancing Strategies',
    'CDN Configuration Guide',
    'Security Headers Best Practices',
    'XSS Prevention Techniques',
    'CSRF Protection Methods',
    'SQL Injection Prevention',
    'API Rate Limiting Implementation',
    'Error Handling Patterns',
    'Logging Best Practices',
  ];

  const posts = [];
  let postCount = 0;

  // Create detailed template posts
  for (const template of longPostTemplates) {
    const community = communities.find(c => c.name === template.community);
    if (community) {
      const post = await prisma.post.create({
        data: {
          title: template.title,
          slug: slugify(template.title),
          body: template.body,
          post_type: template.type,
          authorId: randomElement(users).id,
          communityId: community.id,
          createdAt: randomDate(30),
        },
      });
      posts.push(post);
      postCount++;
    }
  }

  // Create many more posts with varied content
  for (let i = 0; i < 95; i++) {
    const title = postTitles[i % postTitles.length] + (i > postTitles.length ? ` - Part ${Math.floor(i / postTitles.length) + 1}` : '');
    const community = randomElement(communities);
    const author = randomElement(users);
    
    // Generate longer body content
    const bodyParagraphs = [
      `This is a detailed discussion about ${title.toLowerCase()}. Let me share my experiences and insights.`,
      `I've been working with this technology for several years now, and I've learned a lot along the way. Here are some key points to consider:`,
      `First, it's important to understand the fundamentals. Without a solid foundation, advanced concepts become much harder to grasp.`,
      `Second, practice is essential. Reading about something is different from actually implementing it. I recommend building small projects to reinforce your learning.`,
      `Third, don't be afraid to make mistakes. Every error is a learning opportunity. Debugging is a skill that improves with experience.`,
      `Finally, stay curious and keep learning. The tech industry moves fast, and what's cutting-edge today might be outdated tomorrow.`,
      `What are your thoughts on this topic? Have you encountered similar challenges? I'd love to hear about your experiences and any tips you might have.`,
    ];

    const body = bodyParagraphs.slice(0, randomInt(3, 7)).join('\n\n');

    // Randomly assign post types
    const postTypes: Array<'text' | 'link' | 'image' | 'video' | 'poll' | 'crosspost'> = ['text', 'text', 'text', 'text', 'link', 'link', 'image', 'video'];
    const postType = randomElement(postTypes);

    const postData: any = {
      title,
      slug: slugify(title) + `-${i}`,
      body: postType === 'text' ? body : null,
      post_type: postType,
      authorId: author.id,
      communityId: community.id,
      createdAt: randomDate(30),
    };

    if (postType === 'link') {
      postData.link_url = `https://example.com/article-${i}`;
    } else if (postType === 'image') {
      postData.image_url = `https://picsum.photos/800/600?random=${i}`;
    } else if (postType === 'video') {
      postData.video_url = `https://example.com/video-${i}`;
    }

    const post = await prisma.post.create({ data: postData });
    posts.push(post);
    postCount++;
  }

  console.log(`✅ Created ${postCount} posts\n`);

  // ============================================
  // CREATE 300+ COMMENTS WITH DEEP NESTING
  // ============================================
  console.log('💬 Creating 300+ comments with nested replies...');

  const commentTemplates = [
    'Great post! This is exactly what I needed. Thanks for sharing!',
    'I have a different perspective on this. While I agree with most points, I think...',
    'This is really helpful. I\'ve been struggling with this exact issue for weeks.',
    'Could you elaborate more on point 3? I\'m not sure I fully understand.',
    'I tried this approach and it worked perfectly! Here\'s what I did differently...',
    'Has anyone tried this with [alternative technology]? I\'m curious about the differences.',
    'This reminds me of a similar problem I faced. The solution was...',
    'Excellent write-up! I\'m bookmarking this for future reference.',
    'I disagree with this approach. Here\'s why I think [alternative] is better...',
    'Thanks for the detailed explanation. This cleared up a lot of confusion.',
    'I\'ve been using this technique for a while now. One thing to watch out for is...',
    'This is a common misconception. Actually, the real issue is...',
    'Great article! I\'d add that you should also consider...',
    'I wish I had found this earlier. Would have saved me hours of debugging.',
    'Can someone explain this in simpler terms? I\'m still learning.',
    'This is outdated information. The current best practice is...',
    'I\'m having trouble implementing this. Any suggestions?',
    'This works great! I adapted it for my use case and...',
    'I\'m skeptical about this approach. Has anyone else tried it?',
    'Perfect timing! I was just researching this topic yesterday.',
  ];

  const comments: any[] = [];
  let commentCount = 0;

  // Create top-level comments
  for (let i = 0; i < 200; i++) {
    const post = randomElement(posts);
    const author = randomElement(users);
    const template = randomElement(commentTemplates);
    
    // Make some comments longer
    const isLongComment = Math.random() < 0.3;
    let body = template;
    if (isLongComment) {
      body = `${template}\n\nI've been working with this for a while now, and I've found that there are several important considerations:\n\n1. First, you need to understand the underlying principles\n2. Second, implementation details matter more than you might think\n3. Third, testing is crucial to ensure everything works as expected\n\nWhat do you think about these points? I'd love to hear other perspectives.`;
    }

    const comment = await prisma.comment.create({
      data: {
        body,
        authorId: author.id,
        postId: post.id,
        createdAt: randomDate(25),
      },
    });
    comments.push({ ...comment, level: 0 });
    commentCount++;
  }

  // Create nested replies (level 1)
  for (let i = 0; i < 80; i++) {
    const parentComment = randomElement(comments.filter(c => c.level === 0));
    const author = randomElement(users);
    const template = randomElement(commentTemplates);
    
    const comment = await prisma.comment.create({
      data: {
        body: `@${parentComment.authorId} ${template}`,
        authorId: author.id,
        postId: parentComment.postId,
        parentCommentId: parentComment.id,
        createdAt: randomDate(20),
      },
    });
    comments.push({ ...comment, level: 1 });
    commentCount++;
  }

  // Create deeper nested replies (level 2)
  for (let i = 0; i < 30; i++) {
    const parentComment = randomElement(comments.filter(c => c.level === 1));
    const author = randomElement(users);
    const template = randomElement(commentTemplates);
    
    const comment = await prisma.comment.create({
      data: {
        body: `@${parentComment.authorId} ${template}`,
        authorId: author.id,
        postId: parentComment.postId,
        parentCommentId: parentComment.id,
        createdAt: randomDate(15),
      },
    });
    comments.push({ ...comment, level: 2 });
    commentCount++;
  }

  // Create even deeper nested replies (level 3)
  for (let i = 0; i < 15; i++) {
    const parentComment = randomElement(comments.filter(c => c.level === 2));
    const author = randomElement(users);
    const template = randomElement(commentTemplates);
    
    const comment = await prisma.comment.create({
      data: {
        body: `@${parentComment.authorId} ${template}`,
        authorId: author.id,
        postId: parentComment.postId,
        parentCommentId: parentComment.id,
        createdAt: randomDate(10),
      },
    });
    comments.push({ ...comment, level: 3 });
    commentCount++;
  }

  console.log(`✅ Created ${commentCount} comments with deep nesting\n`);

  // ============================================
  // CREATE VOTES
  // ============================================
  console.log('👍 Creating votes...');
  const votes = [];
  
  // Vote on posts
  for (let i = 0; i < 500; i++) {
    const post = randomElement(posts);
    const user = randomElement(users);
    const value = Math.random() < 0.9 ? 1 : -1; // 90% upvotes, 10% downvotes
    
    try {
      await prisma.vote.create({
        data: {
          userId: user.id,
          target_type: 'post',
          target_id: post.id,
          value,
        },
      });
      votes.push({ type: 'post', id: post.id });
    } catch (e) {
      // Ignore duplicate votes
    }
  }

  // Vote on comments
  for (let i = 0; i < 300; i++) {
    const comment = randomElement(comments);
    const user = randomElement(users);
    const value = Math.random() < 0.95 ? 1 : -1;
    
    try {
      await prisma.vote.create({
        data: {
          userId: user.id,
          target_type: 'comment',
          target_id: comment.id,
          value,
        },
      });
      votes.push({ type: 'comment', id: comment.id });
    } catch (e) {
      // Ignore duplicate votes
    }
  }

  console.log(`✅ Created ${votes.length} votes\n`);

  // ============================================
  // CREATE USER FOLLOWS
  // ============================================
  console.log('👥 Creating user follows...');
  let followCount = 0;
  
  for (let i = 0; i < 100; i++) {
    const follower = randomElement(users);
    const following = randomElement(users.filter(u => u.id !== follower.id));
    
    try {
      await prisma.userFollow.create({
        data: {
          followerId: follower.id,
          followingId: following.id,
        },
      });
      followCount++;
    } catch (e) {
      // Ignore duplicate follows
    }
  }

  console.log(`✅ Created ${followCount} user follows\n`);

  // ============================================
  // UPDATE COMMUNITY MEMBER COUNTS
  // ============================================
  console.log('📊 Updating community member counts...');
  for (const community of communities) {
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
    
    // Update using raw SQL (works regardless of Prisma schema state)
    await prisma.$executeRaw`
      UPDATE communities 
      SET member_count = ${memberCount}
      WHERE id = ${community.id}
    `;
    
    console.log(`   ${community.name}: ${memberCount} members`);
  }

  console.log('✅ Updated all community member counts\n');

  // ============================================
  // SUMMARY
  // ============================================
  console.log('🎉 Database seeding completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`   👥 Users: ${users.length}`);
  console.log(`   🏘️  Communities: ${communities.length}`);
  console.log(`   📝 Posts: ${posts.length}`);
  console.log(`   💬 Comments: ${commentCount}`);
  console.log(`   👍 Votes: ${votes.length}`);
  console.log(`   👥 Follows: ${followCount}`);
  console.log('\n✨ Your database is now loaded with CRAZY amounts of data!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
