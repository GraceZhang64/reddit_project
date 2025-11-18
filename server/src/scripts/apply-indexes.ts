/**
 * Script to apply performance indexes to the database
 */
import { prisma } from '../lib/prisma';

async function applyIndexes() {
  console.log('🔧 Applying performance indexes...');
  
  try {
    // Posts table indexes
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC)');
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id)');
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS idx_posts_community_id_created ON posts(community_id, created_at DESC)');
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug) WHERE slug IS NOT NULL');
    console.log('✅ Posts indexes created');

    // Comments table indexes
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS idx_comments_post_id_created ON comments(post_id, created_at DESC)');
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id)');
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL');
    console.log('✅ Comments indexes created');

    // Votes table indexes
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS idx_votes_target_composite ON votes(target_type, target_id)');
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS idx_votes_user_target ON votes(user_id, target_type, target_id)');
    console.log('✅ Votes indexes created');

    // Communities table indexes
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS idx_communities_slug ON communities(slug)');
    console.log('✅ Communities indexes created');

    // User follows indexes
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id)');
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id)');
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS idx_user_follows_composite ON user_follows(follower_id, following_id)');
    console.log('✅ User follows indexes created');

    // Notifications indexes
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC)');
    console.log('✅ Notifications indexes created');

    // Skip poll votes indexes - tables may not exist yet
    console.log('⏭️  Poll votes indexes skipped');

    // Composite indexes for common query patterns
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS idx_comments_post_parent ON comments(post_id, parent_comment_id, created_at DESC)');
    console.log('✅ Composite indexes created');

    // Analyze tables
    await prisma.$executeRawUnsafe('ANALYZE posts');
    await prisma.$executeRawUnsafe('ANALYZE comments');
    await prisma.$executeRawUnsafe('ANALYZE votes');
    await prisma.$executeRawUnsafe('ANALYZE communities');
    await prisma.$executeRawUnsafe('ANALYZE users');
    console.log('✅ Tables analyzed');

    console.log('\n🎉 All performance indexes applied successfully!');
  } catch (error) {
    console.error('❌ Error applying indexes:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

applyIndexes()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

