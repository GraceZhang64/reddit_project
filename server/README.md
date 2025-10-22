# Reddit Project Server

## Database Setup

1. Make sure PostgreSQL is installed and running
2. Update the `.env` file with your database credentials
3. Run the following commands:

```bash
# Generate Prisma Client
npm run prisma:generate

# Create and run migrations
npm run prisma:migrate

# Seed the database with sample data
npm run prisma:seed
```

## Database Schema

- **Users**: User accounts with username, email, and password
- **Communities**: Reddit-like communities where users can post
- **Posts**: User-created posts within communities
- **Comments**: Comments on posts (with support for nested replies)
- **Votes**: Upvotes/downvotes on posts and comments
- **Community Members**: Junction table for user-community memberships

## Sample Data

The seed script creates:
- 3 users (john_doe, jane_smith, bob_wilson)
- 3 communities (programming, gaming, cooking)
- 5 posts across different communities
- Several comments including nested replies
- Sample votes and community memberships
