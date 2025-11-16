import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import postsRouter from './routes/posts';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'Reddit Project API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      posts: '/api/posts',
      hotPosts: '/api/posts/hot',
      search: '/api/posts/search?q=query',
      postById: '/api/posts/:id',
      postSummary: '/api/posts/:id/summary'
    }
  });
});

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ message: 'Server is running!' });
});

app.use('/api/posts', postsRouter);

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
