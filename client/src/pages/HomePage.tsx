import { useState, useEffect } from 'react';
import PostFeed from '../components/PostFeed';
import { Post } from '../types';
import './HomePage.css';

// Mock data - replace with actual API calls
const mockPosts: Post[] = [
  {
    id: 1,
    title: 'Getting Started with React Hooks',
    body: 'React Hooks have revolutionized the way we write React components. Here are some best practices...',
    author: 'john_doe',
    communityId: 1,
    communityName: 'r/reactjs',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    voteCount: 330,
    commentCount: 45,
  },
  {
    id: 2,
    title: 'My First Day Learning JavaScript',
    body: 'Today I started my journey into web development. Any tips for a beginner?',
    author: 'newbie_coder',
    communityId: 2,
    communityName: 'r/learnprogramming',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    voteCount: 123,
    commentCount: 67,
  },
  {
    id: 3,
    title: 'TypeScript vs JavaScript: When to Use Each',
    body: 'A comprehensive guide on choosing between TypeScript and JavaScript for your next project.',
    author: 'tech_guru',
    communityId: 1,
    communityName: 'r/reactjs',
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    voteCount: 544,
    commentCount: 89,
  },
  {
    id: 4,
    title: 'Best Practices for API Design',
    body: 'After working with APIs for 5 years, here are my top recommendations...',
    author: 'api_master',
    communityId: 4,
    communityName: 'r/webdev',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    voteCount: 857,
    commentCount: 123,
  },
  {
    id: 5,
    title: 'How I Built My Portfolio Website',
    body: 'Sharing my journey and the tools I used to create my developer portfolio.',
    author: 'creative_dev',
    communityId: 4,
    communityName: 'r/webdev',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    voteCount: 226,
    commentCount: 34,
  },
  {
    id: 6,
    title: 'Understanding Async/Await in JavaScript',
    body: 'A deep dive into asynchronous programming and how to use async/await effectively.',
    author: 'js_ninja',
    communityId: 2,
    communityName: 'r/learnprogramming',
    createdAt: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString(),
    voteCount: 430,
    commentCount: 56,
  },
  {
    id: 7,
    title: 'Perfect Homemade Pizza Dough Recipe',
    body: 'After years of experimentation, I finally perfected my pizza dough recipe. The secret is in the fermentation time and high-quality flour. Here\'s what you need...',
    author: 'pizza_lover_23',
    communityId: 3,
    communityName: 'r/cooking',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    voteCount: 1006,
    commentCount: 156,
  },
  {
    id: 8,
    title: 'What knife should I buy as a beginner?',
    body: 'I\'m just starting to get serious about cooking and want to invest in a good chef\'s knife. Budget is around $100. Any recommendations?',
    author: 'new_cook_42',
    communityId: 3,
    communityName: 'r/cooking',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    voteCount: 84,
    commentCount: 92,
  },
  {
    id: 9,
    title: 'Made my first sourdough bread!',
    body: 'Been feeding my starter for 2 weeks and finally made my first loaf. The crust is perfect and the crumb is amazing. So proud of this!',
    author: 'bread_baker_99',
    communityId: 3,
    communityName: 'r/cooking',
    createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    voteCount: 666,
    commentCount: 84,
  },
  {
    id: 10,
    title: 'Quick weeknight dinner ideas?',
    body: 'I work long hours and need some fast, healthy dinner ideas that don\'t require too many ingredients. What are your go-to recipes?',
    author: 'busy_parent',
    communityId: 3,
    communityName: 'r/cooking',
    createdAt: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
    voteCount: 305,
    commentCount: 203,
  },
  {
    id: 11,
    title: 'Best way to cook a perfect steak?',
    body: 'I always struggle with getting the right temperature. Should I use cast iron? Reverse sear? What\'s your foolproof method?',
    author: 'meat_master',
    communityId: 3,
    communityName: 'r/cooking',
    createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    voteCount: 424,
    commentCount: 167,
  },
  {
    id: 12,
    title: 'Homemade Pasta from Scratch - Photo Tutorial',
    body: 'Making fresh pasta is easier than you think! Here\'s my step-by-step guide with photos. All you need is flour, eggs, and a rolling pin.',
    author: 'italian_nonna',
    communityId: 3,
    communityName: 'r/cooking',
    createdAt: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
    voteCount: 877,
    commentCount: 134,
  },
  {
    id: 13,
    title: 'Is it worth buying an Instant Pot?',
    body: 'Considering getting one but not sure if it\'s just another kitchen gadget that will collect dust. Do you use yours regularly?',
    author: 'kitchen_gadget_fan',
    communityId: 3,
    communityName: 'r/cooking',
    createdAt: new Date(Date.now() - 1.2 * 24 * 60 * 60 * 1000).toISOString(),
    voteCount: 148,
    commentCount: 98,
  },
  {
    id: 14,
    title: 'My grandmother\'s secret chicken soup recipe',
    body: 'She made this for me whenever I was sick as a kid. Now I make it for my own family. The secret ingredient might surprise you...',
    author: 'comfort_food_lover',
    communityId: 3,
    communityName: 'r/cooking',
    createdAt: new Date(Date.now() - 1.8 * 24 * 60 * 60 * 1000).toISOString(),
    voteCount: 525,
    commentCount: 76,
  },
];

