import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import postsRouter from './routes/posts';
import authRouter from './routes/auth';
import communitiesRouter from './routes/communities';
import votesRouter from './routes/votes';
import commentsRouter from './routes/comments';
import usersRouter from './routes/users';
import pollsRouter from './routes/polls';
import followsRouter from './routes/follows';
import savedPostsRouter from './routes/savedPosts';
import { globalLimiter } from './middleware/rateLimiter';

dotenv.config();

const app: Express = express();
const port = parseInt(process.env.PORT || '5000', 10);

// Middleware
app.use(cors({
  origin: true, // Allow all origins for beta testing
  credentials: true
}));
app.use(express.json());

// Global rate limiter: 300 requests per 5 minutes
app.use('/api', globalLimiter.middleware());

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'BlueIt API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        me: 'GET /api/auth/me'
      },
      communities: {
        list: 'GET /api/communities',
        get: 'GET /api/communities/:slug',
        create: 'POST /api/communities',
        posts: 'GET /api/communities/:slug/posts',
        join: 'POST /api/communities/:slug/join',
        leave: 'POST /api/communities/:slug/leave',
        membership: 'GET /api/communities/:slug/membership'
      },
      posts: {
        list: 'GET /api/posts',
        hot: 'GET /api/posts/hot',
        search: 'GET /api/posts/search?q=query',
        get: 'GET /api/posts/:id',
        summary: 'GET /api/posts/:id/summary',
        create: 'POST /api/posts',
        update: 'PUT /api/posts/:id',
        delete: 'DELETE /api/posts/:id'
      },
      comments: {
        byPost: 'GET /api/comments/post/:postId',
        get: 'GET /api/comments/:id',
        create: 'POST /api/comments',
        update: 'PUT /api/comments/:id',
        delete: 'DELETE /api/comments/:id'
      },
      votes: {
        cast: 'POST /api/votes',
        remove: 'DELETE /api/votes',
        count: 'GET /api/votes/:target_type/:target_id',
        userVote: 'GET /api/votes/user/:target_type/:target_id'
      },
      polls: {
        get: 'GET /api/polls/post/:postId',
        vote: 'POST /api/polls/vote',
        userVote: 'GET /api/polls/:pollId/user-vote'
      },
      users: {
        profile: 'GET /api/users/:username',
        posts: 'GET /api/users/:username/posts',
        comments: 'GET /api/users/:username/comments',
        communities: 'GET /api/users/:username/communities',
        updateProfile: 'PUT /api/users/profile'
      },
      follows: {
        follow: 'POST /api/follows/:username',
        unfollow: 'DELETE /api/follows/:username',
        check: 'GET /api/follows/check/:username',
        followers: 'GET /api/follows/followers/:username',
        following: 'GET /api/follows/following/:username',
        feed: 'GET /api/follows/feed'
      },
      savedPosts: {
        list: 'GET /api/saved-posts',
        save: 'POST /api/saved-posts/:postId',
        unsave: 'DELETE /api/saved-posts/:postId',
        check: 'GET /api/saved-posts/check/:postId',
        checkMultiple: 'POST /api/saved-posts/check-multiple'
      }
    }
  });
});

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ message: 'Server is running!' });
});

// Register routes
app.use('/api/auth', authRouter);
app.use('/api/communities', communitiesRouter);
app.use('/api/posts', postsRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/votes', votesRouter);
app.use('/api/polls', pollsRouter);
app.use('/api/users', usersRouter);
app.use('/api/follows', followsRouter);
app.use('/api/saved-posts', savedPostsRouter);

app.listen(port, '0.0.0.0', () => {
  console.log(`⚡️[server]: Server is running at http://0.0.0.0:${port}`);
  console.log(`⚡️[server]: Local access: http://localhost:${port}`);
  console.log(`⚡️[server]: Network access: Find your IP with 'ipconfig' and use http://YOUR_IP:${port}`);
});