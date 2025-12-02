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
  // CREATE 50+ USERS WITH DIVERSE BACKGROUNDS
  // ============================================
  console.log('👥 Creating 50+ users with diverse backgrounds...');
  const userProfiles = [
    { name: 'alice', bio: 'Senior software engineer at Google, passionate about distributed systems and open source. 8+ years experience building scalable web applications.', karma: 12450 },
    { name: 'bob', bio: 'Full-stack developer specializing in React, Node.js, and PostgreSQL. Love building developer tools and mentoring junior devs.', karma: 8920 },
    { name: 'charlie', bio: 'Cybersecurity researcher and ethical hacker. Currently working on threat intelligence and secure coding practices.', karma: 15670 },
    { name: 'diana', bio: 'Data scientist with PhD in Machine Learning. Researching NLP applications and building AI-powered products.', karma: 11200 },
    { name: 'eve', bio: 'UI/UX designer with 6 years experience. Advocate for accessibility and user-centered design. Currently designing for fintech.', karma: 7890 },
    { name: 'frank', bio: 'DevOps engineer automating everything. Kubernetes, Docker, and cloud infrastructure are my playground. Love building CI/CD pipelines.', karma: 9320 },
    { name: 'grace', bio: 'Mobile app developer (iOS/Android). Flutter enthusiast, building cross-platform apps that millions use daily.', karma: 11890 },
    { name: 'henry', bio: 'Backend engineer specializing in microservices architecture. Go, Rust, and distributed systems expert.', karma: 14560 },
    { name: 'ivy', bio: 'Frontend architect passionate about React, TypeScript, and performance optimization. Building the next generation of web apps.', karma: 9870 },
    { name: 'jack', bio: 'Game developer working on indie projects. Unity, Unreal Engine, and procedural generation are my specialties.', karma: 6780 },
    { name: 'kate', bio: 'Product manager bridging tech and business. 10+ years experience launching products from idea to millions of users.', karma: 13450 },
    { name: 'liam', bio: 'Technical writer documenting complex systems. Making technology accessible through clear, comprehensive documentation.', karma: 7230 },
    { name: 'mia', bio: 'AI researcher working on neural networks and computer vision. PhD candidate exploring deep learning applications.', karma: 10200 },
    { name: 'noah', bio: 'Database administrator optimizing queries and designing scalable data architectures. PostgreSQL and MongoDB expert.', karma: 8760 },
    { name: 'olivia', bio: 'System administrator managing infrastructure at scale. Linux, networking, and automation specialist.', karma: 9450 },
    { name: 'paul', bio: 'Embedded systems engineer working with IoT devices. C++, Rust, and real-time operating systems.', karma: 8120 },
    { name: 'quinn', bio: 'Cloud architect designing scalable systems on AWS, GCP, and Azure. Infrastructure as Code and serverless advocate.', karma: 13890 },
    { name: 'ruby', bio: 'Security researcher and penetration tester. Finding vulnerabilities before the bad guys do.', karma: 11560 },
    { name: 'sam', bio: 'Blockchain developer exploring DeFi protocols. Smart contracts, dApps, and Web3 infrastructure.', karma: 9340 },
    { name: 'tina', bio: 'QA engineer ensuring quality software through comprehensive testing strategies and automation.', karma: 7560 },
    { name: 'uma', bio: 'Open source contributor to major projects. Rust, Python, and community building enthusiast.', karma: 12890 },
    { name: 'vince', bio: 'Freelance developer building custom solutions. Full-stack with expertise in e-commerce and SaaS platforms.', karma: 8910 },
    { name: 'willa', bio: 'Computer graphics programmer creating visual effects for films and games. OpenGL, Vulkan, and shader expert.', karma: 9670 },
    { name: 'xander', bio: 'Network engineer designing robust, scalable network architectures. SDN and cloud networking specialist.', karma: 8230 },
    { name: 'yara', bio: 'Software architect designing enterprise solutions. Domain-driven design and clean architecture advocate.', karma: 14200 },
    { name: 'zoe', bio: 'Test automation engineer building CI/CD pipelines and comprehensive test suites. Selenium, Cypress, and API testing.', karma: 7890 },
    { name: 'adam', bio: 'API developer creating RESTful and GraphQL services. Performance optimization and API design specialist.', karma: 9560 },
    { name: 'bella', bio: 'Game engine developer working on Unity and custom engines. Rendering, physics, and gameplay systems.', karma: 8740 },
    { name: 'carlos', bio: 'Cryptocurrency trader and blockchain analyst. DeFi protocols, market analysis, and smart contract auditing.', karma: 11340 },
    { name: 'dana', bio: 'Fitness enthusiast and personal trainer. Helping others achieve their health goals through science-based training.', karma: 5670 },
    { name: 'eric', bio: 'Professional chef turned food blogger. Exploring culinary traditions from around the world.', karma: 8920 },
    { name: 'fiona', bio: 'Travel photographer documenting cultures and landscapes. Nat Geo published, adventure seeker.', karma: 7340 },
    { name: 'george', bio: 'Book reviewer and literary critic. Classics to contemporary fiction, always reading something fascinating.', karma: 6780 },
    { name: 'hannah', bio: 'Film critic and movie buff. Cannes attendee, passionate about cinema from Hollywood to world cinema.', karma: 8230 },
    { name: 'ian', bio: 'Music producer and audio engineer. Electronic, ambient, and experimental music creator.', karma: 7560 },
    { name: 'julia', bio: 'Investment banker turned personal finance advisor. Helping people build wealth and financial independence.', karma: 9450 },
    { name: 'kevin', bio: 'Research scientist in quantum computing. PhD in physics, exploring the future of computation.', karma: 11200 },
    { name: 'lisa', bio: 'Wildlife photographer and conservationist. Documenting endangered species and advocating for environmental protection.', karma: 6780 },
    { name: 'matt', bio: 'Home cook turned culinary instructor. Teaching cooking fundamentals and international cuisine.', karma: 8340 },
    { name: 'nancy', bio: 'Retired teacher, avid reader of science fiction and fantasy. Writing my first novel.', karma: 5670 },
    { name: 'oscar', bio: 'Sound engineer for major films. Oscar nominee for sound design, passionate about immersive audio.', karma: 7890 },
    { name: 'piper', bio: 'Backpacking enthusiast and travel writer. 50+ countries visited, sharing authentic travel experiences.', karma: 8920 },
    { name: 'quentin', bio: 'Financial analyst specializing in tech stocks and cryptocurrency markets.', karma: 9670 },
    { name: 'rachel', bio: 'Astrophysicist studying exoplanets. Space enthusiast, science communicator, and telescope operator.', karma: 10340 },
    { name: 'steve', bio: 'Semi-professional gamer and esports coach. Competitive gaming since 2005, coaching rising stars.', karma: 7560 },
    { name: 'tara', bio: 'Nutritionist and dietitian. Evidence-based approach to health, wellness, and sustainable eating.', karma: 8230 },
    { name: 'ulrich', bio: 'Linux system administrator and kernel contributor. Open source advocate and security researcher.', karma: 11200 },
    { name: 'violet', bio: 'UX researcher conducting user studies and usability testing. Human-centered design advocate.', karma: 7340 },
    { name: 'wesley', bio: 'Software engineering manager leading teams of 20+ developers. Agile, leadership, and mentoring focus.', karma: 12890 },
    { name: 'ximena', bio: 'Data visualization specialist creating interactive dashboards and infographics for Fortune 500 companies.', karma: 9450 },
  ];

  const users = [];
  for (const profile of userProfiles) {
    const user = await prisma.user.create({
      data: {
        username: profile.name,
        email: `${profile.name}@example.com`,
        avatar_url: null,
        bio: profile.bio,
        karma: profile.karma,
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
  // CREATE 300+ POSTS WITH COMMUNITY-SPECIFIC CONTENT
  // ============================================
  console.log('📝 Creating 300+ posts with detailed, community-specific content...');

  const communitySpecificPosts = [
    // PROGRAMMING
    {
      title: 'The Art of Code Reviews: Best Practices for Modern Development Teams',
      body: `Code reviews are one of the most important practices in software development, yet they're often done poorly. After conducting hundreds of reviews across multiple companies, here's what I've learned about making code reviews effective and constructive.

**The Mindset Shift:**
Code reviews aren't about finding faults - they're about improving code quality and sharing knowledge. The goal is to catch bugs, ensure consistency, and help developers grow.

**Best Practices for Reviewers:**
1. **Focus on the code, not the person**: Frame feedback as "This could be clearer" rather than "You made a mistake"
2. **Ask questions**: Instead of demanding changes, ask "Have you considered...?" to encourage thinking
3. **Prioritize issues**: Not all issues are equal - separate blocking issues from style preferences
4. **Provide context**: Explain why a change improves the code
5. **Balance speed and thoroughness**: Don't make developers wait days, but don't rush through complex changes

**Best Practices for Authors:**
1. **Write clear commit messages**: Explain what and why, not just what
2. **Include context in the PR description**: Explain the problem being solved and your approach
3. **Respond constructively**: When receiving feedback, engage with it rather than defending
4. **Don't take it personally**: Code reviews are about the code, not your worth as a developer

**Common Pitfalls:**
- Nitpicking style issues while missing architectural problems
- Being too vague ("This doesn't look right" without explanation)
- Letting reviews languish for days
- Not reviewing your own code first
- Making reviews mandatory for trivial changes

**Tools and Automation:**
Modern teams use tools like:
- ESLint/Prettier for automated style enforcement
- SonarQube for code quality metrics
- GitHub's CODEOWNERS for routing reviews
- Automated testing to catch obvious issues

What are your team's code review practices? What's worked well or poorly for you?`,
      community: 'programming',
      type: 'text' as const,
    },
    {
      title: 'From Monolith to Microservices: A Real Migration Story',
      body: `Last year, our team migrated a 500K+ line Ruby on Rails monolith to microservices. It was painful, expensive, and absolutely worth it. Here's our journey and lessons learned.

**Why We Did It:**
- **Scaling challenges**: The monolith couldn't handle our user growth
- **Team scaling**: 50+ developers working in one codebase led to conflicts
- **Technology debt**: Legacy Rails 4 with mounting technical debt
- **Deployment frequency**: Monthly releases became quarterly, then yearly

**Our Migration Strategy:**
1. **Identify bounded contexts**: Used Domain-Driven Design to find natural service boundaries
2. **Start with leaf services**: Began with services that had few dependencies (notifications, file uploads)
3. **Implement the strangler pattern**: Gradually replaced monolith functionality with microservices
4. **Maintain database consistency**: Used eventual consistency and saga patterns for distributed transactions

**Technical Decisions:**
- **Language choice**: Went with Go for services requiring high performance, Node.js for I/O-bound services
- **Communication**: gRPC for service-to-service communication, REST/GraphQL for external APIs
- **Data consistency**: Event sourcing for critical business logic, CQRS for read-heavy workloads
- **Observability**: Comprehensive logging, metrics, and distributed tracing from day one

**Challenges We Faced:**
- **Distributed systems complexity**: Debugging issues across 15+ services
- **Data migration**: Migrating legacy data while keeping the system running
- **Team coordination**: Coordinating deployments across multiple services
- **Monitoring blind spots**: Ensuring we could see issues across the entire system

**What We Got Right:**
- **Invested heavily in testing**: 85% test coverage including integration tests
- **Automated everything**: Infrastructure as code, automated testing, blue-green deployments
- **Clear service boundaries**: Well-defined APIs and contracts between services
- **Gradual migration**: Never attempted a "big bang" rewrite

**Costs and Benefits:**
- **Cost**: $2.4M over 18 months (development, infrastructure, training)
- **Benefits**: 10x faster deployment frequency, 5x better uptime, ability to scale individual services
- **ROI**: Paid for itself in 8 months through improved developer productivity

**Lessons for Others:**
1. Don't migrate just because "microservices are cool" - have clear business reasons
2. Start small and prove the concept before going all-in
3. Invest in observability and automation upfront
4. Plan for organizational change, not just technical change
5. Consider alternatives like modular monoliths first

Would you consider migrating your monolith? What challenges do you anticipate?`,
      community: 'programming',
      type: 'text' as const,
    },

    // JAVASCRIPT
    {
      title: 'JavaScript Engines: V8, SpiderMonkey, and the Quest for Performance',
      body: `JavaScript engines have evolved from simple interpreters to sophisticated JIT compilers that rival native code performance. Understanding how they work can help you write faster JavaScript. Let's dive deep into the major engines and their optimization strategies.

**The Big Three Engines:**
1. **V8 (Chrome/Node.js)**: Uses Crankshaft (legacy), TurboFan (current), and Ignition interpreter
2. **SpiderMonkey (Firefox)**: Uses JaegerMonkey JIT and IonMonkey optimizing compiler
3. **JavaScriptCore (Safari)**: Uses LLInt interpreter, Baseline JIT, DFG JIT, and FTL JIT

**How JIT Compilation Works:**
Modern JS engines use a multi-tier approach:
- **Interpreter**: Fast startup, slow execution
- **Baseline JIT**: Compiles hot functions to bytecode
- **Optimizing JIT**: Uses type feedback to generate optimized machine code

**Key Optimization Techniques:**
1. **Inline Caching**: Caches object property access patterns
2. **Hidden Classes**: Groups objects with similar structure for efficient property access
3. **Type Feedback**: Tracks variable types at runtime to optimize operations
4. **Dead Code Elimination**: Removes unreachable code paths
5. **Loop Unrolling**: Optimizes tight loops by reducing overhead

**Writing Engine-Friendly Code:**
- **Use consistent object shapes**: Don't add random properties to objects
- **Avoid polymorphic operations**: Same operations on different types slow things down
- **Prefer monomorphic code**: Engines optimize better when types are consistent
- **Use typed arrays for numeric data**: More efficient than regular arrays for math
- **Avoid eval() and with statements**: They prevent many optimizations

**Performance Monitoring:**
Use these tools to understand your app's performance:
- Chrome DevTools Performance tab
- Node.js --prof and --trace-opt flags
- WebPageTest and Lighthouse for real-world metrics

**Recent Advancements:**
- **WebAssembly**: Binary format that runs alongside JavaScript
- **SIMD.js**: SIMD operations for parallel processing
- **SharedArrayBuffer**: True parallelism with Atomics
- **QuickJS**: Embeddable engine for resource-constrained environments

**The Future:**
Engines are getting smarter with:
- Better machine learning-guided optimization
- WebAssembly integration
- Improved memory management
- Enhanced debugging capabilities

What JavaScript performance optimizations have you discovered? Have you profiled a slow application and found surprising results?`,
      community: 'javascript',
      type: 'text' as const,
    },

    // REACT
    {
      title: 'React Server Components: The Future of Full-Stack React',
      body: `React Server Components represent a fundamental shift in how we build React applications. Announced in late 2020, they're finally becoming production-ready. Let's explore what they are, why they matter, and how to use them effectively.

**What Are Server Components?**
Server Components are React components that run on the server, not in the browser. They can:
- Access databases and file systems directly
- Reduce bundle size by keeping server-only code on the server
- Enable true full-stack React applications
- Improve performance by reducing client-side JavaScript

**Key Differences from Client Components:**
- **No browser APIs**: Can't use useState, useEffect, event handlers
- **Async by default**: Can be async functions that fetch data
- **Server-only imports**: Can import server-side libraries without bundle bloat
- **Zero client JavaScript**: Don't hydrate to the client at all

**The Component Tree Architecture:**
Server and Client Components can be nested arbitrarily, allowing fine-grained control over what runs where.

**Data Fetching Patterns:**
Instead of useEffect + fetch in Client Components, Server Components can directly query databases:
- Automatic request deduplication
- No loading states for initial data
- Better performance and user experience

**Streaming and Suspense:**
Server Components work beautifully with React 18's streaming:
- Send HTML as it's ready
- Show fallbacks while loading
- Progressive enhancement

**Best Practices:**
1. **Keep data fetching close to usage**: Fetch data in the component that needs it
2. **Use Client Components sparingly**: Only when you need interactivity
3. **Design for progressive enhancement**: App works without JavaScript
4. **Handle errors gracefully**: Server Components can throw errors
5. **Consider bundle size**: Each Client Component adds to your JavaScript bundle

**Current Limitations:**
- Still experimental in Next.js App Router
- Limited ecosystem support
- Learning curve for existing React developers
- Not all React features are available

**The Future:**
Server Components are evolving rapidly. Expect:
- Better debugging tools
- More framework support (Remix, etc.)
- Integration with existing React patterns
- Performance improvements

Have you tried Server Components yet? What challenges have you encountered? What's your biggest concern about adopting them?`,
      community: 'reactjs',
      type: 'text' as const,
    },

    // PYTHON
    {
      title: 'Async Python: From asyncio to Trio and Curio',
      body: `Python's async story has evolved significantly since asyncio was introduced in Python 3.4. From callbacks to coroutines to the modern async/await syntax, Python's concurrency model is now mature and powerful. Let's explore the current state of async Python.

**The Evolution:**
- **Python 3.4**: asyncio introduced with @asyncio.coroutine
- **Python 3.5**: async/await syntax added
- **Python 3.7**: asyncio became more mature with context variables
- **Python 3.8+**: Additional async utilities and performance improvements

**Core Concepts:**
1. **Coroutines**: Functions defined with async def
2. **Event Loop**: The heart of asyncio, schedules and runs coroutines
3. **Tasks**: Wrappers around coroutines that can be scheduled
4. **Futures**: Represent the result of asynchronous operations

**Async Patterns:**
- **Producer/Consumer**: asyncio.Queue for coordinating producers and consumers
- **Timeouts**: asyncio.wait_for and asyncio.timeout for bounding operations
- **Gathering**: asyncio.gather for running multiple coroutines concurrently
- **Shielding**: Protecting critical operations from cancellation

**Common Pitfalls:**
- **Blocking the event loop**: Never use time.sleep() in async code
- **Not awaiting coroutines**: Forgetting await means you get a coroutine object, not the result
- **Race conditions**: Shared state needs careful synchronization
- **Exception handling**: Unhandled exceptions in tasks can be silent

**Performance Considerations:**
- **CPU-bound work**: Use ProcessPoolExecutor, not asyncio
- **I/O-bound work**: Perfect for asyncio (network, file I/O)
- **Context switching**: asyncio is lightweight compared to threads
- **Memory usage**: Coroutines use far less memory than threads

**Alternatives to asyncio:**
- **Trio**: A newer async library with a cleaner API and structured concurrency
- **Curio**: Another async library focused on simplicity
- **AnyIO**: Provides a consistent interface across asyncio, Trio, and others

**Real-World Usage:**
- **Web frameworks**: FastAPI, aiohttp, Quart
- **Databases**: asyncpg, aiomysql, motor (MongoDB)
- **HTTP clients**: aiohttp, httpx
- **Task queues**: Celery with async workers

**Debugging Async Code:**
- Use asyncio debugging mode: PYTHONTRIO=1 or PYTHONASYNCIODEBUG=1
- Tools like aiodebug, pytest-asyncio
- Understand task cancellation and exception propagation

**Best Practices:**
1. **Use async context managers**: Properly cleanup resources
2. **Handle cancellation gracefully**: Use try/finally or async context managers
3. **Test async code**: pytest.mark.asyncio for testing coroutines
4. **Avoid global state**: Pass state explicitly to avoid race conditions
5. **Profile performance**: Use aiohttp-devtools or similar for monitoring

What's your experience with async Python? Have you built production systems with asyncio? What frameworks do you prefer?`,
      community: 'python',
      type: 'text' as const,
    },

    // MACHINE LEARNING
    {
      title: 'Transformers: The Architecture That Changed Everything',
      body: `The Transformer architecture, introduced in the 2017 paper "Attention is All You Need," revolutionized natural language processing and beyond. Understanding Transformers is essential for anyone working in modern machine learning. Let's break down this game-changing architecture.

**The Problem Transformers Solved:**
Before Transformers, RNNs and LSTMs dominated sequence modeling. However, they suffered from:
- Sequential processing (slow training/inference)
- Vanishing gradients on long sequences
- Difficulty parallelizing across GPUs
- Limited context understanding

**Core Components:**

**1. Self-Attention Mechanism:**
- Computes relevance between all pairs of positions in a sequence
- Allows the model to focus on relevant parts of the input
- Parallelizable across sequence positions
- Captures long-range dependencies effectively

**2. Multi-Head Attention:**
- Multiple attention heads learn different aspects of relationships
- Concatenated outputs provide rich representations
- Allows modeling different types of relationships simultaneously

**3. Positional Encoding:**
- Adds position information since Transformers don't process sequentially
- Uses sinusoidal functions to encode position
- Allows the model to understand sequence order

**4. Feed-Forward Networks:**
- Position-wise fully connected networks
- Applied to each position independently
- Adds non-linearity and increases model capacity

**5. Layer Normalization and Residual Connections:**
- Stabilizes training with normalization
- Residual connections help with gradient flow
- Enable training of very deep networks

**Training and Scale:**
- Transformers scale incredibly well with data and parameters
- Pre-training on massive datasets, fine-tuning on specific tasks
- The "scaling laws" show that bigger models + more data = better performance

**Variants and Improvements:**
- **BERT**: Bidirectional Encoder for classification tasks
- **GPT**: Generative Pre-trained Transformer for generation
- **T5**: Text-to-Text Transfer Transformer
- **Vision Transformers (ViT)**: Applying Transformers to images
- **Swin Transformers**: Hierarchical vision Transformers

**Practical Considerations:**
- **Memory complexity**: O(n²) attention creates memory bottlenecks
- **Long sequences**: Techniques like sparse attention and memory compression
- **Efficient implementations**: FlashAttention, memory-efficient attention
- **Quantization**: Reducing model size for deployment

**Applications Beyond NLP:**
- **Computer Vision**: Vision Transformers, DALL-E, Stable Diffusion
- **Reinforcement Learning**: Decision Transformers
- **Time Series**: Temporal fusion Transformers
- **Graph Neural Networks**: Graph Transformers

**The Future:**
- **Sparse Transformers**: More efficient attention mechanisms
- **Linear Transformers**: O(n) complexity attention
- **Retrieval-Augmented Generation**: Combining retrieval with generation
- **Multimodal Transformers**: Processing multiple data types

**Implementation Tips:**
- Use libraries like Hugging Face Transformers
- Start with pre-trained models, fine-tune for your task
- Use mixed precision training to fit larger models
- Implement gradient checkpointing for memory efficiency

Have you built Transformer-based models? What challenges have you faced with training or deploying them? What's your favorite Transformer variant?`,
      community: 'machinelearning',
      type: 'text' as const,
    },

    // CYBERSECURITY
    {
      title: 'Zero Trust Architecture: Beyond Perimeter Security',
      body: `Traditional perimeter-based security is dead. The modern threat landscape demands a fundamental shift to Zero Trust. As someone who's helped organizations implement Zero Trust at scale, here's what you need to know about this security paradigm shift.

**What is Zero Trust?**
Zero Trust is a security model that assumes breach and verifies every request as if it originates from an untrusted network. Key principles:
- Never trust, always verify
- Assume breach has occurred
- Use least privilege access
- Verify explicitly

**Core Components:**

**1. Identity and Access Management (IAM):**
- Multi-factor authentication (MFA) for all users
- Role-based access control (RBAC) with least privilege
- Just-in-time (JIT) and just-enough (JE) access
- Continuous authentication throughout sessions

**2. Network Segmentation:**
- Micro-segmentation using software-defined networking
- East-west traffic protection (not just north-south)
- Application-aware firewalls
- Zero Trust Network Access (ZTNA)

**3. Device Security:**
- Device posture assessment
- Endpoint detection and response (EDR)
- Secure access service edge (SASE) integration
- Certificate-based authentication

**4. Data Protection:**
- Data loss prevention (DLP) with encryption
- Data classification and labeling
- API security gateways
- Secure web gateways

**Implementation Strategy:**
1. **Assessment**: Audit current security posture and identify gaps
2. **Planning**: Define trust zones and data flows
3. **Pilot**: Start with high-risk applications
4. **Scale**: Gradually expand Zero Trust controls
5. **Monitor**: Continuous monitoring and improvement

**Common Challenges:**
- **Legacy systems**: Older applications not designed for Zero Trust
- **User experience**: Balancing security with usability
- **Cost**: Initial implementation can be expensive
- **Complexity**: Managing policies across distributed environments
- **Third parties**: Extending Zero Trust to vendors and partners

**Real-World Examples:**
- **Google's BeyondCorp**: Pioneered Zero Trust at scale
- **Capital One's implementation**: Protected against major breaches
- **Microsoft's Zero Trust deployment**: Comprehensive enterprise implementation

**Tools and Technologies:**
- **Identity**: Okta, Auth0, Azure AD, Ping Identity
- **Network**: Cloudflare Access, Zscaler, Palo Alto Prisma Access
- **Endpoint**: CrowdStrike, SentinelOne, Microsoft Defender
- **Data**: Symantec DLP, Microsoft Purview, McAfee MVISION

**Measuring Success:**
- Reduced breach impact and dwell time
- Improved compliance posture
- Enhanced visibility into user and device behavior
- Better user experience with appropriate access

**The Future of Zero Trust:**
- **AI-driven security**: Using ML for anomaly detection
- **Identity fabric**: Unified identity across hybrid environments
- **Continuous verification**: Real-time risk assessment
- **Privacy-preserving security**: Balancing security with privacy regulations

**Getting Started:**
1. Begin with identity as the foundation
2. Implement MFA everywhere
3. Map your critical data and applications
4. Start small with a pilot program
5. Measure and iterate

Have you implemented Zero Trust in your organization? What were the biggest challenges? What's your security philosophy - perimeter or Zero Trust?`,
      community: 'cybersecurity',
      type: 'text' as const,
    },

    // DEVOPS
    {
      title: 'Infrastructure as Code: Terraform, Pulumi, and CDK Compared',
      body: `Infrastructure as Code (IaC) has become essential for modern DevOps teams. With multiple tools available, choosing the right one can be challenging. Having used all three major IaC approaches extensively, here's my comprehensive comparison of Terraform, Pulumi, and AWS CDK.

**The Three Approaches:**

**1. Terraform (HashiCorp):**
- **Declarative**: Define desired state, Terraform figures out how to achieve it
- **Multi-cloud**: Supports AWS, Azure, GCP, and 100+ providers
- **HCL language**: Domain-specific language designed for infrastructure
- **State management**: Tracks resource state in terraform.tfstate
- **Modules**: Reusable infrastructure components

**2. Pulumi:**
- **Imperative**: Write real code (TypeScript, Python, Go, C#, Java)
- **Multi-cloud**: Same providers as Terraform plus Kubernetes
- **Real programming languages**: Full language features, testing, debugging
- **State management**: Uses your cloud provider's state (no separate state file)
- **Rich ecosystem**: NPM/Yarn for packages, full IDE support

**3. AWS CDK:**
- **Imperative**: Write TypeScript/Python/C#/Java code
- **AWS-only**: Best for AWS-centric environments
- **High-level constructs**: L2/L3 constructs abstract away AWS complexity
- **CloudFormation**: Generates CloudFormation templates under the hood
- **AWS integrations**: Deep integration with AWS services

**Comparison Matrix:**

**Learning Curve:**
- **Terraform**: Moderate - learn HCL and provider APIs
- **Pulumi**: Steep initially, but leverages existing programming skills
- **CDK**: Moderate - learn AWS constructs and CDK APIs

**Ecosystem:**
- **Terraform**: Largest - 100+ providers, massive community
- **Pulumi**: Growing - good multi-cloud support, active development
- **CDK**: AWS-focused - excellent for AWS, limited elsewhere

**State Management:**
- **Terraform**: Separate state file, complex locking and remote state
- **Pulumi**: Uses cloud provider state, simpler but less flexible
- **CDK**: CloudFormation state, fully managed by AWS

**Testing:**
- **Terraform**: Limited testing options, mostly integration tests
- **Pulumi**: Full unit testing of infrastructure code
- **CDK**: Good testing support with CDK assertions

**CI/CD Integration:**
- **Terraform**: Mature CI/CD integrations, Atlantis for GitOps
- **Pulumi**: Excellent CI/CD support, preview deployments
- **CDK**: Good CI/CD support, CDK Pipelines for deployment

**Real-World Usage Patterns:**

**Choose Terraform if:**
- You need multi-cloud support
- Your team prefers declarative configuration
- You have complex cross-provider dependencies
- You want maximum provider coverage

**Choose Pulumi if:**
- Your team is strong in software development
- You want to unit test your infrastructure
- You prefer imperative, programmatic infrastructure
- You need advanced programming constructs

**Choose CDK if:**
- You're heavily AWS-focused
- You want high-level abstractions
- You need tight AWS service integration
- You're already using CloudFormation

**Migration Strategies:**
- **From Terraform to Pulumi**: Use Pulumi's Terraform bridge
- **From CloudFormation to CDK**: Gradual migration with CDK
- **Multi-tool environments**: Use Terraform for multi-cloud, CDK for AWS-specific

**Best Practices:**
1. **Version control**: Treat IaC like code - full Git workflows
2. **Modularize**: Break down infrastructure into reusable modules
3. **Test thoroughly**: Use the best testing capabilities of your chosen tool
4. **Document**: Keep runbooks and architecture documentation
5. **Automate**: Integrate with CI/CD for automated deployments

What IaC tools does your team use? Have you migrated between tools? What factors influenced your choice?`,
      community: 'devops',
      type: 'text' as const,
    },

    // GAMING
    {
      title: 'Game Development Post-Mortem: Building a Mobile Hit with 10M+ Downloads',
      body: `Our studio's latest mobile game just hit 10 million downloads. It was a rollercoaster journey filled with technical challenges, user feedback surprises, and business lessons. Here's the complete story of how we built "Puzzle Quest Legends."

**The Vision:**
We wanted to create a puzzle game that combined match-3 mechanics with RPG progression. Key goals:
- Accessible to casual players but deep enough for hardcore gamers
- Monetization through optional purchases, not pay-to-win
- Regular content updates to keep players engaged
- Cross-platform (iOS/Android) from day one

**Technical Architecture:**
- **Engine**: Unity with custom C# framework
- **Backend**: Node.js microservices on AWS
- **Database**: PostgreSQL with Redis caching
- **Analytics**: Mixpanel for user behavior, custom dashboards for KPIs
- **CDN**: Cloudflare for global asset delivery

**Development Challenges:**
- **Performance optimization**: 60 FPS on low-end Android devices
- **Memory management**: 200MB RAM limit on many devices
- **Network reliability**: Handle poor connectivity gracefully
- **Battery optimization**: Minimize background processing

**Game Design Iterations:**
**Version 1.0 (Launch):**
- Basic match-3 with power-ups
- 50 levels, simple progression
- Launch metrics: 500K downloads first month

**Version 1.5 (First Major Update):**
- Added guild system after seeing player forum requests
- Implemented daily challenges based on analytics data
- Downloads doubled after this update

**Version 2.0 (Major Content Update):**
- Complete art style refresh (from cartoon to realistic)
- Added pet system based on player feedback
- Downloads tripled, retention improved 40%

**Monetization Strategy:**
- **Free-to-play**: No upfront cost, optional purchases
- **Value-driven**: Cosmetic items, convenience features, bonus content
- **Psychological pricing**: $0.99, $2.99, $4.99, $9.99 tiers
- **Season passes**: Monthly content bundles
- **Revenue**: $2.5M first year, 70% from in-app purchases

**Marketing Success:**
- **Organic growth**: App store features drove initial traction
- **Influencer partnerships**: Gaming YouTubers with 100K+ subscribers
- **User-generated content**: Player-created levels featured in updates
- **Cross-promotion**: Featured in other games we published

**Technical Post-Mortem:**
**What Went Right:**
- Modular architecture allowed rapid iteration
- Comprehensive analytics informed every decision
- Strong testing culture caught major bugs before release
- Cloud infrastructure scaled automatically

**What Went Wrong:**
- Underestimated Android fragmentation (500+ device configurations)
- Database queries weren't optimized for social features
- Push notification timing caused user backlash
- Server costs escalated faster than revenue initially

**Player Behavior Insights:**
- 80% of players never make purchases
- Average session: 15 minutes
- Peak engagement: evenings and weekends
- Churn highest in first 3 days, drops significantly after 7 days
- Social features increased retention by 25%

**Team Growth:**
Started with 5 people, now 25+ across design, engineering, marketing, and support.

**Lessons for Other Developers:**
1. **Listen to players**: Analytics and feedback drive success
2. **Iterate quickly**: Release early, update often
3. **Technical debt is real**: Pay it down regularly
4. **Marketing matters**: Great game + poor marketing = failure
5. **Monetization balance**: Don't sacrifice fun for money

**The Future:**
- Console ports in development
- VR version planned
- Sequel with expanded universe

What's your biggest game development challenge? Have you launched a successful mobile game? What's your monetization philosophy?`,
      community: 'gaming',
      type: 'text' as const,
    },

    // COOKING
    {
      title: 'The Science of Perfect Bread: From Wheat to Loaf',
      body: `Bread baking is equal parts art and science. After 15 years of professional baking and teaching, I've developed a deep understanding of the chemistry, biology, and physics that make great bread. Let's explore the fascinating world of bread science.

**The Raw Materials:**

**1. Flour:**
- **Protein content**: Gluten-forming proteins (gliadin + glutenin)
- **Extraction rate**: Whole wheat (100%) vs white flour (70-80%)
- **Protein quality**: Strong flours for bread, weak flours for cakes
- **Ash content**: Mineral content indicating refinement level

**2. Water:**
- **Hydration percentage**: 65-75% of flour weight for most breads
- **Temperature**: Affects yeast activity and gluten development
- **Mineral content**: Hard vs soft water affects dough behavior

**3. Yeast:**
- **Saccharomyces cerevisiae**: Converts sugars to CO2 and alcohol
- **Instant vs active dry**: Instant yeast can be added directly to flour
- **Wild yeast (sourdough)**: Lactic acid bacteria + yeast = complex flavors
- **Osmotolerance**: Yeast can work in high-sugar environments

**4. Salt:**
- **Flavor enhancement**: 1.8-2.5% of flour weight
- **Gluten control**: Strengthens gluten network
- **Yeast control**: Slows fermentation for better flavor development

**The Baking Process:**

**1. Mixing:**
- **Hydration**: Water absorption creates gluten matrix
- **Oxidation**: Develops gluten structure
- **Protein bonding**: Creates elastic dough network

**2. Fermentation:**
- **Bulk fermentation**: 1-3 hours at room temperature
- **Yeast metabolism**: Produces CO2 for leavening, alcohol for flavor
- **Acid production**: Lowers pH, affects gluten and flavor
- **Aroma development**: Hundreds of volatile compounds created

**3. Proofing:**
- **Final rise**: Dough doubles in size
- **Oven spring**: Rapid expansion in hot oven
- **Gas retention**: Gluten network traps CO2 bubbles

**4. Baking:**
- **Maillard reaction**: Browning and flavor development (300°F+)
- **Caramelization**: Sugar browning (320°F+)
- **Starch gelatinization**: Starch absorbs water, sets crumb structure
- **Protein coagulation**: Gluten network solidifies

**Troubleshooting Common Issues:**

**Dense bread:**
- Under-fermentation, insufficient gluten development
- Too much flour, not enough water
- Killed yeast from hot water

**Flat bread:**
- Over-proofing, weak gluten
- Insufficient yeast, cold environment
- Dense dough (not enough water)

**Sour bread:**
- Over-fermentation, excess acid
- Sourdough not properly maintained
- Long bulk fermentation

**Hollow bread:**
- Under-kneaded, weak gluten structure
- Oven too hot, too much oven spring

**Advanced Techniques:**

**Sourdough Mastery:**
- **Starter maintenance**: Regular feeding schedule
- **Hydration levels**: Stiff (50%) to liquid (100%+) starters
- **Natural leavening**: No commercial yeast required

**Artisan Methods:**
- **Long fermentation**: Develops complex flavors
- **Autolyse**: Flour + water rest develops gluten naturally
- **Lamination**: Creates layered structure in enriched breads

**Equipment and Tools:**
- **Stand mixer**: Consistent kneading
- **Dutch oven**: Steam trap for oven spring
- **Banneton**: Proofing basket for shape
- **Lame**: Scoring tool for controlled expansion

**Bread Types and Techniques:**
- **French bread**: High hydration, long fermentation
- **Sourdough**: Wild yeast, complex flavors
- **Ciabatta**: Very high hydration, big holes
- **Focaccia**: Olive oil enrichment, dimpled surface

**Science Meets Art:**
The perfect loaf balances chemistry (right ratios, temperatures) with sensory experience (crust texture, crumb structure, aroma). Every baker develops their own "feel" for dough, but understanding the science provides the foundation for consistent results.

What's your bread baking experience level? Have you experimented with sourdough? What's your biggest baking challenge?`,
      community: 'cooking',
      type: 'text' as const,
    },

    // SCIENCE
    {
      title: 'CRISPR: Gene Editing Revolution and Ethical Dilemmas',
      body: `CRISPR-Cas9 has revolutionized biology, making gene editing accessible and affordable. As a molecular biologist who's used CRISPR extensively, I'll explain how it works, its applications, and the profound ethical questions it raises.

**How CRISPR Works:**
CRISPR-Cas9 is a bacterial immune system adapted for genome editing. The system consists of:
- **Guide RNA (gRNA)**: Targets specific DNA sequences (20-30 nucleotides)
- **Cas9 enzyme**: Molecular scissors that cut DNA at the target site
- **DNA repair**: Cell's natural repair mechanisms insert or delete genetic material

**The Editing Process:**
1. **Design**: Create gRNA complementary to target DNA sequence
2. **Delivery**: Get CRISPR components into cells (viral vectors, nanoparticles, electroporation)
3. **Cutting**: Cas9 cuts both DNA strands at target location
4. **Repair**: Cell repairs break via NHEJ (error-prone) or HDR (precise editing)

**Applications:**

**Medical:**
- **Genetic diseases**: Correcting sickle cell anemia, cystic fibrosis mutations
- **Cancer therapy**: CAR-T cells edited to target cancer cells
- **Infectious diseases**: HIV resistance, malaria prevention
- **Regenerative medicine**: Stem cell engineering for tissue repair

**Agriculture:**
- **Disease resistance**: Virus-resistant crops (papaya ringspot virus)
- **Nutritional enhancement**: Golden rice with vitamin A, high-iron beans
- **Climate adaptation**: Drought-tolerant crops, salt-resistant varieties
- **Yield improvement**: Enhanced photosynthesis, nitrogen efficiency

**Research:**
- **Model organisms**: Creating precise genetic models (mice, zebrafish)
- **Functional genomics**: Large-scale gene knockout screens
- **Synthetic biology**: Building custom genetic circuits
- **Epigenetics**: Studying gene regulation mechanisms

**Industrial:**
- **Biomanufacturing**: Engineered microbes for drug production
- **Biofuels**: Microorganisms optimized for fuel production
- **Materials**: Bacteria producing spider silk, biodegradable plastics

**Ethical Concerns:**

**Human Germline Editing:**
- **Heritability**: Changes passed to future generations
- **Designer babies**: Selecting traits like intelligence, appearance
- **Inequality**: Access limited to wealthy individuals
- **Slippery slope**: Where do we draw ethical boundaries?

**Off-Target Effects:**
- **Unintended mutations**: CRISPR can cut similar DNA sequences
- **Mosaicism**: Incomplete editing in some cells
- **Long-term effects**: Unknown consequences of genome alterations
- **Cancer risk**: DNA breaks can lead to chromosomal instability

**Agricultural Concerns:**
- **Ecological impact**: Gene drive technology could eliminate species
- **Biodiversity loss**: Monocultures replacing diverse crops
- **Corporate control**: Patent ownership of genetic resources
- **Food security**: Dependency on genetically modified crops

**Access and Equity:**
- **Global disparities**: Rich countries vs developing nations
- **Intellectual property**: Patents on naturally occurring CRISPR systems
- **Regulatory frameworks**: Inconsistent international standards
- **Dual-use technology**: Beneficial and harmful applications

**Current Regulations:**
- **US**: FDA oversight for clinical applications, no germline editing
- **EU**: Strict GMO regulations, cautious approach to gene editing
- **China**: More permissive, first CRISPR babies (controversial)
- **UK**: Allowed for research, clinical trials approved

**Future Developments:**
- **Base editing**: Chemical modifications without DNA cutting
- **Prime editing**: Precise insertions without donor DNA
- **CRISPR-Cas12**: Smaller size, different targeting capabilities
- **Gene drives**: Spreading genetic changes through populations
- **Epigenome editing**: Modifying gene expression without changing DNA

**My Perspective:**
CRISPR is a powerful tool that can alleviate human suffering, but we must approach it with humility and rigorous oversight. The technology moves faster than our ethical frameworks can adapt.

What are your thoughts on CRISPR applications? Do you support human germline editing? What ethical concerns worry you most?`,
      community: 'science',
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

  // Create detailed community-specific posts
  for (const template of communitySpecificPosts) {
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

  // Create additional detailed posts for each community
  const additionalCommunityPosts = [
    // More programming posts
    {
      title: 'The Future of Programming Languages: What Comes After Rust?',
      body: `Rust has captured developer imagination with its memory safety guarantees and zero-cost abstractions. But what might come next? Let's explore emerging languages that could shape the future of systems programming.`,
      community: 'programming',
      type: 'text' as const,
    },
    {
      title: 'Building Resilient Systems: Chaos Engineering in Practice',
      body: `Netflix's Chaos Monkey taught us to embrace failure in production. Chaos engineering has evolved into a sophisticated discipline for building antifragile systems. Here's how to implement it effectively.`,
      community: 'programming',
      type: 'text' as const,
    },

    // More JavaScript posts
    {
      title: 'Deno 2.0: Node.js Killer or Peaceful Coexistence?',
      body: `Deno's second major release brings significant improvements. With native TypeScript support, improved security model, and npm compatibility, is it finally ready to challenge Node.js dominance?`,
      community: 'javascript',
      type: 'text' as const,
    },
    {
      title: 'JavaScript Performance: Beyond the Bundle Size Obsession',
      body: `We've focused on bundle sizes for years, but runtime performance matters more. From optimizing algorithms to leveraging WebAssembly, here's how to make your JavaScript actually fast.`,
      community: 'javascript',
      type: 'text' as const,
    },

    // More React posts
    {
      title: 'React 19 and the Future of Meta Frameworks',
      body: `React 19 brings compiler optimizations and new patterns. How will this affect Next.js, Remix, and other frameworks? What does it mean for the React ecosystem as a whole?`,
      community: 'reactjs',
      type: 'text' as const,
    },

    // More Python posts
    {
      title: 'Python 3.12: Performance Improvements and New Features',
      body: `Python 3.12 brings significant performance improvements with its new specializing adaptive interpreter. Let's explore the changes and how they affect real-world applications.`,
      community: 'python',
      type: 'text' as const,
    },

    // More machine learning posts
    {
      title: 'Large Language Models: Architecture Evolution from GPT-3 to GPT-4',
      body: `The architecture improvements that enabled GPT-4's capabilities are fascinating. From better attention mechanisms to improved training techniques, here's what changed.`,
      community: 'machinelearning',
      type: 'text' as const,
    },

    // More cybersecurity posts
    {
      title: 'Supply Chain Attacks: SolarWinds to Log4Shell and Beyond',
      body: `The SolarWinds and Log4Shell incidents exposed critical vulnerabilities in software supply chains. What have we learned, and how can organizations protect themselves?`,
      community: 'cybersecurity',
      type: 'text' as const,
    },

    // More devops posts
    {
      title: 'Kubernetes 2024: State of the Orchestrator',
      body: `Kubernetes continues to evolve rapidly. Gateway API, improved security, and better developer experience. What's working well and what still needs improvement?`,
      community: 'devops',
      type: 'text' as const,
    },

    // Gaming posts
    {
      title: 'Indie Game Development: From Idea to Launch in 2024',
      body: `The indie game landscape has never been more accessible, yet more competitive. Using modern tools, communities, and funding models, here's how to launch a successful indie game.`,
      community: 'gaming',
      type: 'text' as const,
    },
    {
      title: 'Game Engines Compared: Unity vs Unreal vs Godot in 2024',
      body: `Each engine has its strengths and ideal use cases. Unity for mobile and web, Unreal for AAA graphics, Godot for open-source flexibility. Which should you choose for your project?`,
      community: 'gaming',
      type: 'text' as const,
    },

    // Cooking posts
    {
      title: 'Plant-Based Cooking: Beyond Tofu and Tempeh',
      body: `Modern plant-based cuisine goes far beyond meat substitutes. Using whole foods, fermentation, and innovative techniques to create satisfying, flavorful dishes.`,
      community: 'cooking',
      type: 'text' as const,
    },

    // Science posts
    {
      title: 'Quantum Computing: Progress and Practical Applications',
      body: `Quantum computers have moved from theoretical curiosities to practical tools. What real-world problems can they solve today, and what breakthroughs are on the horizon?`,
      community: 'science',
      type: 'text' as const,
    },

    // Finance posts
    {
      title: 'Index Funds vs Individual Stocks: A Data-Driven Analysis',
      body: `The debate continues: passive indexing vs active stock picking. Using decades of market data, let's examine which approach actually delivers better long-term returns.`,
      community: 'finance',
      type: 'text' as const,
    },

    // Travel posts
    {
      title: 'Digital Nomad Visas: A Complete Guide to Working Remotely Worldwide',
      body: `With remote work normalized, digital nomad visas have proliferated. From Estonia's D visa to Barbados' Welcome Stamp, here's how to legally work from anywhere.`,
      community: 'travel',
      type: 'text' as const,
    },

    // Books posts
    {
      title: 'The State of Science Fiction: 2024 Trends and Must-Reads',
      body: `Science fiction continues to evolve, addressing current technological and social issues. From climate fiction to AI narratives, here are the books shaping the genre.`,
      community: 'books',
      type: 'text' as const,
    },

    // Movies posts
    {
      title: 'Streaming Wars: How Services Are Changing Cinema',
      body: `Netflix, Disney+, and others are producing more original content than traditional studios. What does this mean for filmmakers, actors, and audiences?`,
      community: 'movies',
      type: 'text' as const,
    },

    // Music posts
    {
      title: 'The Rise of AI Music Generation: Creative Tool or Artistic Threat?',
      body: `Tools like Suno and Udio can generate complete songs from text prompts. Musicians are divided: some see it as a powerful creative tool, others fear it undermines artistic value.`,
      community: 'music',
      type: 'text' as const,
    },

    // Fitness posts
    {
      title: 'Strength Training for Longevity: Science-Based Approach',
      body: `Building muscle isn't just for aesthetics. Research shows strength training is crucial for healthy aging, disease prevention, and maintaining independence.`,
      community: 'fitness',
      type: 'text' as const,
    },

    // Photography posts
    {
      title: 'Computational Photography: How Your Phone Camera Works',
      body: `Modern phone cameras use sophisticated computational techniques. From HDR to night mode to portrait effects, here's the technology behind your pocket camera.`,
      community: 'photography',
      type: 'text' as const,
    },
  ];

  // Create additional community posts
  for (const template of additionalCommunityPosts) {
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
  for (let i = 0; i < 200; i++) {
    const title = postTitles[i % postTitles.length] + (i > postTitles.length ? ` - Part ${Math.floor(i / postTitles.length) + 1}` : '');
    const community = randomElement(communities);
    const author = randomElement(users);
    
    // Generate community-relevant body content
    const communityContent = {
      programming: [
        'As a software engineer, I\'ve found that understanding algorithms deeply impacts code quality. Let me share some insights about this topic.',
        'Clean code principles aren\'t just nice-to-have - they\'re essential for maintainable software. Here\'s how I approach this challenge.',
        'Modern development practices have evolved significantly. Let me share what\'s working well in today\'s development environment.',
      ],
      javascript: [
        'JavaScript\'s evolution from a browser scripting language to a full-stack powerhouse has been fascinating. Here are my thoughts on current trends.',
        'The JavaScript ecosystem moves incredibly fast. Here\'s what I\'ve learned about staying current while building reliable applications.',
        'TypeScript has transformed how I write JavaScript. The trade-offs and benefits have been interesting to navigate.',
      ],
      python: [
        'Python\'s simplicity hides incredible power. I\'ve used it for everything from data analysis to web development to automation.',
        'The Python community\'s focus on readability and developer experience is unmatched. Here\'s why I keep coming back to it.',
        'Python\'s versatility makes it perfect for prototyping, but production considerations are crucial.',
      ],
      reactjs: [
        'React\'s component model has fundamentally changed how we think about UI development. The learning curve was steep but worth it.',
        'State management in React applications is both simple and complex. I\'ve tried many approaches - here\'s what works.',
        'React ecosystem tools evolve constantly. Staying current while maintaining stability is an ongoing challenge.',
      ],
      machinelearning: [
        'Machine learning requires both mathematical understanding and practical engineering skills. The combination is powerful.',
        'Data quality matters more than algorithm choice. I\'ve learned this through many failed projects.',
        'MLOps is where machine learning meets software engineering. The challenges are unique and fascinating.',
      ],
      cybersecurity: [
        'Security isn\'t a checkbox - it\'s an ongoing process. Every system has vulnerabilities waiting to be discovered.',
        'Zero trust principles have transformed how I think about network security. The shift was eye-opening.',
        'Threat modeling early in development prevents expensive security issues later. Here\'s my approach.',
      ],
      devops: [
        'Infrastructure as code has revolutionized deployment reliability. The journey from manual processes was transformative.',
        'Observability is crucial for modern systems. Without good monitoring, you\'re flying blind.',
        'CI/CD pipelines are more than automation - they\'re quality gates and deployment safety nets.',
      ],
      gaming: [
        'Game development combines technical challenges with creative expression. The balance is what makes it rewarding.',
        'Player experience design goes beyond mechanics. Community building and social features are equally important.',
        'Mobile gaming economics have evolved dramatically. Understanding player psychology is key to success.',
      ],
      cooking: [
        'Cooking is both science and art. Understanding techniques leads to consistently better results.',
        'Flavor development happens through chemical reactions. Learning food science has transformed my cooking.',
        'Recipe development is iterative. What starts as an idea becomes refined through testing and feedback.',
      ],
      science: [
        'Scientific research combines methodical process with creative problem-solving. The methodology is rigorous but rewarding.',
        'Reproducibility is the foundation of science. Ensuring experiments can be repeated is crucial.',
        'Interdisciplinary approaches often lead to breakthrough discoveries. Collaboration across fields is powerful.',
      ],
    };

    const communityParagraphs = communityContent[community.name as keyof typeof communityContent] || [
      `This is a detailed discussion about ${title.toLowerCase()}. Let me share my experiences and insights.`,
      `I've been working with this technology for several years now, and I've learned a lot along the way. Here are some key points to consider:`,
      `First, it's important to understand the fundamentals. Without a solid foundation, advanced concepts become much harder to grasp.`,
      `Second, practice is essential. Reading about something is different from actually implementing it. I recommend building small projects to reinforce your learning.`,
      `Third, don't be afraid to make mistakes. Every error is a learning opportunity. Debugging is a skill that improves with experience.`,
      `Finally, stay curious and keep learning. The tech industry moves fast, and what's cutting-edge today might be outdated tomorrow.`,
      `What are your thoughts on this topic? Have you encountered similar challenges? I'd love to hear about your experiences and any tips you might have.`,
    ];

    const body = communityParagraphs.slice(0, randomInt(3, 7)).join('\n\n');

    // Randomly assign post types
    const postTypes: Array<'text' | 'link' | 'image' | 'video' | 'poll' | 'crosspost'> = ['text', 'text', 'text', 'text', 'link', 'link', 'image', 'video', 'poll'];
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
      const domains = ['github.com', 'dev.to', 'medium.com', 'stackoverflow.com', 'reddit.com', 'news.ycombinator.com'];
      postData.link_url = `https://${randomElement(domains)}/article-${i}`;
    } else if (postType === 'image') {
      postData.image_url = `https://picsum.photos/800/600?random=${i}`;
    } else if (postType === 'video') {
      postData.video_url = `https://example.com/video-${i}`;
    } else if (postType === 'poll') {
      // We'll handle polls separately
    }

    const post = await prisma.post.create({ data: postData });
    posts.push(post);
    postCount++;
  }

  console.log(`✅ Created ${postCount} posts\n`);

  // ============================================
  // CREATE POLLS FOR ENGAGING DISCUSSIONS
  // ============================================
  console.log('🗳️  Creating polls for community engagement...');

  const pollData = [
    {
      question: 'What\'s your primary programming language?',
      community: 'programming',
      options: ['JavaScript/TypeScript', 'Python', 'Java', 'C#', 'Go', 'Rust', 'C++', 'Other'],
    },
    {
      question: 'Which JavaScript framework do you prefer?',
      community: 'javascript',
      options: ['React', 'Vue.js', 'Angular', 'Svelte', 'Next.js', 'Nuxt.js', 'Vanilla JS', 'Other'],
    },
    {
      question: 'What\'s your go-to state management solution in React?',
      community: 'reactjs',
      options: ['Redux', 'Zustand', 'Jotai', 'Context API', 'Recoil', 'MobX', 'None, I use hooks', 'Other'],
    },
    {
      question: 'Which Python web framework do you use most?',
      community: 'python',
      options: ['Django', 'FastAPI', 'Flask', 'Tornado', 'Bottle', 'CherryPy', 'Other'],
    },
    {
      question: 'What\'s your primary ML framework?',
      community: 'machinelearning',
      options: ['TensorFlow', 'PyTorch', 'scikit-learn', 'Keras', 'JAX', 'MXNet', 'Other'],
    },
    {
      question: 'Which IaC tool does your team use?',
      community: 'devops',
      options: ['Terraform', 'CloudFormation', 'Pulumi', 'CDK', 'Ansible', 'Puppet', 'Other'],
    },
    {
      question: 'What\'s your favorite game engine?',
      community: 'gaming',
      options: ['Unity', 'Unreal Engine', 'Godot', 'GameMaker', 'Construct', 'Custom Engine', 'Other'],
    },
    {
      question: 'Which cloud provider do you use most?',
      community: 'devops',
      options: ['AWS', 'Google Cloud', 'Azure', 'DigitalOcean', 'Linode', 'Heroku', 'Other'],
    },
    {
      question: 'What\'s your cybersecurity specialty?',
      community: 'cybersecurity',
      options: ['Network Security', 'Application Security', 'Cloud Security', 'Incident Response', 'Penetration Testing', 'Compliance', 'Other'],
    },
    {
      question: 'Which Linux distribution do you prefer?',
      community: 'linux',
      options: ['Ubuntu', 'Fedora', 'Arch Linux', 'Debian', 'CentOS/RHEL', 'Manjaro', 'Other'],
    },
    {
      question: 'What\'s your camera gear preference?',
      community: 'photography',
      options: ['DSLR', 'Mirrorless', 'Point-and-shoot', 'Phone camera', 'Film camera', 'Medium format', 'Other'],
    },
    {
      question: 'What\'s your primary fitness activity?',
      community: 'fitness',
      options: ['Weight training', 'Cardio', 'Yoga', 'Running', 'Cycling', 'Swimming', 'Sports', 'Other'],
    },
    {
      question: 'Which literary genre do you read most?',
      community: 'books',
      options: ['Science Fiction', 'Fantasy', 'Mystery/Thriller', 'Romance', 'Non-fiction', 'Biography', 'Classics', 'Other'],
    },
    {
      question: 'What\'s your favorite film genre?',
      community: 'movies',
      options: ['Action', 'Drama', 'Comedy', 'Sci-Fi', 'Horror', 'Documentary', 'Romance', 'Other'],
    },
    {
      question: 'Which music genre do you listen to most?',
      community: 'music',
      options: ['Pop', 'Rock', 'Hip-Hop/Rap', 'Electronic', 'Jazz', 'Classical', 'Country', 'Other'],
    },
  ];

  const polls = [];
  for (const pollInfo of pollData) {
    const community = communities.find(c => c.name === pollInfo.community);
    if (community) {
      const post = await prisma.post.create({
        data: {
          title: pollInfo.question,
          slug: slugify(pollInfo.question),
          body: `Community poll: ${pollInfo.question}\n\nWhat about you? Share your choice and why!`,
          post_type: 'poll',
          authorId: randomElement(users).id,
          communityId: community.id,
          createdAt: randomDate(20),
        },
      });

      // Create poll
      const poll = await prisma.poll.create({
        data: {
          postId: post.id,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });

      // Create poll options
      const pollOptions = [];
      for (let i = 0; i < pollInfo.options.length; i++) {
        const option = await prisma.pollOption.create({
          data: {
            pollId: poll.id,
            text: pollInfo.options[i],
            position: i,
          },
        });
        pollOptions.push(option);
      }

      // Generate some votes for the poll
      const voteCount = randomInt(20, 100);
      for (let i = 0; i < voteCount; i++) {
        const user = randomElement(users);
        const option = randomElement(pollOptions);

        try {
          await prisma.pollVote.create({
            data: {
              userId: user.id,
              optionId: option.id,
            },
          });
        } catch (e) {
          // Ignore duplicate votes
        }
      }

      polls.push({ post, poll, options: pollOptions });
    }
  }

  console.log(`✅ Created ${polls.length} polls with community voting\n`);

  // ============================================
  // CREATE 1000+ COMMENTS WITH CONTEXTUAL REPLIES
  // ============================================
  console.log('💬 Creating 1000+ contextual comments with deep discussions...');

  const contextualCommentGenerators = {
    programming: [
      'This is spot-on about code review culture. In my last team, we implemented mandatory reviews but forgot the "constructive" part.',
      'The reviewer mindset shift is crucial. I coach junior developers to ask "How can we improve this?" instead of "This is wrong."',
      'Automated tools help, but nothing replaces human judgment for architectural decisions.',
      'Our team uses GitHub\'s CODEOWNERS for routing. It really helps distribute review load evenly.',
      'The "blocking vs style" distinction is key. I wish more teams understood this.',
      'Have you tried pair programming as an alternative to async reviews? It\'s great for complex changes.',
      'NITs (Not In This) comments are my pet peeve. They derail actual technical discussions.',
      'What metrics do you track for code review effectiveness? We look at review time and post-release defects.',
    ],
    javascript: [
      'The V8 optimization details are fascinating. I\'ve seen 10x performance improvements from fixing object shapes.',
      'Inline caching is why we should avoid polymorphic operations. Great point about consistent types.',
      'JavaScript engines are basically JIT compilers now. The performance ceiling keeps getting higher.',
      'Have you tried the --trace-opt flag in Node.js? It shows exactly which functions get optimized.',
      'The hidden classes concept blew my mind when I first learned it. Such a clever optimization.',
      'WebAssembly integration is the future. JavaScript will become the orchestration layer.',
      'Memory management in JS engines is underrated. Understanding GC pauses prevents many perf issues.',
      'The shift from interpreted to compiled JavaScript changed everything about how we write code.',
    ],
    reactjs: [
      'Server Components are a paradigm shift. I\'m still wrapping my head around zero client JavaScript.',
      'The async Server Components are brilliant. No more waterfall loading of data.',
      'Suspense boundaries with Server Components create such clean loading states.',
      'I\'m worried about the learning curve. Client Components vs Server Components is confusing at first.',
      'The bundle size reduction is huge. We cut our client bundle by 40% using Server Components.',
      'How do you handle authentication in Server Components? The lack of client-side state is tricky.',
      'The progressive enhancement aspect is perfect for performance and accessibility.',
      'Next.js App Router finally makes Server Components practical for real applications.',
    ],
    python: [
      'Asyncio has such a steep learning curve, but once you get it, it\'s incredibly powerful.',
      'The event loop concept is mind-bending coming from synchronous programming.',
      'Trio\'s structured concurrency makes async code much easier to reason about.',
      'uvloop made such a difference in our async application performance.',
      'Debugging async code requires different tools. asyncio debugging mode is essential.',
      'The async/await syntax made async code readable, but the underlying concepts are still complex.',
      'FastAPI\'s async support is why I switched from Flask. The performance gains are real.',
      'Python\'s GIL makes async even more important for I/O-bound applications.',
    ],
    machinelearning: [
      'The self-attention mechanism is brilliant. Processing all pairs in parallel is genius.',
      'The positional encoding sinusoidal functions are such an elegant solution.',
      'Scaling laws are real. GPT-3 to GPT-4 showed that more data + compute = better performance.',
      'Sparse attention is crucial for longer sequences. The quadratic complexity is a killer.',
      'Multi-head attention allows the model to learn different types of relationships simultaneously.',
      'The residual connections and layer norm are what enable such deep networks.',
      'Pre-training then fine-tuning is such a powerful paradigm.',
      'FlashAttention optimizations are what made these models trainable at scale.',
    ],
    cybersecurity: [
      'Zero Trust is essential in today\'s threat landscape. Assume breach is the right mindset.',
      'The identity foundation is key. Everything else builds on strong authentication.',
      'Micro-segmentation prevents lateral movement. It\'s amazing how many breaches it stops.',
      'Implementing ZTNA instead of VPNs was a game-changer for our remote work.',
      'The cultural shift to Zero Trust is harder than the technology implementation.',
      'Measuring success goes beyond compliance. We track dwell time and blast radius.',
      'Legacy applications are the biggest challenge. Some systems just can\'t be secured traditionally.',
      'The cost is worth it. We\'ve prevented several breaches since implementing Zero Trust.',
    ],
    devops: [
      'IaC is transformative, but the cognitive load of multiple tools is real.',
      'Terraform\'s state management is both its strength and weakness.',
      'Pulumi\'s ability to use real programming languages is a huge advantage.',
      'CDK\'s higher-level constructs abstract away so much AWS complexity.',
      'The testing story is much better with Pulumi than Terraform.',
      'Multi-cloud support is why we chose Terraform, despite the HCL syntax.',
      'The migration between tools is painful. We\'re still dealing with Terraform drift.',
      'Infrastructure as Code finally made infrastructure changes versionable and testable.',
    ],
    gaming: [
      'The mobile game market is so competitive now. 10M downloads is impressive.',
      'The iteration based on player feedback is exactly how successful games are made.',
      'Unity\'s cross-platform support was crucial for reaching that scale.',
      'The monetization balance is so important. Pay-to-win kills player retention.',
      'Analytics-driven development is how modern games succeed.',
      'The team growth from 5 to 25+ people shows real business scaling.',
      'Server infrastructure costs are often underestimated in game dev budgets.',
      'The pivot to social features based on analytics data was smart.',
    ],
    cooking: [
      'The science behind bread baking is fascinating. Yeast metabolism is basically alchemy.',
      'The gluten network development through kneading is such a perfect example of food science.',
      'The Maillard reaction creates hundreds of flavor compounds. That\'s why browning matters.',
      'Sourdough starters are living ecosystems. The microbiology is incredible.',
      'Hydration percentage completely changes dough behavior. It\'s all about the ratios.',
      'The oven spring from steam is what creates that perfect crust.',
      'Long fermentation develops so much more flavor through acid production.',
      'Bread baking teaches patience. You can\'t rush good fermentation.',
    ],
    science: [
      'CRISPR\'s precision is amazing, but the off-target effects concern me deeply.',
      'The ethical implications for germline editing are profound and scary.',
      'The accessibility of gene editing democratizes biotechnology, but at what cost?',
      'The agricultural applications could solve world hunger, but corporate control worries me.',
      'The dual-use nature of this technology requires careful governance.',
      'The pace of advancement outstrips our ethical frameworks.',
      'CRISPR babies in China crossed a line that shouldn\'t have been crossed.',
      'The potential for curing genetic diseases is incredible, but we need international standards.',
    ],
  };

  const comments: any[] = [];
  let commentCount = 0;

  // Create contextual top-level comments
  for (let i = 0; i < 400; i++) {
    const post = randomElement(posts);
    const author = randomElement(users);

    // Get community-specific comments or fall back to generic ones
    const communityName = communities.find(c => c.id === post.communityId)?.name;
    const communityComments = contextualCommentGenerators[communityName as keyof typeof contextualCommentGenerators] || [
    'Great post! This is exactly what I needed. Thanks for sharing!',
    'I have a different perspective on this. While I agree with most points, I think...',
    'This is really helpful. I\'ve been struggling with this exact issue for weeks.',
    'Could you elaborate more on point 3? I\'m not sure I fully understand.',
    'I tried this approach and it worked perfectly! Here\'s what I did differently...',
    'Has anyone tried this with [alternative technology]? I\'m curious about the differences.',
    'This reminds me of a similar problem I faced. The solution was...',
    'Excellent write-up! I\'m bookmarking this for future reference.',
    ];

    const template = randomElement(communityComments);

    // Make some comments longer and more detailed
    const isLongComment = Math.random() < 0.4;
    let body = template;
    if (isLongComment) {
      const followUps = [
        `\n\nI've been working in ${communityName} for ${randomInt(2, 10)} years, and this resonates with my experience. One thing I'd add is that the learning curve is steeper than most people expect.`,
        `\n\nThis is spot-on. In our current project, we implemented similar practices and saw a ${randomInt(30, 70)}% improvement in development velocity.`,
        `\n\nI disagree with one aspect though. While the general approach is sound, I've found that [alternative method] works better in high-stakes production environments.`,
        `\n\nThe key insight here is that this isn't just about technical implementation - it's about team culture and communication. We've struggled with this in the past.`,
        `\n\nHave you considered the scaling implications? As teams grow beyond ${randomInt(5, 15)} people, these practices become even more critical.`,
      ];
      body = template + randomElement(followUps);
    }

    const comment = await prisma.comment.create({
      data: {
        body,
        authorId: author.id,
        postId: post.id,
        createdAt: randomDate(25),
      },
    });
    comments.push({ ...comment, level: 0, community: communityName });
    commentCount++;
  }

  // Create many nested replies (level 1) - more engagement
  for (let i = 0; i < 300; i++) {
    const parentComment = randomElement(comments.filter(c => c.level === 0));
    const author = randomElement(users.filter(u => u.id !== parentComment.authorId));

    // Create replies that reference the parent comment
    const replyTemplates = [
      `I completely agree with your point about [aspect]. In my experience, this has been crucial.`,
      `That's a great observation. Have you tried [alternative approach]? I found it works well for [use case].`,
      `I had a similar experience recently. We ended up [solution], which solved the problem.`,
      `This reminds me of [related concept]. The parallels are interesting.`,
      `Good point! I'd add that [additional consideration] is also important.`,
      `I used to think the same way, but [experience] changed my perspective.`,
      `That's exactly what we're doing now. The results have been [outcome].`,
      `I wish more people understood this. It's not intuitive at first.`,
    ];

    let body = randomElement(replyTemplates);
    if (Math.random() < 0.3) {
      body += `\n\nTo elaborate: ${parentComment.community}-specific tools make this even more effective.`;
    }
    
    const comment = await prisma.comment.create({
      data: {
        body,
        authorId: author.id,
        postId: parentComment.postId,
        parentCommentId: parentComment.id,
        createdAt: randomDate(20),
      },
    });
    comments.push({ ...comment, level: 1, community: parentComment.community });
    commentCount++;
  }

  // Create deeper nested replies (level 2) - real discussions
  for (let i = 0; i < 200; i++) {
    const parentComment = randomElement(comments.filter(c => c.level === 1));
    const author = randomElement(users.filter(u => u.id !== parentComment.authorId));

    const deepReplyTemplates = [
      `Building on what you said, I think the real challenge is [deeper issue].`,
      `That's a fair point. However, in [specific context], the trade-offs change.`,
      `I see where you're coming from. Our team handles this by [specific solution].`,
      `The devil is in the details here. Implementation matters more than theory.`,
      `This is why I prefer [alternative approach] for complex scenarios.`,
      `Experience level also plays a role. Junior devs struggle with this more than seniors.`,
      `Documentation and examples are crucial for adoption of these practices.`,
      `The tooling ecosystem has improved dramatically in the last few years.`,
    ];

    let body = randomElement(deepReplyTemplates);
    if (Math.random() < 0.2) {
      body += `\n\nAnyone else dealing with this in ${parentComment.community}? I'd love to hear your strategies.`;
    }
    
    const comment = await prisma.comment.create({
      data: {
        body,
        authorId: author.id,
        postId: parentComment.postId,
        parentCommentId: parentComment.id,
        createdAt: randomDate(15),
      },
    });
    comments.push({ ...comment, level: 2, community: parentComment.community });
    commentCount++;
  }

  // Create even deeper nested replies (level 3) - expert discussions
  for (let i = 0; i < 100; i++) {
    const parentComment = randomElement(comments.filter(c => c.level === 2));
    const author = randomElement(users.filter(u => u.id !== parentComment.authorId));

    const expertReplyTemplates = [
      `This discussion is getting really interesting. The nuance here is important.`,
      `I think we're all converging on the same conclusion: context matters.`,
      `The academic literature on this supports what we're seeing in practice.`,
      `This is why I advocate for [broader principle] rather than focusing on specifics.`,
      `The evolution of [technology/field] has made these discussions more relevant than ever.`,
      `I'd be interested in seeing case studies from companies that have solved this.`,
      `The human factors are often more important than the technical ones.`,
      `This is a perfect example of why [community] continues to evolve.`,
    ];

    let body = randomElement(expertReplyTemplates);
    if (Math.random() < 0.15) {
      body += `\n\nThanks to everyone contributing to this thread. These discussions are why I love this community.`;
    }
    
    const comment = await prisma.comment.create({
      data: {
        body,
        authorId: author.id,
        postId: parentComment.postId,
        parentCommentId: parentComment.id,
        createdAt: randomDate(10),
      },
    });
    comments.push({ ...comment, level: 3, community: parentComment.community });
    commentCount++;
  }

  console.log(`✅ Created ${commentCount} comments with deep nesting\n`);

  // ============================================
  // CREATE REALISTIC VOTE PATTERNS
  // ============================================
  console.log('👍 Creating realistic vote patterns with higher engagement...');
  const votes = [];

  // Create more realistic vote distribution based on post/comment quality and user karma
  // Higher karma users and newer content get more votes

  // Vote on posts - more votes, weighted by post quality and age
  for (let i = 0; i < 1500; i++) {
    const post = randomElement(posts);
    const user = randomElement(users);

    // Weight votes by post age (newer posts get more votes) and quality (longer posts get more engagement)
    const postAge = post.createdAt ? (Date.now() - post.createdAt.getTime()) / (1000 * 60 * 60 * 24) : 7; // days old, default to 7 if null
    const qualityScore = post.body ? Math.min(post.body.length / 1000, 3) : 1; // longer posts get more attention
    const engagementProbability = Math.max(0.1, 1 - (postAge / 60)); // newer posts more likely to be voted on

    if (Math.random() < engagementProbability * qualityScore) {
      // Higher karma users are more likely to upvote, lower karma users more likely to downvote
      const userKarma = users.find(u => u.id === user.id)?.karma || 0;
      const upvoteProbability = Math.min(0.95, 0.7 + (userKarma / 10000)); // high karma users mostly upvote
      const value = Math.random() < upvoteProbability ? 1 : -1;

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
  }

  // Vote on comments - even more votes, comments drive discussion
  for (let i = 0; i < 1200; i++) {
    const comment = randomElement(comments);
    const user = randomElement(users);

    // Comments get voted on based on length and nesting level (deeper discussions get more votes)
    const commentLength = comment.body.length;
    const nestingBonus = comment.level * 0.2; // deeper replies get slightly more attention
    const qualityScore = Math.min(commentLength / 200, 2) + nestingBonus;

    if (Math.random() < qualityScore * 0.3) { // comments get less votes than posts overall
      const userKarma = users.find(u => u.id === user.id)?.karma || 0;
      const upvoteProbability = Math.min(0.98, 0.8 + (userKarma / 10000)); // comments get even more upvotes
      const value = Math.random() < upvoteProbability ? 1 : -1;

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
  }

  console.log(`✅ Created ${votes.length} votes with realistic engagement patterns\n`);

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
  console.log('📊 MASSIVE SEED DATA SUMMARY:');
  console.log(`   👥 Users: ${users.length} (diverse backgrounds, realistic karma)`);
  console.log(`   🏘️  Communities: ${communities.length} (all major tech/dev topics)`);
  console.log(`   📝 Posts: ${posts.length} (300+ detailed, community-specific posts)`);
  console.log(`   🗳️  Polls: ${polls.length} (community engagement polls with votes)`);
  console.log(`   💬 Comments: ${commentCount} (1000+ contextual, nested discussions)`);
  console.log(`   👍 Votes: ${votes.length} (realistic engagement patterns)`);
  console.log(`   👥 Follows: ${followCount} (social connections)`);
  console.log('\n🚀 Features:');
  console.log('   • In-depth technical posts with real insights');
  console.log('   • Community-specific discussions that make sense');
  console.log('   • Nested comment threads with expert-level conversations');
  console.log('   • Realistic voting patterns based on karma and content quality');
  console.log('   • Active polls driving community engagement');
  console.log('   • Diverse user profiles with authentic backgrounds');
  console.log('\n✨ Your Reddit-like platform now has WORLD-CLASS seed data!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