function HomePage() {
  const [selectedFeed, setSelectedFeed] = useState<'home' | 'popular'>('home');
  const [posts, setPosts] = useState<Post[]>([]);
  const [joinedCommunities, setJoinedCommunities] = useState<string[]>([]);

  useEffect(() => {
    // Load joined communities from localStorage
    const loadJoinedCommunities = () => {
      const stored = localStorage.getItem('joinedCommunities');
      if (stored) {
        setJoinedCommunities(JSON.parse(stored));
      } else {
        setJoinedCommunities([]);
      }
    };

    // Load initially
    loadJoinedCommunities();

    // Listen for storage changes (when communities are joined/left)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'joinedCommunities') {
        loadJoinedCommunities();
      }
    };

    // Listen for custom event (for same-window updates)
    const handleJoinedCommunitiesChange = () => {
      loadJoinedCommunities();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('joinedCommunitiesChanged', handleJoinedCommunitiesChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('joinedCommunitiesChanged', handleJoinedCommunitiesChange);
    };
  }, []);

  useEffect(() => {
    // Filter posts based on selected feed
    if (selectedFeed === 'home') {
      // Show posts from joined communities
      if (joinedCommunities.length > 0) {
        const filteredPosts = mockPosts.filter(post => 
          joinedCommunities.includes(String(post.communityId))
        );
        setPosts(filteredPosts.length > 0 ? filteredPosts : mockPosts);
      } else {
        // If not joined to any communities, show all posts
        setPosts(mockPosts);
      }
    } else {
      // Show popular posts (sorted by vote count)
      const popularPosts = [...mockPosts].sort((a, b) => 
        b.voteCount - a.voteCount
      );
      setPosts(popularPosts);
    }
  }, [selectedFeed, joinedCommunities]);

  return (
    <div className="home-page">
      <div className="home-container">
        <div className="feed-content">
          <div className="feed-selector">
            <button
              className={`feed-tab ${selectedFeed === 'home' ? 'active' : ''}`}
              onClick={() => setSelectedFeed('home')}
            >
              <span className="tab-icon">🏠</span>
              <span className="tab-text">Home</span>
            </button>
            <button
              className={`feed-tab ${selectedFeed === 'popular' ? 'active' : ''}`}
              onClick={() => setSelectedFeed('popular')}
            >
              <span className="tab-icon">🔥</span>
              <span className="tab-text">Popular</span>
            </button>
          </div>

          <div className="feed-description">
            {selectedFeed === 'home' ? (
              joinedCommunities.length > 0 ? (
                <p>Posts from communities you've joined</p>
              ) : (
                <p>Join communities to customize your feed</p>
              )
            ) : (
              <p>The most upvoted posts across all communities</p>
            )}
          </div>

          <PostFeed posts={posts} />
        </div>

        <div className="home-sidebar">
          <div className="sidebar-card">
            <div className="sidebar-header">
              <span className="sidebar-icon">🏠</span>
              <h3>Home</h3>
            </div>
            <p className="sidebar-description">
              Your personal Reddit frontpage. See posts from communities you've joined.
            </p>
          </div>

          <div className="sidebar-card">
            <div className="sidebar-header">
              <span className="sidebar-icon">📊</span>
              <h3>Quick Stats</h3>
            </div>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-value">{joinedCommunities.length}</div>
                <div className="stat-label">Communities Joined</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{posts.length}</div>
                <div className="stat-label">Posts in Feed</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
