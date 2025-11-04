# Reddit Project - Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        UI[React Frontend<br/>TypeScript + Vite]
        Auth[Auth Components<br/>Login/Register]
        PostView[Post View<br/>with AI Summary]
    end

    subgraph "API Gateway Layer"
        API[Express API Server<br/>TypeScript<br/>Port 5000]
        AuthMW[Auth Middleware<br/>JWT Validation]
        RateLimit[Rate Limiter]
    end

    subgraph "Business Logic Layer"
        AuthService[Auth Service<br/>Login/Register/Token]
        PostService[Post Service<br/>CRUD Operations]
        CommentService[Comment Service<br/>Nested Comments]
        VoteService[Vote Service<br/>Upvote/Downvote]
        AIService[AI Summary Service<br/>LLM Integration]
    end

    subgraph "Data Layer"
        ORM[Prisma ORM]
        DB[(PostgreSQL Database<br/>Users/Posts/Comments/Votes)]
    end

    subgraph "External Services"
        LLM[LLM API<br/>OpenAI/Anthropic<br/>GPT-4/Claude]
    end

    %% User Flow - Main Use Case: View Post with AI Summary
    UI -->|1. GET /posts/:id| API
    API -->|2. Validate JWT| AuthMW
    AuthMW -->|3. Authorized| PostService
    PostService -->|4. Query Post| ORM
    ORM -->|5. Fetch Data| DB
    DB -->|6. Return Post + Comments| ORM
    ORM -->|7. Data| PostService
    PostService -->|8. Trigger Summary| AIService
    AIService -->|9. Generate Prompt| LLM
    LLM -->|10. AI Summary| AIService
    AIService -->|11. Cached Summary| PostService
    PostService -->|12. Combined Response| API
    API -->|13. JSON Response| UI
    UI -->|14. Display Post + AI Summary| PostView

    %% Authentication Flow
    Auth -->|POST /auth/login| API
    API --> AuthService
    AuthService -->|Validate Credentials| ORM
    ORM -->|Check User| DB
    DB -->|User Data| ORM
    ORM --> AuthService
    AuthService -->|Generate JWT| API
    API -->|Return Token| Auth

    %% Other Service Flows
    UI -->|POST /posts| API
    API --> PostService
    PostService --> ORM
    
    UI -->|POST /comments| API
    API --> CommentService
    CommentService --> ORM
    
    UI -->|POST /votes| API
    API --> VoteService
    VoteService --> ORM

    %% Security & Performance
    API -.->|Rate Limit Check| RateLimit
    RateLimit -.->|Block/Allow| API

    style UI fill:#e1f5ff
    style API fill:#fff4e1
    style AIService fill:#ffe1f5
    style LLM fill:#ffe1e1
    style DB fill:#e1ffe1
    style AuthMW fill:#f0e1ff
```

## Architecture Overview

### Scope & External Dependencies
- **Client**: React SPA running on Vite dev server (port 3000)
- **API Server**: Express.js REST API (port 5000)
- **Database**: PostgreSQL with Prisma ORM
- **LLM Service**: External API (OpenAI/Anthropic) for AI summaries

### Key Components
1. **Client Layer**: React UI components with routing
2. **API Gateway**: Express server with auth middleware and rate limiting
3. **Business Logic**: Service layer for auth, posts, comments, votes, and AI
4. **Data Layer**: Prisma ORM + PostgreSQL database
5. **External Services**: LLM API for content summarization

### Main Use Case Flow (View Post with AI Summary)
1. User requests post → Frontend calls API
2. API validates JWT token
3. Post Service queries database
4. AI Service generates summary from post + comments
5. LLM API processes prompt and returns summary
6. Combined response (post + summary) returned to user

### LLM Integration Design
- **Component**: Dedicated AI Summary Service
- **API Call**: Made from backend to prevent API key exposure
- **Prompt Generation**: Combines post title, body, and top comments
- **Caching**: Summaries cached to reduce API costs and latency
- **Design Rationale**: Backend handles LLM calls for security, rate limiting, and cost control

