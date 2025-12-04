import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-').replace(/^-+/, '').replace(/-+$/, '').substring(0, 100);
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(daysAgo: number = 30): Date {
  const now = new Date();
  const past = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()));
}

async function main() {
  console.log('🌱 Starting high-quality database seed...');

  try {
    await prisma.$executeRaw`ALTER TABLE communities ADD COLUMN IF NOT EXISTS member_count INTEGER DEFAULT 0;`;
  } catch (e) { /* ignore */ }

  const existingPosts = await prisma.post.count();
  if (existingPosts > 0) {
    console.log('Clearing existing data...');
    await prisma.vote.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.pollVote.deleteMany();
    await prisma.pollOption.deleteMany();
    await prisma.poll.deleteMany();
    await prisma.post.deleteMany();
    await prisma.userFollow.deleteMany();
    await prisma.community.deleteMany();
    await prisma.user.deleteMany();
  }

  // Users
  const userProfiles = [
    { name: 'alice', bio: 'Senior software engineer at Google. 8+ years building scalable systems.' },
    { name: 'bob', bio: 'Full-stack developer specializing in React and Node.js.' },
    { name: 'charlie', bio: 'Cybersecurity researcher and ethical hacker.' },
    { name: 'diana', bio: 'Data scientist with PhD in Machine Learning.' },
    { name: 'eve', bio: 'UI/UX designer with 6 years experience.' },
    { name: 'frank', bio: 'DevOps engineer. Kubernetes and cloud infrastructure expert.' },
    { name: 'grace', bio: 'Mobile developer. Flutter enthusiast.' },
    { name: 'henry', bio: 'Backend engineer specializing in Go and Rust.' },
    { name: 'ivy', bio: 'Frontend architect passionate about React and TypeScript.' },
    { name: 'jack', bio: 'Game developer. Unity and Unreal specialist.' },
    { name: 'kate', bio: 'Product manager with 10+ years experience.' },
    { name: 'liam', bio: 'Technical writer making complex systems accessible.' },
    { name: 'mia', bio: 'AI researcher working on neural networks.' },
    { name: 'noah', bio: 'Database administrator. PostgreSQL expert.' },
    { name: 'olivia', bio: 'System administrator managing infrastructure at scale.' },
    { name: 'paul', bio: 'Embedded systems engineer working with IoT.' },
    { name: 'quinn', bio: 'Cloud architect on AWS, GCP, and Azure.' },
    { name: 'ruby', bio: 'Security researcher and penetration tester.' },
    { name: 'sam', bio: 'Blockchain developer exploring DeFi.' },
    { name: 'tina', bio: 'QA engineer ensuring quality through automation.' },
    { name: 'eric', bio: 'Professional chef turned food blogger.' },
    { name: 'fiona', bio: 'Travel photographer. Nat Geo published.' },
    { name: 'george', bio: 'Book reviewer and literary critic.' },
    { name: 'hannah', bio: 'Film critic and movie enthusiast.' },
    { name: 'ian', bio: 'Music producer and audio engineer.' },
    { name: 'julia', bio: 'Personal finance advisor.' },
    { name: 'kevin', bio: 'Research scientist in quantum computing.' },
    { name: 'rachel', bio: 'Astrophysicist studying exoplanets.' },
    { name: 'steve', bio: 'Esports coach and competitive gamer.' },
    { name: 'dana', bio: 'Fitness trainer and nutritionist.' },
  ];

  const users = [];
  for (const profile of userProfiles) {
    const user = await prisma.user.create({
      data: { username: profile.name, email: `${profile.name}@example.com`, bio: profile.bio },
    });
    users.push(user);
  }
  console.log(`✅ Created ${users.length} users`);

  // Communities
  const communityData = [
    { name: 'programming', description: 'Discuss programming, software development, and coding best practices.' },
    { name: 'gaming', description: 'Share gaming experiences, discuss video games, and connect with gamers.' },
    { name: 'cooking', description: 'Share recipes, cooking tips, and culinary adventures.' },
    { name: 'science', description: 'Scientific discussions, research papers, and discoveries.' },
    { name: 'fitness', description: 'Fitness routines, nutrition advice, and workout tips.' },
    { name: 'movies', description: 'Movie reviews, discussions, recommendations, and film analysis.' },
    { name: 'music', description: 'Music discovery, album reviews, artist discussions, and sharing tracks.' },
    { name: 'books', description: 'Book recommendations, reviews, literary discussions, and reading challenges.' },
    { name: 'travel', description: 'Travel stories, destination guides, tips, and photos from around the world.' },
    { name: 'technology', description: 'Tech news, gadget reviews, and discussions about the latest innovations.' },
  ];

  const communities = [];
  for (const comm of communityData) {
    const community = await prisma.community.create({
      data: { name: comm.name, slug: comm.name, description: comm.description, creator_id: randomElement(users).id },
    });
    communities.push(community);
  }
  console.log(`✅ Created ${communities.length} communities`);

  // High-quality posts with 4 per community
  const qualityPosts: { community: string; title: string; body: string }[] = [
    // PROGRAMMING (4 posts)
    {
      community: 'programming',
      title: 'The Art of Writing Clean Code: Lessons from 10 Years of Software Development',
      body: `After a decade of writing code professionally, I've learned that clean code isn't about following rules blindly—it's about communication. Every line you write is a message to the next developer (often future you).

**The Three Pillars of Clean Code:**

**1. Naming Things Well**
The hardest problem in computer science isn't cache invalidation—it's naming. A good name should tell you what something does, not how it does it. \`getUserById(id)\` beats \`fetchFromDatabaseTableUsersWhereIdEquals(id)\` every time.

Bad: \`const d = new Date();\`
Good: \`const currentTimestamp = new Date();\`

**2. Functions Should Do One Thing**
If you can't describe what a function does without using "and," it's doing too much. A 200-line function is a code smell. Break it down. Each function should be a single, testable unit of behavior.

\`\`\`javascript
// Bad
function processUserData(user) {
  validateUser(user);
  saveToDatabase(user);
  sendWelcomeEmail(user);
  updateAnalytics(user);
}

// Good
function onUserRegistration(user) {
  const validatedUser = validateUser(user);
  const savedUser = saveUser(validatedUser);
  notifyNewUser(savedUser);
  trackRegistration(savedUser);
}
\`\`\`

**3. Comments Should Explain Why, Not What**
If your code needs a comment to explain what it does, the code isn't clear enough. Comments should explain business logic, edge cases, and the reasoning behind non-obvious decisions.

**Practical Tips I Wish I Knew Earlier:**
- Write tests first. They force you to think about your API before implementation.
- Refactor continuously. Don't wait for "refactoring sprints."
- Read other people's code. Open source projects are free education.
- Delete code ruthlessly. Dead code is worse than no code.

What are your clean code principles? I'd love to hear what works for your team.`,
    },
    {
      community: 'programming',
      title: 'Understanding Big O Notation: A Practical Guide for Everyday Coding',
      body: `Big O notation intimidates many developers, but it's actually quite intuitive once you understand the core concept: we're measuring how an algorithm's performance scales as input grows.

**The Common Complexities Explained:**

**O(1) - Constant Time**
The holy grail. No matter how much data you have, the operation takes the same time.
- Accessing an array element by index
- HashMap lookups (average case)
- Checking if a number is even/odd

**O(log n) - Logarithmic Time**
Each step eliminates half the remaining data. Binary search is the classic example.
\`\`\`python
def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1
\`\`\`

**O(n) - Linear Time**
You touch each element once. Finding the max value in an unsorted array.

**O(n log n) - Linearithmic Time**
The sweet spot for sorting. Merge sort, quicksort (average), heapsort.

**O(n²) - Quadratic Time**
Nested loops over the same data. Bubble sort, selection sort. Avoid for large datasets.

**O(2^n) - Exponential Time**
The performance cliff. Recursive Fibonacci without memoization. Run away.

**Real-World Application:**
Last week, I optimized a report generator from 45 seconds to 0.3 seconds. The original code was O(n³)—three nested loops checking user permissions. By using a HashMap for permission lookups, I reduced it to O(n).

**When to Care About Big O:**
- Processing user-generated data (could be millions of records)
- Real-time systems (latency matters)
- Batch processing jobs (time = money)

**When NOT to Obsess:**
- Small, fixed-size datasets
- One-time scripts
- Premature optimization (measure first!)

What's your most satisfying Big O optimization story?`,
    },
    {
      community: 'programming',
      title: 'Git Workflow Strategies: From Solo Projects to Enterprise Teams',
      body: `After working with teams ranging from 2 to 200 developers, I've seen Git workflows that sing and ones that cause merge conflict nightmares. Here's what actually works.

**For Solo Developers: Trunk-Based Development**
Keep it simple. Work on main, commit often, push frequently. Use feature flags for incomplete work. Don't overcomplicate things when you're the only contributor.

**For Small Teams (2-10): GitHub Flow**
1. Create a feature branch from main
2. Make commits with clear messages
3. Open a Pull Request
4. Discuss and review
5. Merge to main
6. Deploy immediately

This works because:
- Short-lived branches reduce merge conflicts
- PRs create natural code review checkpoints
- main is always deployable

**For Larger Teams: GitFlow (Modified)**
The full GitFlow with develop, release, and hotfix branches makes sense when you have:
- Multiple versions in production
- Scheduled releases
- QA environments that need stable code

**Branch Naming Conventions That Work:**
\`\`\`
feature/USER-123-add-login-page
bugfix/USER-456-fix-null-pointer
hotfix/critical-security-patch
\`\`\`

**Commit Message Best Practices:**
\`\`\`
feat: add user authentication with OAuth2
fix: resolve race condition in payment processing
docs: update API documentation for v2 endpoints
refactor: extract email service into separate module
\`\`\`

**The Merge vs Rebase Debate:**
- Use merge for feature branches → preserves history
- Use rebase for updating feature branches → clean linear history
- Never rebase public branches

**Common Pitfalls:**
1. **Long-lived branches**: Merge hell awaits. Keep branches under a week.
2. **Giant PRs**: 1000+ line PRs don't get reviewed properly. Split them.
3. **Force pushing to shared branches**: Just don't.
4. **Ignoring .gitignore**: Commit node_modules once, regret forever.

**Pro Tips:**
- Use \`git stash\` liberally
- Learn \`git reflog\` for recovery
- Set up branch protection rules
- Automate with pre-commit hooks

What's your team's Git workflow? Any horror stories to share?`,
    },
    {
      community: 'programming',
      title: 'Debugging Like a Detective: Systematic Approaches to Finding Bugs',
      body: `The best debuggers I've worked with don't guess—they investigate. Here's the systematic approach that's saved me countless hours.

**The Scientific Method for Debugging:**

**1. Reproduce the Bug**
If you can't reproduce it, you can't fix it. Get the exact steps, input data, and environment. "It doesn't work" is not a bug report.

**2. Isolate the Problem**
Binary search your codebase. Comment out half the code. Does the bug persist? Narrow down until you find the exact line.

**3. Form a Hypothesis**
Before changing code, predict what's wrong. "I think the null check is missing" is better than randomly adding null checks everywhere.

**4. Test Your Hypothesis**
Make ONE change. Run the test. Did it fix the bug? If not, revert and try a different hypothesis.

**5. Verify the Fix**
Does the fix break anything else? Write a regression test. Future you will thank present you.

**Essential Debugging Tools:**

**Print Debugging (Yes, Really)**
\`\`\`python
print(f"DEBUG: user_id={user_id}, status={status}")
\`\`\`
Fast, universal, and often sufficient.

**Interactive Debuggers**
- Python: pdb, ipdb, or IDE debuggers
- JavaScript: Chrome DevTools, VS Code debugger
- Java: IntelliJ's debugger is phenomenal

**Logging**
\`\`\`python
import logging
logging.debug("Processing user %s with %d items", user_id, len(items))
\`\`\`

**Common Bug Patterns:**

1. **Off-by-one errors**: Check your loop bounds
2. **Null/undefined access**: Always validate input
3. **Race conditions**: Add logging with timestamps
4. **State mutations**: Look for unexpected side effects
5. **Encoding issues**: UTF-8 everything

**The Rubber Duck Method:**
Explain the problem out loud. To a colleague, a rubber duck, or an empty room. The act of articulating the problem often reveals the solution.

**When You're Stuck:**
1. Take a break. Fresh eyes find bugs faster.
2. Ask for help. A second perspective is invaluable.
3. Check recent changes. \`git log\` and \`git bisect\` are your friends.
4. Read the error message. Actually read it. The answer is often right there.

**My Favorite Debugging Story:**
Spent 4 hours on a bug. The fix was changing \`==\` to \`===\` in JavaScript. The lesson? Type coercion is the devil.

What's your debugging superpower?`,
    },

    // GAMING (4 posts)
    {
      community: 'gaming',
      title: 'The Evolution of Open World Games: From GTA III to Elden Ring',
      body: `Open world games have come a long way since GTA III revolutionized the genre in 2001. Let's trace this evolution and discuss where the genre is heading.

**The GTA III Revolution (2001)**
Before GTA III, "open world" meant top-down views and limited interactivity. Rockstar changed everything by creating a living, breathing 3D city. You could steal cars, explore freely, and ignore the main story entirely. Revolutionary.

**The Ubisoft Formula (2007-2015)**
Assassin's Creed popularized the "tower climbing, map revealing, icon collecting" formula. It worked initially but became exhausting. By 2015, every open world game felt the same: climb tower, reveal map, collect 500 feathers.

**The Breath of the Wild Moment (2017)**
Nintendo threw out the rulebook. No minimap icons. No quest markers. Just... exploration. See a mountain? Climb it. See a shrine? Figure it out. The game trusted players to find their own fun. It was liberating.

**Elden Ring's Contribution (2022)**
FromSoftware proved that difficulty and open world can coexist beautifully. The game doesn't hold your hand, but it never feels unfair. Getting stuck? Go explore somewhere else. Come back stronger. The sense of discovery is unmatched.

**What Makes Open Worlds Work:**

1. **Meaningful Exploration**: Every corner should reward curiosity
2. **Emergent Gameplay**: Systems that interact in unexpected ways
3. **Respecting Player Time**: No padding, no busywork
4. **Environmental Storytelling**: The world itself tells stories

**Current Problems:**
- Map bloat (looking at you, Ubisoft)
- Repetitive activities
- Fast travel that makes the world feel small
- NPCs that feel like furniture

**Games That Get It Right:**
- Red Dead Redemption 2: Immersion through detail
- The Witcher 3: Quests that feel meaningful
- Breath of the Wild: Pure exploration joy
- Elden Ring: Discovery and challenge

**Where We're Heading:**
I think the future is smaller, denser worlds. Quality over quantity. Fewer icons, more surprises. Games that trust players to explore without constant guidance.

What's your favorite open world game and why?`,
    },
    {
      community: 'gaming',
      title: 'Building a Gaming PC in 2024: Complete Guide for Every Budget',
      body: `After building dozens of PCs for friends and family, I've learned what actually matters and what's marketing hype. Here's my 2024 guide.

**Budget Build ($600-800): The 1080p Champion**

| Component | Recommendation | Price |
|-----------|---------------|-------|
| CPU | AMD Ryzen 5 5600 | $130 |
| GPU | RX 6650 XT or RTX 4060 | $250-300 |
| RAM | 16GB DDR4 3200MHz | $50 |
| Storage | 1TB NVMe SSD | $60 |
| Motherboard | B550 | $100 |
| PSU | 550W 80+ Bronze | $50 |
| Case | Anything with airflow | $60 |

This runs everything at 1080p 60fps+ on high settings. Cyberpunk, Elden Ring, whatever you throw at it.

**Mid-Range Build ($1200-1500): The 1440p Sweet Spot**

| Component | Recommendation | Price |
|-----------|---------------|-------|
| CPU | Ryzen 7 7700X or i5-14600K | $300-350 |
| GPU | RTX 4070 Super | $600 |
| RAM | 32GB DDR5 5600MHz | $120 |
| Storage | 2TB NVMe SSD | $100 |
| Motherboard | B650 or Z790 | $180 |
| PSU | 750W 80+ Gold | $90 |
| Case | Quality airflow case | $100 |

1440p gaming at high refresh rates. This is where price-to-performance peaks.

**High-End Build ($2500+): The 4K Monster**

Go for RTX 4080 Super or 4090, Ryzen 9 7900X3D, 64GB RAM. But honestly? The mid-range build handles 95% of games perfectly.

**Common Mistakes to Avoid:**

1. **Overspending on CPU**: Games are GPU-bound. A $300 CPU pairs fine with a $600 GPU.
2. **Cheap PSU**: Don't cheap out here. Bad PSUs kill components.
3. **RGB Everything**: Looks cool, adds nothing to performance.
4. **Ignoring Airflow**: Hot components throttle. Get a mesh front panel case.
5. **Buying 32GB RAM for Gaming**: 16GB is enough for 99% of games.

**Where to Spend More:**
- GPU (biggest impact on gaming performance)
- SSD (quality NVMe makes everything snappy)
- Monitor (144Hz+ at your target resolution)

**Where to Save:**
- Case (function over form)
- Motherboard (mid-range is fine)
- Cooler (stock coolers work for non-overclocking)

**Building Tips:**
- Watch a YouTube build guide first
- Install I/O shield BEFORE the motherboard
- Cable management matters for airflow
- Update BIOS before installing new CPUs

Questions? Happy to help with specific builds!`,
    },
    {
      community: 'gaming',
      title: 'Why Indie Games Are Having a Renaissance: My Top 10 Hidden Gems',
      body: `AAA games cost $70 and are increasingly formulaic. Meanwhile, indie developers are creating the most innovative, memorable experiences in gaming. Here are 10 indie gems that deserve more attention.

**1. Outer Wilds (2019)**
A 22-minute time loop, a solar system to explore, and zero hand-holding. This game made me feel like a real astronaut-archaeologist. The less you know going in, the better. Don't look up spoilers.

**2. Hades (2020)**
Supergiant proved roguelikes can have compelling narratives. Every death advances the story. The combat is tight, the voice acting is superb, and the Greek mythology setting is perfectly executed.

**3. Disco Elysium (2019)**
An RPG where you solve a murder through conversation. Your skills are aspects of your personality that argue with each other. It's weird, brilliant, and unlike anything else.

**4. Celeste (2018)**
A precision platformer about climbing a mountain and fighting depression. The difficulty is brutal but fair, and the assist mode makes it accessible to everyone. The soundtrack is phenomenal.

**5. Hollow Knight (2017)**
A $15 game with more content than most $60 releases. The atmosphere, the boss fights, the exploration—everything is polished to perfection. Silksong when?

**6. Return of the Obra Dinn (2018)**
You're an insurance adjuster investigating a ghost ship. Sounds boring? It's one of the best puzzle games ever made. The art style is unforgettable.

**7. Slay the Spire (2019)**
The game that popularized deck-building roguelikes. Simple to learn, impossible to master. "Just one more run" becomes "it's 3 AM."

**8. Inscryption (2021)**
A card game that becomes... something else entirely. The less said, the better. Trust me.

**9. Vampire Survivors (2022)**
$5 for hundreds of hours of dopamine. It shouldn't work, but it does. Pure addiction in game form.

**10. Tunic (2022)**
Zelda meets Dark Souls meets instruction manual puzzles. The game actively hides mechanics from you, and discovering them is magical.

**Why Indies Succeed Where AAA Fails:**
- Creative freedom (no corporate mandates)
- Focused vision (small teams, clear goals)
- Risk-taking (can't lose what you don't have)
- Passion projects (made by people who love games)

**Where to Find More:**
- Steam Next Fest (free demos!)
- itch.io (experimental games)
- Game Pass (tons of indies)
- r/indiegaming

What indie games have blown you away recently?`,
    },
    {
      community: 'gaming',
      title: 'The Psychology of Game Design: Why Some Games Are Impossible to Put Down',
      body: `As both a gamer and someone who's studied game design, I'm fascinated by why certain games consume our lives while others collect dust. Let's break down the psychology.

**The Core Loop: The Heart of Addiction**

Every successful game has a core loop:
1. **Goal**: Clear objective
2. **Action**: Engaging gameplay
3. **Reward**: Satisfying feedback
4. **Repeat**: Loop tightens

Diablo's loop: Kill monsters → Get loot → Equip loot → Kill stronger monsters
Candy Crush's loop: Match candies → Clear level → Unlock next level → Match more candies

**Variable Reward Schedules**

Slot machines and loot boxes use the same psychology. Unpredictable rewards trigger more dopamine than guaranteed ones. This is why:
- Legendary drops feel amazing
- Gacha games are profitable
- "Just one more run" becomes hours

**The Competence Loop**

Games make us feel skilled through:
- **Challenge Scaling**: Difficulty grows with ability
- **Clear Feedback**: You know why you failed
- **Mastery Moments**: Skills click into place

Dark Souls nails this. You die repeatedly, but each death teaches something. Victory feels earned.

**Social Dynamics**

Multiplayer games exploit:
- **Competition**: Leaderboards, rankings, PvP
- **Cooperation**: Guilds, co-op, shared goals
- **Social Proof**: "Your friend is playing!"
- **FOMO**: Limited-time events, battle passes

**The Sunk Cost Fallacy**

"I've invested 500 hours, I can't quit now."

Games exploit this through:
- Daily login rewards
- Progression systems
- Seasonal content
- Account investment

**Ethical Game Design**

Not all engagement is healthy. Ethical designers:
- Respect player time
- Avoid predatory monetization
- Provide natural stopping points
- Don't exploit psychological vulnerabilities

**Games That Do It Right:**
- **Hades**: Runs have natural endpoints
- **Stardew Valley**: Relaxing, not stressful
- **Celeste**: Assist mode for accessibility

**Games That Exploit:**
- Mobile gacha games
- Loot box-heavy AAA titles
- "Energy" systems that gate play

**As Players, We Should:**
1. Recognize manipulation tactics
2. Set time limits
3. Avoid games that feel like work
4. Choose games that respect us

What games have you found impossible to put down? Do you think they were designed ethically?`,
    },

    // COOKING (4 posts)
    {
      community: 'cooking',
      title: 'The Science of Perfect Pasta: Why Italians Are Right About Everything',
      body: `After years of cooking pasta wrong, I finally learned the science behind what makes pasta perfect. Spoiler: your nonna was right all along.

**The Water: More Is More**

Use at least 4 liters of water per 500g of pasta. Why?
- **Dilutes starch**: Prevents gummy pasta
- **Maintains temperature**: Water doesn't cool too much when pasta is added
- **Room to move**: Pasta needs space to cook evenly

**Salt: Season Like the Sea**

The water should taste like the Mediterranean. That's about 1 tablespoon per liter. This is your ONLY chance to season the pasta itself. Unsalted pasta water = bland pasta, no matter how good your sauce is.

**The Boil: Rolling, Not Simmering**

A rolling boil:
- Keeps pasta moving (even cooking)
- Prevents sticking
- Maintains temperature

Never add oil to the water. It doesn't prevent sticking and makes sauce slide off the pasta.

**Al Dente: The Science**

"Al dente" means "to the tooth"—pasta should have a slight resistance when bitten. Scientifically:
- Outer layer is fully hydrated
- Core retains some structure
- Starch is gelatinized but not mushy

Cook 1-2 minutes less than package directions. The pasta finishes cooking in the sauce.

**The Sauce Marriage**

This is where most home cooks fail. The sauce and pasta must become one.

1. **Save pasta water**: Starchy, salty liquid gold
2. **Finish in the pan**: Transfer pasta to sauce with tongs
3. **Add pasta water**: Creates emulsion, binds sauce to pasta
4. **Toss vigorously**: The mantecatura technique
5. **Off heat for cheese**: Prevents clumping

**Classic Sauces Decoded:**

**Cacio e Pepe** (cheese and pepper)
- Pecorino Romano, black pepper, pasta water
- The emulsion is everything
- Fails if water is too hot (cheese clumps)

**Carbonara**
- Eggs, guanciale, Pecorino, black pepper
- NO CREAM. Ever.
- Temper the eggs with pasta water

**Aglio e Olio**
- Garlic, olive oil, chili, parsley
- Toast garlic gently (golden, not brown)
- Emulsify with pasta water

**Common Mistakes:**
1. Rinsing pasta (removes starch)
2. Saucing on the plate (no integration)
3. Overcooking (mushy disaster)
4. Under-salting water (bland pasta)
5. Drowning in sauce (pasta should be coated, not swimming)

What's your go-to pasta dish? Any techniques you've discovered?`,
    },
    {
      community: 'cooking',
      title: 'Knife Skills 101: The Foundation of Efficient Cooking',
      body: `A sharp knife and proper technique will transform your cooking more than any gadget. Here's everything I wish I knew when I started.

**The Essential Knives (You Only Need Three)**

1. **Chef's Knife (8-10")**: Your workhorse. 90% of cutting tasks.
2. **Paring Knife (3-4")**: Detail work, peeling, trimming.
3. **Serrated Knife**: Bread, tomatoes, anything with tough skin.

Skip the 20-piece knife sets. Quality over quantity.

**Holding the Knife**

**The Pinch Grip:**
- Pinch the blade where it meets the handle
- Thumb on one side, index finger on the other
- Remaining fingers wrap the handle
- This gives maximum control

**The Claw (Guiding Hand):**
- Curl fingers inward
- Knuckles face the blade
- Fingertips tucked behind knuckles
- Blade rests against knuckles as guide

**The Basic Cuts:**

**Rough Chop**: Quick, imprecise cuts for stocks and stews

**Dice**: Uniform cubes
- Brunoise: 3mm cubes
- Small dice: 6mm cubes
- Medium dice: 12mm cubes
- Large dice: 20mm cubes

**Julienne**: Matchstick cuts, 3mm x 3mm x 5cm

**Chiffonade**: Roll leaves, slice thinly (herbs, leafy greens)

**The Rocking Motion**

For the chef's knife:
1. Tip stays on the board
2. Rock the blade up and down
3. Move through the food in a smooth motion
4. Let the knife do the work

**Sharpening vs Honing**

**Honing** (weekly): Realigns the edge. Use a honing steel before each session.

**Sharpening** (monthly-yearly): Removes metal to create new edge. Use a whetstone or professional service.

A dull knife is dangerous—it requires more pressure and slips more easily.

**Practice Exercises:**

1. **Onion dice**: The classic test. Even cubes, no tears (cold onion helps).
2. **Julienne carrots**: Consistency is key.
3. **Mince garlic**: Fine, even pieces.
4. **Chiffonade basil**: Thin ribbons, no bruising.

**Speed Comes Last**

Focus on:
1. Safety first
2. Consistency second
3. Speed comes naturally with practice

Those TV chefs didn't start fast. They practiced for years.

**Mise en Place**

"Everything in its place." Prep all ingredients before cooking:
- Reduces stress
- Prevents mistakes
- Makes cooking enjoyable

What knife techniques are you working on? Any tips to share?`,
    },
    {
      community: 'cooking',
      title: 'Mastering the Maillard Reaction: The Science of Delicious Browning',
      body: `That beautiful crust on a steak, the golden top of fresh bread, the caramelized edges of roasted vegetables—they all come from the Maillard reaction. Understanding it will make you a better cook.

**What Is the Maillard Reaction?**

Named after French chemist Louis-Camille Maillard, it's a chemical reaction between amino acids and reducing sugars. It occurs at temperatures above 280°F (140°C) and creates:
- Brown color
- Complex flavors
- Aromatic compounds
- Textural changes

It's NOT caramelization (that's just sugar). The Maillard reaction requires proteins.

**The Chemistry (Simplified)**

1. Sugars and amino acids combine
2. Unstable compounds form
3. These break down and recombine
4. Hundreds of flavor compounds are created
5. Melanoidins form (brown pigments)

**Why Dry Surfaces Matter**

Water boils at 212°F (100°C). The Maillard reaction needs 280°F+. Wet surfaces can't get hot enough.

**For the perfect sear:**
- Pat meat completely dry
- Don't crowd the pan (steam buildup)
- Let it sit (don't flip constantly)
- Use high heat

**The Enemies of Browning:**

1. **Moisture**: Steaming instead of searing
2. **Crowding**: Trapped steam
3. **Low heat**: Never reaches reaction temperature
4. **Impatience**: Moving food too soon

**Techniques to Maximize Maillard:**

**Dry Brining**: Salt draws moisture out, then it reabsorbs. Surface dries, interior stays juicy.

**Baking Soda**: Raises pH, accelerates browning. Use sparingly (1/4 tsp per pound of meat).

**Sugar Addition**: More fuel for the reaction. Honey glazes, sugar in rubs.

**High Heat Finishes**: Broiler, torch, screaming hot pan.

**Applications:**

**Steak**: Dry surface, ripping hot cast iron, don't touch it for 3-4 minutes.

**Roasted Vegetables**: Spread out, high heat (425°F+), toss halfway.

**Bread**: Steam first (gelatinizes surface), then dry heat for crust.

**Caramelized Onions**: Low and slow, but finish with high heat for color.

**Common Mistakes:**

1. Wet meat hitting the pan
2. Pan not hot enough
3. Flipping too often
4. Overcrowding
5. Using non-stick (doesn't get hot enough safely)

**The Cast Iron Advantage**

Cast iron retains heat. When cold meat hits it, temperature doesn't drop as much. Better sear, less steaming.

What's your favorite Maillard moment in cooking?`,
    },
    {
      community: 'cooking',
      title: 'Fermentation at Home: From Sauerkraut to Sourdough',
      body: `Fermentation is humanity's oldest food preservation technique, and it's having a renaissance. Here's how to start fermenting at home safely and deliciously.

**Why Ferment?**

1. **Flavor complexity**: Fermentation creates compounds impossible to achieve otherwise
2. **Preservation**: Lactic acid and alcohol prevent spoilage
3. **Nutrition**: Increases bioavailability of nutrients
4. **Probiotics**: Beneficial bacteria for gut health
5. **It's fun**: Watching transformation is magical

**The Science**

Fermentation is controlled decomposition. Beneficial microorganisms (bacteria, yeast) consume sugars and produce:
- Lactic acid (sauerkraut, kimchi, yogurt)
- Alcohol (wine, beer, bread)
- Acetic acid (vinegar)

**Starter Project: Sauerkraut**

Ingredients:
- 1 head cabbage (about 2 lbs)
- 1 tablespoon salt (2% of cabbage weight)

Process:
1. Shred cabbage finely
2. Add salt, massage until liquid releases (10-15 minutes)
3. Pack into clean jar, submerge under liquid
4. Cover loosely (gas needs to escape)
5. Keep at room temperature
6. Taste daily after day 3
7. Refrigerate when tangy enough (5-14 days)

**Troubleshooting:**
- **Mold on top**: Scrape off, ensure vegetables stay submerged
- **Too salty**: Rinse before eating
- **Not tangy**: Wait longer, warmer environment speeds fermentation
- **Mushy**: Fermented too long or too warm

**Level Up: Kimchi**

Same principle as sauerkraut, but with:
- Napa cabbage
- Gochugaru (Korean chili flakes)
- Garlic, ginger, scallions
- Fish sauce or salted shrimp

The fermentation develops incredible depth of flavor.

**Sourdough Starter**

Day 1: 50g flour + 50g water in a jar
Days 2-7: Discard half, add 50g flour + 50g water daily
Week 2+: Maintain with regular feedings

Signs of a healthy starter:
- Doubles in size after feeding
- Smells yeasty/tangy (not rotten)
- Bubbles throughout
- Floats in water

**Safety Notes**

Fermentation is safe when done correctly:
- Use clean equipment
- Keep vegetables submerged
- Trust your senses (bad ferments smell BAD)
- When in doubt, throw it out

**Advanced Projects:**
- Kombucha (fermented tea)
- Miso (fermented soybean paste)
- Hot sauce (fermented peppers)
- Tempeh (fermented soybeans)

What fermentation projects have you tried? Any failures to learn from?`,
    },

    // SCIENCE (4 posts)
    {
      community: 'science',
      title: 'CRISPR Explained: How Gene Editing Is Changing Medicine',
      body: `CRISPR-Cas9 is the most significant biological tool since PCR. It's already curing genetic diseases and will reshape medicine in our lifetime. Here's how it works and why it matters.

**What Is CRISPR?**

CRISPR stands for "Clustered Regularly Interspaced Short Palindromic Repeats." It's a bacterial immune system that scientists have repurposed for precise gene editing.

Think of it as molecular scissors with GPS.

**The Components:**

1. **Guide RNA (gRNA)**: The GPS. A 20-nucleotide sequence that matches the target DNA.
2. **Cas9 Protein**: The scissors. Cuts both strands of DNA at the target location.
3. **Repair Template** (optional): New DNA to insert at the cut site.

**How It Works:**

1. Design gRNA matching target gene
2. gRNA guides Cas9 to exact location
3. Cas9 cuts DNA
4. Cell's repair machinery kicks in
5. Either disrupts gene (NHEJ) or inserts new sequence (HDR)

**Current Medical Applications:**

**Sickle Cell Disease (2023 FDA Approved)**
Casgevy (exa-cel) is the first CRISPR therapy approved. It edits patient's stem cells to produce fetal hemoglobin, which doesn't sickle. Patients are effectively cured.

**Cancer Immunotherapy**
CAR-T cells are engineered using CRISPR to recognize and attack cancer cells. Revolutionary for blood cancers.

**Genetic Blindness**
Clinical trials are treating Leber congenital amaurosis by editing genes directly in the eye.

**HIV**
Research is exploring CRISPR to cut HIV DNA out of infected cells, potentially curing the infection.

**The Challenges:**

**Off-Target Effects**
CRISPR sometimes cuts similar-looking sequences elsewhere in the genome. Newer versions (Cas9 variants, base editors, prime editors) are more precise.

**Delivery**
Getting CRISPR into the right cells is hard. Viral vectors work but have limitations. Lipid nanoparticles are promising.

**Germline Editing**
Editing embryos is technically possible but ethically fraught. The 2018 "CRISPR babies" scandal showed the dangers of rushing ahead of ethics.

**Beyond Medicine:**

- **Agriculture**: Disease-resistant crops, improved nutrition
- **Conservation**: Genetic rescue of endangered species
- **Research**: Understanding gene function

**The Future:**

- More precise editing tools
- Better delivery methods
- Treating more genetic diseases
- Potential for enhancement (controversial)

**Ethical Considerations:**

- Who decides what gets edited?
- Access and equity concerns
- Unintended ecological consequences
- The line between treatment and enhancement

What aspects of CRISPR interest or concern you most?`,
    },
    {
      community: 'science',
      title: 'The James Webb Space Telescope: What We\'ve Learned in Two Years',
      body: `JWST has been operational for two years, and it's already rewriting astronomy textbooks. Here's what we've discovered and why it matters.

**Why JWST Is Special**

JWST observes in infrared, which allows it to:
- See through cosmic dust
- Observe the earliest galaxies (redshifted light)
- Study exoplanet atmospheres
- Peer into stellar nurseries

Its 6.5-meter mirror collects 6x more light than Hubble. It operates at -233°C to detect faint infrared signals.

**Major Discoveries:**

**1. The Early Universe Is Weird**

JWST found galaxies that formed just 300 million years after the Big Bang—far earlier than models predicted. These galaxies are:
- Surprisingly massive
- Unexpectedly mature
- Challenging our understanding of galaxy formation

Either galaxies form faster than we thought, or our cosmological models need revision.

**2. Exoplanet Atmospheres**

JWST has detected:
- **Water vapor** on multiple exoplanets
- **Carbon dioxide** on WASP-39b (first time ever)
- **Sulfur dioxide** from photochemistry
- Potential **biosignature gases** (under investigation)

We're getting closer to detecting signs of life on other worlds.

**3. Stellar Nurseries in Detail**

The Carina Nebula and Pillars of Creation images revealed:
- Protostellar jets previously invisible
- Hundreds of young stars in formation
- Complex chemistry in dust clouds

**4. Our Solar System**

JWST observed:
- **Jupiter's rings** and auroras
- **Neptune's rings** (first clear view in 30 years)
- **Asteroids** and their compositions
- **Titan's atmosphere** in new detail

**5. Supermassive Black Holes**

Found evidence of massive black holes in the early universe, challenging theories about how quickly they can form.

**Iconic Images:**

- **Carina Nebula**: "Cosmic Cliffs" showing star formation
- **Stephan's Quintet**: Interacting galaxies in unprecedented detail
- **Southern Ring Nebula**: Dying star's final gasps
- **SMACS 0723**: Deep field with thousands of galaxies

**What's Next:**

- More exoplanet atmosphere studies
- Deeper surveys of the early universe
- Observations of potentially habitable worlds
- Continued surprises

**The Bigger Picture:**

JWST is answering questions we've had for decades while raising new ones we never thought to ask. That's how good science works.

What JWST discovery has excited you most?`,
    },
    {
      community: 'science',
      title: 'Quantum Computing: Separating Hype from Reality',
      body: `Quantum computing promises to revolutionize everything from drug discovery to cryptography. But what can it actually do today? Let's separate the hype from the reality.

**The Basics (Simplified)**

Classical computers use bits: 0 or 1.
Quantum computers use qubits: 0, 1, or both simultaneously (superposition).

When qubits interact, they become entangled—measuring one instantly affects the other. This enables parallel computation on an exponential scale.

**What Quantum Computers Are Good At:**

1. **Optimization Problems**: Finding the best solution among many possibilities
2. **Simulation**: Modeling quantum systems (molecules, materials)
3. **Cryptography**: Breaking current encryption (eventually), creating unbreakable encryption
4. **Machine Learning**: Certain algorithms may have quantum speedups

**What They're NOT Good At:**

- General computing (your laptop is better)
- Tasks without quantum advantage
- Anything requiring stable, long-running computation (for now)

**Current State (2024):**

**IBM**: 1,121 qubit processor (Condor), but qubits are noisy
**Google**: Claimed "quantum supremacy" in 2019, continues advancing
**IonQ**: Trapped ion approach, different tradeoffs
**D-Wave**: Quantum annealing (different paradigm)

**The Error Problem:**

Qubits are fragile. They decohere (lose quantum properties) quickly. Current error rates are too high for practical computation.

**Error correction** requires many physical qubits per logical qubit. We might need millions of physical qubits for useful computation.

**Timeline Reality Check:**

**Now**: Research, proof-of-concept, narrow applications
**5-10 years**: Early practical applications in chemistry/materials
**10-20 years**: Cryptographically relevant quantum computers
**20+ years**: General-purpose quantum advantage

**Real Applications Today:**

- Simulating small molecules (drug discovery research)
- Optimization experiments (logistics, finance)
- Quantum machine learning research
- Cryptography research (post-quantum algorithms)

**The Cryptography Concern:**

Shor's algorithm can break RSA encryption—but requires thousands of stable qubits. We're not there yet, but:
- Start transitioning to post-quantum cryptography now
- "Harvest now, decrypt later" is a real threat
- NIST has standardized post-quantum algorithms

**Investment vs. Reality:**

Billions are being invested. Much is hype-driven. But the science is real, even if timelines are uncertain.

**My Take:**

Quantum computing will be transformative—eventually. But the "quantum winter" is possible if expectations outpace progress. The technology is real; the timelines are optimistic.

What quantum computing applications interest you most?`,
    },
    {
      community: 'science',
      title: 'Climate Science 101: Understanding the Data Behind Global Warming',
      body: `Climate change is the defining challenge of our time. Understanding the science—not just the headlines—is crucial. Here's what the data actually shows.

**The Greenhouse Effect (Basic Physics)**

1. Sun's energy reaches Earth (mostly visible light)
2. Earth absorbs and re-emits as infrared radiation
3. Greenhouse gases (CO2, methane, water vapor) absorb infrared
4. Energy is trapped, warming the atmosphere

This is not controversial—it's physics known since the 1800s.

**The Evidence:**

**Temperature Records**
- Global average temperature has risen ~1.1°C since pre-industrial times
- 2023 was the hottest year on record
- 20 of the 21 hottest years occurred since 2000
- Multiple independent datasets confirm this

**Ice Cores**
- Antarctic ice contains 800,000 years of atmospheric history
- CO2 and temperature correlate strongly
- Current CO2 levels (420+ ppm) are unprecedented in human history

**Ocean Data**
- Oceans have absorbed 90% of excess heat
- Sea levels rising ~3.7mm/year (accelerating)
- Ocean acidification threatens marine ecosystems

**Satellite Observations**
- Infrared radiation escaping Earth has decreased
- Exactly the wavelengths absorbed by CO2
- Direct evidence of enhanced greenhouse effect

**The Attribution Question**

How do we know it's human-caused?

1. **Isotopic Signature**: Fossil fuel carbon has distinct isotope ratio
2. **Timing**: Warming correlates with industrial emissions
3. **Pattern**: Stratospheric cooling (greenhouse prediction) confirmed
4. **Magnitude**: Natural factors can't explain observed warming
5. **Fingerprints**: Warming pattern matches greenhouse, not solar

**What Models Predict:**

Climate models have been remarkably accurate:
- 1990 IPCC projections match observed warming
- Models correctly predicted stratospheric cooling
- Arctic ice loss exceeded predictions (models were conservative)

**Current Projections (IPCC AR6):**

| Scenario | 2100 Warming | Outcome |
|----------|--------------|---------|
| Very low emissions | 1.0-1.8°C | Paris goals met |
| Low emissions | 1.3-2.4°C | Significant impacts |
| Intermediate | 2.1-3.5°C | Severe impacts |
| High emissions | 3.3-5.7°C | Catastrophic |

**The Tipping Points:**

- Ice sheet collapse (irreversible sea level rise)
- Permafrost thaw (methane release feedback)
- Amazon dieback (carbon sink becomes source)
- Coral reef death (ecosystem collapse)

**What We Can Do:**

1. **Mitigation**: Reduce emissions (renewable energy, efficiency)
2. **Adaptation**: Prepare for unavoidable changes
3. **Carbon Removal**: Technology to remove CO2 from atmosphere

**The Good News:**

- Renewable energy costs have plummeted
- Electric vehicles are going mainstream
- Climate policy is advancing globally
- Solutions exist—we need implementation

What aspects of climate science would you like to explore further?`,
    },

    // FITNESS (4 posts)
    {
      community: 'fitness',
      title: 'Progressive Overload: The Only Principle You Need for Strength Gains',
      body: `After 15 years of training and coaching, I've seen every program, every method, every "secret." They all work if they follow one principle: progressive overload. Here's how to apply it properly.

**What Is Progressive Overload?**

Your body adapts to stress. To keep growing stronger, you must gradually increase the demands. This can mean:
- More weight
- More reps
- More sets
- Better form
- Less rest
- Greater range of motion

**The Hierarchy of Progression:**

**1. Add Weight (Primary)**
If you can complete all prescribed reps with good form, add weight next session.
- Upper body: 2.5-5 lbs
- Lower body: 5-10 lbs
- Small increments beat big jumps

**2. Add Reps (Secondary)**
Can't add weight? Add reps within your target range.
- Week 1: 3x8 @ 100 lbs
- Week 2: 3x9 @ 100 lbs
- Week 3: 3x10 @ 100 lbs
- Week 4: 3x8 @ 105 lbs (reset and add weight)

**3. Add Sets (Tertiary)**
More volume drives adaptation.
- Start: 3 sets
- Progress to: 4-5 sets
- Then reduce sets and increase weight

**Programming for Progressive Overload:**

**Linear Progression (Beginners)**
Add weight every session. Works for 3-12 months.

\`\`\`
Monday: Squat 135x5x3
Wednesday: Squat 140x5x3
Friday: Squat 145x5x3
\`\`\`

**Weekly Progression (Intermediate)**
Add weight weekly. Periodize intensity.

**Monthly Progression (Advanced)**
Progress over mesocycles. More complex periodization.

**Tracking Is Essential**

If you're not tracking, you're guessing. Record:
- Exercise
- Weight
- Sets x Reps
- RPE (Rate of Perceived Exertion)
- Notes (sleep, stress, etc.)

Apps: Strong, JEFIT, or a simple notebook.

**Common Mistakes:**

1. **Too much, too fast**: 5% jumps lead to plateaus and injury
2. **Ego lifting**: Bad form doesn't count
3. **Program hopping**: Consistency beats novelty
4. **Ignoring recovery**: Adaptation happens during rest
5. **Not deloading**: Planned recovery weeks prevent burnout

**When Progress Stalls:**

1. Check recovery (sleep, nutrition, stress)
2. Reduce volume temporarily (deload)
3. Change rep ranges
4. Address weak points
5. Be patient—progress isn't linear

**Sample Beginner Program:**

**Day A:**
- Squat 3x5
- Bench Press 3x5
- Barbell Row 3x5

**Day B:**
- Squat 3x5
- Overhead Press 3x5
- Deadlift 1x5

Alternate A/B, three times per week. Add 5 lbs each session.

What's your current training approach? Any plateaus you're working through?`,
    },
    {
      community: 'fitness',
      title: 'Nutrition for Muscle Building: Protein, Calories, and Timing',
      body: `You can't out-train a bad diet. Nutrition is 70% of your results. Here's the evidence-based approach to eating for muscle growth.

**The Caloric Foundation**

To build muscle, you need a caloric surplus. Your body can't create tissue from nothing.

**Calculating Your Needs:**

1. **BMR** (Basal Metabolic Rate): Calories burned at rest
   - Men: 10 × weight(kg) + 6.25 × height(cm) - 5 × age + 5
   - Women: 10 × weight(kg) + 6.25 × height(cm) - 5 × age - 161

2. **TDEE** (Total Daily Energy Expenditure): BMR × Activity Factor
   - Sedentary: 1.2
   - Light activity: 1.375
   - Moderate: 1.55
   - Very active: 1.725

3. **Surplus**: TDEE + 200-500 calories for muscle gain

**Protein: The Building Block**

**How Much?**
Research consistently shows: 0.7-1g per pound of bodyweight (1.6-2.2g/kg)

More isn't better. Excess protein is just expensive calories.

**Sources:**
- Chicken breast: 31g per 100g
- Greek yogurt: 10g per 100g
- Eggs: 6g each
- Whey protein: 25g per scoop
- Legumes: 15g per cup (incomplete, combine sources)

**Timing:**
- Distribute across 4-6 meals
- 20-40g per meal for optimal synthesis
- Pre/post workout is slightly beneficial but not critical

**Carbohydrates: The Fuel**

Carbs fuel training and spare protein for building muscle.

**How Much?**
2-3g per pound of bodyweight for active individuals.

**Timing:**
- Pre-workout: 1-2 hours before
- Post-workout: Replenish glycogen
- Around training matters most

**Sources:**
- Rice, oats, potatoes
- Fruits and vegetables
- Whole grains

**Fats: The Essential**

Hormones (including testosterone) require dietary fat.

**How Much?**
0.3-0.5g per pound of bodyweight (minimum 20% of calories)

**Sources:**
- Olive oil, avocados
- Nuts and seeds
- Fatty fish (omega-3s)

**Sample Meal Plan (180 lb male, bulking):**

**Breakfast:**
- 4 eggs, 2 slices toast, banana
- 500 cal, 28g protein

**Lunch:**
- 6 oz chicken, 1.5 cups rice, vegetables
- 600 cal, 45g protein

**Pre-Workout:**
- Greek yogurt, berries, granola
- 350 cal, 20g protein

**Post-Workout:**
- Whey shake, banana
- 300 cal, 30g protein

**Dinner:**
- 8 oz salmon, sweet potato, salad
- 650 cal, 50g protein

**Evening:**
- Cottage cheese, almonds
- 300 cal, 25g protein

**Total:** ~2700 cal, ~200g protein

**Supplements (What Actually Works):**

1. **Creatine**: 5g daily, proven effective
2. **Protein powder**: Convenient, not magic
3. **Vitamin D**: If deficient (most people are)
4. **Omega-3s**: If not eating fatty fish

Skip the rest. Most supplements are marketing.

What's your current nutrition approach? Any challenges you're facing?`,
    },
    {
      community: 'fitness',
      title: 'Recovery: The Missing Piece in Most Training Programs',
      body: `Training breaks you down. Recovery builds you up. Most people focus on the former and neglect the latter. Here's how to optimize recovery for better results.

**The Recovery Hierarchy:**

**1. Sleep (Most Important)**

During sleep:
- Growth hormone peaks
- Muscle protein synthesis increases
- Neural connections strengthen
- Inflammation decreases

**Optimize Sleep:**
- 7-9 hours consistently
- Same bedtime/wake time (even weekends)
- Cool, dark room (65-68°F)
- No screens 1 hour before bed
- Limit caffeine after 2 PM

**Sleep Deprivation Effects:**
- Decreased testosterone
- Increased cortisol
- Impaired glucose metabolism
- Reduced training performance
- Increased injury risk

**2. Nutrition (Fuel Recovery)**

Post-workout window exists but isn't magical. Total daily intake matters more.

**Key Nutrients:**
- Protein: Repair muscle damage
- Carbs: Replenish glycogen
- Water: Hydration affects everything
- Micronutrients: Support metabolic processes

**3. Stress Management**

Chronic stress = elevated cortisol = impaired recovery.

**Strategies:**
- Meditation (even 10 minutes helps)
- Nature exposure
- Social connection
- Hobbies unrelated to fitness
- Therapy if needed

**4. Active Recovery**

Light movement promotes blood flow without adding stress.

**Options:**
- Walking (10,000 steps daily)
- Light swimming
- Yoga or stretching
- Foam rolling
- Low-intensity cycling

**5. Deload Weeks**

Planned recovery periods prevent overtraining.

**When:**
- Every 4-8 weeks
- When performance declines
- When motivation drops
- After competition/testing

**How:**
- Reduce volume 40-60%
- Maintain intensity
- Focus on technique
- Extra sleep and nutrition

**Signs You Need More Recovery:**

- Persistent fatigue
- Decreased performance
- Increased resting heart rate
- Mood disturbances
- Frequent illness
- Nagging injuries
- Loss of motivation

**Recovery Tools (Evidence-Based):**

**Effective:**
- Sleep
- Nutrition
- Stress management
- Light activity

**Possibly Helpful:**
- Massage
- Foam rolling
- Contrast showers
- Compression garments

**Overhyped:**
- Cryotherapy
- Most supplements
- Expensive recovery gadgets

**Programming for Recovery:**

Don't train the same muscle groups on consecutive days. Example split:

- Monday: Push (chest, shoulders, triceps)
- Tuesday: Pull (back, biceps)
- Wednesday: Legs
- Thursday: Rest or active recovery
- Friday: Push
- Saturday: Pull
- Sunday: Rest

**The 80/20 Rule:**

80% of recovery comes from:
- Adequate sleep
- Proper nutrition
- Stress management

The other 20% is optimization. Focus on the basics first.

How do you prioritize recovery in your training?`,
    },
    {
      community: 'fitness',
      title: 'Home Gym Setup: Building an Effective Training Space on Any Budget',
      body: `After training in commercial gyms for years, I built a home gym during the pandemic. It was the best fitness decision I've ever made. Here's how to do it right at any budget.

**The Case for Home Gyms:**

- No commute time
- No waiting for equipment
- Train on your schedule
- No monthly fees (long-term savings)
- Your music, your rules
- Never closed

**Budget Tier 1: $200-500 (The Minimalist)**

You can build serious strength with minimal equipment.

**Essential:**
- Adjustable dumbbells (up to 50 lbs): $150-300
- Pull-up bar (doorway): $30
- Resistance bands (set): $30
- Yoga mat: $20

**What You Can Do:**
- All major movement patterns
- Progressive overload with bands + dumbbells
- Calisthenics progressions
- Full-body training

**Budget Tier 2: $1,000-2,000 (The Essentials)**

This is where home training really shines.

**Equipment:**
- Power rack or squat stand: $300-500
- Barbell (45 lb Olympic): $150-300
- Weight plates (300 lbs): $300-500
- Flat/incline bench: $150-300
- Flooring (horse stall mats): $100-150

**What You Can Do:**
- All barbell movements
- Progressive overload indefinitely
- Powerlifting, bodybuilding, general fitness

**Budget Tier 3: $3,000-5,000 (The Complete Gym)**

Commercial gym quality at home.

**Additions:**
- Cable system or functional trainer: $1,000-2,000
- Specialty bars (trap bar, SSB): $200-400 each
- Dumbbells (full set or adjustable): $500-1,000
- Cardio equipment: $500-1,500

**Space Requirements:**

**Minimum:** 6' x 8' (for rack, bench, and barbell movements)
**Comfortable:** 10' x 12' (room to move, store equipment)
**Ideal:** 12' x 16'+ (full gym experience)

**Ceiling height:** 8' minimum, 9'+ for overhead pressing

**Flooring:**

- **Horse stall mats**: $40 per 4'x6' mat, durable, absorbs impact
- **Rubber tiles**: More expensive, better aesthetics
- **Plywood under mats**: Protects concrete, creates stable surface

**Where to Buy:**

**New:**
- Rogue Fitness (premium)
- Rep Fitness (great value)
- Titan Fitness (budget-friendly)
- Amazon Basics (entry-level)

**Used:**
- Facebook Marketplace
- Craigslist
- OfferUp
- Garage sales

Used equipment is often 50% off retail. Be patient.

**Common Mistakes:**

1. **Buying too much too fast**: Start minimal, add as needed
2. **Poor flooring**: Protects equipment and floors
3. **Inadequate ventilation**: Fans, windows, or AC
4. **No mirror**: Form check is important
5. **Overcrowding**: Leave room to move

**My Setup (Budget: ~$2,500):**

- Rogue SML-2 squat stand
- Ohio Power Bar
- 400 lbs of bumper plates
- Rep AB-3100 bench
- Titan pulley system
- Rogue Echo Bike
- Powerblocks (5-50 lbs)
- Horse stall mats

I've trained here for 3 years. Zero regrets.

What's your home gym setup or dream list?`,
    },

    // MOVIES (4 posts)
    {
      community: 'movies',
      title: 'Why Practical Effects Still Matter in the Age of CGI',
      body: `As someone who's worked in film production for 15 years, I've watched the industry shift dramatically toward CGI. But the best films still know when to use practical effects—and the results speak for themselves.

**The Case for Practical Effects:**

**1. Actor Performance**
When actors interact with real objects, their performances are more authentic. Compare the original Jurassic Park (animatronic dinosaurs) with later sequels (pure CGI). The fear in the actors' eyes was real because they were looking at something real.

**2. Lighting and Physics**
Practical effects interact with real light. A practical explosion illuminates actors' faces naturally. CGI requires artists to manually recreate these interactions, and they often miss subtle details.

**3. Longevity**
Films with practical effects age better. The Thing (1982) still looks incredible. Early CGI from the same era looks dated. Practical effects exist in physical reality—they don't suffer from the uncanny valley.

**The Best of Both Worlds:**

Modern filmmakers who understand this:
- **Christopher Nolan**: Real explosions, real stunts, minimal CGI
- **Denis Villeneuve**: Massive practical sets enhanced with CGI
- **George Miller**: Real cars, real crashes in Mad Max: Fury Road

**When CGI Excels:**
- Impossible creatures and environments
- Crowd multiplication
- Digital face replacement
- Cleanup and enhancement

**When Practical Wins:**
- Explosions and fire
- Gore and body horror
- Creature close-ups
- Anything actors interact with directly

**The Cost Myth:**
Studios often think CGI is cheaper. It's not always true. A practical effect happens once on set. CGI requires months of artist time, revisions, and rendering. The Mandalorian's "Volume" LED stage is a hybrid approach that's proving cost-effective.

What films do you think nailed the practical/CGI balance?`,
    },
    {
      community: 'movies',
      title: 'The Art of the Long Take: Films That Master Unbroken Shots',
      body: `There's something magical about a long, unbroken shot. When done well, it creates immersion that cuts simply can't achieve. Here are the films that do it best and why they work.

**What Makes Long Takes Special:**

1. **Real-time tension**: No escape through editing
2. **Technical achievement**: The coordination required is immense
3. **Immersion**: Viewers feel present in the scene
4. **Actor showcase**: No hiding behind cuts

**The Masters:**

**1917 (2019) - Roger Deakins**
The entire film appears as two continuous shots. The technical achievement is staggering—hidden cuts, precise choreography, and Deakins' stunning cinematography. It puts you in the trenches.

**Children of Men (2006) - Emmanuel Lubezki**
The car ambush scene is 4+ minutes of chaos in a confined space. The camera moves impossibly—through the windshield, around passengers, out the window. It's claustrophobic and terrifying.

**Birdman (2014) - Also Lubezki**
The entire film appears as one shot. It's a technical marvel that serves the story—the protagonist's mental state feels unbroken, relentless.

**Goodfellas (1990) - Scorsese**
The Copacabana shot isn't the longest, but it's the most influential. Henry Hill's world is seductive, and the camera glides through it effortlessly. You understand why Karen is impressed.

**Oldboy (2003) - Park Chan-wook**
The hallway fight is a side-scrolling video game brought to life. No cuts, no cheating. Just exhausting, brutal combat.

**The Technical Challenges:**

- **Lighting**: Must work for the entire duration
- **Focus**: Pulling focus across a moving shot
- **Choreography**: Actors, camera, extras in perfect sync
- **Sound**: Often requires complete re-recording
- **Mistakes**: One error means starting over

**When Long Takes Fail:**

Not every long take serves the story. Sometimes directors use them to show off rather than enhance the narrative. The best long takes are invisible—you're so immersed you don't notice the technique.

What's your favorite long take in cinema?`,
    },
    {
      community: 'movies',
      title: 'Understanding Film Scores: How Music Shapes Your Emotional Experience',
      body: `You might not consciously notice a film's score, but it's manipulating your emotions the entire time. As a composer who's scored indie films, let me pull back the curtain.

**The Invisible Art:**

A good score is felt, not heard. When you notice the music, it's often because something's wrong. The best scores work subconsciously, guiding your emotional response without calling attention to themselves.

**Techniques Composers Use:**

**Leitmotifs**
Recurring musical themes associated with characters or ideas. John Williams is the master:
- The Imperial March = Darth Vader/Empire
- Hedwig's Theme = Harry Potter/Magic
- The Jaws theme = Approaching danger

Your brain learns these associations. Just hearing two notes can trigger fear (Jaws) or wonder (E.T.).

**Tempo and Tension**
- Fast tempo = excitement, anxiety
- Slow tempo = sadness, contemplation
- Irregular rhythm = unease, confusion

**Harmonic Language**
- Major keys = happiness, triumph
- Minor keys = sadness, tension
- Dissonance = horror, wrongness

**Silence**
Sometimes the most powerful choice is no music at all. The Coen Brothers use silence devastatingly in No Country for Old Men.

**Iconic Scores Analyzed:**

**Inception (Hans Zimmer)**
The BRAAAM. That massive brass hit became a cliché because it works so well. It signals importance, scale, and impending action.

**There Will Be Blood (Jonny Greenwood)**
Unconventional, abrasive, unsettling. The score mirrors Daniel Plainview's psychology—it's not meant to be pleasant.

**The Social Network (Trent Reznor/Atticus Ross)**
Electronic, cold, precise. It captures the digital age and Zuckerberg's emotional detachment perfectly.

**Interstellar (Hans Zimmer)**
The organ creates a spiritual, cosmic feeling. It's intimate and vast simultaneously.

**How to Listen Actively:**

1. Watch a scene with sound off, then with sound
2. Notice when music enters and exits
3. Pay attention to how your emotions shift
4. Listen to the soundtrack separately

What film score has affected you most deeply?`,
    },
    {
      community: 'movies',
      title: 'The Rise of A24: How an Indie Studio Changed Hollywood',
      body: `In a decade, A24 went from unknown distributor to the most influential studio in American cinema. They've won Best Picture twice and redefined what indie films can achieve. Here's how they did it.

**The A24 Formula:**

**1. Trust the Director**
A24 is famously hands-off. They give directors final cut and creative control. This attracts auteurs who've been burned by studio interference. The result: distinctive, uncompromised visions.

**2. Smart Marketing**
They market films like events. Limited releases build buzz. Merchandise creates community. They understand that their audience wants to feel like they've discovered something special.

**3. Genre Elevation**
They take "low" genres—horror, comedy, coming-of-age—and elevate them with artistic ambition. Hereditary is a horror film AND a meditation on grief. The Witch is scary AND historically meticulous.

**4. Aesthetic Consistency**
A24 films have a recognizable look and feel. Deliberate pacing, naturalistic dialogue, striking cinematography. You can often identify an A24 film without seeing the logo.

**The Hits:**

- **Moonlight** (2016): Best Picture winner, $65M on $4M budget
- **Lady Bird** (2017): Coming-of-age perfection
- **Hereditary** (2018): Elevated horror masterpiece
- **Everything Everywhere All at Once** (2022): Best Picture, swept the Oscars
- **The Whale** (2022): Brendan Fraser's comeback

**The Misses (That Still Matter):**

Not everything is a hit, but even A24's failures are interesting. They take risks that studios won't. Some experiments don't work, and that's okay.

**The Influence:**

Other studios now chase the "A24 aesthetic." Indie films get theatrical releases again. Directors have more leverage. Audiences expect more from genre films.

**Criticisms:**

- Some argue they've created a new formula that's becoming predictable
- The "elevated" label can be pretentious
- Success has made them more risk-averse

**What's Next:**

A24 is expanding into TV, video games, and more. The question is whether they can maintain their identity at scale.

What's your favorite A24 film?`,
    },

    // MUSIC (4 posts)
    {
      community: 'music',
      title: 'Why Vinyl Is Making a Comeback: More Than Just Nostalgia',
      body: `Vinyl sales have grown for 17 consecutive years. In 2023, they outsold CDs for the first time since 1987. As someone who runs a record store, I can tell you it's not just hipster nostalgia—there are real reasons vinyl resonates.

**The Tangible Experience:**

In an age of streaming, vinyl offers something physical. You hold the album, study the artwork, read the liner notes. It's an object, not just data. For many, this tangibility creates a deeper connection to the music.

**The Ritual:**

Playing vinyl is intentional:
1. Choose an album (a commitment)
2. Remove from sleeve (careful handling)
3. Place on turntable (physical interaction)
4. Drop the needle (anticipation)
5. Sit and listen (no skipping)

This ritual forces active listening. You can't shuffle. You experience the album as the artist intended.

**The Sound Debate:**

Does vinyl sound "better"? It's complicated.

**Vinyl advantages:**
- Analog warmth (some frequencies are more natural)
- No digital compression artifacts
- Mastering often differs (less loudness war)

**Digital advantages:**
- Higher dynamic range potential
- No surface noise
- Perfect reproduction every time

The "warmth" people love is technically distortion—but it's pleasing distortion. Our ears evolved with analog sound.

**The Collector Aspect:**

Vinyl creates collectors. Limited pressings, colored variants, special editions. It's a hobby beyond just listening. Some records appreciate in value. It's tangible in a way Spotify playlists can never be.

**The Community:**

Record stores are gathering places. Record Store Day is a holiday. Crate digging is an adventure. There's a social element that streaming lacks.

**Getting Started:**

**Budget setup ($200-300):**
- Audio-Technica AT-LP60X turntable
- Edifier R1280T powered speakers
- That's it. You're spinning.

**Mid-range ($500-800):**
- Audio-Technica AT-LP120X
- Better cartridge
- Separate amp and passive speakers

**Avoid:**
- Crosley/Victrola suitcase players (damage records)
- All-in-one systems (poor sound quality)

What's your vinyl story? What album would you recommend for someone's first purchase?`,
    },
    {
      community: 'music',
      title: 'How Streaming Changed Music: The Good, Bad, and Complicated',
      body: `Streaming killed the album. Streaming saved the industry. Streaming exploits artists. Streaming democratized music. All of these are true simultaneously. Let's untangle the complicated reality.

**The Good:**

**Access**
For $10/month, you have access to virtually all recorded music. In 1999, that would cost thousands in CDs. Discovery is frictionless. You can explore entire genres in an afternoon.

**Artist Discovery**
Algorithms introduce listeners to new artists. Playlist placement can launch careers. Artists don't need label support to find audiences. The gatekeepers have less power.

**Data**
Artists know exactly who's listening, where, when. They can plan tours around listener geography. They understand their audience intimately.

**The Bad:**

**Artist Compensation**
Spotify pays $0.003-0.005 per stream. An artist needs 250,000 streams to earn minimum wage for a month. Only the top 1% of artists can live on streaming alone.

**The Album Is Dead**
Playlists dominate. Songs are optimized for playlist placement—front-loaded hooks, shorter lengths. The album as artistic statement is endangered.

**Catalog Devaluation**
Music is now a utility, like water. It's always on, always available. This devalues the art form itself.

**The Complicated:**

**Who Benefits?**
- Major labels: Thriving (they own catalog)
- Streaming services: Barely profitable
- Top artists: Doing fine
- Mid-tier artists: Struggling more than ever
- New artists: Mixed—easier to start, harder to sustain

**The Attention Economy**
There's too much music. 100,000 tracks uploaded to Spotify daily. Standing out is nearly impossible. The competition isn't other musicians—it's TikTok, Netflix, everything.

**What Artists Are Doing:**

1. **Touring**: Live shows are now the primary income
2. **Merchandise**: Direct-to-fan sales
3. **Sync licensing**: TV, film, games, ads
4. **Patreon/Bandcamp**: Direct fan support
5. **Vinyl releases**: Higher margins, collector value

**The Future:**

- Higher streaming payouts (unlikely without regulation)
- Artist-owned platforms (some experimenting)
- AI-generated music (complicated implications)
- Return to ownership models (some artists pulling catalog)

What's your take on streaming's impact?`,
    },
    {
      community: 'music',
      title: 'Music Theory Basics: Understanding Why Songs Work',
      body: `You don't need music theory to enjoy music, but understanding it deepens appreciation. Here's a practical introduction that won't put you to sleep.

**The Building Blocks:**

**Notes and Scales**
Western music uses 12 notes (the chromatic scale). Most songs use 7 of these (a major or minor scale). The scale determines the song's "mood."

- Major scale: Happy, bright (think "Happy Birthday")
- Minor scale: Sad, dark (think "Greensleeves")

**Chords**
Stack notes together, you get chords. Most pop music uses just 4 chords:
- I (tonic): Home base
- IV (subdominant): Movement away
- V (dominant): Tension, wants to resolve
- vi (relative minor): Emotional depth

The I-V-vi-IV progression is everywhere: "Let It Be," "No Woman No Cry," "With or Without You," thousands more.

**Rhythm**
The pattern of beats. Most Western music is in 4/4 time (four beats per measure). Emphasis on beats 1 and 3 feels "square." Emphasis on 2 and 4 feels "groovy" (rock, pop, hip-hop).

**Why Certain Songs Feel Good:**

**Tension and Release**
Music creates tension (dissonance, dominant chords) then releases it (resolution, tonic). This mirrors emotional experience. We crave resolution.

**Repetition with Variation**
Hooks work because they repeat. But pure repetition is boring. Great songs vary the hook slightly each time—different lyrics, added instruments, key change.

**The Unexpected**
When a song subverts expectation—a chord you didn't predict, a rhythm shift—it grabs attention. But it must resolve satisfyingly.

**Practical Listening:**

Next time you hear a song:
1. Find the beat (tap along)
2. Identify the chord progression (does it repeat?)
3. Notice the structure (verse, chorus, bridge)
4. Listen for tension and release

**Resources to Learn More:**
- 12tone (YouTube): Theory analysis of popular songs
- Adam Neely (YouTube): Deep dives into music concepts
- Hooktheory: Interactive chord progression tools
- musictheory.net: Free lessons

What song would you like analyzed from a theory perspective?`,
    },
    {
      community: 'music',
      title: 'Building a Home Recording Studio: From Bedroom to Professional Sound',
      body: `You don't need a professional studio to make professional-sounding recordings. I've recorded albums in bedrooms that have charted. Here's how to build a capable home studio at any budget.

**The Essentials (What You Actually Need):**

1. **Computer**: Any modern laptop/desktop works
2. **DAW (Digital Audio Workstation)**: Software to record/edit
3. **Audio Interface**: Converts analog to digital
4. **Microphone**: Captures sound
5. **Headphones**: For monitoring
6. **Acoustic Treatment**: Controls room sound

**Budget Tier ($300-500):**

- **Interface**: Focusrite Scarlett Solo ($110)
- **Microphone**: Audio-Technica AT2020 ($100)
- **Headphones**: Audio-Technica ATH-M50x ($150)
- **DAW**: Reaper ($60) or GarageBand (free)
- **Acoustic Treatment**: DIY panels ($50)

This setup can produce release-quality recordings. Seriously.

**Mid-Range ($1000-2000):**

- **Interface**: Universal Audio Volt 2 or Audient iD14 ($200-300)
- **Microphone**: Rode NT1-A or Shure SM7B ($250-400)
- **Preamp**: Warm Audio WA12 ($400)
- **Monitors**: Yamaha HS5 ($400/pair)
- **Better acoustic treatment** ($200-400)

**The Room Matters Most:**

A $5000 microphone in a bad room sounds worse than a $100 microphone in a treated room. Focus on:

1. **Bass traps**: Corners accumulate bass
2. **Absorption panels**: Reduce reflections
3. **Diffusion**: Scatter sound (bookshelves work!)
4. **Positioning**: Don't sit in the center of the room

**Common Mistakes:**

1. **Buying gear before learning**: Software skills matter more than hardware
2. **Ignoring the room**: Treatment before upgrades
3. **Too much gear**: Limitations breed creativity
4. **Chasing "that sound"**: Your sound is valid
5. **Not finishing songs**: Completion beats perfection

**The Learning Path:**

1. Learn your DAW inside out
2. Study mixing (YouTube is free education)
3. Analyze reference tracks
4. Practice, finish songs, get feedback
5. Upgrade gear only when you've hit limits

**Free Resources:**
- Produce Like a Pro (YouTube)
- Pensado's Place
- Recording Revolution
- r/audioengineering

What's your current setup? What are you trying to record?`,
    },

    // BOOKS (4 posts)
    {
      community: 'books',
      title: 'How to Read More: Practical Strategies That Actually Work',
      body: `I went from reading 5 books a year to 50+. It wasn't about finding more time—it was about changing my relationship with reading. Here's what worked.

**The Mindset Shifts:**

**1. Quit Books Without Guilt**
Life's too short for books you're not enjoying. If you're 50 pages in and dreading picking it up, stop. This isn't school. There's no test. Move on.

**2. Reading Isn't a Competition**
Goodreads challenges can be motivating but also toxic. Reading 100 short books isn't better than reading 20 challenging ones. Quality over quantity.

**3. Multiple Books at Once**
I always have 3-4 books going:
- Fiction for evenings
- Non-fiction for mornings
- Audiobook for commutes
- "Comfort read" for when nothing else appeals

Match the book to your mental state.

**Practical Strategies:**

**Replace Scrolling with Reading**
Put your Kindle app on your phone's home screen. When you reach for social media, read instead. Even 5 minutes adds up.

**Read Before Bed**
30 minutes of reading before sleep beats 30 minutes of screens. Better sleep AND more books.

**Audiobooks Count**
Audiobooks are reading. Period. They're perfect for commutes, exercise, chores. 2x speed is fine once you adjust.

**Carry a Book Everywhere**
Waiting rooms, lines, lunch breaks—dead time becomes reading time.

**The 10-Page Rule**
Commit to 10 pages. That's it. Most days, you'll keep going. Some days, 10 pages is enough. Progress is progress.

**Finding Books You'll Actually Read:**

- Ask friends with similar taste
- Follow reviewers you trust
- Browse bookstores (physical browsing beats algorithms)
- Reread favorites (it's allowed!)
- Follow authors you love on social media

**Building the Habit:**

1. **Start small**: 10 minutes daily
2. **Same time, same place**: Create a ritual
3. **Track progress**: Goodreads, spreadsheet, journal
4. **Join a community**: Book clubs, r/books, Discord servers
5. **Celebrate**: Finishing a book is an achievement

**What Changed for Me:**

I stopped treating reading as self-improvement and started treating it as pleasure. I read what I want, when I want, at whatever pace I want. The numbers followed naturally.

What's stopping you from reading more?`,
    },
    {
      community: 'books',
      title: 'The Art of Rereading: Why Returning to Books Matters',
      body: `In our culture of consumption, rereading feels wasteful. So many books, so little time—why revisit old ones? But rereading is one of the most rewarding things you can do with a book.

**Why Reread:**

**1. You're Different Now**
The book hasn't changed, but you have. Reading "The Great Gatsby" at 17 and 35 are entirely different experiences. Your life experience adds layers of meaning.

**2. You Missed Things**
First reads are about plot. What happens next? Rereads let you notice craft, foreshadowing, themes, prose style. The architecture becomes visible.

**3. Comfort and Familiarity**
Sometimes you don't want surprise. You want to visit old friends. There's profound comfort in returning to beloved stories.

**4. Deeper Understanding**
Complex books reveal themselves over multiple readings. I've read "Infinite Jest" three times and understand it differently each time.

**Books That Reward Rereading:**

**Dense Literary Fiction:**
- Ulysses (Joyce)
- Infinite Jest (Wallace)
- The Brothers Karamazov (Dostoevsky)

**Layered Genre Fiction:**
- Dune (Herbert)
- The Name of the Wind (Rothfuss)
- Piranesi (Clarke)

**Childhood Favorites:**
- Harry Potter series
- His Dark Materials
- The Hobbit

**Philosophy/Non-Fiction:**
- Meditations (Marcus Aurelius)
- Man's Search for Meaning (Frankl)

**How to Reread:**

**Immediate Reread**
Finish a book, start again. See the beginning with knowledge of the end. Great for mysteries and twist-heavy narratives.

**Annual Traditions**
Some books become rituals. I read "A Christmas Carol" every December. "The Lord of the Rings" every few years.

**Decade Gaps**
Return to books from different life stages. High school favorites, college reads, books from major life transitions.

**Different Formats**
Read it in print, then listen to the audiobook. Different narrators offer different interpretations.

**The Permission:**

You don't need permission to reread. It's not cheating. It's not lazy. It's one of reading's great pleasures.

What book have you reread most? What did you discover on subsequent readings?`,
    },
    {
      community: 'books',
      title: 'Building a Personal Library: Curation Over Collection',
      body: `I used to buy every book I wanted to read. My shelves overflowed with unread volumes. Then I realized: a library should be curated, not accumulated. Here's my philosophy.

**The Shift:**

A personal library isn't a trophy case. It's a tool for living. The books on your shelves should serve a purpose:
- Reference and rereading
- Lending to friends
- Inspiration and comfort
- Reflection of who you are

**The Curation Process:**

**1. The One-Year Rule**
If you haven't touched a book in a year and won't reference it again, it goes. Exceptions for genuine favorites.

**2. Borrow Before Buying**
Library first. If you love it enough to reread, buy it. This alone cut my purchases by 70%.

**3. Quality Over Quantity**
One beautiful edition beats five cheap paperbacks. Invest in books that will last and that you'll want to display.

**4. Regular Purges**
Every year, I remove 10-20% of my collection. Books go to friends, Little Free Libraries, or used bookstores. Someone else will love them.

**What Stays:**

- Books I'll definitely reread
- Reference works I actually use
- Books with sentimental value
- Beautiful editions worth displaying
- Books I lend frequently

**What Goes:**

- "I should read this someday" (you won't)
- Books you finished but didn't love
- Outdated non-fiction
- Duplicates
- Books you keep from guilt

**Organization:**

I've tried many systems. What works:
- Fiction alphabetical by author
- Non-fiction by subject
- Favorites in prominent positions
- TBR pile separate and visible

**The Digital Question:**

E-books are great for:
- Travel
- Trying new authors
- Books you'll read once
- Saving space

Physical books are better for:
- Rereading favorites
- Reference
- Lending
- The experience

Both have their place.

**Building Intentionally:**

Before buying, ask:
1. Will I reread this?
2. Will I lend this?
3. Does this represent who I am?
4. Do I have space for this?

If no to all four, borrow it.

What's your library philosophy?`,
    },
    {
      community: 'books',
      title: 'Genre Fiction Deserves Respect: A Defense of "Popular" Literature',
      body: `Literary snobbery is tiresome. The distinction between "literary fiction" and "genre fiction" is often arbitrary, and the dismissal of genre fiction ignores some of the most important writing being done today.

**The False Hierarchy:**

Somewhere along the way, we decided that:
- Literary fiction = serious, artistic, worthy
- Genre fiction = escapist, formulaic, lesser

This is nonsense. Shakespeare wrote for popular audiences. Dickens was a bestselling serialist. "Literary" is often just "genre fiction that academics approve of."

**Genre Fiction's Strengths:**

**1. Accessibility**
Genre fiction welcomes readers. It doesn't demand credentials. It meets people where they are. Getting someone to read anything is a victory.

**2. Innovation**
Genre fiction experiments constantly. Science fiction predicted the internet, questioned gender, explored consciousness. Horror examines our deepest fears. Romance centers emotional intelligence.

**3. Craft**
Writing a great mystery requires extraordinary skill. Plotting, pacing, misdirection, fair play with the reader. It's not easier than literary fiction—it's differently difficult.

**4. Social Commentary**
Genre fiction can critique society while entertaining. "The Handmaid's Tale" is science fiction. "1984" is science fiction. "Get Out" is horror. Genre provides cover for radical ideas.

**The Best Genre Fiction:**

**Science Fiction:**
- Ursula K. Le Guin (literary AND genre)
- Octavia Butler
- Ted Chiang
- Kim Stanley Robinson

**Fantasy:**
- Gene Wolfe (prose as good as any "literary" writer)
- Susanna Clarke
- N.K. Jemisin

**Mystery/Thriller:**
- Tana French
- Gillian Flynn
- Dennis Lehane

**Horror:**
- Shirley Jackson
- Stephen King (yes, really)
- Carmen Maria Machado

**The Real Distinction:**

Good books vs. bad books. That's it. There's mediocre literary fiction and brilliant genre fiction. Judge books individually, not by category.

**Reading Widely:**

The best readers cross boundaries. Literary fiction can learn from genre's pacing and plot. Genre can learn from literary fiction's prose and interiority. Read both. Read everything.

What genre fiction do you think deserves more respect?`,
    },

    // TRAVEL (4 posts)
    {
      community: 'travel',
      title: 'Slow Travel: Why Spending More Time in Fewer Places Changed Everything',
      body: `I used to travel like I was checking boxes. Five countries in two weeks. See the highlights, take the photos, move on. I was exhausted and couldn't remember half of what I'd seen. Then I discovered slow travel.

**What Is Slow Travel?**

Instead of rushing through destinations, you stay longer in fewer places. A month in one city instead of a week in four. The goal shifts from "seeing" to "experiencing."

**Why It's Better:**

**1. Deeper Understanding**
You learn the rhythms of a place. The quiet café locals actually use. The park where families gather on Sundays. The neighborhood that tourists miss.

**2. Reduced Stress**
No rushing to catch connections. No packing and unpacking every few days. You can have a slow morning. You can get sick without ruining your trip.

**3. Real Connections**
Stay long enough and you become a regular. The barista knows your order. The shopkeeper greets you. You make actual friends.

**4. Better Value**
Weekly/monthly rentals are cheaper than hotels. Cooking saves money. You're not paying for constant transportation.

**5. Sustainability**
Fewer flights. Less transportation. Lower carbon footprint. Tourism that benefits local economies more directly.

**How to Do It:**

**Accommodation:**
- Airbnb monthly discounts
- House sitting (TrustedHousesitters)
- Sublets
- Hostels with private rooms

**Mindset Shifts:**
- You don't need to see everything
- Boring days are okay
- Routines are allowed
- Missing "must-sees" is fine

**Practical Tips:**
- Choose one base, take day trips
- Learn basic local language
- Shop at local markets
- Find a regular café/bar
- Walk everywhere possible

**My Experience:**

I spent two months in Lisbon instead of two weeks in Portugal. I found my favorite pastelaria, learned enough Portuguese to chat with neighbors, discovered neighborhoods no guidebook mentioned, and made friends I still visit years later.

The photos from that trip are mostly of ordinary moments. They mean more than any landmark shot.

**When Fast Travel Makes Sense:**

- Limited vacation time (reality for most)
- First visits to regions (overview before deep dive)
- Specific events (festivals, conferences)

**The Hybrid Approach:**

Even with limited time, you can slow down. Instead of three cities in a week, do one. Instead of five attractions daily, do two. Quality over quantity.

How do you approach travel pacing?`,
    },
    {
      community: 'travel',
      title: 'Solo Travel: Overcoming Fear and Finding Freedom',
      body: `My first solo trip terrified me. Eating alone? Navigating foreign cities alone? What if something went wrong? Now, solo travel is my preferred way to see the world. Here's what I've learned.

**The Fears (And Reality):**

**"I'll be lonely"**
Reality: You meet more people solo. Other travelers approach you. Locals engage more. You're forced out of your comfort zone.

**"It's dangerous"**
Reality: With basic precautions, solo travel is as safe as traveling with others. Trust your instincts. Research destinations. Stay aware.

**"I'll look weird eating alone"**
Reality: Nobody cares. Bring a book. People-watch. Enjoy your food. It becomes liberating.

**"I won't know what to do"**
Reality: You can do whatever you want. Sleep in. Stay out late. Change plans spontaneously. It's freedom.

**The Benefits:**

**1. Complete Freedom**
No compromising on restaurants, activities, or pace. Your trip, your rules.

**2. Self-Discovery**
Who are you when there's no one to perform for? What do you actually enjoy? Solo travel reveals answers.

**3. Confidence Building**
Every problem you solve alone builds confidence. Navigate a foreign subway? Confidence. Handle a cancelled flight? Confidence.

**4. Present Moment**
Without a travel partner to chat with, you're more present. You notice more. You experience more deeply.

**Practical Tips:**

**Safety:**
- Share your itinerary with someone at home
- Check in regularly
- Trust your gut
- Research neighborhoods before booking
- Keep copies of important documents

**Loneliness Management:**
- Stay in hostels (social by design)
- Join walking tours
- Take classes (cooking, language, art)
- Use apps (Meetup, Couchsurfing hangouts)
- Schedule video calls with home

**Dining Alone:**
- Sit at the bar (more social)
- Bring a book or journal
- Lunch is easier than dinner
- Street food is inherently social

**First Solo Trip Recommendations:**

**Easy Mode:**
- Portugal (safe, English-friendly, affordable)
- Japan (incredibly safe, efficient)
- Iceland (small, safe, English-speaking)

**Medium:**
- Mexico City (vibrant, welcoming)
- Thailand (backpacker infrastructure)
- Spain (social culture, good transit)

**The Transformation:**

Solo travel changed me fundamentally. I'm more confident, more adaptable, more comfortable with myself. The person who returns is different from the person who left.

Have you traveled solo? What held you back or pushed you forward?`,
    },
    {
      community: 'travel',
      title: 'Budget Travel Secrets: How I Travel Full-Time on $30/Day',
      body: `I've been traveling continuously for three years on an average of $30/day, including accommodation. It's not about deprivation—it's about priorities and knowledge. Here's everything I've learned.

**The Big Three (Where Money Goes):**

**1. Accommodation (40%)**
- Hostels: $8-25/night (dorms)
- Couchsurfing: Free (meet locals too)
- House sitting: Free (TrustedHousesitters, $129/year)
- Work exchange: Free (Workaway, HelpX)
- Camping: $0-15/night

**2. Transportation (30%)**
- Walk whenever possible
- Buses over trains over planes
- Book in advance for major routes
- Use local transit, not taxis
- Overnight buses (save a night's accommodation)

**3. Food (25%)**
- Cook in hostel kitchens
- Street food over restaurants
- Markets over supermarkets
- Picnic lunches
- Splurge occasionally (you're traveling!)

**Country Selection Matters:**

Daily budget varies wildly by destination:
- Southeast Asia: $20-30/day easy
- Eastern Europe: $30-40/day
- South America: $25-40/day
- Western Europe: $50-70/day (harder)
- Scandinavia: $80+/day (very hard)

Choose destinations that match your budget.

**Money-Saving Hacks:**

**Flights:**
- Use Skyscanner "everywhere" search
- Be flexible on dates (±3 days)
- Budget airlines + carry-on only
- Error fares (Secret Flying, The Flight Deal)

**Accommodation:**
- Book direct (often cheaper than Booking.com)
- Negotiate for longer stays
- Shoulder season = lower prices
- Stay outside city centers

**Activities:**
- Free walking tours (tip-based)
- Museum free days
- Hiking (nature is free)
- People-watching (also free)

**The Mindset:**

Budget travel isn't about suffering. It's about:
- Experiences over comfort
- Connections over convenience
- Flexibility over luxury
- Time over money

**What I Spend On:**

- Experiences I can't get elsewhere
- Good coffee (my vice)
- Occasional nice meals
- Safety (never cheap on that)

**What I Skip:**

- Fancy accommodation
- Tourist trap restaurants
- Guided tours (usually)
- Souvenirs

**Sample Daily Budget (Southeast Asia):**

- Hostel dorm: $8
- Breakfast (included): $0
- Street food lunch: $3
- Street food dinner: $4
- Coffee: $2
- Transport: $3
- Activity: $5
- **Total: $25**

**Is It Sustainable?**

Physically: Yes, if you take rest days
Mentally: Yes, if you enjoy the lifestyle
Financially: Yes, if you have remote income or savings

What budget travel questions do you have?`,
    },
    {
      community: 'travel',
      title: 'Sustainable Travel: Reducing Your Impact Without Ruining Your Trip',
      body: `Tourism has a dark side. Overtourism destroys communities. Flights accelerate climate change. "Authentic" experiences can exploit locals. But we can travel better. Here's how.

**The Uncomfortable Truth:**

A single transatlantic flight produces more CO2 than many people emit in a year. Tourism can displace locals, raise housing costs, and commodify culture. We should acknowledge this honestly.

**What We Can Do:**

**1. Fly Less, Stay Longer**
The biggest impact is flights. One long trip beats multiple short trips. If you fly somewhere, stay long enough to justify the emissions.

**2. Choose Destinations Wisely**
- Avoid overtouristed places in peak season
- Visit emerging destinations that need tourism
- Consider domestic/regional travel
- Research how tourism affects locals

**3. Transportation Choices**
Impact ranking (worst to best):
- Cruise ships (worst polluters)
- Flights
- Cars (single occupancy)
- Cars (shared)
- Buses
- Trains
- Bikes/walking

**4. Accommodation**
- Local guesthouses over international chains
- Airbnb is complicated (can raise local rents)
- Eco-lodges when legitimate
- Camping/hostels (lower footprint)

**5. Activities**
Avoid:
- Elephant riding
- Tiger temples
- Swimming with captive dolphins
- Voluntourism (often harmful)

Choose:
- Locally-owned tour operators
- Community-based tourism
- Wildlife sanctuaries (research them)
- Walking/biking tours

**6. Economic Impact**
- Eat at local restaurants
- Buy from local artisans
- Hire local guides
- Avoid all-inclusive resorts (money doesn't reach community)

**The Carbon Offset Debate:**

Offsets are controversial. They can:
- Fund legitimate reforestation/renewable projects
- Be greenwashing that doesn't actually help
- Create moral license to pollute more

My take: Offset if you fly, but don't pretend it makes flying carbon-neutral. It's harm reduction, not absolution.

**Realistic Expectations:**

Perfect sustainable travel doesn't exist. We make trade-offs. The goal is improvement, not perfection.

**What I Do:**

- Fly only for major trips (once or twice a year)
- Take trains when possible (even if slower)
- Stay in locally-owned accommodation
- Eat local, shop local
- Research destinations for overtourism issues
- Offset flights (while acknowledging limitations)

**The Bigger Picture:**

Individual choices matter, but systemic change matters more. Support policies that:
- Tax aviation fuel
- Invest in rail infrastructure
- Regulate cruise ship emissions
- Protect communities from overtourism

How do you balance travel desires with environmental concerns?`,
    },

    // TECHNOLOGY (4 posts)
    {
      community: 'technology',
      title: 'The State of AI in 2024: What Actually Works and What\'s Hype',
      body: `AI is everywhere in the headlines. Revolutionary breakthroughs announced weekly. But what actually works in practice? As someone who implements AI systems professionally, let me separate reality from hype.

**What Actually Works:**

**1. Large Language Models (ChatGPT, Claude, etc.)**
- Writing assistance: drafts, editing, brainstorming
- Code generation: boilerplate, debugging, explanation
- Translation: remarkably good for most languages
- Summarization: extracting key points from documents

Limitations: Hallucinations, outdated knowledge, can't verify facts, struggles with math and logic.

**2. Image Generation (Midjourney, DALL-E, Stable Diffusion)**
- Concept art and ideation
- Marketing materials
- Stock photo replacement
- Creative exploration

Limitations: Hands/fingers issues, text in images, consistency across images, copyright concerns.

**3. Code Assistants (Copilot, Cursor)**
- Autocomplete on steroids
- Boilerplate generation
- Documentation writing
- Bug identification

Limitations: Security vulnerabilities, outdated patterns, doesn't understand your codebase deeply.

**4. Specialized AI**
- Medical imaging analysis (FDA-approved tools)
- Fraud detection (banking)
- Recommendation systems (Netflix, Spotify)
- Voice assistants (limited but useful)

**What's Overhyped:**

**1. "AGI is coming soon"**
We're nowhere close to general intelligence. Current AI is pattern matching at scale. It doesn't understand, reason, or have goals.

**2. "AI will replace all jobs"**
AI augments more than replaces. The jobs that disappear are usually the ones we wanted automated anyway. New jobs emerge.

**3. "AI is conscious/sentient"**
It's not. It's very good at mimicking patterns in training data. There's no "there" there.

**4. Self-driving cars**
Level 5 autonomy (no human needed ever) is still years away. Current systems are impressive but limited.

**Practical AI Adoption:**

**For Individuals:**
- Use ChatGPT/Claude as a thinking partner
- Try image generation for creative projects
- Use AI transcription (Whisper, Otter)
- Experiment with code assistants

**For Businesses:**
- Start with clear, bounded use cases
- Don't trust AI output without verification
- Consider privacy implications
- Build human oversight into workflows

**The Real Concerns:**

- Misinformation at scale
- Job displacement in specific sectors
- Privacy and data usage
- Concentration of power in few companies
- Environmental cost of training

**My Predictions:**

- AI assistants become standard tools (like Google)
- Creative AI gets better but remains controversial
- Enterprise AI adoption accelerates
- Regulation increases globally
- The hype cycle continues

What's your experience with AI tools?`,
    },
    {
      community: 'technology',
      title: 'Privacy in 2024: Practical Steps to Protect Yourself Online',
      body: `Your data is the product. Every click, search, and purchase is tracked, analyzed, and sold. Complete privacy is impossible, but you can significantly reduce your exposure. Here's a practical guide.

**The Threat Model:**

Before going full paranoid, consider what you're protecting against:
- **Advertisers**: Want your attention and data
- **Data brokers**: Sell your information
- **Hackers**: Want your money/identity
- **Governments**: Surveillance (varies by country)
- **Corporations**: Building profiles for profit

Most people need protection from the first three. Adjust based on your situation.

**Quick Wins (Do These Today):**

**1. Password Manager**
- Use one (Bitwarden is free and excellent)
- Unique password for every site
- Long, random passwords
- Enable 2FA everywhere possible

**2. Browser Privacy**
- Firefox or Brave over Chrome
- Install uBlock Origin (ad/tracker blocker)
- Use private browsing for sensitive searches
- Consider a VPN for public WiFi

**3. Phone Privacy**
- Review app permissions regularly
- Disable location for apps that don't need it
- Use Signal for messaging
- Turn off ad personalization

**4. Email**
- Don't use email for sensitive communication
- Consider ProtonMail for privacy-focused email
- Use email aliases for signups (SimpleLogin)
- Unsubscribe aggressively

**Medium Effort (Worth Doing):**

**Search Engines:**
- DuckDuckGo (no tracking)
- Startpage (Google results, no tracking)
- Brave Search

**Social Media:**
- Minimize usage
- Review privacy settings
- Don't post personal details
- Consider deleting accounts

**Smart Home:**
- Every device is a microphone
- Segment IoT on separate network
- Research before buying
- Consider: do you need this?

**Financial:**
- Virtual credit card numbers
- Monitor credit reports
- Freeze credit if not actively applying

**Advanced (For Higher Threat Models):**

- Tor Browser for anonymous browsing
- Tails OS for sensitive activities
- Hardware security keys (YubiKey)
- Encrypted email (PGP)
- Faraday bags for phones

**The Reality Check:**

Perfect privacy requires sacrificing convenience. Find your balance:
- What data are you comfortable sharing?
- What inconvenience will you tolerate?
- What's your actual threat model?

**What Companies Know:**

- Google: Searches, location, email, purchases
- Facebook: Social graph, interests, browsing history
- Amazon: Purchase history, Alexa recordings
- Your ISP: Every website you visit

**Taking Back Control:**

1. Request your data (GDPR/CCPA rights)
2. Delete old accounts
3. Opt out of data brokers
4. Use privacy-respecting alternatives
5. Pay for products (you're not the product)

What privacy measures have you implemented?`,
    },
    {
      community: 'technology',
      title: 'Mechanical Keyboards: Why People Spend $300 on Typing',
      body: `To outsiders, the mechanical keyboard hobby seems insane. $300 for a keyboard? Custom keycaps? Lubing switches? But once you understand, it makes perfect sense. Let me explain.

**Why Mechanical Keyboards?**

**1. Feel**
Every keystroke on a mechanical keyboard provides tactile feedback. You feel the actuation. It's satisfying in a way membrane keyboards can't match.

**2. Sound**
The "thock" of a well-built keyboard is ASMR for your fingers. Different switches, cases, and modifications create different sounds.

**3. Durability**
Mechanical switches are rated for 50-100 million keystrokes. Your keyboard will outlast you.

**4. Customization**
Everything is modular. Switches, keycaps, cases, cables. Build exactly what you want.

**5. Ergonomics**
Better keyboards reduce strain. Split keyboards, tenting, different layouts—find what works for your body.

**Switch Types:**

**Linear (Red, Black)**
- Smooth keystroke, no bump
- Quiet (relatively)
- Gaming favorite

**Tactile (Brown, Clear)**
- Bump at actuation point
- Feedback without click
- Typing favorite

**Clicky (Blue, Green)**
- Audible click at actuation
- Maximum feedback
- Annoying to others

**The Rabbit Hole:**

**Level 1: Pre-built ($50-150)**
- Keychron, Ducky, Leopold
- Great out of the box
- Limited customization

**Level 2: Hot-swappable ($100-200)**
- Swap switches without soldering
- Try different switches
- Easy modifications

**Level 3: Custom builds ($200-500)**
- Choose every component
- Solder or hot-swap
- Unique to you

**Level 4: Group buys and artisans ($500+)**
- Limited edition keyboards
- Handmade artisan keycaps
- Months of waiting
- Community involvement

**Modifications:**

**Lubing switches**: Smoother, quieter
**Filming switches**: Tighter housing
**Foam**: Dampens sound
**Band-aid mod**: Stabilizer improvement
**O-rings**: Quieter bottom-out

**Recommended Entry Points:**

**Budget ($50-80):**
- Keychron C3 Pro
- Royal Kludge RK68

**Mid-range ($100-150):**
- Keychron Q series
- GMMK Pro

**Premium ($200+):**
- Mode Sonnet
- Zoom65

**The Community:**

r/MechanicalKeyboards is one of the friendliest hobby communities. People share builds, help newcomers, and organize group buys. It's surprisingly wholesome.

**Is It Worth It?**

If you type for hours daily, yes. A good keyboard is an investment in your primary tool. The satisfaction of a perfect keystroke is real.

What's your keyboard setup?`,
    },
    {
      community: 'technology',
      title: 'Right to Repair: Why You Should Care About Fixing Your Own Stuff',
      body: `Your phone screen cracks. The manufacturer wants $300 to fix it. A local shop could do it for $80, but they can't get genuine parts. You could do it yourself for $30, but the phone is designed to prevent that. This is the Right to Repair fight.

**The Problem:**

Modern devices are increasingly:
- Glued shut (not screwed)
- Using proprietary parts
- Software-locked to prevent repairs
- Designed to be replaced, not fixed

Manufacturers profit from this. Consumers and the environment lose.

**Real Examples:**

**Apple:**
- Pairs components to motherboards (replacing screen disables features)
- Sues repair shops
- Lobbies against repair legislation
- Recently improved (under pressure)

**John Deere:**
- Tractors require dealer software to repair
- Farmers can't fix their own equipment
- Harvest delays cost thousands

**Medical Devices:**
- Hospitals can't repair ventilators
- During COVID, this was literally life-threatening

**Smartphones:**
- Batteries glued in
- Proprietary screws
- Parts pairing

**Why It Matters:**

**1. Your Property Rights**
You bought it. You should be able to fix it. Manufacturers argue you're "licensing" the software, not owning the device.

**2. Environmental Impact**
E-waste is catastrophic. 50 million tons annually. Devices designed for repair last longer. Repair reduces waste.

**3. Cost**
Manufacturer repairs cost 3-10x independent repairs. This is a tax on consumers.

**4. Rural/Developing Areas**
No authorized repair center nearby? Too bad. Right to repair enables local economies.

**5. Competition**
Repair monopolies stifle innovation. Independent shops often develop better techniques.

**The Movement:**

**Legislative Progress:**
- EU: Universal chargers, repairability scores
- US: State-level bills passing (NY, Minnesota, California)
- FTC: Increased enforcement against repair restrictions

**Manufacturer Response:**
- Apple Self Service Repair (limited, expensive)
- Framework Laptop (designed for repair)
- Fairphone (modular, repairable)

**What You Can Do:**

**Buy Repairable:**
- Check iFixit repairability scores
- Choose brands that support repair
- Avoid glued, sealed designs

**Learn to Repair:**
- iFixit guides (free)
- YouTube tutorials
- Local repair cafés

**Advocate:**
- Support repair legislation
- Contact representatives
- Share the message

**The Bigger Picture:**

Right to Repair is about who controls technology. Do manufacturers own your devices forever? Or do you actually own what you bought?

The answer affects everything from phones to cars to medical equipment to farm machinery.

Where do you stand on Right to Repair?`,
    },
  ];

  const posts = [];
  const postsWithData: Array<{ post: any; title: string; community: string }> = [];
  for (const postData of qualityPosts) {
    const community = communities.find(c => c.name === postData.community);
    if (community) {
      const post = await prisma.post.create({
        data: {
          title: postData.title,
          slug: slugify(postData.title),
          body: postData.body,
          post_type: 'text',
          authorId: randomElement(users).id,
          communityId: community.id,
          createdAt: randomDate(30),
        },
      });
      posts.push(post);
      postsWithData.push({ post, title: postData.title, community: postData.community });
    }
  }
  console.log(`✅ Created ${posts.length} high-quality posts`);

  // Post-specific comments mapped by title
  const postSpecificComments: { [key: string]: string[] } = {
    // PROGRAMMING POSTS
    'The Art of Writing Clean Code: Lessons from 10 Years of Software Development': [
      "This is exactly what I needed to read. I've been struggling with code reviews at my company - we tend to nitpick style issues while missing actual bugs. The distinction between blocking issues and preferences is crucial. We're implementing a 'MUST/SHOULD/COULD' labeling system for review comments now.",
      "The point about naming being the hardest problem resonates deeply. I spent 30 minutes yesterday debating whether to call a function `validateUser` or `checkUserValidity`. Ended up with `ensureUserIsValid` which I think captures the intent better.",
      "I'd add that pair programming can replace some code reviews entirely. When two people write the code together, you get real-time review and knowledge sharing. We've reduced our review backlog significantly since adopting this.",
      "The 'comments should explain why, not what' principle changed how I write code. I used to comment every function, now I only comment when there's actual business logic or a non-obvious decision.",
      "The refactoring continuously tip is gold. I used to wait for 'refactoring sprints' but by then the technical debt was overwhelming. Small refactors during feature work keeps the codebase healthy.",
      "Deleting dead code is so underrated. I cleaned out 2000 lines of unused code last month and the codebase is so much easier to navigate. Dead code is worse than no code.",
    ],
    'Understanding Big O Notation: A Practical Guide for Everyday Coding': [
      "Great breakdown of Big O! One thing I'd add: in practice, constants matter. An O(n) algorithm with a large constant can be slower than O(n log n) for realistic input sizes. Always benchmark with real data.",
      "The real-world application example is perfect. I had a similar experience optimizing a search feature from O(n²) to O(n log n). The difference was going from 5 seconds to 50ms on large datasets.",
      "The 'when NOT to obsess' section is important. I see junior devs over-optimizing simple loops that run once. Premature optimization is still the root of all evil.",
      "Binary search is such a powerful tool. I use it all the time for range queries and finding insertion points. The logarithmic complexity makes it perfect for large sorted datasets.",
      "The HashMap lookup example is spot on. I always tell new devs: if you're doing nested loops, there's probably a HashMap solution that's faster.",
    ],
    'Git Workflow Strategies: From Solo Projects to Enterprise Teams': [
      "The Git workflow section is gold. We switched from GitFlow to trunk-based development last year and our deployment frequency went from monthly to daily. The key was investing in feature flags first.",
      "Feature branches vs trunk-based is such a hot debate. We use short-lived feature branches (max 2 days) and it's been a game changer. Less merge conflicts, faster feedback.",
      "The rebase vs merge discussion never ends. I prefer rebase for cleaner history, but I know teams that swear by merge commits for traceability. Both work if you're consistent.",
      "Git hooks for pre-commit checks saved our team. We run linters, tests, and type checks before any commit. Catches issues before they hit CI.",
    ],
    'Debugging Like a Detective: Systematic Approaches to Finding Bugs': [
      "Debugging like a detective is such an apt metaphor. I keep a 'debugging journal' where I write down my hypotheses before testing them. It prevents me from going in circles and helps me learn from each bug.",
      "The rubber duck method saved my sanity. I have a literal rubber duck on my desk. My colleagues thought I was crazy until they tried it themselves. Now we have a whole flock.",
      "One addition to the debugging section: `git bisect` is incredibly powerful for finding regression bugs. It binary searches through commits to find exactly when a bug was introduced.",
      "Systematic debugging beats random guessing every time. I follow a strict process: reproduce, isolate, hypothesize, test, fix. It's slower at first but much faster overall.",
    ],
    // GAMING POSTS
    'The Evolution of Open World Games: From GTA III to Elden Ring': [
      "The evolution from GTA III to modern open worlds is fascinating. I remember being blown away that you could just... go anywhere. Now I take it for granted. Elden Ring reminded me of that wonder by hiding so much off the beaten path.",
      "Elden Ring's approach to open world design is brilliant. No map markers, no quest logs telling you exactly where to go. You discover things organically. It's how open worlds should be.",
      "The comparison to older games really highlights how far we've come. GTA III felt massive at the time, but by today's standards it's tiny. Yet it felt more alive somehow.",
      "The open world fatigue is real. I bounced off Assassin's Creed Valhalla after 20 hours because every icon on the map felt like a chore. Then I played Outer Wilds with zero icons and it was magical.",
    ],
    'Building a Gaming PC in 2024: Complete Guide for Every Budget': [
      "Your budget build recommendations are spot on. I built almost exactly this for my nephew and he's running everything at 1080p without issues. The 6650 XT is criminally underrated for the price.",
      "The used GPU market is wild right now. Got a 3070 for $300 last month. If you're patient, you can build a high-end rig for mid-range prices.",
      "One thing I'd add: don't cheap out on the PSU. A bad PSU can kill your entire system. Spend the extra $30-50 for a quality unit with proper protections.",
      "Building my first PC was terrifying but so rewarding. Following a guide step-by-step made it manageable. Now I've built 5 systems and it's like Legos for adults.",
    ],
    'Why Indie Games Are Having a Renaissance: My Top 10 Hidden Gems': [
      "Hollow Knight for $15 gave me more enjoyment than most $60 games. The amount of content is absurd. I'm at 80 hours and still finding new areas. Silksong can't come soon enough.",
      "Great point about indie games taking risks AAA can't. When you have a $200M budget, you can't experiment. Indies can fail and try again. That's where innovation happens.",
      "The hidden gems list is solid. I'd add Outer Wilds to that list - it's a masterpiece that could only exist as an indie game. No AAA studio would greenlight that concept.",
      "Indie games prove that gameplay > graphics. Some of my favorite games have pixel art or simple 3D. It's about the experience, not the fidelity.",
    ],
    'The Psychology of Game Design: Why Some Games Are Impossible to Put Down': [
      "The psychology section explains why I have 200 hours in Vampire Survivors. It's pure dopamine manipulation and I'm not even mad about it. At least it only cost $5.",
      "As a game developer, the section on ethical design really resonates. We had heated debates about adding a battle pass to our game. Ultimately decided against it because it would change the player experience negatively.",
      "The variable reward schedule is so powerful. Loot boxes, random drops, critical hits - they all tap into the same psychological mechanism. It's why slot machines are addictive.",
      "Flow state in games is real. When you hit that perfect difficulty curve where you're challenged but not frustrated, time just disappears. That's peak game design.",
    ],
    // COOKING POSTS
    'The Science of Perfect Pasta: Why Italians Are Right About Everything': [
      "The pasta water tip changed my cooking. I used to drain it all and wonder why my sauce never stuck. Now I save a cup and my carbonara is actually creamy instead of clumpy.",
      "The cacio e pepe technique took me 10 attempts to get right. The key is really having the pasta water at the right temperature - too hot and the cheese clumps, too cold and it doesn't emulsify.",
      "Al dente is everything. I used to overcook pasta because I thought it was 'safer'. Now I time it exactly and the texture difference is night and day.",
      "The salt in pasta water rule is so important. I use a full tablespoon per liter. It should taste like the sea. Makes such a difference in the final dish.",
    ],
    'Knife Skills 101: The Foundation of Efficient Cooking': [
      "The knife skills section should be required reading. I took a knife skills class and it transformed my prep time. What used to take 30 minutes now takes 10, and my cuts are actually uniform.",
      "Learning proper knife technique changed everything. I used to be scared of sharp knives, but a sharp knife is actually safer - it cuts where you want it to, not where it slips.",
      "The claw grip felt awkward at first but now it's second nature. Haven't cut myself in years since adopting it. Safety and speed in one technique.",
      "Investing in a good chef's knife was the best kitchen purchase I've made. A $150 knife that lasts 20 years is cheaper than replacing $30 knives every year.",
    ],
    'Mastering the Maillard Reaction: The Science of Delicious Browning': [
      "I've been making bread for 5 years and still learned something from the Maillard reaction post. The baking soda tip for browning is genius - I'm trying it on my next batch of roasted vegetables.",
      "Understanding the Maillard reaction made me a better cook. I used to flip steaks constantly, now I let them develop that proper crust. The difference in flavor is incredible.",
      "The temperature control section is key. Too hot and you burn, too low and you steam. Finding that sweet spot where Maillard happens but burning doesn't is the skill.",
    ],
    'Fermentation at Home: From Sauerkraut to Sourdough': [
      "Fermentation is addictive once you start. I began with sauerkraut, now I have kimchi, kombucha, and three sourdough starters going. My fridge is a science experiment.",
      "Sourdough starter maintenance is a commitment but so worth it. The flavor difference between sourdough and commercial yeast bread is massive. Plus it's alive - feels like a pet.",
      "The health benefits of fermented foods are real. My digestion improved dramatically after adding fermented foods to my diet. Plus they taste amazing.",
    ],
    // SCIENCE POSTS
    'CRISPR Explained: How Gene Editing Is Changing Medicine': [
      "The CRISPR explanation is the clearest I've read. The 'molecular scissors with GPS' analogy is perfect. I'm going to use that when explaining it to my students.",
      "I work on CAR-T therapy research. CRISPR has accelerated our work tremendously. The ability to precisely edit T cells to target cancer is revolutionary.",
      "The ethical considerations are crucial. CRISPR is powerful but we need to be careful. Germline editing especially - once you change the gene pool, there's no going back.",
    ],
    'The James Webb Space Telescope: What We\'ve Learned in Two Years': [
      "JWST findings are mind-blowing. The early universe galaxies being more mature than expected could mean we need to revise the standard model. Exciting times for cosmology.",
      "The image quality from JWST is stunning. Seeing those first deep field images gave me chills. We're literally looking back in time billions of years.",
      "The exoplanet atmosphere analysis is fascinating. Finding water, carbon dioxide, and other molecules in atmospheres light-years away is incredible. We're getting closer to finding signs of life.",
    ],
    'Quantum Computing: Separating Hype from Reality': [
      "As someone working in quantum computing, I appreciate the realistic timeline. The hype cycle is frustrating - we're making real progress, but it's decades away from breaking encryption.",
      "The quantum computing section on error correction is key. People don't realize how fragile qubits are. We need maybe 1000 physical qubits per logical qubit with current technology.",
      "Quantum supremacy was a milestone but it's not practical yet. We solved a problem that would take classical computers forever, but it's not a useful problem. Still, progress is progress.",
    ],
    'Climate Science 101: Understanding the Data Behind Global Warming': [
      "The climate science post is exactly what we need more of - data-driven, clear, and not alarmist. The evidence is overwhelming when you actually look at it objectively.",
      "The ice core data is what convinced me climate change was real. 800,000 years of atmospheric history in frozen bubbles is incredible. And current CO2 levels are literally off the chart.",
      "The correlation between CO2 and temperature over geological time is undeniable. We're doing an uncontrolled experiment on the only planet we have.",
    ],
    // FITNESS POSTS
    'Progressive Overload: The Only Principle You Need for Strength Gains': [
      "Progressive overload is the one principle I wish I understood earlier. I spent years 'working out' without a plan. Once I started tracking and progressively adding weight, gains came fast.",
      "The linear progression approach works so well for beginners. Adding 5lbs per session seems small but compounds over months. I went from 135lb bench to 225lb in 6 months following this.",
      "Deload weeks are crucial. I used to think more was always better. Now I deload every 4-6 weeks and I'm stronger than ever. Recovery is part of the process.",
    ],
    'Nutrition for Muscle Building: Protein, Calories, and Timing': [
      "Your protein recommendations align with the research I've seen. So many people think they need 2g per pound. The science says 0.7-1g is optimal. More is just expensive pee.",
      "Meal timing matters less than people think. I used to stress about eating protein within 30 minutes of workouts. Now I just hit my daily total and it works fine.",
      "The calorie surplus for bulking is real. I was stuck at the same weight for months until I actually tracked calories and realized I wasn't eating enough. Added 500 calories and started growing.",
    ],
    'Recovery: The Missing Piece in Most Training Programs': [
      "The recovery section is underrated. I was overtraining for years, wondering why I wasn't progressing. Added deload weeks and suddenly started getting stronger again.",
      "The sleep section hit hard. I was training 6 days a week but only sleeping 5-6 hours. Cut back to 4 days and prioritized 8 hours of sleep. Stronger than ever.",
      "Active recovery is a game changer. I used to do nothing on rest days. Now I do light walks or yoga and I feel better and recover faster.",
    ],
    'Home Gym Setup: Building an Effective Training Space on Any Budget': [
      "Built my home gym during COVID for about $2000. Best investment I've ever made. No commute, no waiting, train whenever I want. Paid for itself in 2 years of saved gym fees.",
      "The home gym flooring tip about horse stall mats is gold. $40 for a 4x6 mat that's basically indestructible. Way better than expensive 'gym flooring'.",
      "You don't need everything at once. I started with a barbell, plates, and a squat rack. Added equipment over time. Now I have everything I need and more.",
    ],
    // MOVIES POSTS
    'Why Practical Effects Still Matter in the Age of CGI': [
      "The practical effects argument is spot on. I rewatched The Thing recently and it holds up better than most CGI from 10 years ago. There's a weight to practical effects that CGI struggles to replicate.",
      "The point about practical effects aging better is so true. Original Star Wars vs. the special editions is proof. The practical stuff still looks real; the added CGI looks dated.",
      "Mad Max: Fury Road is the perfect example. 80% practical effects, minimal CGI. It looks incredible and will age beautifully. Compare that to CGI-heavy films from the same era.",
    ],
    'The Art of the Long Take: Films That Master Unbroken Shots': [
      "The long take analysis is fascinating. I never realized how much choreography goes into those shots. The car scene in Children of Men must have taken weeks to coordinate.",
      "1917's one-shot gimmick worked perfectly for the story. The continuous take made you feel like you were right there with the characters. Technical achievement matched narrative purpose.",
      "Long takes are so difficult to pull off. One mistake and you start over. The planning and rehearsal required is immense. When done well, it's pure cinema magic.",
    ],
    'Understanding Film Scores: How Music Shapes Your Emotional Experience': [
      "As someone who studied film scoring, this breakdown is excellent. The Inception BRAAAM became a cliché precisely because it worked so well at creating a sense of importance and scale.",
      "Film scores are the unsung heroes of cinema. Try watching a horror movie with the sound off - it's not scary at all. The music does most of the emotional heavy lifting.",
      "John Williams' leitmotifs are masterful. You hear those two notes and instantly think of Jaws. That's the power of a well-crafted score - it becomes part of the cultural lexicon.",
    ],
    'The Rise of A24: How an Indie Studio Changed Hollywood': [
      "A24 changed my relationship with movies. Before them, I mostly watched blockbusters. Now I seek out smaller, more ambitious films. Everything Everywhere All at Once deserved every Oscar.",
      "The A24 aesthetic has become so recognizable that I can often identify their films from trailers alone. Whether that's good or bad is debatable.",
      "A24 proves that audiences want more than just superhero movies. Mid-budget films with unique voices can still find success. They just need proper marketing and distribution.",
    ],
    // MUSIC POSTS
    'Why Vinyl Is Making a Comeback: More Than Just Nostalgia': [
      "The vinyl ritual is exactly why I got into it. Streaming is convenient, but there's something about choosing an album and committing to it. It changed how I listen to music.",
      "Vinyl absolutely sounds different - whether 'better' is subjective. I notice it most in the bass and the overall warmth. Digital is technically more accurate, but analog feels more musical.",
      "The physicality of vinyl is underrated. Holding the album art, reading the liner notes, flipping the record - it's an experience that streaming can't replicate.",
    ],
    'How Streaming Changed Music: The Good, Bad, and Complicated': [
      "The streaming compensation issue is so frustrating. I use Bandcamp for artists I want to support directly. The difference in what artists receive is night and day.",
      "The point about the album being dead is sad but true. I miss the days of listening to an album front to back as a complete artistic statement. Playlists have fragmented the experience.",
      "Streaming's discovery algorithms are a double-edged sword. They help you find new music but also create echo chambers. I have to actively seek out different genres to break out.",
    ],
    'Music Theory Basics: Understanding Why Songs Work': [
      "Music theory opened up a whole new way of listening for me. Once you understand why a chord progression works, you appreciate the craft behind songs you've heard a thousand times.",
      "The music theory breakdown is the clearest I've seen. The I-V-vi-IV progression really is everywhere once you start listening for it. Pop music is more formulaic than people realize.",
      "Learning basic music theory made me a better musician. I went from just playing songs to understanding why they work. It's like learning grammar after speaking a language your whole life.",
    ],
    'Building a Home Recording Studio: From Bedroom to Professional Sound': [
      "Built my home studio for under $500 and recorded an EP that got playlist placement. The gear matters way less than people think. Skills and creativity beat expensive equipment.",
      "Acoustic treatment is more important than expensive mics. I treated my room with DIY panels and the difference was night and day. Good room > expensive gear.",
      "The DAW you use doesn't matter. I started with GarageBand, moved to Logic, tried Pro Tools. They all do the same thing. Pick one and learn it deeply.",
    ],
    // BOOKS POSTS
    'How to Read More: Practical Strategies That Actually Work': [
      "The advice to quit books without guilt was liberating. I used to force myself to finish everything. Now I'm reading more because I only read what I enjoy.",
      "The 10-page rule is perfect. Most days I end up reading much more, but on tough days, 10 pages is still progress. Small consistent habits beat occasional marathons.",
      "Audiobooks changed my reading life. I 'read' 30+ books a year now, mostly during commutes and workouts. They absolutely count as reading.",
    ],
    'The Art of Rereading: Why Returning to Books Matters': [
      "Rereading is underrated. I've read Dune four times and notice different things each time. The book hasn't changed, but I have, and it reveals new layers.",
      "Some books reveal themselves on the second read. The first time you're following the plot, the second time you see the themes and craft. It's a completely different experience.",
    ],
    'Building a Personal Library: Curation Over Collection': [
      "The curation approach transformed my library. I donated 200 books last year and my remaining collection feels more meaningful. Quality over quantity applies to books too.",
      "A personal library should reflect who you are, not just what you've read. I keep books that changed me, not just books I finished. Much more meaningful collection.",
    ],
    'Genre Fiction Deserves Respect: A Defense of "Popular" Literature': [
      "Genre fiction absolutely deserves respect. Some of the most innovative writing is happening in sci-fi and fantasy. Literary fiction can be just as formulaic as any genre.",
      "The defense of genre fiction needed to be said. Ursula K. Le Guin wrote some of the most profound literature of the 20th century, and it was 'just' science fiction.",
      "The literary vs genre distinction is arbitrary. Good writing is good writing regardless of genre. Some of my favorite books are genre fiction that tackles deep themes.",
    ],
    // TRAVEL POSTS
    'Slow Travel: Why Spending More Time in Fewer Places Changed Everything': [
      "Slow travel changed everything for me. I spent a month in Oaxaca instead of rushing through Mexico. I learned basic Spanish, made local friends, and actually understood the culture.",
      "The difference between slow travel and regular travel is night and day. Instead of checking off destinations, you actually experience places. Much more rewarding.",
    ],
    'Solo Travel: Overcoming Fear and Finding Freedom': [
      "Solo travel was terrifying the first time and now it's my preference. The freedom is addictive. You meet more people traveling alone than you ever would with a companion.",
      "The tip about eating at the bar when solo is game-changing. You're more likely to chat with the bartender and other diners. Some of my best travel memories started that way.",
    ],
    'Budget Travel Secrets: How I Travel Full-Time on $30/Day': [
      "The budget breakdown is realistic. I traveled Southeast Asia for 6 months on less than $1000/month including flights. House sitting and cooking saved me thousands.",
      "I lived the $30/day budget for two years. It's absolutely possible in the right destinations. Southeast Asia and Central America are incredibly affordable.",
    ],
    'Sustainable Travel: Reducing Your Impact Without Ruining Your Trip': [
      "Sustainable travel is something I struggle with. I love travel but hate the environmental impact. The slow travel approach helps - fewer flights, longer stays.",
      "The overtourism point is crucial. I visited Barcelona and it felt like a theme park. Then I went to lesser-known parts of Spain and had authentic experiences with locals.",
    ],
    // TECHNOLOGY POSTS
    'The State of AI in 2024: What Actually Works and What\'s Hype': [
      "The AI reality check is needed. I work in ML and the gap between headlines and actual capabilities is enormous. Current AI is impressive but nowhere near general intelligence.",
      "The AI section on what actually works vs. hype is spot on. I use ChatGPT daily for writing and coding assistance. It's a tool, not magic - and it hallucinates constantly.",
    ],
    'Privacy in 2024: Practical Steps to Protect Yourself Online': [
      "Privacy is a losing battle but worth fighting. I've implemented most of these suggestions. The password manager alone is life-changing - no more password reuse.",
      "Privacy recommendations are solid. I switched to Firefox and DuckDuckGo years ago. The convenience loss is minimal and the tracking reduction is significant.",
    ],
    'Mechanical Keyboards: Why People Spend $300 on Typing': [
      "Mechanical keyboards seem crazy until you try one. I got a cheap one to see what the fuss was about. Now I have three and can't go back to membrane.",
      "The mechanical keyboard rabbit hole is real. Started with a $50 Keychron. Now I'm lubing switches at midnight. It's a hobby that happens to be useful.",
    ],
    'Right to Repair: Why You Should Care About Fixing Your Own Stuff': [
      "Right to Repair affects everyone. My dishwasher died and the manufacturer wanted $400 for a $20 part. Found a third-party supplier and fixed it myself for $30.",
      "The environmental impact of right to repair is huge. We throw away so many devices that could be fixed. Repair extends device life and reduces e-waste significantly.",
    ],
  };

  // Fallback to community-based comments if post-specific ones don't exist
  const commentTemplates: { [key: string]: string[] } = {
    programming: [
      "This is exactly what I needed to read. I've been struggling with code reviews at my company - we tend to nitpick style issues while missing actual bugs. The distinction between blocking issues and preferences is crucial. We're implementing a 'MUST/SHOULD/COULD' labeling system for review comments now.",
      "The point about naming being the hardest problem resonates deeply. I spent 30 minutes yesterday debating whether to call a function `validateUser` or `checkUserValidity`. Ended up with `ensureUserIsValid` which I think captures the intent better.",
      "I'd add that pair programming can replace some code reviews entirely. When two people write the code together, you get real-time review and knowledge sharing. We've reduced our review backlog significantly since adopting this.",
      "Great breakdown of Big O! One thing I'd add: in practice, constants matter. An O(n) algorithm with a large constant can be slower than O(n log n) for realistic input sizes. Always benchmark with real data.",
      "The Git workflow section is gold. We switched from GitFlow to trunk-based development last year and our deployment frequency went from monthly to daily. The key was investing in feature flags first.",
      "Debugging like a detective is such an apt metaphor. I keep a 'debugging journal' where I write down my hypotheses before testing them. It prevents me from going in circles and helps me learn from each bug.",
      "The rubber duck method saved my sanity. I have a literal rubber duck on my desk. My colleagues thought I was crazy until they tried it themselves. Now we have a whole flock.",
      "One addition to the debugging section: `git bisect` is incredibly powerful for finding regression bugs. It binary searches through commits to find exactly when a bug was introduced.",
    ],
    gaming: [
      "The evolution from GTA III to modern open worlds is fascinating. I remember being blown away that you could just... go anywhere. Now I take it for granted. Elden Ring reminded me of that wonder by hiding so much off the beaten path.",
      "Your budget build recommendations are spot on. I built almost exactly this for my nephew and he's running everything at 1080p without issues. The 6650 XT is criminally underrated for the price.",
      "Hollow Knight for $15 gave me more enjoyment than most $60 games. The amount of content is absurd. I'm at 80 hours and still finding new areas. Silksong can't come soon enough.",
      "The psychology section explains why I have 200 hours in Vampire Survivors. It's pure dopamine manipulation and I'm not even mad about it. At least it only cost $5.",
      "As a game developer, the section on ethical design really resonates. We had heated debates about adding a battle pass to our game. Ultimately decided against it because it would change the player experience negatively.",
      "The open world fatigue is real. I bounced off Assassin's Creed Valhalla after 20 hours because every icon on the map felt like a chore. Then I played Outer Wilds with zero icons and it was magical.",
      "Great point about indie games taking risks AAA can't. When you have a $200M budget, you can't experiment. Indies can fail and try again. That's where innovation happens.",
    ],
    cooking: [
      "The pasta water tip changed my cooking. I used to drain it all and wonder why my sauce never stuck. Now I save a cup and my carbonara is actually creamy instead of clumpy.",
      "I've been making bread for 5 years and still learned something from the Maillard reaction post. The baking soda tip for browning is genius - I'm trying it on my next batch of roasted vegetables.",
      "The knife skills section should be required reading. I took a knife skills class and it transformed my prep time. What used to take 30 minutes now takes 10, and my cuts are actually uniform.",
      "Fermentation is addictive once you start. I began with sauerkraut, now I have kimchi, kombucha, and three sourdough starters going. My fridge is a science experiment.",
      "The cacio e pepe technique took me 10 attempts to get right. The key is really having the pasta water at the right temperature - too hot and the cheese clumps, too cold and it doesn't emulsify.",
      "As a professional chef, I appreciate how you explained the science without dumbing it down. Understanding WHY techniques work makes you a better cook than just following recipes.",
      "The mise en place tip is underrated. I used to start cooking before everything was prepped and constantly scrambled. Now I prep everything first and cooking is actually relaxing.",
    ],
    science: [
      "The CRISPR explanation is the clearest I've read. The 'molecular scissors with GPS' analogy is perfect. I'm going to use that when explaining it to my students.",
      "JWST findings are mind-blowing. The early universe galaxies being more mature than expected could mean we need to revise the standard model. Exciting times for cosmology.",
      "As someone working in quantum computing, I appreciate the realistic timeline. The hype cycle is frustrating - we're making real progress, but it's decades away from breaking encryption.",
      "The climate science post is exactly what we need more of - data-driven, clear, and not alarmist. The evidence is overwhelming when you actually look at it objectively.",
      "The ice core data is what convinced me climate change was real. 800,000 years of atmospheric history in frozen bubbles is incredible. And current CO2 levels are literally off the chart.",
      "I work on CAR-T therapy research. CRISPR has accelerated our work tremendously. The ability to precisely edit T cells to target cancer is revolutionary.",
      "The quantum computing section on error correction is key. People don't realize how fragile qubits are. We need maybe 1000 physical qubits per logical qubit with current technology.",
    ],
    fitness: [
      "Progressive overload is the one principle I wish I understood earlier. I spent years 'working out' without a plan. Once I started tracking and progressively adding weight, gains came fast.",
      "The sleep section hit hard. I was training 6 days a week but only sleeping 5-6 hours. Cut back to 4 days and prioritized 8 hours of sleep. Stronger than ever.",
      "Your protein recommendations align with the research I've seen. So many people think they need 2g per pound. The science says 0.7-1g is optimal. More is just expensive pee.",
      "Built my home gym during COVID for about $2000. Best investment I've ever made. No commute, no waiting, train whenever I want. Paid for itself in 2 years of saved gym fees.",
      "The recovery section is underrated. I was overtraining for years, wondering why I wasn't progressing. Added deload weeks and suddenly started getting stronger again.",
      "Creatine is the only supplement I recommend. 5g daily, cheap, decades of research proving it works. Everything else is mostly marketing.",
      "The home gym flooring tip about horse stall mats is gold. $40 for a 4x6 mat that's basically indestructible. Way better than expensive 'gym flooring'.",
    ],
    movies: [
      "The practical effects argument is spot on. I rewatched The Thing recently and it holds up better than most CGI from 10 years ago. There's a weight to practical effects that CGI struggles to replicate.",
      "The long take analysis is fascinating. I never realized how much choreography goes into those shots. The car scene in Children of Men must have taken weeks to coordinate.",
      "As someone who studied film scoring, this breakdown is excellent. The Inception BRAAAM became a cliché precisely because it worked so well at creating a sense of importance and scale.",
      "A24 changed my relationship with movies. Before them, I mostly watched blockbusters. Now I seek out smaller, more ambitious films. Everything Everywhere All at Once deserved every Oscar.",
      "The point about practical effects aging better is so true. Original Star Wars vs. the special editions is proof. The practical stuff still looks real; the added CGI looks dated.",
      "Film scores are the unsung heroes of cinema. Try watching a horror movie with the sound off - it's not scary at all. The music does most of the emotional heavy lifting.",
      "The A24 aesthetic has become so recognizable that I can often identify their films from trailers alone. Whether that's good or bad is debatable.",
    ],
    music: [
      "The vinyl ritual is exactly why I got into it. Streaming is convenient, but there's something about choosing an album and committing to it. It changed how I listen to music.",
      "The streaming compensation issue is so frustrating. I use Bandcamp for artists I want to support directly. The difference in what artists receive is night and day.",
      "Music theory opened up a whole new way of listening for me. Once you understand why a chord progression works, you appreciate the craft behind songs you've heard a thousand times.",
      "Built my home studio for under $500 and recorded an EP that got playlist placement. The gear matters way less than people think. Skills and creativity beat expensive equipment.",
      "The point about the album being dead is sad but true. I miss the days of listening to an album front to back as a complete artistic statement. Playlists have fragmented the experience.",
      "Vinyl absolutely sounds different - whether 'better' is subjective. I notice it most in the bass and the overall warmth. Digital is technically more accurate, but analog feels more musical.",
      "The music theory breakdown is the clearest I've seen. The I-V-vi-IV progression really is everywhere once you start listening for it. Pop music is more formulaic than people realize.",
    ],
    books: [
      "The advice to quit books without guilt was liberating. I used to force myself to finish everything. Now I'm reading more because I only read what I enjoy.",
      "Rereading is underrated. I've read Dune four times and notice different things each time. The book hasn't changed, but I have, and it reveals new layers.",
      "The curation approach transformed my library. I donated 200 books last year and my remaining collection feels more meaningful. Quality over quantity applies to books too.",
      "Genre fiction absolutely deserves respect. Some of the most innovative writing is happening in sci-fi and fantasy. Literary fiction can be just as formulaic as any genre.",
      "The 10-page rule is perfect. Most days I end up reading much more, but on tough days, 10 pages is still progress. Small consistent habits beat occasional marathons.",
      "Audiobooks changed my reading life. I 'read' 30+ books a year now, mostly during commutes and workouts. They absolutely count as reading.",
      "The defense of genre fiction needed to be said. Ursula K. Le Guin wrote some of the most profound literature of the 20th century, and it was 'just' science fiction.",
    ],
    travel: [
      "Slow travel changed everything for me. I spent a month in Oaxaca instead of rushing through Mexico. I learned basic Spanish, made local friends, and actually understood the culture.",
      "Solo travel was terrifying the first time and now it's my preference. The freedom is addictive. You meet more people traveling alone than you ever would with a companion.",
      "The budget breakdown is realistic. I traveled Southeast Asia for 6 months on less than $1000/month including flights. House sitting and cooking saved me thousands.",
      "Sustainable travel is something I struggle with. I love travel but hate the environmental impact. The slow travel approach helps - fewer flights, longer stays.",
      "The tip about eating at the bar when solo is game-changing. You're more likely to chat with the bartender and other diners. Some of my best travel memories started that way.",
      "I lived the $30/day budget for two years. It's absolutely possible in the right destinations. Southeast Asia and Central America are incredibly affordable.",
      "The overtourism point is crucial. I visited Barcelona and it felt like a theme park. Then I went to lesser-known parts of Spain and had authentic experiences with locals.",
    ],
    technology: [
      "The AI reality check is needed. I work in ML and the gap between headlines and actual capabilities is enormous. Current AI is impressive but nowhere near general intelligence.",
      "Privacy is a losing battle but worth fighting. I've implemented most of these suggestions. The password manager alone is life-changing - no more password reuse.",
      "Mechanical keyboards seem crazy until you try one. I got a cheap one to see what the fuss was about. Now I have three and can't go back to membrane.",
      "Right to Repair affects everyone. My dishwasher died and the manufacturer wanted $400 for a $20 part. Found a third-party supplier and fixed it myself for $30.",
      "The AI section on what actually works vs. hype is spot on. I use ChatGPT daily for writing and coding assistance. It's a tool, not magic - and it hallucinates constantly.",
      "Privacy recommendations are solid. I switched to Firefox and DuckDuckGo years ago. The convenience loss is minimal and the tracking reduction is significant.",
      "The mechanical keyboard rabbit hole is real. Started with a $50 Keychron. Now I'm lubing switches at midnight. It's a hobby that happens to be useful.",
    ],
  };

  let commentCount = 0;
  const allComments = [];
  for (const postWithData of postsWithData) {
    const post = postWithData.post;
    const postTitle = postWithData.title;
    
    // Try to get post-specific comments first, fall back to community-based
    let templates = postSpecificComments[postTitle];
    if (!templates || templates.length === 0) {
      const community = communities.find(c => c.id === post.communityId);
      templates = commentTemplates[community?.name || 'programming'] || commentTemplates.programming;
    }
    
    if (!templates || templates.length === 0) continue;
    
    // 5-8 comments per post
    const numComments = 5 + Math.floor(Math.random() * 4);
    const usedTemplates = new Set<number>();
    
    for (let i = 0; i < numComments && i < templates.length; i++) {
      let templateIndex;
      do {
        templateIndex = Math.floor(Math.random() * templates.length);
      } while (usedTemplates.has(templateIndex) && usedTemplates.size < templates.length);
      usedTemplates.add(templateIndex);
      
      const author = randomElement(users);
      const comment = await prisma.comment.create({
        data: {
          body: templates[templateIndex],
          authorId: author.id,
          postId: post.id,
          createdAt: randomDate(25),
        },
      });
      allComments.push(comment);
      commentCount++;
    }
  }
  console.log(`✅ Created ${commentCount} high-quality comments`);

  // Votes for posts
  let voteCount = 0;
  for (const post of posts) {
    const voterCount = 10 + Math.floor(Math.random() * 20);
    for (let i = 0; i < voterCount; i++) {
      const user = randomElement(users);
      try {
        await prisma.vote.create({
          data: { userId: user.id, target_type: 'post', target_id: post.id, value: Math.random() > 0.1 ? 1 : -1 },
        });
        voteCount++;
      } catch (e) { /* duplicate */ }
    }
  }
  console.log(`✅ Created ${voteCount} votes for posts`);

  // Votes for comments
  let commentVoteCount = 0;
  for (const comment of allComments) {
    const voterCount = 3 + Math.floor(Math.random() * 12);
    for (let i = 0; i < voterCount; i++) {
      const user = randomElement(users);
      try {
        await prisma.vote.create({
          data: { userId: user.id, target_type: 'comment', target_id: comment.id, value: Math.random() > 0.15 ? 1 : -1 },
        });
        commentVoteCount++;
      } catch (e) { /* duplicate */ }
    }
  }
  console.log(`✅ Created ${commentVoteCount} votes for comments`);

  // Create community memberships and update member counts
  for (const community of communities) {
    const [postAuthors, commentAuthors] = await Promise.all([
      prisma.post.groupBy({ by: ['authorId'], where: { communityId: community.id } }),
      prisma.$queryRaw<{ authorId: string }[]>`SELECT DISTINCT author_id as "authorId" FROM comments WHERE post_id IN (SELECT id FROM posts WHERE community_id = ${community.id})`,
    ]);
    const uniqueMembers = new Set([...postAuthors.map(p => p.authorId), ...commentAuthors.map(c => c.authorId)]);
    
    // Create CommunityMembership records for all members
    for (const userId of uniqueMembers) {
      try {
        await prisma.communityMembership.create({
          data: {
            userId: userId,
            communityId: community.id,
            joinedAt: randomDate(60),
          },
        });
      } catch (e) { /* duplicate membership */ }
    }
    
    await prisma.$executeRaw`UPDATE communities SET member_count = ${uniqueMembers.size} WHERE id = ${community.id}`;
  }
  console.log('✅ Created community memberships and updated member counts');

  console.log('\n🎉 High-quality seed completed!');
  console.log(`   👥 Users: ${users.length}`);
  console.log(`   🏘️  Communities: ${communities.length}`);
  console.log(`   📝 Posts: ${posts.length} (4 per community)`);
  console.log(`   💬 Comments: ${commentCount} (5+ per post)`);
  console.log(`   👍 Votes: ${voteCount} (posts) + ${commentVoteCount} (comments)`);
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
