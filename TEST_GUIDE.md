# Testing Guide

This project includes comprehensive tests for both backend and frontend.

## Test Structure

```
server/src/__tests__/
├── posts.test.ts         # API endpoint tests
├── ai-cache.test.ts      # AI summary caching logic tests
├── slug.test.ts          # Slug generation tests
└── integration.test.ts   # End-to-end integration tests

client/src/__tests__/
├── PostCard.test.tsx     # PostCard component tests
└── HomePage.test.tsx     # HomePage component tests
```

## Running Tests

### Backend Tests

```bash
cd server

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Frontend Tests

```bash
cd client

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Coverage

### Backend Tests Cover:

1. **API Endpoints** (`posts.test.ts`)
   - GET /api/posts (pagination)
   - GET /api/posts/:idOrSlug (by ID or slug)
   - POST /api/posts (create)
   - PUT /api/posts/:id (update)
   - DELETE /api/posts/:id (delete)
   - GET /api/posts/:idOrSlug/summary (AI summary with caching)

2. **AI Caching Logic** (`ai-cache.test.ts`)
   - Cache invalidation after 24 hours
   - Cache regeneration with 3+ new comments
   - Cache persistence with < 3 new comments
   - First-time summary generation
   - Database field integrity

3. **Slug Generation** (`slug.test.ts`)
   - Lowercase conversion
   - Special character removal
   - Space to hyphen conversion
   - Unicode handling
   - Length truncation
   - Uniqueness timestamps

4. **Integration Tests** (`integration.test.ts`)
   - Post creation → retrieval flow
   - Comment tracking for AI summaries
   - Vote count calculations
   - Community post listings
   - Search functionality

### Frontend Tests Cover:

1. **PostCard Component** (`PostCard.test.tsx`)
   - Rendering post data
   - Vote button interactions
   - Slug-based navigation
   - User vote highlighting

2. **HomePage Component** (`HomePage.test.tsx`)
   - Loading states
   - Post fetching
   - Error handling
   - Empty state handling

## Key Testing Features

### ✅ AI Summary Caching
Tests verify the smart caching system:
- 24-hour cache duration
- Regeneration on 3+ new comments
- Database field persistence

### ✅ Slug-Based Routing
Tests ensure:
- Slugs generated from titles
- Special characters handled
- Both ID and slug work in URLs

### ✅ API Response Mapping
Tests verify:
- Snake_case ↔ camelCase conversion
- Nested object handling
- Missing field fallbacks

### ✅ User Interactions
Tests cover:
- Voting (upvote/downvote)
- Comment creation
- Post creation
- Navigation

## Writing New Tests

### Backend Test Example

```typescript
describe('Feature Name', () => {
  it('should do something', async () => {
    const response = await request(app)
      .get('/api/endpoint')
      .expect(200);
    
    expect(response.body).toHaveProperty('field');
  });
});
```

### Frontend Test Example

```typescript
import { render, screen } from '@testing-library/react';

describe('Component Name', () => {
  it('should render correctly', () => {
    render(<Component />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

## Test Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Clean up test data after each test
3. **Mocking**: Mock external dependencies
4. **Assertions**: Use clear, specific assertions
5. **Coverage**: Aim for >80% code coverage

## Continuous Integration

Tests should run automatically on:
- Pre-commit hooks
- Pull requests
- CI/CD pipelines

```bash
# Run all tests before committing
cd server && npm test && cd ../client && npm test
```

## Debugging Tests

### Backend
```bash
# Run specific test file
npm test -- posts.test.ts

# Run with verbose output
npm test -- --verbose

# Debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Frontend
```bash
# Run specific test
npm test -- PostCard.test.tsx

# Update snapshots
npm test -- -u

# Debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Coverage Reports

After running `npm run test:coverage`, view reports:
- **Terminal**: Summary in console
- **HTML**: Open `coverage/lcov-report/index.html`

## Known Test Limitations

1. **Database Tests**: Require running Postgres instance
2. **AI Service**: OpenAI API calls are mocked in tests
3. **Auth Tests**: Use mock JWT tokens
4. **E2E Tests**: Not yet implemented (future work)

## Future Test Additions

- [ ] E2E tests with Playwright/Cypress
- [ ] Performance tests
- [ ] Security tests
- [ ] Load tests
- [ ] Accessibility tests

## Questions?

See test files for examples or reach out to the development team.

