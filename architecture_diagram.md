# Reddit Project - Architecture Diagram

```mermaid
graph LR
    subgraph CLIENT[" "]
        direction TB
        UI[Next.js Frontend<br/>TypeScript + App Router]
        Pages[Pages & Components<br/>Server/Client Components]
        Auth[Auth Components]
        PostView[Post View<br/>with AI Summary]
        UI --- Pages
        Pages --- Auth
        Pages --- PostView
    end

    subgraph GATEWAY[" "]
        direction TB
        API[Express API Server<br/>TypeScript<br/>Port 5000]
        AuthMW[Auth Middleware<br/>JWT Validation]
        RateLimit[Rate Limiter]
        API --- AuthMW
        API --- RateLimit
    end

    subgraph SERVICES[" "]
        direction TB
        AuthService[Auth Service]
        PostService[Post Service<br/>CRUD Operations]
        CommentService[Comment Service]
        VoteService[Vote Service]
        AIService[AI Summary Service<br/>LLM Integration]
    end

    subgraph DATA[" "]
        direction TB
        ORM[Prisma ORM]
        DB[(PostgreSQL Database<br/>Users/Posts/Comments/Votes)]
        ORM --- DB
    end

    subgraph EXTERNAL[" "]
        LLM[LLM API<br/>OpenAI/Anthropic<br/>GPT-4/Claude]
    end

    %% Main Use Case Flow - View Post with AI Summary (Primary Path)
    Pages -->|"1. GET /posts/:id"| API
    API -->|"2. Validate JWT"| AuthMW
    AuthMW -->|"3. Authorized"| PostService
    PostService -->|"4. Query Post"| ORM
    ORM -->|"5. Fetch Data"| DB
    DB -->|"6. Return Post + Comments"| ORM
    ORM -->|"7. Data"| PostService
    PostService -->|"8. Trigger Summary"| AIService
    AIService -->|"9. Generate Prompt"| LLM
    LLM -->|"10. AI Summary"| AIService
    AIService -->|"11. Cached Summary"| PostService
    PostService -->|"12. Combined Response"| API
    API -->|"13. JSON Response"| Pages
    Pages -->|"14. Display"| PostView

    %% Authentication Flow
    Auth -->|"POST /auth/login"| API
    API --> AuthService
    AuthService -->|"Validate"| ORM
    ORM -->|"Check User"| DB
    DB -->|"User Data"| ORM
    ORM --> AuthService
    AuthService -->|"Generate JWT"| API
    API -->|"Return Token"| Auth

    %% Other Service Flows
    Pages -->|"POST /posts"| API
    API --> PostService
    PostService --> ORM
    
    Pages -->|"POST /comments"| API
    API --> CommentService
    CommentService --> ORM
    
    Pages -->|"POST /votes"| API
    API --> VoteService
    VoteService --> ORM

    %% Security & Performance
    API -.->|"Rate Limit"| RateLimit
    RateLimit -.->|"Allow/Block"| API

    %% Styling - Orange and Blue with White Lines
    style CLIENT fill:#FF8C00,stroke:#FFFFFF,stroke-width:3px,color:#FFFFFF
    style GATEWAY fill:#0066FF,stroke:#FFFFFF,stroke-width:3px,color:#FFFFFF
    style SERVICES fill:#FF8C00,stroke:#FFFFFF,stroke-width:3px,color:#FFFFFF
    style DATA fill:#0066FF,stroke:#FFFFFF,stroke-width:3px,color:#FFFFFF
    style EXTERNAL fill:#FF8C00,stroke:#FFFFFF,stroke-width:3px,color:#FFFFFF
    
    style UI fill:#FFA500,stroke:#FFFFFF,stroke-width:2px,color:#000000
    style Pages fill:#FFA500,stroke:#FFFFFF,stroke-width:2px,color:#000000
    style Auth fill:#FFA500,stroke:#FFFFFF,stroke-width:2px,color:#000000
    style PostView fill:#FFA500,stroke:#FFFFFF,stroke-width:2px,color:#000000
    
    style API fill:#0052CC,stroke:#FFFFFF,stroke-width:2px,color:#FFFFFF
    style AuthMW fill:#0052CC,stroke:#FFFFFF,stroke-width:2px,color:#FFFFFF
    style RateLimit fill:#0052CC,stroke:#FFFFFF,stroke-width:2px,color:#FFFFFF
    
    style AuthService fill:#FFA500,stroke:#FFFFFF,stroke-width:2px,color:#000000
    style PostService fill:#FFA500,stroke:#FFFFFF,stroke-width:2px,color:#000000
    style CommentService fill:#FFA500,stroke:#FFFFFF,stroke-width:2px,color:#000000
    style VoteService fill:#FFA500,stroke:#FFFFFF,stroke-width:2px,color:#000000
    style AIService fill:#FF6600,stroke:#FFFFFF,stroke-width:3px,color:#FFFFFF
    
    style ORM fill:#0052CC,stroke:#FFFFFF,stroke-width:2px,color:#FFFFFF
    style DB fill:#0052CC,stroke:#FFFFFF,stroke-width:2px,color:#FFFFFF
    
    style LLM fill:#FF6600,stroke:#FFFFFF,stroke-width:3px,color:#FFFFFF
```

## Architecture Overview

### Scope & External Dependencies
- **Client**: Next.js frontend with App Router, Server/Client Components (port 3000)
- **API Server**: Express.js REST API (port 5000)
- **Database**: PostgreSQL with Prisma ORM
- **LLM Service**: External API (OpenAI/Anthropic) for AI summaries

### Key Components
1. **Client Layer**: Next.js App Router with Server/Client Components, SSR/SSG capabilities
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

