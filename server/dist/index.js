"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const posts_1 = __importDefault(require("./routes/posts"));
const auth_1 = __importDefault(require("./routes/auth"));
const communities_1 = __importDefault(require("./routes/communities"));
const votes_1 = __importDefault(require("./routes/votes"));
const comments_1 = __importDefault(require("./routes/comments"));
const users_1 = __importDefault(require("./routes/users"));
const polls_1 = __importDefault(require("./routes/polls"));
const follows_1 = __importDefault(require("./routes/follows"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.get('/', (req, res) => {
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
            }
        }
    });
});
app.get('/api/health', (req, res) => {
    res.json({ message: 'Server is running!' });
});
// Register routes
app.use('/api/auth', auth_1.default);
app.use('/api/communities', communities_1.default);
app.use('/api/posts', posts_1.default);
app.use('/api/comments', comments_1.default);
app.use('/api/votes', votes_1.default);
app.use('/api/polls', polls_1.default);
app.use('/api/users', users_1.default);
app.use('/api/follows', follows_1.default);
app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
