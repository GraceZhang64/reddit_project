import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import postsRouter from './routes/posts';
import authRouter from './routes/auth';
import communitiesRouter from './routes/communities';
import votesRouter from './routes/votes';
import commentsRouter from './routes/comments';
import usersRouter from './routes/users';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

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
        posts: 'GET /api/communities/:slug/posts'
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
      users: {
        profile: 'GET /api/users/:username',
        posts: 'GET /api/users/:username/posts',
        comments: 'GET /api/users/:username/comments',
        communities: 'GET /api/users/:username/communities',
        updateProfile: 'PUT /api/users/profile'
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
app.use('/api/users', usersRouter);

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
